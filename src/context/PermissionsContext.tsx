import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

interface PermissionsContextType {
  permissions: string[]
  loading: boolean
  hasPermission: (feature: string) => boolean
  refreshPermissions: () => Promise<void>
}

const PermissionsContext = createContext<PermissionsContextType>({
  permissions: [],
  loading: true,
  hasPermission: () => false,
  refreshPermissions: async () => {}
})

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const { user, role } = useAuth()
  const [permissions, setPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPermissions = async () => {
    if (!user) {
      setPermissions([])
      setLoading(false)
      return
    }

    try {
      // 1. Check official subscriptions table first (supports Trial)
      const { data: globalSub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (globalSub && (globalSub.status === 'trial' || globalSub.status === 'active')) {
        const trialEnds = globalSub.trial_ends_at ? new Date(globalSub.trial_ends_at) : null
        const isTrialValid = trialEnds ? trialEnds > new Date() : true
        
        if (isTrialValid) {
          const planName = globalSub.plan.toLowerCase()
          const status = globalSub.status

          // DEFINITION OF PERMISSIONS PER TIER
          const basicFeats = [
            'treinos ativos', 
            'biblioteca de exercícios', 
            'exercícios personalizados'
          ]
          const proFeats = [
            ...basicFeats,
            'chat e suporte', 
            'gamificação e conquistas',
            'gamificação',
            'suporte prioritário'
          ]
          const premiumFeats = [
            ...proFeats,
            'gráficos e analytics',
            'financeiro',
            'exportar relatórios'
          ]

          // Assign based on plan and status (Trial is always Premium)
          if (status === 'trial' || planName.includes('premium')) {
             setPermissions(premiumFeats)
          } else if (planName.includes('pro')) {
             setPermissions(proFeats)
          } else if (planName.includes('basic') || planName.includes('básico')) {
             setPermissions(basicFeats)
          } else {
             // Default for unknown active plans
             setPermissions(basicFeats)
          }

          setLoading(false)
          return
        }
      }

      // 2. Fallback to the legacy/dynamic assinaturas table for specific custom plans
      const { data: subData, error: subErr } = await supabase
        .from('assinaturas')
        .select(`
          created_at,
          plano_id,
          planos (
            duracao_dias,
            plano_itens (
              itens (
                nome
              )
            )
          )
        `)
        .eq('aluno_id', user.id)
        .eq('status', 'ativa')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (subErr) {
        console.error('Error fetching subscription:', subErr)
        setPermissions([])
        return
      }

      if (subData && subData.planos) {
        const planosObj = subData.planos as any
        
        // Expiration check
        const createdAt = new Date(subData.created_at)
        const duracaoDias = planosObj.duracao_dias || 30
        const expirationDate = new Date(createdAt.getTime() + duracaoDias * 24 * 60 * 60 * 1000)

        if (new Date() > expirationDate) {
          // Expired
          setPermissions([])
          return
        }

        const pItens = planosObj.plano_itens as any[]
        const features = pItens ? pItens.map(pi => pi.itens?.nome?.toLowerCase().trim()).filter(Boolean) : []
        setPermissions(features)
      } else {
        // If we found a subscription earlier but not in the legacy table, we already handled it. 
        // If we reach here, look at what we found in step 1.
        setPermissions([])
      }
    } catch (err) {
      console.error(err)
      setPermissions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPermissions()
  }, [user, role])

  const hasPermission = (feature: string) => {
    if (role === 'personal') return true // Personal always has access to everything
    return permissions.includes(feature.toLowerCase().trim())
  }

  return (
    <PermissionsContext.Provider value={{ permissions, loading, hasPermission, refreshPermissions: fetchPermissions }}>
      {children}
    </PermissionsContext.Provider>
  )
}

export const usePermissions = () => useContext(PermissionsContext)

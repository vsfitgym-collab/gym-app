import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

export type SubscriptionStatus = 'ativa' | 'expirada' | 'trial' | 'pendente' | 'cancelada'

interface PermissionsContextType {
  permissions: string[]
  status: SubscriptionStatus | null
  trialEndsAt: string | null
  loading: boolean
  hasPermission: (feature: string) => boolean
  refreshPermissions: () => Promise<void>
}

const PermissionsContext = createContext<PermissionsContextType>({
  permissions: [],
  status: null,
  trialEndsAt: null,
  loading: false,
  hasPermission: () => false,
  refreshPermissions: async () => {}
})

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const { user, role } = useAuth()
  const [permissions, setPermissions] = useState<string[]>([])
  const [status, setStatus] = useState<SubscriptionStatus | null>(null)
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchPermissions = async () => {
    if (!user) {
      setPermissions([])
      setStatus(null)
      setTrialEndsAt(null)
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

      if (globalSub) {
        let currentStatus = globalSub.status as SubscriptionStatus
        const trialEnds = globalSub.trial_ends_at ? new Date(globalSub.trial_ends_at) : null
        
        // Automatic expiration check for Trial
        if (currentStatus === 'trial' && trialEnds && trialEnds < new Date()) {
          currentStatus = 'expirada'
        }

        setStatus(currentStatus)
        setTrialEndsAt(globalSub.trial_ends_at)

        // Assign based on plan and status (Trial is always Full Access)
        if (currentStatus === 'trial') {
          // Fetch ALL items for trial
          const { data: allItens } = await supabase.from('itens').select('nome')
          const allFeats = allItens ? allItens.map(i => i.nome.toLowerCase().trim()) : []
          setPermissions(allFeats)
        } else if (currentStatus === 'ativa') {
          // Fetch dynamic permissions for the plan
          const planNameMatch = globalSub.plan.toLowerCase()
          
          const { data: planData } = await supabase
            .from('planos')
            .select(`
              nome,
              plano_itens (
                itens (
                  nome
                )
              )
            `)
            .or(`nome.ilike.%${planNameMatch}%,nome.ilike.Plano ${planNameMatch}%`)
            .maybeSingle()

          if (planData) {
            const pItens = planData.plano_itens as any[]
            const features = pItens ? pItens.map(pi => pi.itens?.nome?.toLowerCase().trim()).filter(Boolean) : []
            setPermissions(features)
          } else {
            // Fallback to legacy hardcoded if table not found
            setPermissions([])
          }
        } else {
          // expirada, pendente, cancelada -> BLOQUEAR TUDO
          setPermissions([])
        }

        setLoading(false)
        return
      }

      // 2. Fallback to legacy signatures if needed? 
      // User requested "No mock data" and "prod ready", so we favor the subscriptions table logic.
      setPermissions([])
      setStatus(null)
    } catch (err) {
      console.error('Error fetching permissions:', err)
      setPermissions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (role === 'personal') {
      setLoading(false)
      return
    }
    fetchPermissions()
  }, [user, role])

  const hasPermission = (feature: string) => {
    if (role === 'personal') {
      return true
    }
    return permissions.includes(feature.toLowerCase().trim())
  }

  const refreshPermissions = async () => {
    setLoading(true)
    await fetchPermissions()
  }

  return (
    <PermissionsContext.Provider value={{ 
      permissions, 
      status, 
      trialEndsAt, 
      loading, 
      hasPermission, 
      refreshPermissions 
    }}>
      {children}
    </PermissionsContext.Provider>
  )
}

export const usePermissions = () => useContext(PermissionsContext)

import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { usePlan } from '../context/PlanContext'
import { useAuth } from '../context/AuthContext'
import { syncSubscription } from '../lib/stripeService'
import { Check, Loader2, Crown, Zap } from 'lucide-react'

export default function SuccessPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { refreshPlan } = usePlan()
  const { user } = useAuth()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [plan, setPlan] = useState<string | null>(null)

  useEffect(() => {
    async function sync() {
      try {
        // Get plan from URL
        const planParam = searchParams.get('plan')
        setPlan(planParam)

        // Refresh plan from database
        await refreshPlan()

        // Optionally sync with Stripe for backup
        if (user) {
          try {
            await syncSubscription(user.id)
          } catch (e) {
            // Non-critical error - ignore
          }
        }

        setStatus('success')
        
        // Redirect after 3 seconds
        setTimeout(() => {
          navigate('/')
        }, 3000)
      } catch (error) {
        console.error('Sync error:', error)
        setStatus('error')
      }
    }

    sync()
  }, [searchParams, navigate, refreshPlan])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-12 h-12 text-amber-400 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Processando...</h2>
        <p className="text-slate-400">Seu plano está sendo ativado.</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
          <Zap className="text-red-400" size={32} />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Algo deu errado</h2>
        <p className="text-slate-400 mb-6">Entre em contato com o suporte.</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg"
        >
          Voltar ao início
        </button>
      </div>
    )
  }

  // Success
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500/20 to-purple-500/20 flex items-center justify-center mb-6 border border-amber-500/30 animate-pulse">
        <Check className="text-amber-400 w-10 h-10" />
      </div>
      
      <h1 className="text-3xl font-bold text-white mb-2">
        Bem-vindo ao {plan === 'premium' ? 'Plano Elite' : plan === 'pro' ? 'Plano Personal' : 'Plano Essencial'}!
      </h1>
      
      <p className="text-slate-400 text-center max-w-sm mb-8">
        Seu plano foi ativado com sucesso. Agora você tem acesso completo a todas as funcionalidades.
      </p>

      <div className="flex items-center gap-2 text-amber-400">
        <Crown size={16} />
        <span className="text-sm">Redirecionando em 3 segundos...</span>
      </div>
    </div>
  )
}

export function PaymentSuccessHandler() {
  // This component should be used in App.tsx to handle success redirects
  return null
}
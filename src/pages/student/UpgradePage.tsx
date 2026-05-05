import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Sparkles, Zap, Star, Crown, ArrowRight, BadgeCheck } from 'lucide-react'
import { supabase, mapPlanNameToKey, type PlanKey, type Subscription } from '@/lib/supabase'
import { usePlans, PlanFromDB } from '@/hooks/usePlans'
import { Button } from '@/components/ui/Button'

const planIcons: Record<PlanKey, typeof Zap> = {
  trial: Zap,
  basic: Star,
  pro: Crown,
  premium: Sparkles,
}

const planColors: Record<PlanKey, string> = {
  trial: 'from-blue-500 to-cyan-500',
  basic: 'from-purple-500 to-pink-500',
  pro: 'from-amber-500 to-orange-500',
  premium: 'from-emerald-500 to-teal-500',
}

export function UpgradePage() {
  const navigate = useNavigate()
  const { plans, loading: plansLoading } = usePlans()
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)

  const fetchCurrentSubscription = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    try {
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (data) {
        setCurrentSubscription(data as Subscription)
      }
    } catch (error) {
      console.error("Error fetching subscription:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCurrentSubscription()
  }, [fetchCurrentSubscription])

  const handleSelectPlan = (plan: PlanFromDB) => {
    setSelectedPlanId(plan.id)
  }

  const handleConfirm = () => {
    if (!selectedPlanId) return
    const plan = plans.find(p => p.id === selectedPlanId)
    if (!plan) return
    
    navigate(`/aluno/assistant?plan=${plan.planKey}`)
    setSelectedPlanId(null)
  }

  const currentPlanKey = currentSubscription?.plan 
    ? mapPlanNameToKey(currentSubscription.plan) 
    : null

  const plansToShow = plans.filter(p => p.planKey !== 'trial')

  if (plansLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-background to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      
      <div className="relative z-10 px-4 py-12 md:py-20 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 md:mb-16"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
            Desbloqueie todo seu potencial
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Tenha acesso completo a treinos, analytics e suporte profissional
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12">
          {plansToShow.map((plan, idx) => {
            const isPopular = plan.planKey === 'pro'
            const isPremium = plan.planKey === 'premium'
            const Icon = planIcons[plan.planKey]
            const colorClass = planColors[plan.planKey]
            const isCurrentPlan = currentPlanKey === plan.planKey
            const isSelected = selectedPlanId === plan.id

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 + 0.2 }}
                className="relative"
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold rounded-full shadow-lg shadow-amber-500/30">
                    Mais Popular
                  </div>
                )}

                <div 
                  onClick={() => !isCurrentPlan && handleSelectPlan(plan)}
                  className={`
                    relative h-full p-6 md:p-8 rounded-2xl transition-all duration-300 cursor-pointer
                    ${isSelected 
                      ? 'bg-card/80 border-2 border-emerald-500/50 shadow-2xl shadow-emerald-500/20 scale-[1.02]' 
                      : isCurrentPlan
                        ? 'bg-card/50 border-2 border-emerald-500/30'
                        : 'bg-card/40 border border-white/10 hover:border-white/20 hover:bg-card/60'
                    }
                    ${isPremium ? 'md:-mt-4 md:mb-4' : ''}
                  `}
                >
                  {isCurrentPlan && (
                    <div className="absolute -top-3 right-4 px-3 py-1 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 text-xs font-medium rounded-full flex items-center gap-1">
                      <BadgeCheck className="w-3 h-3" />
                      Plano atual
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colorClass} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-white">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{plan.duration_days} dias</p>
                  </div>

                  <div className="text-center mb-6">
                    {plan.price === 0 ? (
                      <span className="text-4xl font-bold text-white">Grátis</span>
                    ) : (
                      <>
                        <span className="text-4xl md:text-5xl font-bold text-white">R$ {plan.price.toFixed(2)}</span>
                        <span className="text-muted-foreground">/mês</span>
                      </>
                    )}
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    variant={isCurrentPlan ? "outline" : isPopular ? "gradient" : "default"}
                    disabled={isCurrentPlan}
                  >
                    {isCurrentPlan 
                      ? 'Plano Ativo' 
                      : isSelected 
                        ? 'Selecionado'
                        : 'Assinar'
                    }
                  </Button>
                </div>

                {isPremium && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent blur-sm" />
                )}
              </motion.div>
            )
          })}
        </div>

        <AnimatePresence>
          {selectedPlanId && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-0 left-0 right-0 p-4 bg-card/80 backdrop-blur-lg border-t border-white/10 z-50"
            >
              <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Plano selecionado</p>
                  <p className="text-lg font-semibold text-white">
                    {plans.find(p => p.id === selectedPlanId)?.name}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button 
                    variant="outline"
                    onClick={() => setSelectedPlanId(null)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="gradient"
                    onClick={handleConfirm}
                    className="shadow-lg shadow-primary/25"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Fazer upgrade
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-8"
        >
          <p className="text-sm text-muted-foreground">
            Pagamento seguro via PIX. Seu personal confirmará a ativação em minutos.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Check, Zap, Crown, Sparkles, Star, Calendar } from "lucide-react"
import { useAuthStore } from "@/stores/authStore"
import { supabase, mapPlanNameToKey, type PlanKey, type Subscription, PLANS } from "@/lib/supabase"
import { usePlans } from "@/hooks/usePlans"
import { CurrentPlanBadge, PlanComparisonTable, UpgradeModal } from "@/components/features"
import { Button } from "@/components/ui/Button"

function normalizePlanKey(plan: string | undefined): PlanKey | undefined {
  if (!plan) return undefined
  const normalized = plan.toLowerCase()
  if (normalized === 'basico' || normalized === 'básico') return 'basic'
  if (normalized === 'trial' || normalized === 'basic' || normalized === 'pro' || normalized === 'premium') {
    return normalized as PlanKey
  }
  return undefined
}

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

export function PlansPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuthStore()
  
  const { plans, loading: plansLoading } = usePlans()
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [selectedPlanKey, setSelectedPlanKey] = useState<PlanKey | null>(null)
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [showComparison, setShowComparison] = useState(false)
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)

  useEffect(() => {
    fetchCurrentSubscription()
  }, [user?.id])

  useEffect(() => {
    const upgradeParam = searchParams.get('upgrade')
    if (upgradeParam) {
      const planKey = normalizePlanKey(upgradeParam)
      if (planKey) {
        setSelectedPlanKey(planKey)
      }
    }
  }, [searchParams])

  const fetchCurrentSubscription = async () => {
    if (!user) return
    
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
  }

  const handleSelectPlan = (plan: typeof plans[0]) => {
    if (plan.planKey === normalizePlanKey(currentSubscription?.plan)) return
    setSelectedPlanId(plan.id)
    setSelectedPlanKey(plan.planKey)
  }

  const handleConfirmPlan = () => {
    if (!selectedPlanId) return
    setSelectedPlanId(null)
    setSelectedPlanKey(null)
    setUpgradeModalOpen(true)
    navigate(`/aluno/assistant?plan=${selectedPlanId}`)
  }

  const formatEndDate = (date: string) => {
    const d = new Date(date)
    return d.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const currentPlanKey = normalizePlanKey(currentSubscription?.plan) as PlanKey | undefined
  const isExpired = currentSubscription?.end_date && new Date(currentSubscription.end_date) < new Date()

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Escolha seu plano</h1>
        <p className="text-muted-foreground mt-2">
          Acesse funcionalidades exclusivas para acelerar seus resultados
        </p>
        
        {currentSubscription && !isExpired && (
          <div className="flex items-center justify-center mt-4">
            <CurrentPlanBadge 
              planId={currentSubscription.plan} 
              endDate={currentSubscription.end_date}
              size="lg"
            />
          </div>
        )}

        {isExpired && (
          <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg inline-flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-500" />
            <span className="text-sm text-amber-500">Seu plano expirou. Faça upgrade para continuar!</span>
          </div>
        )}
      </div>

      {plansLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, idx) => {
            const isPopular = plan.planKey === 'pro'
            const Icon = planIcons[plan.planKey]
            const colorClass = planColors[plan.planKey]
            const currentPlanKey = normalizePlanKey(currentSubscription?.plan)
            const isCurrentPlan = currentPlanKey === plan.planKey

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className={`relative h-full ${isPopular ? 'transform scale-105' : ''}`}>
                  {isPopular && (
                    <div className="absolute -top-3 left-4 z-10 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
                      Mais Popular
                    </div>
                  )}
                  
                  <div className={`
                    relative h-full p-6 rounded-2xl border transition-all
                    ${isPopular 
                      ? 'border-primary/50 bg-card shadow-lg shadow-primary/10' 
                      : 'border-border bg-card hover:border-primary/30'
                    }
                    ${isCurrentPlan 
                      ? 'ring-2 ring-emerald-500/50 bg-emerald-500/5' 
                      : ''
                    }
                  `}>
                    {isCurrentPlan && (
                      <div className={`absolute -top-3 ${isPopular ? 'right-4' : 'right-4'} px-3 py-1 bg-emerald-500 text-white text-xs font-medium rounded-full`}>
                        Plano Atual
                      </div>
                    )}

                    <div className="text-center mb-6">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${colorClass} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold">{plan.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1 px-2">{plan.duration_days} dias</p>
                    </div>

                    <div className="text-center mb-6">
                      {plan.price === 0 ? (
                        <span className="text-4xl font-bold">Grátis</span>
                      ) : (
                        <>
                          <span className="text-4xl font-bold">R$ {plan.price.toFixed(2)}</span>
                          <span className="text-sm text-muted-foreground">/mês</span>
                        </>
                      )}
                    </div>

                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button 
                      className="w-full" 
                      variant={isPopular ? "gradient" : isCurrentPlan ? "outline" : "default"}
                      onClick={() => handleSelectPlan(plan)}
                      disabled={isCurrentPlan}
                    >
                      {isCurrentPlan 
                        ? 'Plano Ativo' 
                        : plan.planKey === 'trial' 
                          ? 'Experimentar Grátis' 
                          : 'Assinar'
                      }
                    </Button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <div className="flex justify-center">
        <Button 
          variant="ghost" 
          onClick={() => setShowComparison(!showComparison)}
          className="text-muted-foreground"
        >
          {showComparison ? 'Ocultar' : 'Ver'} comparação de planos
        </Button>
      </div>

      <AnimatePresence>
        {showComparison && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <PlanComparisonTable 
              currentPlan={normalizePlanKey(currentSubscription?.plan)}
              onSelectPlan={(planKey) => {
                const plan = plans.find(p => p.planKey === planKey)
                if (plan) handleSelectPlan(plan)
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedPlanId && selectedPlanKey && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => { setSelectedPlanId(null); setSelectedPlanKey(null) }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="w-full max-w-md bg-card rounded-2xl border border-border p-5 md:p-6 shadow-2xl">
                {(() => {
                  const selectedPlanData = plans.find(p => p.id === selectedPlanId)
                  return (
                    <>
                      <h3 className="text-lg md:text-xl font-bold mb-2">
                        Assinar Plano {selectedPlanData?.name || selectedPlanKey}
                      </h3>
                      <p className="text-muted-foreground mb-5 md:mb-6 text-sm md:text-base">
                        Você selecionou o plano {selectedPlanData?.name || selectedPlanKey} por R$ {selectedPlanData?.price.toFixed(2) || '0,00'}/mês
                      </p>

                <div className="p-3 md:p-4 rounded-lg bg-secondary/50 mb-5 md:mb-6">
                  <p className="text-sm text-muted-foreground mb-2 font-medium">Como funciona:</p>
                  <ol className="text-sm space-y-2 text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center">1</span>
                      Você será redirecionado para o chat
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center">2</span>
                      Nosso assistant gerará uma chave PIX
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center">3</span>
                      Realize o pagamento
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center">4</span>
                      Seu personal confirmará a ativação
                    </li>
                  </ol>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => { setSelectedPlanId(null); setSelectedPlanKey(null) }}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        className="flex-1"
                        onClick={handleConfirmPlan}
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Confirmar
                      </Button>
                    </div>
                    </>
                  )
                })()}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <UpgradeModal 
        isOpen={upgradeModalOpen} 
        onClose={() => setUpgradeModalOpen(false)} 
      />
    </div>
  )
}
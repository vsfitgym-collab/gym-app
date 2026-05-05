import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, Sparkles, Zap, Star, Crown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PLANS, type PlanKey } from '@/lib/supabase'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  recommendedPlan?: PlanKey
  featureLocked?: string
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

export function UpgradeModal({ 
  isOpen, 
  onClose, 
  recommendedPlan = 'pro',
  featureLocked 
}: UpgradeModalProps) {
  const navigate = useNavigate()
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>(recommendedPlan)

  const plansToShow: PlanKey[] = ['basic', 'pro', 'premium']
  const recommendedPlanData = PLANS[recommendedPlan]

  const handleUpgrade = () => {
    onClose()
    navigate(`/plans?upgrade=${selectedPlan}`)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md md:max-w-2xl max-h-[90vh] overflow-y-auto bg-card rounded-2xl border border-border shadow-2xl">
              <div className="flex items-center justify-between p-4 md:p-6 border-b border-border">
                <div className="flex-1 pr-4">
                  <h2 className="text-xl md:text-2xl font-bold">Desbloqueie mais funcionalidades</h2>
                  {featureLocked && (
                    <p className="text-muted-foreground mt-1 text-sm">
                      Para acessar "{featureLocked}", faça upgrade do seu plano
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-secondary transition-colors flex-shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                {plansToShow.map((planKey) => {
                  const plan = PLANS[planKey]
                  const Icon = planIcons[planKey]
                  const isRecommended = planKey === recommendedPlan
                  const isSelected = selectedPlan === planKey

                  return (
                    <motion.button
                      key={planKey}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedPlan(planKey)}
                      className={`
                        relative p-3 md:p-4 rounded-xl border-2 text-left transition-all
                        ${isSelected 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                        }
                        ${isRecommended ? 'ring-2 ring-primary/30' : ''}
                      `}
                    >
                      {isRecommended && (
                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold rounded-full">
                          RECOMENDADO
                        </div>
                      )}

                      <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br ${planColors[planKey]} flex items-center justify-center mb-2 md:mb-3`}>
                        <Icon className="w-4 h-4 md:w-5 md:h-5 text-white" />
                      </div>

                      <h3 className="font-bold text-base md:text-lg">{plan.name}</h3>
                      
                      <div className="mt-1 mb-2 md:mb-3">
                        <span className="text-xl md:text-2xl font-bold">R$ {plan.price.toFixed(2)}</span>
                        <span className="text-xs text-muted-foreground">/mês</span>
                      </div>

                      <ul className="space-y-1">
                        {plan.features.slice(0, 3).map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-xs">
                            <Check className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <span className="text-muted-foreground line-clamp-1">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {isSelected && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </div>
                      )}
                    </motion.button>
                  )
                })}
              </div>

              <div className="p-4 md:p-6 border-t border-border bg-secondary/30">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Plano: <span className="font-semibold text-foreground">{PLANS[selectedPlan].name}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Pagamento via PIX
                    </p>
                  </div>
                  
                  <Button 
                    onClick={handleUpgrade}
                    className="w-full sm:w-auto gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Continuar
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
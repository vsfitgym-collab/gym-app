import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Modal } from "@/components/ui/Modal"
import { supabase } from "@/lib/supabase"
import { motion } from "framer-motion"
import { Plus, Pencil, Trash2, Check, Crown, Sparkles, Star, Zap } from "lucide-react"

interface Plan {
  id: string
  name: string
  price: number
  features: string[]
  duration_days: number
  is_trial?: boolean
}

const defaultPlans: Omit<Plan, 'id'>[] = [
  {
    name: 'Trial',
    price: 0,
    features: ['Acesso total por 7 dias'],
    duration_days: 7,
    is_trial: true,
  },
  {
    name: 'Básico',
    price: 49.90,
    features: ['Treinos limitados', 'Sem analytics avançado'],
    duration_days: 30,
  },
  {
    name: 'Pro',
    price: 89.90,
    features: ['Treinos ilimitados', 'Progresso completo'],
    duration_days: 30,
  },
  {
    name: 'Premium',
    price: 149.90,
    features: ['Tudo liberado', 'Analytics avançado', 'Conquistas', 'Suporte prioritário'],
    duration_days: 30,
  },
]

const planIcons = [Zap, Star, Crown, Sparkles]
const planColors = ['from-blue-500 to-cyan-500', 'from-purple-500 to-pink-500', 'from-amber-500 to-orange-500', 'from-emerald-500 to-teal-500']

export function TrainerPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    duration_days: 30,
    features: '',
  })

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('plans')
        .select('*')
        .order('price')

      if (data && data.length > 0) {
        setPlans(data.map(p => ({
          ...p,
          features: typeof p.features === 'string' ? JSON.parse(p.features) : p.features
        })))
      } else {
        // Criar planos padrão se não existirem
        await createDefaultPlans()
      }
    } catch (error) {
      console.error("Error fetching plans:", error)
      // Se a tabela não existir, cria os padrões
      await createDefaultPlans()
    } finally {
      setLoading(false)
    }
  }

  const createDefaultPlans = async () => {
    try {
      for (const plan of defaultPlans) {
        await supabase.from('plans').insert({
          ...plan,
          features: JSON.stringify(plan.features),
        })
      }
      fetchPlans()
    } catch (error) {
      console.error("Error creating default plans:", error)
      setPlans([])
    }
  }

  const handleCreatePlan = async () => {
    try {
      const featuresArray = formData.features.split('\n').filter(f => f.trim())
      
      const { data } = await supabase.from('plans').insert({
        name: formData.name,
        price: formData.price,
        duration_days: formData.duration_days,
        features: JSON.stringify(featuresArray),
      }).select().single()

      if (data) {
        setPlans([...plans, { ...data, features: featuresArray }])
        setShowCreateModal(false)
        setFormData({ name: '', price: 0, duration_days: 30, features: '' })
      }
    } catch (error) {
      console.error("Error creating plan:", error)
    }
  }

  const handleUpdatePlan = async () => {
    if (!editingPlan) return

    try {
      const featuresArray = formData.features.split('\n').filter(f => f.trim())
      
      await supabase.from('plans').update({
        name: formData.name,
        price: formData.price,
        duration_days: formData.duration_days,
        features: JSON.stringify(featuresArray),
      }).eq('id', editingPlan.id)

      setPlans(plans.map(p => 
        p.id === editingPlan.id 
          ? { ...p, name: formData.name, price: formData.price, duration_days: formData.duration_days, features: featuresArray }
          : p
      ))
      setShowEditModal(false)
      setEditingPlan(null)
    } catch (error) {
      console.error("Error updating plan:", error)
    }
  }

  const handleDeletePlan = async (id: string) => {
    try {
      await supabase.from('plans').delete().eq('id', id)
      setPlans(plans.filter(p => p.id !== id))
    } catch (error) {
      console.error("Error deleting plan:", error)
    }
  }

  const openEditModal = (plan: Plan) => {
    setEditingPlan(plan)
    setFormData({
      name: plan.name,
      price: plan.price,
      duration_days: plan.duration_days,
      features: plan.features.join('\n'),
    })
    setShowEditModal(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Planos</h1>
          <p className="text-muted-foreground">Gerencie os planos disponíveis para seus alunos</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Plano
        </Button>
      </div>

      {plans.length === 0 ? (
        <Card variant="glass" className="p-12 text-center">
          <Crown className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Nenhum plano criado</h3>
          <p className="text-muted-foreground mb-4">Crie planos para oferecer aos seus alunos</p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Plano
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, idx) => {
            const Icon = planIcons[idx % planIcons.length]
            const color = planColors[idx % planColors.length]
            const isTrial = plan.is_trial

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card variant="glass" className={`relative h-full ${isTrial ? 'border-blue-500/50' : ''}`}>
                  {isTrial && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-full">
                      Trial
                    </div>
                  )}
                  <CardHeader className="text-center">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mx-auto mb-4`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>{plan.duration_days} dias</CardDescription>
                    <div className="mt-2">
                      <span className="text-3xl font-bold">
                        {plan.price === 0 ? 'Grátis' : `R$ ${plan.price.toFixed(2)}`}
                      </span>
                      {plan.price > 0 && <span className="text-muted-foreground">/mês</span>}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditModal(plan)}>
                      <Pencil className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    {!isTrial && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeletePlan(plan.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Modal de Criação */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Criar Novo Plano"
        className="max-w-lg"
      >
        <div className="space-y-4">
          <Input
            placeholder="Nome do plano"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              placeholder="Preço (R$)"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
            />
            <Input
              type="number"
              placeholder="Duração (dias)"
              value={formData.duration_days}
              onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) })}
            />
          </div>
          <textarea
            className="w-full h-32 bg-white/5 border border-white/20 rounded-lg p-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            placeholder="Benefícios (um por linha)"
            value={formData.features}
            onChange={(e) => setFormData({ ...formData, features: e.target.value })}
          />
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleCreatePlan} disabled={!formData.name}>
              Criar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Edição */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingPlan(null)
        }}
        title="Editar Plano"
        className="max-w-lg"
      >
        <div className="space-y-4">
          <Input
            placeholder="Nome do plano"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              placeholder="Preço (R$)"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
            />
            <Input
              type="number"
              placeholder="Duração (dias)"
              value={formData.duration_days}
              onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) })}
            />
          </div>
          <textarea
            className="w-full h-32 bg-white/5 border border-white/20 rounded-lg p-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            placeholder="Benefícios (um por linha)"
            value={formData.features}
            onChange={(e) => setFormData({ ...formData, features: e.target.value })}
          />
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => {
              setShowEditModal(false)
              setEditingPlan(null)
            }}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleUpdatePlan} disabled={!formData.name}>
              Salvar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
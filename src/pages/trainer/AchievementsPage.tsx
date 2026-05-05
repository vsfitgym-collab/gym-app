import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Modal } from "@/components/ui/Modal"
import { useAuthStore } from "@/stores/authStore"
import { supabase } from "@/lib/supabase"
import { motion } from "framer-motion"
import { Plus, Trophy, Users, Trash2, Edit, Zap, Flame, Calendar, Clock, Medal, Crown, Star, Filter } from "lucide-react"
import { cn } from "@/lib/utils"

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  type: string
  target_value: number
  xp_reward: number
  students_count?: number
}

const iconOptions = [
  { value: "zap", label: "Raio", icon: Zap },
  { value: "flame", label: "Fogo", icon: Flame },
  { value: "calendar", label: "Calendário", icon: Calendar },
  { value: "clock", label: "Relógio", icon: Clock },
  { value: "medal", label: "Medalha", icon: Medal },
  { value: "trophy", label: "Troféu", icon: Trophy },
  { value: "crown", label: "Coroa", icon: Crown },
  { value: "star", label: "Estrela", icon: Star },
]

const typeOptions = [
  { value: "workouts_completed", label: "Treinos Concluídos" },
  { value: "streak_days", label: "Dias Seguidos" },
  { value: "total_time", label: "Tempo Total (min)" },
  { value: "weekly_frequency", label: "Frequência Semanal" },
  { value: "special", label: "Especial" },
]

const defaultAchievements = [
  { name: 'Primeiro Passo', description: 'Complete seu primeiro treino', icon: 'zap', type: 'workouts_completed', target_value: 1, xp_reward: 50 },
  { name: 'Consistente', description: 'Complete 7 treinos', icon: 'flame', type: 'workouts_completed', target_value: 7, xp_reward: 100 },
  { name: 'Dedicado', description: 'Complete 20 treinos', icon: 'trophy', type: 'workouts_completed', target_value: 20, xp_reward: 200 },
  { name: 'Atleta', description: 'Complete 50 treinos', icon: 'medal', type: 'workouts_completed', target_value: 50, xp_reward: 500 },
  { name: 'Lendário', description: 'Complete 100 treinos', icon: 'crown', type: 'workouts_completed', target_value: 100, xp_reward: 1000 },
  { name: 'Streak Semanal', description: 'Treine 7 dias seguidos', icon: 'calendar', type: 'streak_days', target_value: 7, xp_reward: 150 },
  { name: 'Streak Mensal', description: 'Treine 30 dias seguidos', icon: 'flame', type: 'streak_days', target_value: 30, xp_reward: 500 },
  { name: 'Maratonista', description: 'Treine por 1000 minutos', icon: 'clock', type: 'total_time', target_value: 1000, xp_reward: 200 },
]

const getIcon = (iconName: string) => {
  const iconMap: Record<string, any> = { zap: Zap, flame: Flame, calendar: Calendar, clock: Clock, medal: Medal, trophy: Trophy, crown: Crown, star: Star }
  return iconMap[iconName] || Zap
}

export function TrainerAchievementsPage() {
  const { user } = useAuthStore()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null)
  const [filterType, setFilterType] = useState("")
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'zap',
    type: 'workouts_completed',
    target_value: 1,
    xp_reward: 50,
  })

  useEffect(() => {
    fetchAchievements()
  }, [])

  const fetchAchievements = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('achievements')
        .select('*')
        .order('xp_reward')

      if (data && data.length > 0) {
        // Buscar quantos alunos completaram cada conquista
        const achievementsWithCount = await Promise.all(
          data.map(async (achievement) => {
            const { count } = await supabase
              .from('user_achievements')
              .select('*', { count: 'exact', head: true })
              .eq('achievement_id', achievement.id)
              .eq('completed', true)
            return { ...achievement, students_count: count || 0 }
          })
        )
        setAchievements(achievementsWithCount)
      } else {
        // Criar conquistas padrão
        await createDefaultAchievements()
      }
    } catch (error) {
      console.error("Error fetching achievements:", error)
      await createDefaultAchievements()
    } finally {
      setLoading(false)
    }
  }

  const createDefaultAchievements = async () => {
    try {
      for (const achievement of defaultAchievements) {
        await supabase.from('achievements').insert({
          ...achievement,
          created_by: user?.id,
        })
      }
      fetchAchievements()
    } catch (error) {
      console.error("Error creating default achievements:", error)
      setAchievements([])
    }
  }

  const handleCreateAchievement = async () => {
    try {
      const { data } = await supabase.from('achievements').insert({
        ...formData,
        created_by: user?.id,
      }).select().single()

      if (data) {
        setAchievements([{ ...data, students_count: 0 }, ...achievements])
        setShowCreateModal(false)
        setFormData({ name: '', description: '', icon: 'zap', type: 'workouts_completed', target_value: 1, xp_reward: 50 })
      }
    } catch (error) {
      console.error("Error creating achievement:", error)
    }
  }

  const handleUpdateAchievement = async () => {
    if (!editingAchievement) return

    try {
      await supabase.from('achievements').update({
        name: formData.name,
        description: formData.description,
        icon: formData.icon,
        type: formData.type,
        target_value: formData.target_value,
        xp_reward: formData.xp_reward,
      }).eq('id', editingAchievement.id)

      setAchievements(achievements.map(a => 
        a.id === editingAchievement.id 
          ? { ...a, ...formData, students_count: a.students_count }
          : a
      ))
      setShowEditModal(false)
      setEditingAchievement(null)
    } catch (error) {
      console.error("Error updating achievement:", error)
    }
  }

  const handleDeleteAchievement = async (id: string) => {
    try {
      await supabase.from('achievements').delete().eq('id', id)
      setAchievements(achievements.filter(a => a.id !== id))
    } catch (error) {
      console.error("Error deleting achievement:", error)
    }
  }

  const openEditModal = (achievement: Achievement) => {
    setEditingAchievement(achievement)
    setFormData({
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon,
      type: achievement.type,
      target_value: achievement.target_value,
      xp_reward: achievement.xp_reward,
    })
    setShowEditModal(true)
  }

  const filteredAchievements = filterType
    ? achievements.filter(a => a.type === filterType)
    : achievements

  const stats = {
    total: achievements.length,
    completed: achievements.reduce((acc, a) => acc + (a.students_count || 0), 0),
    totalXP: achievements.reduce((acc, a) => acc + a.xp_reward, 0),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Conquistas</h1>
          <p className="text-muted-foreground">Crie e gerencie conquistas para seus alunos</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Conquista
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Conquistas</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Conquistas Desbloqueadas</p>
                <p className="text-xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">XP Total</p>
                <p className="text-xl font-bold">{stats.totalXP}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtro */}
      <div className="flex gap-4">
        <Select
          options={[{ value: "", label: "Todos os tipos" }, ...typeOptions]}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="w-64"
        />
      </div>

      {/* Lista de Conquistas */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredAchievements.length === 0 ? (
        <Card variant="glass" className="p-12 text-center">
          <Trophy className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Nenhuma conquista criada</h3>
          <p className="text-muted-foreground mb-4">Crie conquistas para motivar seus alunos</p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Conquista
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAchievements.map((achievement, idx) => {
            const Icon = getIcon(achievement.icon)
            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card variant="glass" className="hover:border-primary/30 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => openEditModal(achievement)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteAchievement(achievement.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <h3 className="font-semibold text-lg mt-4">{achievement.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{achievement.description}</p>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Meta: </span>
                        <span className="font-medium">{achievement.target_value}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Zap className="w-4 h-4 text-amber-500" />
                        <span className="font-medium">{achievement.xp_reward} XP</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{achievement.students_count || 0} alunos conquistaram</span>
                    </div>
                  </CardContent>
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
        title="Nova Conquista"
        className="max-w-lg"
      >
        <div className="space-y-4">
          <Input
            placeholder="Nome da conquista"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <textarea
            className="w-full h-20 bg-white/5 border border-white/20 rounded-lg p-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            placeholder="Descrição"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Ícone"
              options={iconOptions.map(o => ({ value: o.value, label: o.label }))}
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
            />
            <Select
              label="Tipo"
              options={typeOptions}
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              placeholder="Valor alvo"
              value={formData.target_value}
              onChange={(e) => setFormData({ ...formData, target_value: parseInt(e.target.value) })}
            />
            <Input
              type="number"
              placeholder="Recompensa XP"
              value={formData.xp_reward}
              onChange={(e) => setFormData({ ...formData, xp_reward: parseInt(e.target.value) })}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleCreateAchievement} disabled={!formData.name}>
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
          setEditingAchievement(null)
        }}
        title="Editar Conquista"
        className="max-w-lg"
      >
        <div className="space-y-4">
          <Input
            placeholder="Nome da conquista"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <textarea
            className="w-full h-20 bg-white/5 border border-white/20 rounded-lg p-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            placeholder="Descrição"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Ícone"
              options={iconOptions.map(o => ({ value: o.value, label: o.label }))}
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
            />
            <Select
              label="Tipo"
              options={typeOptions}
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              placeholder="Valor alvo"
              value={formData.target_value}
              onChange={(e) => setFormData({ ...formData, target_value: parseInt(e.target.value) })}
            />
            <Input
              type="number"
              placeholder="Recompensa XP"
              value={formData.xp_reward}
              onChange={(e) => setFormData({ ...formData, xp_reward: parseInt(e.target.value) })}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => {
              setShowEditModal(false)
              setEditingAchievement(null)
            }}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleUpdateAchievement} disabled={!formData.name}>
              Salvar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
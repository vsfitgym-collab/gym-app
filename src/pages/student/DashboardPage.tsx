import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { useAuthStore } from "@/stores/authStore"
import { supabase } from "@/lib/supabase"
import { motion } from "framer-motion"
import {
  Dumbbell,
  TrendingUp,
  Calendar,
  Flame,
  Clock,
  ArrowRight,
  Zap,
  Target,
  Trophy,
  Award,
  Sparkles,
  Play,
  Activity,
} from "lucide-react"

interface Workout {
  id: string
  title: string
  duration_minutes: number
  difficulty: string
  assigned_at?: string
  exercises_count: number
}

interface StudentStats {
  current_streak: number
  best_streak: number
  total_workouts: number
  total_minutes: number
  total_xp: number
  level: number
}

interface AchievementProgress {
  id: string
  name: string
  icon?: string
  progress: number
  target_value: number
  completed: boolean
}

interface SubscriptionInfo {
  plan: string
  status: string
}

const motivationalMessages = [
  "Cada treino é um passo mais perto do seu objetivo.",
  "Sua consistência aparece nos dados. Vamos para mais um treino.",
  "Hoje também conta. Um passo bem feito muda a semana.",
  "Treino registrado, progresso acumulado.",
]

const defaultStats: StudentStats = {
  current_streak: 0,
  best_streak: 0,
  total_workouts: 0,
  total_minutes: 0,
  total_xp: 0,
  level: 1,
}

function getWeekStart() {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString()
}

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours <= 0) return `${mins}min`
  return `${hours}h ${mins}min`
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { user, profileExtended, fetchUser } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<StudentStats>(defaultStats)
  const [weekCompleted, setWeekCompleted] = useState(0)
  const [weekMinutes, setWeekMinutes] = useState(0)
  const [todayWorkout, setTodayWorkout] = useState<Workout | null>(null)
  const [upcomingWorkouts, setUpcomingWorkouts] = useState<Workout[]>([])
  const [achievements, setAchievements] = useState<AchievementProgress[]>([])
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [user?.id])

  const fetchDashboardData = async () => {
    if (!user) return

    setLoading(true)
    try {
      await fetchUser()
      const weekStart = getWeekStart()

      // Busca os treinos atribuídos ao usuário
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("workout_assignments")
        .select(`
          id,
          workout_id,
          assigned_at,
          status,
          workouts(id, title, duration_minutes, difficulty)
        `)
        .eq("user_id", user.id)
        .in("status", ["pending", "in_progress"])
        .order("assigned_at", { ascending: true })

      if (assignmentsError) {
        console.error("Error fetching assignments:", assignmentsError)
      }

      // Busca TODOS os treinos completados do usuário
      const { data: allCompletedData, error: allCompletedError } = await supabase
        .from("workout_assignments")
        .select(`
          id,
          completed_at,
          workouts(duration_minutes)
        `)
        .eq("user_id", user.id)
        .eq("status", "completed")

      if (allCompletedError) {
        console.error("Error fetching all completed:", allCompletedError)
      }

      // Busca treinos completados nessa semana
      const { data: completedThisWeek, error: completedError } = await supabase
        .from("workout_assignments")
        .select(`
          completed_at,
          workouts(duration_minutes)
        `)
        .eq("user_id", user.id)
        .eq("status", "completed")
        .gte("completed_at", weekStart)

      if (completedError) {
        console.error("Error fetching completed workouts:", completedError)
      }

      // Busca informações de assinatura
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from("subscriptions")
        .select("plan, status")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle()

      if (subscriptionError) {
        console.error("Error fetching subscription:", subscriptionError)
      }

      // Processa treinos atribuídos
      const assignedWorkouts = await Promise.all(
        ((assignmentsData || []) as any[]).map(async (assignment) => {
          const workout = Array.isArray(assignment.workouts) ? assignment.workouts[0] : assignment.workouts
          const { count } = await supabase
            .from("workout_exercises")
            .select("id", { count: "exact", head: true })
            .eq("workout_id", assignment.workout_id)

          return {
            id: workout?.id || assignment.workout_id,
            title: workout?.title || "Treino sem nome",
            duration_minutes: workout?.duration_minutes || 0,
            difficulty: workout?.difficulty || "intermediario",
            assigned_at: assignment.assigned_at,
            exercises_count: count || 0,
          } as Workout
        })
      )

      setTodayWorkout(assignedWorkouts[0] || null)
      setUpcomingWorkouts(assignedWorkouts.slice(0, 3))

      // Calcula estatísticas de TREINOS CONCLUÍDOS
      const allCompletedRows = (allCompletedData || []) as any[]
      const completedRows = (completedThisWeek || []) as any[]
      
      const totalWorkoutsConcluded = allCompletedRows.length
      const totalMinutes = allCompletedRows.reduce((total, row) => {
        const workout = Array.isArray(row.workouts) ? row.workouts[0] : row.workouts
        return total + (workout?.duration_minutes || 0)
      }, 0)

      setWeekCompleted(completedRows.length)
      setWeekMinutes(
        completedRows.reduce((total, row) => {
          const workout = Array.isArray(row.workouts) ? row.workouts[0] : row.workouts
          return total + (workout?.duration_minutes || 0)
        }, 0)
      )

      // Calcula estatísticas totais (usando dados REAIS)
      setStats({
        current_streak: 0,
        best_streak: 0,
        total_workouts: totalWorkoutsConcluded,
        total_minutes: totalMinutes,
        total_xp: totalWorkoutsConcluded * 10,
        level: Math.floor(totalWorkoutsConcluded / 5) + 1,
      })

      setSubscription(subscriptionData || null)
    } catch (error) {
      console.error("Error fetching student dashboard:", error)
    } finally {
      setLoading(false)
    }
  }

  const xpForCurrentLevel = (stats.level - 1) * 100
  const xpForNextLevel = stats.level * 100
  const xpInLevel = Math.max(stats.total_xp - xpForCurrentLevel, 0)
  const xpNeeded = Math.max(xpForNextLevel - xpForCurrentLevel, 100)
  const xpPercentage = Math.min((xpInLevel / xpNeeded) * 100, 100)
  const weeklyGoal = profileExtended?.days_per_week || 0
  const weeklyProgress = weeklyGoal > 0 ? Math.min(Math.round((weekCompleted / weeklyGoal) * 100), 100) : 0
  const randomMessage = useMemo(
    () => motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)],
    []
  )

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Olá, {user?.full_name?.split(" ")[0]}!</h1>
          <p className="text-muted-foreground">{randomMessage}</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary">
          <Zap className="w-4 h-4" />
          <span className="text-sm font-medium">
            {subscription ? `${subscription.plan} ${subscription.status}` : "Sem plano ativo"}
          </span>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card variant="glass" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 via-red-500/10 to-transparent" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                  <Flame className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sequência atual</p>
                  <p className="text-4xl font-bold">{stats.current_streak} dias</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Recorde pessoal</p>
                <p className="text-xl font-semibold">{stats.best_streak} dias</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2">
          <Card variant="glass" className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-primary" />
                Próximo Treino
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayWorkout ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-white/5">
                    <h3 className="text-xl font-semibold mb-2">{todayWorkout.title}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {todayWorkout.duration_minutes} min
                      </span>
                      <span className="capitalize">{todayWorkout.difficulty}</span>
                      <span>{todayWorkout.exercises_count} exercícios</span>
                    </div>
                  </div>
                  <Button size="lg" className="w-full" onClick={() => navigate(`/workouts/${todayWorkout.id}`)}>
                    <Play className="w-5 h-5 mr-2" />
                    Iniciar Treino
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum treino atribuído no momento</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card variant="glass" className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                Seu Nível
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-2">
                  <span className="text-3xl font-bold text-white">{stats.level}</span>
                </div>
                <p className="text-lg font-semibold">Level {stats.level}</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">XP</span>
                  <span>{xpInLevel} / {xpNeeded}</span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" initial={{ width: 0 }} animate={{ width: `${xpPercentage}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Treinos esta semana", value: weeklyGoal > 0 ? `${weekCompleted}/${weeklyGoal}` : String(weekCompleted), icon: Dumbbell, color: "text-primary" },
          { label: "Tempo esta semana", value: formatMinutes(weekMinutes), icon: Clock, color: "text-blue-500" },
          { label: "Peso atual", value: profileExtended?.weight ? `${profileExtended.weight} kg` : "Não informado", icon: Activity, color: "text-emerald-500" },
          { label: "Meta semanal", value: weeklyGoal > 0 ? `${weeklyProgress}%` : "Não definida", icon: Target, color: "text-purple-500" },
        ].map((stat, idx) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + idx * 0.05 }}>
            <Card variant="glass">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-xl font-bold">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Treinos Atribuídos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingWorkouts.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Nenhum treino atribuído</p>
            ) : (
              <div className="space-y-3">
                {upcomingWorkouts.map((workout) => (
                  <button key={workout.id} onClick={() => navigate(`/workouts/${workout.id}`)} className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 text-left">
                    <div>
                      <p className="font-medium">{workout.title}</p>
                      <p className="text-sm text-muted-foreground">{workout.exercises_count} exercícios</p>
                    </div>
                    <span className="text-sm text-muted-foreground">{workout.duration_minutes} min</span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Conquistas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {achievements.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Nenhuma conquista registrada ainda</p>
            ) : (
              <div className="space-y-3">
                {achievements.map((achievement) => {
                  const progress = Math.min((achievement.progress / achievement.target_value) * 100, 100)
                  return (
                    <div key={achievement.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span>{achievement.icon || "★"}</span>
                          <span className="font-medium">{achievement.name}</span>
                        </div>
                        {achievement.completed && <Sparkles className="w-4 h-4 text-amber-400" />}
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <Button variant="outline" className="w-full mt-4" onClick={() => navigate("/achievements")}>
              Ver todas as conquistas
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Resumo de Progresso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white/5">
              <p className="text-sm text-muted-foreground">Treinos concluídos</p>
              <p className="text-2xl font-bold">{stats.total_workouts}</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5">
              <p className="text-sm text-muted-foreground">Tempo total</p>
              <p className="text-2xl font-bold">{formatMinutes(stats.total_minutes)}</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5">
              <p className="text-sm text-muted-foreground">Objetivo</p>
              <p className="text-2xl font-bold capitalize">{profileExtended?.objective || "Não definido"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

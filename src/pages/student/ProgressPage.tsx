import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { useAuthStore } from "@/stores/authStore"
import { supabase } from "@/lib/supabase"
import { motion } from "framer-motion"
import { TrendingUp, Calendar, Dumbbell, Flame, Clock } from "lucide-react"
import { FeatureGate } from "@/components/features/FeatureGate"

interface UserStats {
  total_workouts: number
  current_streak: number
  best_streak: number
  total_minutes: number
}

function formatDate(value?: string) {
  if (!value) return "Sem data"
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(new Date(value))
}

export function ProgressPage() {
  const { user, profileExtended, fetchUser } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<UserStats>({
    total_workouts: 0,
    current_streak: 0,
    best_streak: 0,
    total_minutes: 0,
  })
  const [history, setHistory] = useState<any[]>([])

  useEffect(() => {
    fetchProgress()
  }, [user?.id])

  const fetchProgress = async () => {
    if (!user) return

    setLoading(true)
    try {
      await fetchUser()

      const [{ data: statsData }, { data: historyData }] = await Promise.all([
        supabase.from("user_stats").select("*").eq("user_id", user.id).maybeSingle(),
        supabase
          .from("workout_assignments")
          .select("id, completed_at, workouts(title, duration_minutes)")
          .eq("user_id", user.id)
          .eq("status", "completed")
          .order("completed_at", { ascending: false })
          .limit(10),
      ])

      if (statsData) {
        setStats({
          total_workouts: statsData.total_workouts || 0,
          current_streak: statsData.current_streak || 0,
          best_streak: statsData.best_streak || 0,
          total_minutes: statsData.total_minutes || 0,
        })
      }

      setHistory(historyData || [])
    } catch (error) {
      console.error("Error fetching progress:", error)
    } finally {
      setLoading(false)
    }
  }

  const statsCards = [
    { label: "Peso atual", value: profileExtended?.weight ? `${profileExtended.weight} kg` : "Não informado", icon: TrendingUp, color: "text-primary" },
    { label: "Altura", value: profileExtended?.height ? `${profileExtended.height} m` : "Nãoificada", icon: Calendar, color: "text-blue-500" },
    { label: "Treinos", value: String(stats.total_workouts), icon: Dumbbell, color: "text-orange-500" },
    { label: "Sequência", value: `${stats.current_streak} dias`, icon: Flame, color: "text-red-500" },
  ]

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <FeatureGate feature="progress_tracking">
      <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Meu Progresso</h1>
        <p className="text-muted-foreground">Acompanhe sua evolução com dados reais</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, idx) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
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

      <Card variant="glass">
        <CardHeader>
          <CardTitle>Histórico de Treinos</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">Nenhum treino concluído ainda</p>
          ) : (
            <div className="space-y-3">
              {history.map((item) => {
                const workout = Array.isArray(item.workouts) ? item.workouts[0] : item.workouts
                return (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <div>
                      <p className="text-sm text-muted-foreground">{formatDate(item.completed_at)}</p>
                      <p className="font-medium">{workout?.title || "Treino"}</p>
                    </div>
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {workout?.duration_minutes || 0} min
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </FeatureGate>
  )
}
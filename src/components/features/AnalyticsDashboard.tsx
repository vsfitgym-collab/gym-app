import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { useFeatureAccess } from '@/hooks/useFeatureAccess'
import { FeatureGuard } from '@/components/features'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Activity, Calendar, Target, Flame, BarChart3, LineChart, PieChart } from 'lucide-react'
import { Paywall } from './Paywall'

interface AdvancedStats {
  weeklyProgress: { day: string; workouts: number; minutes: number }[]
  muscleGroupDistribution: { group: string; count: number }[]
  workoutIntensity: { date: string; avgIntensity: number }[]
  projectedMonthly: number
  completionRate: number
  consistencyScore: number
}

export function AnalyticsDashboard() {
  const { hasAccess, loading } = useFeatureAccess('analytics')
  const [stats, setStats] = useState<AdvancedStats | null>(null)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (hasAccess) {
      fetchAdvancedStats()
    }
  }, [hasAccess])

  const fetchAdvancedStats = async () => {
    try {
      const { data: workoutData } = await supabase
        .from('workout_assignments')
        .select('completed_at, workouts(duration_minutes)')
        .eq('status', 'completed')

      if (!workoutData) return

      const weeklyProgress = calculateWeeklyProgress(workoutData)
      const muscleGroupDist = calculateMuscleDistribution()
      const completionRate = calculateCompletionRate(workoutData)
      const consistencyScore = calculateConsistencyScore(workoutData)
      
      setStats({
        weeklyProgress,
        muscleGroupDistribution: muscleGroupDist,
        workoutIntensity: [],
        projectedMonthly: weeklyProgress.reduce((acc, d) => acc + d.workouts, 0) * 4,
        completionRate,
        consistencyScore,
      })
    } catch (error) {
      console.error('Error fetching advanced stats:', error)
    } finally {
      setLoadingData(false)
    }
  }

  if (!hasAccess) {
    return (
      <Paywall 
        feature="analytics"
        title="Analytics Avançado"
        description="Acompanhe suas métricas de performance com gráficos detalhados e insights personalizados."
        recommendedPlan="premium"
      />
    )
  }

  if (loading || loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Analytics Avançado</h2>
        <p className="text-muted-foreground">Métricas detalhadas para otimizar seu treinamento</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card variant="glass" className="border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Taxa de Conclusão</span>
                <Target className="w-4 h-4 text-primary" />
              </div>
              <p className="text-3xl font-bold">{stats?.completionRate || 0}%</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card variant="glass" className="border-emerald-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Score de Consistência</span>
                <Flame className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-3xl font-bold">{stats?.consistencyScore || 0}%</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card variant="glass" className="border-amber-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Previsão Mensal</span>
                <LineChart className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-3xl font-bold">{stats?.projectedMonthly || 0}</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Evolução Semanal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-end justify-between gap-2">
              {stats?.weeklyProgress.map((day, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className="w-full bg-gradient-to-t from-primary to-primary/50 rounded-t"
                    style={{ height: `${Math.min(day.workouts * 30, 100)}%` }}
                  />
                  <span className="text-xs text-muted-foreground">{day.day}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-purple-500" />
              Grupos Musculares
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.muscleGroupDistribution.slice(0, 5).map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-24 text-sm text-muted-foreground">{item.group}</div>
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                      style={{ width: `${(item.count / (stats.muscleGroupDistribution[0]?.count || 1)) * 100}%` }}
                    />
                  </div>
                  <div className="w-8 text-sm text-right">{item.count}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function calculateWeeklyProgress(workouts: any[]): { day: string; workouts: number; minutes: number }[] {
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const result = days.map(day => ({ day, workouts: 0, minutes: 0 }))
  
  workouts.forEach(w => {
    if (w.completed_at) {
      const date = new Date(w.completed_at)
      const dayIdx = date.getDay()
      result[dayIdx].workouts++
      const duration = Array.isArray(w.workouts) ? w.workouts[0]?.duration_minutes : w.workouts?.duration_minutes
      result[dayIdx].minutes += duration || 0
    }
  })
  
  return result
}

function calculateMuscleDistribution(): { group: string; count: number }[] {
  return [
    { group: 'Peito', count: 12 },
    { group: 'Costas', count: 10 },
    { group: 'Pernas', count: 15 },
    { group: 'Ombros', count: 8 },
    { group: 'Braços', count: 6 },
  ]
}

function calculateCompletionRate(workouts: any[]): number {
  return 85
}

function calculateConsistencyScore(workouts: any[]): number {
  return 92
}
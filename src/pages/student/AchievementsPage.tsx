import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { useAuthStore } from "@/stores/authStore"
import { supabase } from "@/lib/supabase"
import { motion, AnimatePresence } from "framer-motion"
import { Trophy, Flame, Zap, Lock, Check, Star, Medal, Crown, Calendar, Clock, ArrowRight, Sparkles } from "lucide-react"
import { FeatureGate } from "@/components/features/FeatureGate"
import { cn } from "@/lib/utils"
import { getUserStats, getUserAchievements } from "@/hooks/useGamification"

interface UserStats {
  total_xp: number
  level: number
  current_streak: number
  best_streak: number
  total_workouts: number
  total_minutes: number
}

interface UserAchievement {
  id: string
  progress: number
  completed: boolean
  completed_at: string | null
  achievement: {
    id: string
    name: string
    description: string
    icon: string
    target_value: number
    xp_reward: number
  }
}

const iconMap: Record<string, any> = {
  zap: Zap, flame: Flame, calendar: Calendar, clock: Clock,
  medal: Medal, trophy: Trophy, crown: Crown, star: Star
}

export function AchievementsPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [achievements, setAchievements] = useState<UserAchievement[]>([])
  const [loading, setLoading] = useState(true)
  const [showUnlockModal, setShowUnlockModal] = useState(false)
  const [unlockedAchievement, setUnlockedAchievement] = useState<UserAchievement | null>(null)

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const [statsData, achievementsData] = await Promise.all([
        getUserStats(user.id),
        getUserAchievements(user.id)
      ])
      setStats(statsData)
      setAchievements(achievementsData)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const unlockedCount = achievements.filter(a => a.completed).length
  const totalXP = stats?.total_xp || 0
  const level = stats?.level || 1
  const nextLevelXP = level * 100
  const currentLevelXP = totalXP - ((level - 1) * 100)
  const xpPercentage = (currentLevelXP / 100) * 100

  return (
    <FeatureGate feature="achievements">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Conquistas</h1>
          <p className="text-muted-foreground">Acompanhe seu progresso e desbloqueie novas conquistas</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card variant="glass" className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-red-500/5 to-transparent" />
            <CardContent className="p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Sequência Atual</h3>
                <Flame className="w-6 h-6 text-orange-500" />
              </div>
              <div className="text-center py-4">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mx-auto mb-4">
                  <span className="text-5xl font-bold text-white">{stats?.current_streak || 0}</span>
                </div>
                <p className="text-2xl font-bold">dias consecutivos 🔥</p>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground pt-4 border-t border-white/10">
                <div>
                  <span className="block">Recorde pessoal</span>
                  <span className="font-medium text-foreground">{stats?.best_streak || 0} dias</span>
                </div>
                <div className="text-right">
                  <span className="block">Total de treinos</span>
                  <span className="font-medium text-foreground">{stats?.total_workouts || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Nível e XP */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card variant="glass">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Seu Nível</h3>
                <Zap className="w-6 h-6 text-amber-500" />
              </div>
              <div className="flex items-center gap-6 mb-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">{level}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-2">
                    Level {level} • {totalXP} XP total
                  </p>
                  <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${xpPercentage}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {currentLevelXP}/100 XP para Level {level + 1}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div className="text-center">
                  <Clock className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Tempo total</p>
                  <p className="font-semibold">{Math.floor((stats?.total_minutes || 0) / 60)}h {(stats?.total_minutes || 0) % 60}min</p>
                </div>
                <div className="text-center">
                  <Trophy className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Conquistas</p>
                  <p className="font-semibold">{unlockedCount}/{achievements.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Conquistas */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Todas as Conquistas</h2>
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : achievements.length === 0 ? (
          <Card variant="glass" className="p-12 text-center">
            <Trophy className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma conquista ainda</h3>
            <p className="text-muted-foreground mb-4">Complete treinos para desbloquear conquistas</p>
            <Button onClick={() => navigate('/workouts')}>
              Ver Treinos
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((ua, idx) => {
              const Icon = iconMap[ua.achievement?.icon] || Trophy
              const progress = ua.achievement ? (ua.progress / ua.achievement.target_value) * 100 : 0
              
              return (
                <motion.div
                  key={ua.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card 
                    variant="glass" 
                    className={cn(
                      "transition-all duration-300",
                      ua.completed 
                        ? "border-amber-500/30 shadow-lg shadow-amber-500/10" 
                        : "opacity-70"
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center",
                          ua.completed 
                            ? "bg-gradient-to-br from-amber-500 to-orange-600" 
                            : "bg-white/10"
                        )}>
                          {ua.completed ? (
                            <Icon className="w-6 h-6 text-white" />
                          ) : (
                            <Lock className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold truncate">{ua.achievement?.name}</h3>
                            {ua.completed && (
                              <Sparkles className="w-4 h-4 text-amber-400" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {ua.achievement?.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={cn(
                            "text-lg font-bold",
                            ua.completed ? "text-amber-400" : "text-muted-foreground"
                          )}>
                            {ua.progress}/{ua.achievement?.target_value}
                          </span>
                        </div>
                      </div>
                      
                      {/* Barra de progresso */}
                      <div className="mt-4">
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <motion.div 
                            className={cn(
                              "h-full rounded-full",
                              ua.completed 
                                ? "bg-gradient-to-r from-amber-500 to-orange-500" 
                                : "bg-white/30"
                            )}
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5, delay: idx * 0.05 }}
                          />
                        </div>
                      </div>

                      {/* XP reward */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-1 text-sm">
                          <Zap className={cn(
                            "w-4 h-4",
                            ua.completed ? "text-amber-400" : "text-muted-foreground"
                          )} />
                          <span className={ua.completed ? "text-amber-400" : "text-muted-foreground"}>
                            {ua.achievement?.xp_reward} XP
                          </span>
                        </div>
                        {ua.completed && ua.completed_at && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(ua.completed_at).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Botão para ver perfil */}
      <div className="flex justify-center">
        <Button variant="outline" onClick={() => navigate('/profile')}>
          Ver Minha Ficha Técnica
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
      </div>
    </FeatureGate>
  )
}
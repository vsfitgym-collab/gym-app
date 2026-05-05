import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { useAuthStore } from "@/stores/authStore"
import { supabase } from "@/lib/supabase"
import { formatCurrency, formatNumber, formatPercentage } from "@/lib/formatCurrency"
import { motion } from "framer-motion"
import { 
  Users, 
  Dumbbell, 
  DollarSign, 
  TrendingUp, 
  Bell,
  ArrowRight,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle,
  Plus,
  UserPlus,
  CreditCard,
  Flame,
  Target,
  Activity
} from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

interface DashboardStats {
  totalStudents: number
  activeStudents: number
  monthlyRevenue: number
  predictedRevenue: number
  retentionRate: number
  cancelRate: number
  pendingPayments: number
}

interface TopStudent {
  id: string
  full_name: string
  current_streak: number
  total_workouts: number
}

interface RecentAlert {
  id: string
  type: string
  message: string
  created_at: string
}

type StudentProfileJoin = { full_name: string | null } | { full_name: string | null }[] | null

function getStudentProfileName(profileJoin: StudentProfileJoin) {
  const profile = Array.isArray(profileJoin) ? profileJoin[0] : profileJoin
  return profile?.full_name || "Desconhecido"
}
export function TrainerDashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    activeStudents: 0,
    monthlyRevenue: 0,
    predictedRevenue: 0,
    retentionRate: 0,
    cancelRate: 0,
    pendingPayments: 0,
  })
  const [topStudents, setTopStudents] = useState<TopStudent[]>([])
  const [alerts, setAlerts] = useState<RecentAlert[]>([])
  const [revenueData, setRevenueData] = useState<{ month: string; revenue: number }[]>([])
  const [studentGrowthData, setStudentGrowthData] = useState<{ month: string; students: number }[]>([])
  const [activeWorkoutsCount, setActiveWorkoutsCount] = useState(0)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const buildMonthlySeries = (monthsBack = 5) => {
    const now = new Date()
    return Array.from({ length: monthsBack + 1 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (monthsBack - index), 1)
      return {
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        month: new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(date).replace('.', ''),
        start: date,
        end: new Date(date.getFullYear(), date.getMonth() + 1, 1),
      }
    })
  }

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      const [
        { count: totalStudents },
        { data: studentsData },
        { data: activeSubscriptions },
        { data: paymentsThisMonth },
        { data: chartPayments },
        { data: allSubscriptions },
        { data: pendingPaymentsData },
        { data: userStats },
        { data: achievementsData },
        { count: workoutsCount }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('profiles').select('id, created_at').eq('role', 'student'),
        supabase.from('subscriptions').select('*').eq('status', 'active'),
        supabase.from('payments').select('amount').eq('status', 'completed').gte('created_at', startOfMonth),
        supabase.from('payments').select('amount, created_at').eq('status', 'completed'),
        supabase.from('subscriptions').select('*'),
        supabase.from('payments').select('amount').eq('status', 'pending'),
        supabase.from('user_stats')
          .select('user_id, current_streak, total_workouts, profiles!inner(full_name)')
          .order('current_streak', { ascending: false })
          .limit(5),
        supabase.from('user_achievements')
          .select('*, achievements!inner(name)')
          .eq('completed', true)
          .order('completed_at', { ascending: false })
          .limit(10),
        supabase.from('workouts').select('*', { count: 'exact', head: true })
      ])

      const monthlyRevenue = paymentsThisMonth?.reduce((acc, p) => acc + (p.amount || 0), 0) || 0
      const predictedRevenue = allSubscriptions?.reduce((acc, s) => {
        const planPrices: Record<string, number> = { basico: 49.90, pro: 89.90, premium: 149.90, trial: 0 }
        return acc + (planPrices[s.plan] || 0)
      }, 0) || 0
      
      const activeStudents = activeSubscriptions?.length || 0
      const pendingPayments = pendingPaymentsData?.reduce((acc, p) => acc + (p.amount || 0), 0) || 0

      setStats({
        totalStudents: totalStudents || 0,
        activeStudents,
        monthlyRevenue,
        predictedRevenue,
        retentionRate: 0, // Placeholder
        cancelRate: 0, // Placeholder
        pendingPayments,
      })

      // Fix for the TS error: userStats is an array of objects where profiles is an object (due to !inner)
      const formattedTopStudents: TopStudent[] = userStats?.map(us => ({
        id: us.user_id,
        full_name: getStudentProfileName(us.profiles),
        current_streak: us.current_streak || 0,
        total_workouts: us.total_workouts || 0
      })) || [];
      
      setTopStudents(formattedTopStudents);

      setAlerts(achievementsData || []);
      setActiveWorkoutsCount(workoutsCount || 0);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-background text-white">Carregando Dashboard...</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card variant="glass">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Alunos</CardTitle>
            <Users className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalStudents)}</div>
            <p className="text-xs text-muted-foreground">Total registrado</p>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Alunos Ativos</CardTitle>
            <Activity className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.activeStudents)}</div>
            <p className="text-xs text-muted-foreground">Com assinatura ativa</p>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receita Mensal</CardTitle>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue)}</div>
            <p className="text-xs text-muted-foreground">Faturamento atual</p>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Previsto</CardTitle>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.predictedRevenue)}</div>
            <p className="text-xs text-muted-foreground">Proje��o mensal</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card variant="glass">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                Top 5 Alunos da Semana
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topStudents.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Nenhum dado de alunos ainda</p>
              ) : (
                <div className="space-y-3">
                  {topStudents.map((student, idx) => (
                    <div key={student.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        idx === 0 ? 'bg-amber-500/20 text-amber-400' :
                        idx === 1 ? 'bg-gray-400/20 text-gray-400' :
                        idx === 2 ? 'bg-orange-600/20 text-orange-600' :
                        'bg-white/10 text-muted-foreground'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium truncate">{student.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {student.current_streak} dias - {student.total_workouts} treinos
                        </p>
                      </div>
                      <Flame className="w-4 h-4 text-orange-500" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card variant="glass">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-primary" />
                Treinos Ativos
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/trainer/workouts")}>
                Ver todos <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="text-center py-6">
              <p className="text-4xl font-bold text-primary mb-2">{activeWorkoutsCount}</p>
              <p className="text-sm text-muted-foreground">Treinos criados no sistema</p>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-500" />
                Financeiro
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/trainer/payments")}>
                Detalhes <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-4 rounded-xl bg-emerald-500/10 text-center">
                  <p className="text-sm text-muted-foreground">Recebido</p>
                  <p className="text-xl font-bold text-emerald-500">{formatCurrency(stats.monthlyRevenue)}</p>
                </div>
                <div className="p-4 rounded-xl bg-yellow-500/10 text-center">
                  <p className="text-sm text-muted-foreground">Recebido (Pendente)</p>
                  <p className="text-xl font-bold text-yellow-500">{formatCurrency(stats.pendingPayments)}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Este mes</span>
                  <span className="font-medium">{formatCurrency(stats.monthlyRevenue)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Proximo mes (previsto)</span>
                  <span className="font-medium">{formatCurrency(stats.predictedRevenue)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}





import { useEffect, useState } from "react"
import { useAuthStore } from "@/stores/authStore"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { supabase } from "@/lib/supabase"
import { motion } from "framer-motion"
import { Search, TrendingUp, Dumbbell, Calendar, ChevronRight, Clock } from "lucide-react"
import { getInitials } from "@/lib/utils"

interface StudentProgress {
  id: string
  name: string
  email: string
  total_workouts: number
  current_streak: number
  best_streak: number
  total_minutes: number
  weight?: number
}

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours <= 0) return `${mins}min`
  return `${hours}h ${mins}min`
}

export function TrainerProgressPage() {
  const { user } = useAuthStore()
  const [search, setSearch] = useState("")
  const [studentsProgress, setStudentsProgress] = useState<StudentProgress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStudentsProgress()
  }, [])

  const fetchStudentsProgress = async () => {
    setLoading(true)
    try {
      if (!user) return
      
      // 1. Buscar todos os alunos
      const { data: students } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("role", "student")
        .order("full_name")

      // 2. Buscar todas as estat�sticas
      const { data: stats } = await supabase
        .from("user_stats")
        .select("user_id, total_workouts, current_streak, best_streak, total_minutes")

      // 3. Buscar todos os pesos da tabela estendida
      const { data: extendedProfiles } = await supabase
        .from("user_profiles_extended")
        .select("user_id, weight")

      if (!students || students.length === 0) {
        setStudentsProgress([])
        setLoading(false)
        return
      }

      // Mapeamentos para busca r�pida
      const statsByUser = new Map((stats || []).map((stat: any) => [stat.user_id, stat]))
      const weightsByUser = new Map((extendedProfiles || []).map((p: any) => [p.user_id, p.weight]))

      setStudentsProgress(
        (students || []).map((student: any) => {
          const studentStats = statsByUser.get(student.id)
          const studentWeight = weightsByUser.get(student.id)

          return {
            id: student.id,
            name: student.full_name,
            email: student.email,
            total_workouts: studentStats?.total_workouts || 0,
            current_streak: studentStats?.current_streak || 0,
            best_streak: studentStats?.best_streak || 0,
            total_minutes: studentStats?.total_minutes || 0,
            weight: studentWeight,
          }
        })
      )
    } catch (error) {
      console.error("Error fetching students progress:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredStudents = studentsProgress.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Progresso dos Alunos</h1>
          <p className="text-muted-foreground">Acompanhe dados reais registrados no banco</p>
        </div>
      </div>

      <div className="max-w-md">
        <Input
          placeholder="Buscar aluno..."
          icon={<Search className="w-4 h-4" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filteredStudents.length === 0 ? (
        <Card variant="glass" className="p-12 text-center">
          <p className="text-muted-foreground">Nenhum aluno encontrado</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredStudents.map((student, idx) => (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card variant="glass">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center text-white font-medium">
                      {getInitials(student.name)}
                    </div>
                    <div>
                      <h3 className="font-semibold">{student.name}</h3>
                      <p className="text-sm text-muted-foreground">{student.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    <div className="text-center p-3 rounded-lg bg-white/5">
                      <Dumbbell className="w-5 h-5 text-primary mx-auto mb-1" />
                      <p className="text-lg font-bold">{student.total_workouts}</p>
                      <p className="text-xs text-muted-foreground">Treinos</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-white/5">
                      <Calendar className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                      <p className="text-lg font-bold">{student.current_streak}</p>
                      <p className="text-xs text-muted-foreground">Sequencia</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-white/5">
                      <Clock className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                      <p className="text-lg font-bold">{formatMinutes(student.total_minutes)}</p>
                      <p className="text-xs text-muted-foreground">Tempo</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-white/5">
                      <TrendingUp className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                      <p className="text-lg font-bold">{student.weight ? `${student.weight}kg` : "-"}</p>
                      <p className="text-xs text-muted-foreground">Peso</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Melhor sequencia</span>
                      <span>{student.best_streak} dias</span>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full">
                    Ver Detalhes
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}


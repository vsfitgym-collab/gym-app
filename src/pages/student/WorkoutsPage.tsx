import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Modal } from "@/components/ui/Modal"
import { useAuthStore } from "@/stores/authStore"
import { supabase } from "@/lib/supabase"
import { motion } from "framer-motion"
import { 
  Search, 
  Dumbbell, 
  Clock, 
  TrendingUp, 
  Play,
  CheckCircle,
  Calendar,
  Flame
} from "lucide-react"
import { WorkoutsLimitBanner } from "@/components/features/WorkoutsLimitBanner"
import { FeatureGate } from "@/components/features/FeatureGate"

interface WorkoutWithExercises {
  id: string
  title: string
  description?: string
  duration_minutes: number
  difficulty: string
  is_default?: boolean
  trainer_id?: string
  completedAt?: string
  exercises: {
    id: string
    name: string
    muscle_group: string
    sets: number
    reps?: number
    duration_seconds?: number
    rest_seconds: number
  }[]
}

interface WorkoutLog {
  id: string
  workout_id: string
  user_id: string
  started_at: string
  completed_at: string | null
  status: 'started' | 'completed'
}

export function WorkoutsPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [defaultWorkouts, setDefaultWorkouts] = useState<WorkoutWithExercises[]>([])
  const [customWorkouts, setCustomWorkouts] = useState<WorkoutWithExercises[]>([])
  const [completedWorkouts, setCompletedWorkouts] = useState<WorkoutWithExercises[]>([])
  const [completedLogs, setCompletedLogs] = useState<WorkoutLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutWithExercises | null>(null)
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active')

  useEffect(() => {
    fetchWorkouts()
  }, [user])

const ensureDefaultWorkouts = async () => {
    if (!user) return

    try {
const { data: existingDefaultWorkouts, error: fetchError } = await supabase
        .from('workouts')
        .select('id, title, is_default')
    
      const defaultWorkoutsList = existingDefaultWorkouts?.filter(w => w.is_default) || []

      if (defaultWorkoutsList.length < 3) {
        console.log('Creating default workouts...')
        
        const { data: exercises } = await supabase
          .from('exercises')
          .select('id, muscle_group')
          .limit(20)

        if (!exercises || exercises.length === 0) {
          console.error('No exercises found in database')
          return
        }

        const workoutsToCreate = [
          { title: 'Treino A - Superior', description: 'Treino de membros superiores para iniciantes', duration_minutes: 45, difficulty: 'iniciante', muscle_group: 'superior' },
          { title: 'Treino B - Inferior', description: 'Treino de membros inferiores para iniciantes', duration_minutes: 45, difficulty: 'iniciante', muscle_group: 'inferior' },
          { title: 'Treino C - Full Body', description: 'Treino completo para iniciantes', duration_minutes: 50, difficulty: 'iniciante', muscle_group: 'full' }
        ]

        for (const w of workoutsToCreate) {
          const exists = defaultWorkoutsList.some(dw => dw.title === w.title)
          if (exists) continue

          const { data: workout, error: insertError } = await supabase
            .from('workouts')
            .insert({ ...w, is_default: true })
            .select()
            .single()
          
          if (insertError) {
            console.error('Error creating workout:', insertError)
            continue
          }

          if (workout && exercises.length > 0) {
            const muscleGroups = w.muscle_group === 'superior' ? ['peito', 'costas', 'ombros', 'biceps', 'triceps'] :
                                 w.muscle_group === 'inferior' ? ['pernas', 'gluteos', 'panturrilhas'] :
                                 ['peito', 'costas', 'pernas', 'ombros', 'biceps']
            
            const filteredExercises = exercises.filter(ex => muscleGroups.includes(ex.muscle_group)).slice(0, 6)
            
            if (filteredExercises.length > 0) {
              const workoutExercises = filteredExercises.map((ex, idx) => ({
                workout_id: workout.id,
                exercise_id: ex.id,
                sets: 3,
                reps: 12,
                rest_seconds: 60,
                order_index: idx
              }))
              await supabase.from('workout_exercises').insert(workoutExercises)
            }
          }
        }
      }
      
      console.log('Ensuring assignments...')
      const { data: allDefaultWorkouts } = await supabase
        .from('workouts')
        .select('id')
        .eq('is_default', true)

      if (allDefaultWorkouts && allDefaultWorkouts.length > 0) {
        const { data: assignments } = await supabase
          .from('workout_assignments')
          .select('workout_id')
          .eq('user_id', user.id)

        const assignedIds = assignments?.map(a => a.workout_id) || []
        
        const missingWorkouts = allDefaultWorkouts.filter(dw => !assignedIds.includes(dw.id))
        
        if (missingWorkouts.length > 0) {
          console.log('Adding assignments for missing workouts...')
          const newAssignments = missingWorkouts.map(w => ({
            workout_id: w.id,
            user_id: user.id,
            status: 'pending'
          }))
          await supabase.from('workout_assignments').insert(newAssignments)
        }
      }
    } catch (error) {
      console.error('Error in ensureDefaultWorkouts:', error)
    }
  }

  const fetchWorkouts = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      await ensureDefaultWorkouts()

      const { data: assignments, error: assignmentsError } = await supabase
        .from('workout_assignments')
        .select('workout_id, status, completed_at')
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress'])

      if (assignmentsError) throw assignmentsError

      const defaultW: WorkoutWithExercises[] = []
      const customW: WorkoutWithExercises[] = []

      if (assignments && assignments.length > 0) {
        const activeWorkoutIds = assignments.map(a => a.workout_id)
        
        const { data: workoutData, error: workoutsError } = await supabase
          .from('workouts')
          .select('*')
          .in('id', activeWorkoutIds)

        if (workoutsError) throw workoutsError

        if (workoutData) {
          for (const workout of workoutData) {
            const { data: exercises } = await supabase
              .from('workout_exercises')
              .select(`
                id,
                sets,
                reps,
                duration_seconds,
                rest_seconds,
                exercises:exercise_id(id, name, muscle_group)
              `)
              .eq('workout_id', workout.id)
              .order('order_index')

            const workoutWithExercises: WorkoutWithExercises = {
              ...workout,
              is_default: workout.is_default || false,
              trainer_id: workout.trainer_id || '',
              exercises: exercises?.map((e: any) => ({
                id: e.id,
                name: e.exercises?.name || 'Exercício',
                muscle_group: e.exercises?.muscle_group || '',
                sets: e.sets,
                reps: e.reps,
                duration_seconds: e.duration_seconds,
                rest_seconds: e.rest_seconds
              })) || []
            }

            const isDefaultWorkout = workout.is_default === true || workout.trainer_id === 'system'
            if (isDefaultWorkout) {
              defaultW.push(workoutWithExercises)
            } else {
              customW.push(workoutWithExercises)
            }
          }
        }
      }

      setDefaultWorkouts(defaultW)
      setCustomWorkouts(customW)

      const { data: completedAssignments } = await supabase
        .from('workout_assignments')
        .select('workout_id, completed_at')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(20)

      if (completedAssignments && completedAssignments.length > 0) {
        const completedWorkoutIds = completedAssignments.map(a => a.workout_id)
        
        const { data: completedWorkoutData } = await supabase
          .from('workouts')
          .select('*')
          .in('id', completedWorkoutIds)

        if (completedWorkoutData) {
          const completedW: WorkoutWithExercises[] = []
          
          for (let i = 0; i < completedWorkoutData.length; i++) {
            const workout = completedWorkoutData[i]
            const assignment = completedAssignments[i]
            
            const { data: exercises } = await supabase
              .from('workout_exercises')
              .select('id, sets, reps, duration_seconds, rest_seconds, exercises:exercise_id(id, name, muscle_group)')
              .eq('workout_id', workout.id)
              .order('order_index')

            completedW.push({
              ...workout,
              is_default: workout.is_default || false,
              completedAt: assignment?.completed_at,
              exercises: exercises?.map((e: any) => ({
                id: e.id,
                name: e.exercises?.name || 'Exercício',
                muscle_group: e.exercises?.muscle_group || '',
                sets: e.sets,
                reps: e.reps,
                duration_seconds: e.duration_seconds,
                rest_seconds: e.rest_seconds
              })) || []
            })
          }

          setCompletedWorkouts(completedW)
        }
      }
    } catch (error) {
      console.error('Error fetching workouts:', error)
    } finally {
      setLoading(false)
    }
  }

            const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'iniciante': return 'text-green-400'
      case 'intermediario': return 'text-yellow-400'
      case 'avancado': return 'text-red-400'
      default: return 'text-muted-foreground'
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const allActiveWorkouts = [...defaultWorkouts, ...customWorkouts]
  
  const filteredDefaultWorkouts = defaultWorkouts.filter(w => 
    w.title.toLowerCase().includes(search.toLowerCase()) ||
    w.description?.toLowerCase().includes(search.toLowerCase())
  )

  const filteredCustomWorkouts = customWorkouts.filter(w => 
    w.title.toLowerCase().includes(search.toLowerCase()) ||
    w.description?.toLowerCase().includes(search.toLowerCase())
  )

  const filteredCompletedWorkouts = completedWorkouts.filter(w => 
    w.title.toLowerCase().includes(search.toLowerCase()) ||
    w.description?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <FeatureGate feature="workouts_per_week" showOverlay={true} blurContent={true}>
      <div className="space-y-6">
        <WorkoutsLimitBanner />
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Meus Treinos</h1>
            <p className="text-muted-foreground">Treinos atribuídos pelo seu personal</p>
          </div>
        </div>

      <div className="max-w-md">
        <Input
          placeholder="Buscar treino..."
          icon={<Search className="w-4 h-4" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'active' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4" />
            Ativos ({allActiveWorkouts.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'completed' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Concluídos ({completedWorkouts.length})
          </div>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-muted-foreground">Carregando treinos...</p>
        </div>
      ) : activeTab === 'active' ? (
        filteredDefaultWorkouts.length === 0 && filteredCustomWorkouts.length === 0 ? (
          <Card variant="glass" className="p-12 text-center">
            <Dumbbell className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum treino ativo</h3>
            <p className="text-muted-foreground mb-4">
              {search ? "Tente buscar com outros termos" : "Você ainda não tem treinos atribuídos"}
            </p>
          </Card>
        ) : (
          <div className="space-y-8">
            {filteredDefaultWorkouts.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-primary" />
                  Meus Treinos
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDefaultWorkouts.map((workout, idx) => (
              <motion.div
                key={workout.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card variant="glass" className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setSelectedWorkout(workout)}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{workout.title}</CardTitle>
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Dumbbell className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                    {workout.description && (
                      <p className="text-sm text-muted-foreground">{workout.description}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{workout.duration_minutes} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        <span className={getDifficultyColor(workout.difficulty)}>{workout.difficulty}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Dumbbell className="w-4 h-4" />
                        <span>{workout.exercises.length} exercícios</span>
                      </div>
                    </div>
                    <Button className="w-full" onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/workouts/${workout.id}`)
                    }}>
                      <Play className="w-4 h-4 mr-2" />
                      Iniciar Treino
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
                </div>
              </div>
            )}

            {filteredCustomWorkouts.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                  Treinos Personalizados
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCustomWorkouts.map((workout, idx) => (
                    <motion.div
                      key={workout.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <Card variant="glass" className="hover:border-purple-500/50 transition-colors cursor-pointer border-purple-500/20" onClick={() => setSelectedWorkout(workout)}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg">{workout.title}</CardTitle>
                            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                              <TrendingUp className="w-5 h-5 text-purple-500" />
                            </div>
                          </div>
                          {workout.description && (
                            <p className="text-sm text-muted-foreground">{workout.description}</p>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{workout.duration_minutes} min</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-4 h-4" />
                              <span className={getDifficultyColor(workout.difficulty)}>{workout.difficulty}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Dumbbell className="w-4 h-4" />
                              <span>{workout.exercises.length} exercícios</span>
                            </div>
                          </div>
                          <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/workouts/${workout.id}`)
                          }}>
                            <Play className="w-4 h-4 mr-2" />
                            Iniciar Treino
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      ) : (
        filteredCompletedWorkouts.length === 0 ? (
          <Card variant="glass" className="p-12 text-center">
            <CheckCircle className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum treino concluído</h3>
            <p className="text-muted-foreground mb-4">
              {search ? "Tente buscar com outros termos" : "Complete um treino para vê-lo aqui"}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompletedWorkouts.map((workout, idx) => (
              <motion.div
                key={workout.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card variant="glass" className="opacity-75 hover:opacity-100 transition-opacity cursor-pointer" onClick={() => setSelectedWorkout(workout)}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{workout.title}</CardTitle>
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                      </div>
                    </div>
                    {workout.description && (
                      <p className="text-sm text-muted-foreground">{workout.description}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{workout.duration_minutes} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(workout.completedAt || '')}</span>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/workouts/${workout.id}`)
                      }}
                    >
                      Refazer Treino
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )
      )}

      <Modal
        isOpen={!!selectedWorkout}
        onClose={() => setSelectedWorkout(null)}
        title={selectedWorkout?.title}
        description={selectedWorkout?.description}
        className="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {selectedWorkout?.duration_minutes} min
            </span>
            <span className={getDifficultyColor(selectedWorkout?.difficulty || "")}>
              {selectedWorkout?.difficulty}
            </span>
            <span>{selectedWorkout?.exercises.length} exercícios</span>
            {selectedWorkout?.completedAt && (
              <span className="flex items-center gap-1 text-emerald-500">
                <CheckCircle className="w-4 h-4" />
                {formatDate(selectedWorkout.completedAt)}
              </span>
            )}
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium">Exercícios</h4>
            {selectedWorkout?.exercises.map((exercise, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-white/5 flex items-center justify-between">
                <div>
                  <p className="font-medium">{exercise.name}</p>
                  <p className="text-sm text-muted-foreground">{exercise.muscle_group}</p>
                </div>
                <div className="text-right text-sm">
                  <p>{exercise.sets} séries</p>
                  <p className="text-muted-foreground">
                    {exercise.reps ? `${exercise.reps} reps` : `${exercise.duration_seconds}s`}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Button className="w-full" onClick={() => {
            if (selectedWorkout) navigate(`/workouts/${selectedWorkout.id}`)
          }}>
            <Play className="w-4 h-4 mr-2" />
            {activeTab === 'completed' ? 'Refazer Treino' : 'Iniciar Treino'}
          </Button>
        </div>
      </Modal>
      </div>
    </FeatureGate>
  )
}
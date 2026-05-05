import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Modal } from "@/components/ui/Modal"
import { useAuthStore } from "@/stores/authStore"
import { supabase } from "@/lib/supabase"
import { motion } from "framer-motion"
import { Plus, Search, Dumbbell, Clock, Trash2, Edit, ChevronRight, Check, X, UserPlus } from "lucide-react"
import { cn } from "@/lib/utils"

interface Workout {
  id: string
  title: string
  description?: string
  duration_minutes: number
  difficulty: string
  exercises_count: number
}

interface Exercise {
  id: string
  name: string
  muscle_group: string
  image_url?: string
}

interface WorkoutExercise {
  exercise_id: string
  exercise: Exercise
  sets: number
  reps: number
  rest_seconds: number
}

interface Student {
  id: string
  full_name: string
  email: string
}

const difficultyOptions = [
  { value: "iniciante", label: "Iniciante" },
  { value: "intermediario", label: "Intermediário" },
  { value: "avancado", label: "Avançado" },
]

const muscleGroups = [
  { value: "", label: "Todos os grupos" },
  { value: "peito", label: "Peito" },
  { value: "costas", label: "Costas" },
  { value: "pernas", label: "Pernas" },
  { value: "ombros", label: "Ombros" },
  { value: "biceps", label: "Bíceps" },
  { value: "triceps", label: "Tríceps" },
  { value: "core", label: "Core" },
]

export function TrainerWorkoutsPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [allExercises, setAllExercises] = useState<Exercise[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null)
  const [selectedExercises, setSelectedExercises] = useState<WorkoutExercise[]>([])
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; workoutId: string | null; workoutTitle: string }>({
    show: false,
    workoutId: null,
    workoutTitle: ""
  })
  const [exerciseFilter, setExerciseFilter] = useState("")
  const [assigningStudents, setAssigningStudents] = useState<string[]>([])
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration_minutes: 45,
    difficulty: "iniciante",
  })

  useEffect(() => {
    fetchWorkouts()
    fetchExercises()
    fetchStudents()
  }, [])

  const fetchWorkouts = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data: workouts, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('trainer_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const workoutsWithCounts = await Promise.all(
        (workouts || []).map(async (workout) => {
          const { count, error: countError } = await supabase
            .from('workout_exercises')
            .select('id', { count: 'exact', head: true })
            .eq('workout_id', workout.id)

          if (countError) throw countError

          return {
            ...workout,
            exercises_count: count || 0
          }
        })
      )

      setWorkouts(workoutsWithCounts)
    } catch (error) {
      console.error("Error fetching workouts:", error)
      setWorkouts([])
    } finally {
      setLoading(false)
    }
  }

  const fetchExercises = async () => {
    try {
      const { data } = await supabase
        .from('exercises')
        .select('*')
        .order('name')
      if (data) setAllExercises(data)
    } catch (error) {
      console.error("Error fetching exercises:", error)
    }
  }

  const fetchStudents = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'student')
        .order('full_name')
      if (data) setStudents(data)
    } catch (error) {
      console.error("Error fetching students:", error)
    }
  }

  const handleCreateWorkout = async () => {
    if (!user || !formData.title || selectedExercises.length === 0) return

    try {
      const { data: workout, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          trainer_id: user.id,
          title: formData.title,
          description: formData.description,
          duration_minutes: formData.duration_minutes,
          difficulty: formData.difficulty,
        })
        .select()
        .single()

      if (workoutError) throw workoutError

      if (workout) {
        const workoutExercises = selectedExercises.map((ex, idx) => ({
          workout_id: workout.id,
          exercise_id: ex.exercise_id,
          sets: ex.sets,
          reps: ex.reps,
          rest_seconds: ex.rest_seconds,
          order_index: idx,
        }))

        await supabase.from('workout_exercises').insert(workoutExercises)

        setWorkouts([{ ...workout, exercises_count: selectedExercises.length }, ...workouts])
        setShowCreateModal(false)
        setFormData({ title: "", description: "", duration_minutes: 45, difficulty: "iniciante" })
        setSelectedExercises([])
      }
    } catch (error) {
      console.error("Error creating workout:", error)
    }
  }

  const handleAssignWorkout = async () => {
    if (!selectedWorkout || assigningStudents.length === 0) return

    try {
      const assignments = assigningStudents.map(studentId => ({
        workout_id: selectedWorkout.id,
        user_id: studentId,
        assigned_by: user?.id,
        status: 'pending',
      }))

      await supabase.from('workout_assignments').insert(assignments)
      
      setShowAssignModal(false)
      setAssigningStudents([])
      setSelectedWorkout(null)
    } catch (error) {
      console.error("Error assigning workout:", error)
    }
  }

  const handleDeleteWorkout = async (id: string) => {
    try {
      await supabase.from('workouts').delete().eq('id', id)
      setWorkouts(workouts.filter(w => w.id !== id))
      setDeleteConfirm({ show: false, workoutId: null, workoutTitle: "" })
    } catch (error) {
      console.error("Error deleting workout:", error)
    }
  }

  const confirmDelete = (id: string, title: string) => {
    setDeleteConfirm({ show: true, workoutId: id, workoutTitle: title })
  }

  const cancelDelete = () => {
    setDeleteConfirm({ show: false, workoutId: null, workoutTitle: "" })
  }

  const handleEditWorkout = (workout: Workout) => {
    // Navigate to create page with workout ID to edit
    navigate(`/trainer/workouts/edit/${workout.id}`)
  }

  const toggleExercise = (exercise: Exercise) => {
    const exists = selectedExercises.find(e => e.exercise_id === exercise.id)
    if (exists) {
      setSelectedExercises(selectedExercises.filter(e => e.exercise_id !== exercise.id))
    } else {
      setSelectedExercises([
        ...selectedExercises,
        {
          exercise_id: exercise.id,
          exercise,
          sets: 3,
          reps: 12,
          rest_seconds: 60,
        }
      ])
    }
  }

  const updateExerciseConfig = (exerciseId: string, field: string, value: number) => {
    setSelectedExercises(selectedExercises.map(ex => 
      ex.exercise_id === exerciseId ? { ...ex, [field]: value } : ex
    ))
  }

  const filteredWorkouts = workouts.filter(w => 
    w.title.toLowerCase().includes(search.toLowerCase())
  )

  const filteredExercises = allExercises.filter(e => 
    e.name.toLowerCase().includes(exerciseFilter.toLowerCase()) &&
    (!exerciseFilter || !exerciseFilter || e.muscle_group.includes(exerciseFilter))
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Treinos</h1>
          <p className="text-muted-foreground">Crie e gerencie treinos para seus alunos</p>
        </div>
        <Button onClick={() => navigate('/trainer/workouts/create')}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Treino
        </Button>
      </div>

      <div className="max-w-md">
        <Input
          placeholder="Buscar treino..."
          icon={<Search className="w-4 h-4" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : filteredWorkouts.length === 0 ? (
        <Card variant="glass" className="p-12 text-center">
          <Dumbbell className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Nenhum treino criado</h3>
          <p className="text-muted-foreground mb-4">Crie seu primeiro treino para atribuir aos alunos</p>
          <Button onClick={() => navigate('/trainer/workouts/create')}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Treino
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkouts.map((workout, idx) => (
            <motion.div
              key={workout.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card variant="glass" className="hover:border-primary/30 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Dumbbell className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleEditWorkout(workout)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => confirmDelete(workout.id, workout.title)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <h3 className="font-semibold text-lg mb-1">{workout.title}</h3>
                  {workout.description && (
                    <p className="text-sm text-muted-foreground mb-4">{workout.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {workout.duration_minutes} min
                    </span>
                    <span className="capitalize">{workout.difficulty}</span>
                    <span className="flex items-center gap-1">
                      <Dumbbell className="w-4 h-4" />
                      {workout.exercises_count} exercícios
                    </span>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setSelectedWorkout(workout)
                      setShowAssignModal(true)
                    }}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Atribuir a Aluno
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
</div>
      )}

      {/* Modal de Atribuição */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false)
          setAssigningStudents([])
          setSelectedWorkout(null)
        }}
        title={`Atribuir "${selectedWorkout?.title}"`}
        className="max-w-lg"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">Selecione os alunos que receberão este treino:</p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {students.map(student => (
              <button
                key={student.id}
                type="button"
                onClick={() => {
                  if (assigningStudents.includes(student.id)) {
                    setAssigningStudents(assigningStudents.filter(id => id !== student.id))
                  } else {
                    setAssigningStudents([...assigningStudents, student.id])
                  }
                }}
                className={cn(
                  "w-full p-3 rounded-lg border flex items-center gap-3 transition-all",
                  assigningStudents.includes(student.id)
                    ? "border-primary bg-primary/20"
                    : "border-white/20 bg-white/5 hover:bg-white/10"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                  assigningStudents.includes(student.id) ? "border-primary bg-primary" : "border-white/30"
                )}>
                  {assigningStudents.includes(student.id) && <Check className="w-4 h-4 text-white" />}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">{student.full_name}</p>
                  <p className="text-sm text-muted-foreground">{student.email}</p>
                </div>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => {
              setShowAssignModal(false)
              setAssigningStudents([])
              setSelectedWorkout(null)
            }}>
              Cancelar
            </Button>
            <Button 
              className="flex-1" 
              onClick={handleAssignWorkout}
              disabled={assigningStudents.length === 0}
            >
              Atribuir ({assigningStudents.length})
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={cancelDelete}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Confirmar Exclusão</h3>
              <p className="text-white/60 mb-6">
                Tem certeza que deseja excluir o treino <strong className="text-white">"{deleteConfirm.workoutTitle}"</strong>? 
                Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={cancelDelete}
                >
                  Cancelar
                </Button>
                <Button 
                  className="flex-1 bg-red-500 hover:bg-red-600"
                  onClick={() => deleteConfirm.workoutId && handleDeleteWorkout(deleteConfirm.workoutId)}
                >
                  Excluir
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

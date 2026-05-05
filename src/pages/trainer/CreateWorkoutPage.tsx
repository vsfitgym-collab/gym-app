import { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/Button"
import { useAuthStore } from "@/stores/authStore"
import { supabase } from "@/lib/supabase"
import { getExerciseImage } from "@/lib/getExerciseMedia"
import { motion, AnimatePresence, Reorder } from "framer-motion"
import { 
  Plus, 
  Search, 
  Dumbbell, 
  Clock, 
  Trash2, 
  Edit2,
  Check,
  X,
  ChevronRight,
  ChevronLeft,
  UserPlus,
  Users,
  Calendar,
  Bell,
  Filter,
  Star,
  Zap,
  GripVertical,
  Copy,
  Save,
  ArrowLeft,
  Sparkles,
  Clock3,
  Target,
  AlertCircle,
  CheckCircle2,
  Play
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Exercise {
  id: string
  name: string
  description?: string
  muscle_group: string
  equipment?: string
  image_url?: string
  video_url?: string
  level?: string
}

interface WorkoutExerciseConfig {
  exercise: Exercise
  sets: number
  reps: string | number
  rest_seconds: number
  weight?: string
  notes?: string
}

interface Student {
  id: string
  full_name: string
  email: string
  avatar_url?: string
}

interface WorkoutInfo {
  title: string
  description: string
  difficulty: string
  duration_minutes: number
  category: string
}

const categories = [
  { value: "hipertrofia", label: "Hipertrofia", icon: "💪" },
  { value: "emagrecimento", label: "Emagrecimento", icon: "🔥" },
  { value: "forca", label: "Força", icon: "🏋️" },
  { value: "funcional", label: "Funcional", icon: "⚡" },
  { value: "mobilidade", label: "Mobilidade", icon: "🧘" },
  { value: "cardio", label: "Cardio", icon: "❤️" },
]

const difficultyOptions = [
  { value: "iniciante", label: "Iniciante", color: "emerald" },
  { value: "intermediario", label: "Intermediário", color: "amber" },
  { value: "avancado", label: "Avançado", color: "rose" },
]

const muscleGroups = [
  { value: "", label: "Todos" },
  { value: "peito", label: "Peito" },
  { value: "costas", label: "Costas" },
  { value: "pernas", label: "Pernas" },
  { value: "ombros", label: "Ombros" },
  { value: "biceps", label: "Bíceps" },
  { value: "triceps", label: "Tríceps" },
  { value: "core", label: "Core" },
  { value: "cardio", label: "Cardio" },
]

const levels = [
  { value: "", label: "Todos" },
  { value: "iniciante", label: "Iniciante" },
  { value: "intermediario", label: "Intermediário" },
  { value: "avancado", label: "Avançado" },
]

function StepIndicator({ currentStep, steps }: { currentStep: number; steps: { label: string; icon: React.ReactNode }[] }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, idx) => (
        <div key={idx} className="flex items-center">
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full transition-all",
            idx + 1 === currentStep 
              ? "bg-primary text-black" 
              : idx + 1 < currentStep 
                ? "bg-primary/20 text-primary"
                : "bg-white/5 text-white/40"
          )}>
            {idx + 1 < currentStep ? (
              <Check className="w-4 h-4" />
            ) : (
              <span className="w-5 h-5 flex items-center justify-center text-sm font-medium">
                {idx + 1}
              </span>
            )}
            <span className="text-sm font-medium hidden sm:inline">{step.label}</span>
          </div>
          {idx < steps.length - 1 && (
            <ChevronRight className={cn(
              "w-4 h-4 mx-2",
              idx + 1 < currentStep ? "text-primary" : "text-white/20"
            )} />
          )}
        </div>
      ))}
    </div>
  )
}

function ExerciseSelectionCard({ 
  exercise, 
  selected, 
  onToggle 
}: { 
  exercise: Exercise
  selected: boolean
  onToggle: () => void
}) {
  const imageUrl = getExerciseImage(exercise)

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onToggle}
      className={cn(
        "relative cursor-pointer rounded-2xl overflow-hidden border-2 transition-all duration-200",
        selected 
          ? "border-primary bg-primary/10" 
          : "border-white/10 bg-[#1A1A1A] hover:border-white/20"
      )}
    >
      <div className="aspect-[4/3] relative overflow-hidden bg-[#222]">
        {imageUrl ? (
          <img src={imageUrl} alt={exercise.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Dumbbell className="w-12 h-12 text-white/20" />
          </div>
        )}
        <div className={cn(
          "absolute top-3 left-3 w-6 h-6 rounded-full flex items-center justify-center transition-all",
          selected ? "bg-primary" : "bg-black/40 border border-white/20"
        )}>
          {selected && <Check className="w-4 h-4 text-black" />}
        </div>
        <div className="absolute top-3 right-3">
          <span className={cn(
            "px-2 py-1 rounded-full text-xs font-medium capitalize",
            selected ? "bg-primary/20 text-primary" : "bg-black/40 text-white/60"
          )}>
            {exercise.muscle_group}
          </span>
        </div>
        {exercise.level && (
          <div className="absolute bottom-3 left-3">
            <span className={cn(
              "px-2 py-1 rounded-full text-xs font-medium",
              exercise.level === 'iniciante' && "bg-emerald-500/20 text-emerald-400",
              exercise.level === 'intermediario' && "bg-amber-500/20 text-amber-400",
              exercise.level === 'avancado' && "bg-rose-500/20 text-rose-400"
            )}>
              {exercise.level === 'iniciante' ? 'Iniciante' : exercise.level === 'intermediario' ? 'Inter' : 'Avançado'}
            </span>
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-medium text-white text-sm truncate">{exercise.name}</h3>
        {exercise.equipment && (
          <p className="text-xs text-white/40 mt-1 capitalize">{exercise.equipment.replace('_', ' ')}</p>
        )}
      </div>
    </motion.div>
  )
}

function ConfiguredExerciseCard({ 
  config, 
  onUpdate, 
  onRemove,
  index
}: { 
  config: WorkoutExerciseConfig
  onUpdate: (updates: Partial<WorkoutExerciseConfig>) => void
  onRemove: () => void
  index: number
}) {
  const imageUrl = getExerciseImage(config.exercise)

  const handleSetsChange = (value: string) => {
    const num = parseInt(value) || 1
    onUpdate({ sets: num })
  }

  const handleRepsChange = (value: string) => {
    onUpdate({ reps: value as any })
  }

  const handleRestChange = (value: string) => {
    const num = parseInt(value) || 60
    onUpdate({ rest_seconds: num })
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="flex items-center gap-3 p-3 bg-[#1A1A1A] border border-white/10 rounded-xl"
    >
      <div className="flex items-center gap-1 text-white/40 cursor-grab">
        <GripVertical className="w-4 h-4" />
        <span className="text-xs font-medium">{index + 1}</span>
      </div>
      
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#222] flex-shrink-0">
        {imageUrl ? (
          <img src={imageUrl} alt={config.exercise.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-white/20" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-white text-sm truncate">{config.exercise.name}</h4>
        <p className="text-xs text-white/50 capitalize">{config.exercise.muscle_group}</p>
      </div>

      <div className="flex items-center gap-1.5">
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-white/30 mb-0.5">Séries</span>
          <input
            type="number"
            value={config.sets}
            onChange={(e) => handleSetsChange(e.target.value)}
            className="w-12 h-8 bg-[#222] border border-white/10 rounded text-center text-white text-sm focus:border-primary focus:outline-none cursor-pointer"
            min={1}
            max={10}
          />
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-white/30 mb-0.5">Reps</span>
          <input
            type="text"
            value={String(config.reps)}
            onChange={(e) => handleRepsChange(e.target.value)}
            className="w-12 h-8 bg-[#222] border border-white/10 rounded text-center text-white text-sm focus:border-primary focus:outline-none cursor-pointer"
            placeholder="12"
          />
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-white/30 mb-0.5">Desc</span>
          <input
            type="number"
            value={config.rest_seconds}
            onChange={(e) => handleRestChange(e.target.value)}
            className="w-12 h-8 bg-[#222] border border-white/10 rounded text-center text-white text-sm focus:border-primary focus:outline-none cursor-pointer"
            min={0}
            step={15}
          />
        </div>
      </div>

      <button
        onClick={onRemove}
        className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </motion.div>
  )
}

function StudentSelector({ 
  students, 
  selected, 
  onToggle 
}: { 
  students: Student[]
  selected: string[]
  onToggle: (id: string) => void
}) {
  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {students.map((student) => (
        <div
          key={student.id}
          onClick={() => onToggle(student.id)}
          className={cn(
            "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors",
            selected.includes(student.id) 
              ? "bg-primary/10 border border-primary/30" 
              : "bg-[#1A1A1A] border border-white/10 hover:border-white/20"
          )}
        >
          <div className={cn(
            "w-5 h-5 rounded-full flex items-center justify-center",
            selected.includes(student.id) ? "bg-primary" : "bg-white/10 border border-white/20"
          )}>
            {selected.includes(student.id) && <Check className="w-3 h-3 text-black" />}
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">
              {student.full_name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <p className="font-medium text-white text-sm">{student.full_name}</p>
            <p className="text-xs text-white/40">{student.email}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export function CreateWorkoutPage() {
  const { user } = useAuthStore()
  const { id: workoutId } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!workoutId

  const [currentStep, setCurrentStep] = useState(1)
  const [allExercises, setAllExercises] = useState<Exercise[]>([])
  const [loadingExercises, setLoadingExercises] = useState(true)
  const [students, setStudents] = useState<Student[]>([])
  
  const [workoutInfo, setWorkoutInfo] = useState<WorkoutInfo>({
    title: "",
    description: "",
    difficulty: "intermediario",
    duration_minutes: 45,
    category: "hipertrofia"
  })

  const [selectedExercises, setSelectedExercises] = useState<Set<string>>(new Set())
  const [configuredExercises, setConfiguredExercises] = useState<WorkoutExerciseConfig[]>([])
  
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [startDate, setStartDate] = useState("")
  const [frequency, setFrequency] = useState("3")
  const [sendNotification, setSendNotification] = useState(true)
  
  const [search, setSearch] = useState("")
  const [filterMuscle, setFilterMuscle] = useState("")
  const [filterLevel, setFilterLevel] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "favorites">("all")
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")

  useEffect(() => {
    fetchExercises()
    fetchStudents()
    if (isEditMode && workoutId) {
      loadWorkoutForEdit(workoutId)
    }
  }, [])

  const loadWorkoutForEdit = async (id: string) => {
    try {
      const { data: workout, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      if (workout) {
        setWorkoutInfo({
          title: workout.title || "",
          description: workout.description || "",
          difficulty: workout.difficulty || "intermediario",
          duration_minutes: workout.duration_minutes || 45,
          category: "hipertrofia"
        })

        const { data: exercises } = await supabase
          .from('workout_exercises')
          .select('*, exercises(*)')
          .eq('workout_id', id)
          .order('order_index')

        if (exercises && exercises.length > 0) {
          const configs = exercises.map((we: any) => ({
            exercise: we.exercises,
            sets: we.sets,
            reps: String(we.reps),
            rest_seconds: we.rest_seconds
          }))
          setConfiguredExercises(configs)
          setSelectedExercises(new Set(exercises.map((e: any) => e.exercise_id)))
          setCurrentStep(3)
        }
      }
    } catch (error) {
      console.error('Error loading workout:', error)
    }
  }

  const fetchExercises = async () => {
    setLoadingExercises(true)
    const { data } = await supabase.from('exercises').select('*').order('name')
    if (data) setAllExercises(data)
    setLoadingExercises(false)
  }

  const fetchStudents = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('role', 'student').order('full_name')
    if (data) setStudents(data)
  }

  const filteredExercises = allExercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase())
    const matchesMuscle = !filterMuscle || ex.muscle_group === filterMuscle
    const matchesLevel = !filterLevel || ex.level === filterLevel
    return matchesSearch && matchesMuscle && matchesLevel
  })

  const toggleExercise = (id: string) => {
    const newSelected = new Set(selectedExercises)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedExercises(newSelected)
  }

  const proceedToStep2 = () => {
    // Apenas navegar para etapa de seleção de exercícios
    setCurrentStep(2)
  }

  const proceedToStep3 = () => {
    // Criar configurações dos exercícios selecionados ao ir para etapa 3
    const configs = Array.from(selectedExercises).map(id => {
      const exercise = allExercises.find(e => e.id === id)!
      return {
        exercise,
        sets: 3,
        reps: "12",
        rest_seconds: 60
      } as WorkoutExerciseConfig
    })
    setConfiguredExercises(configs)
    setCurrentStep(3)
  }

  const handleCreateWorkout = async () => {
    if (!user || !workoutInfo.title || configuredExercises.length === 0 || saving) return

    setSaving(true)
    setSaveError("")

    try {
      let workoutIdToUse: string

      if (isEditMode && workoutId) {
        const { data: updatedWorkout, error: updateError } = await supabase
          .from('workouts')
          .update({
            title: workoutInfo.title,
            description: workoutInfo.description,
            difficulty: workoutInfo.difficulty,
            duration_minutes: workoutInfo.duration_minutes
          })
          .eq('id', workoutId)
          .select()
          .single()

        if (updateError) throw updateError
        workoutIdToUse = workoutId

        const { error: deleteExercisesError } = await supabase
          .from('workout_exercises')
          .delete()
          .eq('workout_id', workoutId)

        if (deleteExercisesError) throw deleteExercisesError
      } else {
        const { data: workout, error } = await supabase
          .from('workouts')
          .insert({
            trainer_id: user?.id,
            title: workoutInfo.title,
            description: workoutInfo.description,
            difficulty: workoutInfo.difficulty,
            duration_minutes: workoutInfo.duration_minutes
          })
          .select()
          .single()

        if (error) throw error
        workoutIdToUse = workout.id
      }

      const workoutExercises = configuredExercises.map((config, idx) => ({
        workout_id: workoutIdToUse,
        exercise_id: config.exercise.id,
        sets: config.sets,
        reps: typeof config.reps === 'string' ? parseInt(config.reps) || 12 : config.reps,
        rest_seconds: config.rest_seconds,
        order_index: idx
      }))

      const { error: workoutExercisesError } = await supabase
        .from('workout_exercises')
        .insert(workoutExercises)

      if (workoutExercisesError) throw workoutExercisesError

      if (!isEditMode && selectedStudents.length > 0) {
        const assignments = selectedStudents.map(studentId => ({
          workout_id: workoutIdToUse,
          user_id: studentId,
          assigned_by: user?.id,
          status: 'pending'
        }))
        const { error: assignmentsError } = await supabase
          .from('workout_assignments')
          .insert(assignments)

        if (assignmentsError) throw assignmentsError
      }

      navigate('/trainer/workouts')
    } catch (error: any) {
      console.error('Error saving workout:', error)
      const message = error.message || ''
      setSaveError(
        message.includes('row-level security')
          ? 'O Supabase bloqueou o salvamento dos exercícios pela policy RLS. Execute o arquivo FIX_WORKOUT_EXERCISES_RLS.sql no SQL Editor do Supabase e tente novamente.'
          : message || 'Não foi possível salvar os exercícios do treino.'
      )
    } finally {
      setSaving(false)
    }
  }

  const updateExerciseConfig = (index: number, updates: Partial<WorkoutExerciseConfig>) => {
    const newConfigs = [...configuredExercises]
    newConfigs[index] = { ...newConfigs[index], ...updates }
    setConfiguredExercises(newConfigs)
  }

  const removeExercise = (index: number) => {
    const newConfigs = configuredExercises.filter((_, i) => i !== index)
    setConfiguredExercises(newConfigs)
  }

  const applyToAll = (field: 'sets' | 'reps' | 'rest_seconds', value: string | number) => {
    const newConfigs = configuredExercises.map(config => ({
      ...config,
      [field]: value
    }))
    setConfiguredExercises(newConfigs)
  }

  const toggleStudent = (id: string) => {
    setSelectedStudents(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] p-6 pb-24">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <a 
            href="/trainer/workouts"
            className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </a>
          <div>
            <h1 className="text-2xl font-bold text-white">Criar Novo Treino</h1>
            <p className="text-white/40 text-sm">Siga as etapas para criar um treino personalizado</p>
          </div>
        </div>

        <StepIndicator 
          currentStep={currentStep}
          steps={[
            { label: "Informações", icon: <Sparkles className="w-4 h-4" /> },
            { label: "Exercícios", icon: <Dumbbell className="w-4 h-4" /> },
            { label: "Configurar", icon: <Target className="w-4 h-4" /> }
          ]}
        />

        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-8 space-y-6">
                <div>
                  <label className="text-sm text-white/60 mb-2 block">Nome do Treino</label>
                  <input
                    type="text"
                    placeholder="Ex: Treino A - Inferiores"
                    value={workoutInfo.title}
                    onChange={(e) => setWorkoutInfo({ ...workoutInfo, title: e.target.value })}
                    className="w-full h-12 px-4 bg-[#222] border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-2 block">Descrição</label>
                  <textarea
                    placeholder="Descreva o objetivo deste treino..."
                    value={workoutInfo.description}
                    onChange={(e) => setWorkoutInfo({ ...workoutInfo, description: e.target.value })}
                    className="w-full h-24 px-4 py-3 bg-[#222] border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-white/60 mb-2 block">Dificuldade</label>
                    <select
                      value={workoutInfo.difficulty}
                      onChange={(e) => setWorkoutInfo({ ...workoutInfo, difficulty: e.target.value })}
                      className="w-full h-12 px-4 bg-[#222] border border-white/10 rounded-xl text-white appearance-none cursor-pointer focus:border-primary/50"
                    >
                      {difficultyOptions.map(opt => (
                        <option key={opt.value} value={opt.value} className="bg-[#1A1A1A]">{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-white/60 mb-2 block">Duração (min)</label>
                    <input
                      type="number"
                      value={workoutInfo.duration_minutes}
                      onChange={(e) => setWorkoutInfo({ ...workoutInfo, duration_minutes: parseInt(e.target.value) || 45 })}
                      className="w-full h-12 px-4 bg-[#222] border border-white/10 rounded-xl text-white focus:border-primary/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-2 block">Categoria</label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                      <button
                        key={cat.value}
                        onClick={() => setWorkoutInfo({ ...workoutInfo, category: cat.value })}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-medium transition-all",
                          workoutInfo.category === cat.value 
                            ? "bg-primary text-black" 
                            : "bg-white/5 text-white/60 hover:bg-white/10"
                        )}
                      >
                        <span className="mr-1">{cat.icon}</span>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={proceedToStep2}
                    disabled={!workoutInfo.title}
                    className="px-8"
                  >
                    Próximo
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                    <input
                      type="text"
                      placeholder="Buscar exercícios..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full h-12 pl-12 pr-4 bg-[#1A1A1A] border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-primary/50"
                    />
                  </div>
                </div>
                <select
                  value={filterMuscle}
                  onChange={(e) => setFilterMuscle(e.target.value)}
                  className="h-12 px-4 bg-[#1A1A1A] border border-white/10 rounded-xl text-white appearance-none cursor-pointer focus:border-primary/50"
                >
                  {muscleGroups.map(g => (
                    <option key={g.value} value={g.value} className="bg-[#1A1A1A]">{g.label}</option>
                  ))}
                </select>
                <select
                  value={filterLevel}
                  onChange={(e) => setFilterLevel(e.target.value)}
                  className="h-12 px-4 bg-[#1A1A1A] border border-white/10 rounded-xl text-white appearance-none cursor-pointer focus:border-primary/50"
                >
                  {levels.map(l => (
                    <option key={l.value} value={l.value} className="bg-[#1A1A1A]">{l.label}</option>
                  ))}
                </select>
              </div>

              <div className="text-sm text-white/60">
                {selectedExercises.size} exercício(s) selecionado(s)
              </div>

              {loadingExercises ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="bg-[#1A1A1A] border border-white/10 rounded-2xl overflow-hidden">
                      <div className="aspect-[4/3] bg-[#222] animate-pulse" />
                      <div className="p-3 space-y-2">
                        <div className="h-4 bg-[#222] rounded animate-pulse w-3/4" />
                        <div className="h-3 bg-[#222] rounded animate-pulse w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 max-h-[60vh] overflow-y-auto pr-2">
                  {filteredExercises.map(exercise => (
                    <ExerciseSelectionCard
                      key={exercise.id}
                      exercise={exercise}
                      selected={selectedExercises.has(exercise.id)}
                      onToggle={() => toggleExercise(exercise.id)}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <h2 className="text-lg font-semibold text-white">Configurar Exercícios</h2>
                  <div className="flex gap-2 flex-wrap">
                    <button 
                      onClick={() => applyToAll('sets', 3)}
                      className="px-3 py-1.5 bg-white/5 text-white/60 text-sm rounded-lg hover:bg-white/10"
                    >
                      Séries: 3
                    </button>
                    <button 
                      onClick={() => applyToAll('reps', '12')}
                      className="px-3 py-1.5 bg-white/5 text-white/60 text-sm rounded-lg hover:bg-white/10"
                    >
                      Reps: 12
                    </button>
                    <button 
                      onClick={() => applyToAll('rest_seconds', 60)}
                      className="px-3 py-1.5 bg-white/5 text-white/60 text-sm rounded-lg hover:bg-white/10"
                    >
                      Descanso: 60s
                    </button>
                  </div>
                </div>

                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
                  <AnimatePresence>
                    {configuredExercises.map((config, idx) => (
                      <ConfiguredExerciseCard
                        key={config.exercise.id}
                        config={config}
                        index={idx}
                        onUpdate={(updates) => updateExerciseConfig(idx, updates)}
                        onRemove={() => removeExercise(idx)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-primary" />
                  Atribuir a Alunos
                  <span className="text-sm text-white/40 font-normal">(opcional)</span>
                </h2>

                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      type="text"
                      placeholder="Buscar alunos..."
                      className="w-full h-10 pl-10 pr-4 bg-[#222] border border-white/10 rounded-lg text-white text-sm placeholder:text-white/30"
                    />
                  </div>
                </div>

                <StudentSelector 
                  students={students}
                  selected={selectedStudents}
                  onToggle={toggleStudent}
                />

                {selectedStudents.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-white/40 mb-1 block">Data de início</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full h-10 px-3 bg-[#222] border border-white/10 rounded-lg text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-white/40 mb-1 block">Frequência semanal</label>
                        <select
                          value={frequency}
                          onChange={(e) => setFrequency(e.target.value)}
                          className="w-full h-10 px-3 bg-[#222] border border-white/10 rounded-lg text-white text-sm"
                        >
                          <option value="1">1x por semana</option>
                          <option value="2">2x por semana</option>
                          <option value="3">3x por semana</option>
                          <option value="4">4x por semana</option>
                          <option value="5">5x por semana</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <input
                        type="checkbox"
                        id="notify"
                        checked={sendNotification}
                        onChange={(e) => setSendNotification(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <label htmlFor="notify" className="text-sm text-white/60">
                        Enviar notificação aos alunos
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {saveError && (
          <div className="fixed bottom-20 left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100 backdrop-blur">
            {saveError}
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0D0D0D]/90 backdrop-blur-xl border-t border-white/10 flex justify-between items-center z-50">
          <Button 
            variant="outline" 
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          
          {currentStep === 1 && (
            <Button onClick={proceedToStep2} disabled={!workoutInfo.title}>
              Selecionar Exercícios
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
          
          {currentStep === 2 && (
            <Button onClick={proceedToStep3} disabled={selectedExercises.size === 0}>
              Configurar ({selectedExercises.size})
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
          
          {currentStep === 3 && (
            <Button 
              onClick={handleCreateWorkout}
              disabled={!workoutInfo.title || configuredExercises.length === 0 || saving}
              loading={saving}
            >
              <Save className="w-4 h-4 mr-2" />
              {isEditMode ? "Salvar Treino" : "Criar Treino"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/stores/authStore"
import { updateWorkoutProgress, getUserStats } from "@/hooks/useGamification"
import { getExerciseImage, getExerciseVideo } from "@/lib/getExerciseMedia"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Play, 
  Pause,
  SkipForward,
  Check,
  ChevronLeft,
  Timer,
  Dumbbell,
  Volume2,
  VolumeX,
  Flame,
  Zap,
  Target,
  Trophy,
  X
} from "lucide-react"

interface ExerciseDetail {
  id: string
  name: string
  description?: string
  muscle_group: string
  image_url?: string
  video_url?: string
}

interface WorkoutExercise {
  id: string
  exercise_id: string
  exercise: ExerciseDetail
  sets: number
  reps?: number
  duration_seconds?: number
  rest_seconds: number
  completed_sets: number
}

interface Workout {
  id: string
  title: string
  description?: string
  duration_minutes: number
  exercises: WorkoutExercise[]
}

interface UserStats {
  current_streak: number
  total_workouts: number
  total_xp: number
  level: number
}

const MOTIVATIONAL_MESSAGES = [
  "Cada repetição te aproxima do seu objetivo!",
  "Você está stronger than yesterday!",
  "O progresso vem para quem persiste!",
  "Hoje você escolheu ser melhor que ontem!",
  "Disciplina é o que te diferencia!",
  "Osucesso é construído exercício a exercício!",
]

function ProgressRing({ progress, size = 200, strokeWidth = 8, color }: { progress: number; size?: number; strokeWidth?: number; color?: string }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={strokeWidth}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color || "url(#timerGradient)"}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-1000 ease-linear"
      />
      <defs>
        <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function WorkoutExecutionPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [currentSet, setCurrentSet] = useState(1)
  const [isResting, setIsResting] = useState(false)
  const [restTimeLeft, setRestTimeLeft] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [completionSaved, setCompletionSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [workoutStartTime] = useState<Date>(new Date())
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [motivationalMessage] = useState(() => MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)])

  const fetchWorkout = async () => {
    if (!id || !user) return

    setLoading(true)
    try {
      await supabase
        .from('workout_assignments')
        .update({ status: 'in_progress' })
        .eq('workout_id', id)
        .eq('user_id', user.id)
        .eq('status', 'pending')

      const { data: existingLog } = await supabase
        .from('workout_logs')
        .select('id')
        .eq('workout_id', id)
        .eq('user_id', user.id)
        .eq('status', 'started')
        .single()

      if (!existingLog) {
        await supabase.from('workout_logs').insert({
          workout_id: id,
          user_id: user.id,
          started_at: new Date().toISOString(),
          status: 'started'
        })
      }

      const { data: workoutData, error: workoutError } = await supabase
        .from('workouts')
        .select('*')
        .eq('id', id)
        .single()

      if (workoutError) throw workoutError

      if (workoutData) {
        const { data: exerciseData, error: exercisesError } = await supabase
          .from('workout_exercises')
          .select(`
            id,
            exercise_id,
            sets,
            reps,
            duration_seconds,
            rest_seconds,
            exercise:exercises(*)
          `)
          .eq('workout_id', id)
          .order('order_index')

        if (exercisesError) throw exercisesError

        if (exerciseData) {
          setWorkout({
            ...workoutData,
            exercises: exerciseData.map((e: any) => ({
              ...e,
              exercise: e.exercise,
              completed_sets: 0
            }))
          })
          
          if (exerciseData.length > 0) {
            setRestTimeLeft(exerciseData[0].rest_seconds)
          }
        }
      }

      const stats = await getUserStats(user.id)
      if (stats) {
        setUserStats(stats)
      }
    } catch (error) {
      console.error("Error fetching workout:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkout()
  }, [id, user?.id])

  useEffect(() => {
    if (isResting && restTimeLeft > 0 && isTimerRunning) {
      const interval = setInterval(() => {
        setRestTimeLeft(prev => {
          if (prev <= 1) {
            setIsResting(false)
            setIsTimerRunning(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [isResting, isTimerRunning, restTimeLeft])

  useEffect(() => {
    if (showCompletionModal && user && workout && id && !completionSaved) {
      setCompletionSaved(true)
      Promise.all([
        supabase
          .from('workout_assignments')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('workout_id', id)
          .eq('user_id', user.id),
        supabase
          .from('workout_logs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('workout_id', id)
          .eq('user_id', user.id)
          .eq('status', 'started'),
        updateWorkoutProgress(user.id, workout.duration_minutes)
      ]).catch((error) => console.error('Error completing workout:', error))
    }
  }, [showCompletionModal, user?.id, workout?.id, id, completionSaved])

  const currentExercise = workout?.exercises[currentExerciseIndex]

  const handleCompleteSet = useCallback(() => {
    if (!workout || !currentExercise) return

    const newExercises = [...workout.exercises]
    newExercises[currentExerciseIndex].completed_sets = currentSet

    setWorkout({ ...workout, exercises: newExercises })

    if (currentSet < currentExercise.sets) {
      setCurrentSet(currentSet + 1)
      setIsResting(true)
      setRestTimeLeft(currentExercise.rest_seconds)
      setIsTimerRunning(true)
    } else {
      if (currentExerciseIndex < workout.exercises.length - 1) {
        setIsResting(true)
        setRestTimeLeft(currentExercise.rest_seconds)
        setIsTimerRunning(true)
        setCurrentExerciseIndex(currentExerciseIndex + 1)
        setCurrentSet(1)
      } else {
        setShowCompletionModal(true)
      }
    }
  }, [workout, currentExercise, currentSet, currentExerciseIndex])

  const skipRest = useCallback(() => {
    setIsResting(false)
    setRestTimeLeft(0)
    setIsTimerRunning(false)
  }, [])

  const skipToNextExercise = useCallback(() => {
    if (!workout) return
    if (currentExerciseIndex < workout.exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1)
      setCurrentSet(1)
    } else {
      setShowCompletionModal(true)
    }
  }, [workout, currentExerciseIndex])

  const getTimerColor = () => {
    if (restTimeLeft > 20) return "#10b981"
    if (restTimeLeft > 10) return "#f59e0b"
    return "#ef4444"
  }

  const getTimerProgress = () => {
    if (!currentExercise) return 0
    const total = currentExercise.rest_seconds
    return (restTimeLeft / total) * 100
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getTotalExercisesCompleted = () => {
    if (!workout) return 0
    return workout.exercises.filter(e => e.completed_sets >= e.sets).length
  }

  const getTotalSetsCompleted = () => {
    if (!workout) return 0
    return workout.exercises.reduce((acc, e) => acc + e.completed_sets, 0)
  }

  const getWorkoutDuration = () => {
    const start = workoutStartTime
    const now = new Date()
    const diff = Math.floor((now.getTime() - start.getTime()) / 1000 / 60)
    return diff
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Carregando treino...</p>
        </div>
      </div>
    )
  }

  if (!workout || !currentExercise) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card variant="glass" className="p-8 text-center max-w-md">
          <Dumbbell className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Treino não encontrado</h3>
          <Button onClick={() => navigate('/workouts')}>Voltar aos treinos</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        {isResting ? (
          <motion.div
            key="rest-screen"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed inset-0 z-50 bg-zinc-950 flex flex-col"
          >
            <div className="flex-1 flex flex-col items-center justify-center p-6">
              <motion.p 
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-lg text-muted-foreground mb-8"
              >
                Próximo exercício
              </motion.p>
              
              <motion.h2 
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-3xl md:text-4xl font-bold text-center mb-2"
              >
                {currentExercise?.exercise.name}
              </motion.h2>
              <p className="text-muted-foreground mb-12">
                {currentExercise?.exercise.muscle_group}
              </p>

              <div className="relative">
                <ProgressRing 
                  progress={getTimerProgress()} 
                  size={220} 
                  strokeWidth={10}
                  color={getTimerColor()}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.span
                    key={restTimeLeft}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-6xl md:text-7xl font-bold"
                    style={{ color: getTimerColor() }}
                  >
                    {restTimeLeft}
                  </motion.span>
                  <span className="text-muted-foreground text-sm mt-2">segundos</span>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 border-t border-white/10">
              <div className="max-w-md mx-auto flex gap-4">
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={skipRest}
                  className="flex-1"
                >
                  <SkipForward className="w-5 h-5 mr-2" />
                  Pular
                </Button>
                <Button 
                  size="lg" 
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className="flex-1"
                >
                  {isTimerRunning ? (
                    <>
                      <Pause className="w-5 h-5 mr-2" />
                      Pausar
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Continuar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="fixed top-0 left-0 right-0 z-10 p-4 glass border-b border-white/5">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/workouts')}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Sair
          </Button>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {currentExerciseIndex + 1} / {workout.exercises.length}
            </p>
            <p className="font-medium text-sm">{currentExercise.exercise.name}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setSoundEnabled(!soundEnabled)}>
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <div className="pt-24 pb-36 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <motion.div
            key={`exercise-${currentExerciseIndex}`}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-4"
          >
            <div className="flex justify-center">
              <div className="w-full h-72 md:h-80 rounded-2xl overflow-hidden bg-white/5">
                {(() => {
                  const videoUrl = getExerciseVideo(currentExercise.exercise)
                  const imageUrl = getExerciseImage(currentExercise.exercise)
                  
                  if (videoUrl) {
                    return (
                      <video
                        src={videoUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    )
                  }
                  
                  if (imageUrl) {
                    return (
                      <img 
                        src={imageUrl} 
                        alt={currentExercise.exercise.name}
                        className="w-full h-full object-cover"
                      />
                    )
                  }
                  
                  return (
                    <div className="w-full h-full flex items-center justify-center bg-white/5">
                      <Dumbbell className="w-20 h-20 text-muted-foreground/30" />
                    </div>
                  )
                })()}
              </div>
            </div>

            <div className="text-center space-y-2">
              <p className="text-sm text-primary font-medium uppercase tracking-wider">
                {currentExercise.exercise.muscle_group}
              </p>
              <h2 className="text-2xl md:text-3xl font-bold">{currentExercise.exercise.name}</h2>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-primary">
                  {currentExercise.reps || currentExercise.duration_seconds}
                </p>
                <p className="text-xs text-muted-foreground">
                  {currentExercise.reps ? 'reps' : 'seg'}
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-primary">
                  {currentSet}/{currentExercise.sets}
                </p>
                <p className="text-xs text-muted-foreground">série</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-primary">
                  {currentExercise.rest_seconds}s
                </p>
                <p className="text-xs text-muted-foreground">descanso</p>
              </div>
            </div>
          </motion.div>

          <div className="flex justify-center gap-3 pt-2">
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => {
                if (currentExerciseIndex > 0) {
                  setCurrentExerciseIndex(currentExerciseIndex - 1)
                  setCurrentSet(1)
                }
              }}
              disabled={currentExerciseIndex === 0}
              className="px-4"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              onClick={handleCompleteSet}
              className="px-8"
            >
              <Check className="w-5 h-5 mr-2" />
              Concluir
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              onClick={skipToNextExercise}
              className="px-4"
            >
              <SkipForward className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showCompletionModal}
        onClose={() => {}}
        title=""
        className="max-w-lg"
      >
        <div className="text-center py-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30"
          >
            <Trophy className="w-12 h-12 text-white" />
          </motion.div>

          <motion.h3 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold mb-2"
          >
            Treino Concluído!
          </motion.h3>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground mb-8"
          >
            {motivationalMessage}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 gap-4 mb-8"
          >
            <div className="bg-white/5 rounded-xl p-4">
              <Timer className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{getWorkoutDuration()}</p>
              <p className="text-xs text-muted-foreground">minutos</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <Target className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{getTotalExercisesCompleted()}/{workout.exercises.length}</p>
              <p className="text-xs text-muted-foreground">exercícios</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <Zap className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{getTotalSetsCompleted()}</p>
              <p className="text-xs text-muted-foreground">séries</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{userStats?.current_streak || 0}</p>
              <p className="text-xs text-muted-foreground">dias seguido</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-2 mb-8 text-sm text-muted-foreground"
          >
            <Zap className="w-4 h-4 text-yellow-500" />
            <span>+25 XP ganhos</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => navigate('/workouts')}
            >
              Voltar aos Treinos
            </Button>
          </motion.div>
        </div>
      </Modal>
    </div>
  )
}
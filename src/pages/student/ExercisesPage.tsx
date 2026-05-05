import { useState, useEffect } from "react"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { supabase } from "@/lib/supabase"
import { getExerciseImage, getExerciseVideo } from "@/lib/getExerciseMedia"
import { ExerciseDetailModal } from "./ExerciseDetailModal"
import { 
  Search, 
  Dumbbell
} from "lucide-react"

interface Exercise {
  id: string
  name: string
  description?: string
  muscle_group: string
  secondary_muscles?: string[]
  equipment?: string
  level?: string
  category?: string
  image_url?: string
  video_url?: string
  steps?: {
    initial?: string
    execution?: string
    return?: string
    breathing?: string
  }
  common_mistakes?: string[]
  trainer_tips?: string[]
  variations?: {
    name: string
    type: string
  }[]
  suggestions?: {
    sets?: number
    reps?: string
    rest?: string
    cadence?: string
  }
}

const levelColors: Record<string, string> = {
  iniciante: "bg-emerald-500/20 text-emerald-400",
  intermediario: "bg-amber-500/20 text-amber-400",
  avancado: "bg-rose-500/20 text-rose-400",
}

const equipmentIcons: Record<string, string> = {
  halteres: "💪",
  barra: "🏋️",
  maquina: "⚙️",
  cabo: "🔗",
  peso_corporal: "🧘",
  elastico: "🪢",
  outro: "🔧",
}

export function StudentExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [filterMuscle, setFilterMuscle] = useState("")
  
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(true)
  const [videoError, setVideoError] = useState(false)

  useEffect(() => {
    document.body.style.overflow = selectedExercise ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [selectedExercise])

  useEffect(() => {
    fetchExercises()
  }, [])

  const fetchExercises = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from("exercises")
        .select("*")
        .order("name")
        .limit(50)
      
      setExercises(data || [])
    } catch (err) {
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const muscleGroups = [
    { value: "", label: "Todos" },
    { value: "peito", label: "Peito" },
    { value: "costas", label: "Costas" },
    { value: "pernas", label: "Pernas" },
    { value: "ombros", label: "Ombros" },
    { value: "biceps", label: "Bíceps" },
    { value: "triceps", label: "Tríceps" },
    { value: "abdomen", label: "Abdômen" },
  ]

  const filteredExercises = exercises.filter(ex => {
    const matchesSearch = !search || ex.name.toLowerCase().includes(search.toLowerCase())
    const matchesMuscle = !filterMuscle || ex.muscle_group === filterMuscle
    return matchesSearch && matchesMuscle
  })

  const getMuscleLabel = (value: string) => {
    const group = muscleGroups.find(g => g.value === value)
    return group?.label || value
  }

  const getLevelLabel = (level?: string) => {
    if (level === 'iniciante') return 'Iniciante'
    if (level === 'intermediario') return 'Intermediário'
    if (level === 'avancado') return 'Avançado'
    return 'Iniciante'
  }

  const closeModal = () => {
    setSelectedExercise(null)
    setVideoError(false)
    setIsPlaying(true)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Exercícios</h1>
        <p className="text-muted-foreground">Biblioteca de exercícios disponíveis</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Buscar exercícios..."
          icon={<Search className="w-4 h-4" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <select
          value={filterMuscle}
          onChange={(e) => setFilterMuscle(e.target.value)}
          className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
        >
          {muscleGroups.map(group => (
            <option key={group.value} value={group.value} className="bg-zinc-900">
              {group.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent animate-spin rounded-full" />
        </div>
      ) : filteredExercises.length === 0 ? (
        <div className="text-center py-12">
          <Dumbbell className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum exercício encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredExercises.map((exercise) => {
            const imageUrl = getExerciseImage(exercise)
            
            return (
              <div
                key={exercise.id}
                onClick={() => setSelectedExercise(exercise)}
                className="bg-white/5 rounded-xl overflow-hidden hover:bg-white/10 transition-colors cursor-pointer"
              >
                <div className="aspect-video relative">
                  {imageUrl ? (
                    <img src={imageUrl} alt={exercise.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-teal-600/20 flex items-center justify-center">
                      <Dumbbell className="w-12 h-12 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold mb-1 truncate">{exercise.name}</h3>
                  <p className="text-sm text-muted-foreground">{getMuscleLabel(exercise.muscle_group)}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selectedExercise && (
        <ExerciseDetailModal
          exercise={selectedExercise}
          isPlaying={isPlaying}
          isMuted={isMuted}
          videoError={videoError}
          onClose={closeModal}
          onPlayToggle={() => setIsPlaying(!isPlaying)}
          onMuteToggle={() => setIsMuted(!isMuted)}
          onVideoError={() => setVideoError(true)}
        />
      )}
    </div>
  )
}
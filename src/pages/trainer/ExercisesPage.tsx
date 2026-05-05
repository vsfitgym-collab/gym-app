import { useState, useEffect } from "react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { supabase } from "@/lib/supabase"
import { getExerciseImage, getExerciseVideo, getPlaceholderImage } from "@/lib/getExerciseMedia"
import { ExerciseDetailModal } from "./ExerciseDetailModal"
import { 
  Plus, 
  Search, 
  Dumbbell, 
  Trash2, 
  Edit2, 
  X
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

export function TrainerExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [filterMuscle, setFilterMuscle] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [form, setForm] = useState({ 
    name: "", 
    muscle_group: "", 
    equipment: "", 
    description: "" 
  })
  
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(true)
  const [videoError, setVideoError] = useState(false)

  useEffect(() => {
    document.body.style.overflow = isDetailOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [isDetailOpen])

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

  const handleSave = async () => {
    if (!form.name || !form.muscle_group) return
    
    try {
      if (selectedExercise) {
        await supabase
          .from("exercises")
          .update(form)
          .eq("id", selectedExercise.id)
      } else {
        await supabase
          .from("exercises")
          .insert(form)
      }

      setIsModalOpen(false)
      setSelectedExercise(null)
      setForm({ name: "", muscle_group: "", equipment: "", description: "" })
      fetchExercises()
    } catch (err) {
      console.error("Error saving:", err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir exercício?")) return
    
    try {
      await supabase
        .from("exercises")
        .delete()
        .eq("id", id)
      fetchExercises()
    } catch (err) {
      console.error("Error deleting:", err)
    }
  }

  const openEdit = (ex: Exercise) => {
    setSelectedExercise(ex)
    setForm({
      name: ex.name,
      muscle_group: ex.muscle_group || "",
      equipment: ex.equipment || "",
      description: ex.description || ""
    })
    setIsModalOpen(true)
  }

  const openNew = () => {
    setSelectedExercise(null)
    setForm({ name: "", muscle_group: "", equipment: "", description: "" })
    setIsModalOpen(true)
  }

  const openDetail = (ex: Exercise) => {
    setSelectedExercise(ex)
    setVideoError(false)
    setIsPlaying(true)
    setIsDetailOpen(true)
  }

  const closeDetail = () => {
    setIsDetailOpen(false)
    setSelectedExercise(null)
    setVideoError(false)
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

  const getLevelLabel = (level?: string) => {
    if (level === 'iniciante') return 'Iniciante'
    if (level === 'intermediario') return 'Intermediário'
    if (level === 'avancado') return 'Avançado'
    return 'Iniciante'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Exercícios</h1>
          <p className="text-muted-foreground">Gerencie os exercícios</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Exercício
        </Button>
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
          {muscleGroups.map(g => (
            <option key={g.value} value={g.value} className="bg-zinc-900">
              {g.label}
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
            const imageUrl = getExerciseImage(exercise) || getPlaceholderImage()
            
            return (
              <div
                key={exercise.id}
                onClick={() => openDetail(exercise)}
                className="bg-white/5 rounded-xl overflow-hidden hover:bg-white/10 transition-colors cursor-pointer"
              >
                <div className="aspect-video relative">
                  <img
                    src={imageUrl}
                    alt={exercise.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getPlaceholderImage()
                    }}
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold mb-1 truncate">{exercise.name}</h3>
                  <p className="text-sm text-muted-foreground capitalize mb-2">
                    {exercise.muscle_group}
                  </p>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="outline" onClick={() => openEdit(exercise)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(exercise.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-zinc-900 rounded-2xl max-w-md w-full p-6">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-xl font-bold mb-4">
              {selectedExercise ? "Editar Exercício" : "Novo Exercício"}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Nome *</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nome do exercício"
                />
              </div>
              
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Grupo Muscular *</label>
                <select
                  value={form.muscle_group}
                  onChange={(e) => setForm({ ...form, muscle_group: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-foreground"
                >
                  <option value="">Selecione</option>
                  {muscleGroups.slice(1).map(g => (
                    <option key={g.value} value={g.value} className="bg-zinc-900">
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Equipamento</label>
                <Input
                  value={form.equipment}
                  onChange={(e) => setForm({ ...form, equipment: e.target.value })}
                  placeholder="Ex: Halteres, Barra, etc."
                />
              </div>
              
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Descrição</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Descrição do exercício"
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-foreground min-h-[100px]"
                />
              </div>
              
              <Button onClick={handleSave} className="w-full" disabled={!form.name || !form.muscle_group}>
                {selectedExercise ? "Salvar" : "Criar"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {isDetailOpen && selectedExercise && (
        <ExerciseDetailModal
          exercise={selectedExercise}
          isPlaying={isPlaying}
          isMuted={isMuted}
          videoError={videoError}
          onClose={closeDetail}
          onEdit={() => { closeDetail(); openEdit(selectedExercise); }}
          onPlayToggle={() => setIsPlaying(!isPlaying)}
          onMuteToggle={() => setIsMuted(!isMuted)}
          onVideoError={() => setVideoError(true)}
        />
      )}
    </div>
  )
}
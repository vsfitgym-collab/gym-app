import { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { getExerciseImage, getExerciseVideo } from "@/lib/getExerciseMedia"
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Heart, 
  Share2,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  RefreshCcw,
  Dumbbell,
  Target,
  Clock,
  Zap,
  ArrowRight
} from "lucide-react"
import { cn } from "@/lib/utils"

type ExerciseLevel = 'iniciante' | 'intermediario' | 'avancado'

interface ExerciseDetail {
  id: string
  name: string
  description?: string
  muscle_group: string
  secondary_muscles?: string[]
  equipment?: string
  level?: ExerciseLevel
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

interface ExerciseCardProps {
  exercise: ExerciseDetail
  onClick?: () => void
  onFavorite?: () => void
  onEdit?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
  isFavorite?: boolean
}

const levelColors = {
  iniciante: "bg-emerald-500/20 text-emerald-400",
  intermediario: "bg-amber-500/20 text-amber-400",
  avancado: "bg-rose-500/20 text-rose-400",
}

function getExerciseLevel(level?: ExerciseLevel): ExerciseLevel {
  return level || 'iniciante'
}

function getLevelLabel(level?: ExerciseLevel) {
  const safeLevel = getExerciseLevel(level)

  if (safeLevel === 'iniciante') return 'Iniciante'
  if (safeLevel === 'intermediario') return 'Intermediário'

  return 'Avançado'
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

export function ExerciseCard({ 
  exercise, 
  onClick, 
  onFavorite, 
  onEdit, 
  onDuplicate, 
  onDelete,
  isFavorite 
}: ExerciseCardProps) {
  const [imageError, setImageError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const level = getExerciseLevel(exercise.level)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative bg-[#1A1A1A] border border-white/5 rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 cursor-pointer"
      onClick={onClick}
    >
      <div className="aspect-[4/3] relative overflow-hidden bg-[#222]">
        {(() => {
          const imageUrl = getExerciseImage(exercise)
          return imageUrl && !imageError ? (
            <img 
              src={imageUrl} 
              alt={exercise.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center">
                <Dumbbell className="w-10 h-10 text-white/20" />
              </div>
            </div>
          )
        })()}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", levelColors[level])}>
            {getLevelLabel(level)}
          </span>
        </div>

        <div className="absolute top-3 right-3 flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onFavorite?.() }}
            className="p-2 bg-black/40 backdrop-blur rounded-xl border border-white/10 hover:border-red-500/50 transition-colors"
          >
            <Heart className={cn("w-4 h-4", isFavorite ? "fill-red-500 text-red-500" : "text-white/60")} />
          </button>
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu) }}
              className="p-2 bg-black/40 backdrop-blur rounded-xl border border-white/10 hover:border-white/20 transition-colors"
            >
              <span className="text-white/60 text-lg">⋯</span>
            </button>
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 bg-[#1A1A1A] border border-white/10 rounded-xl overflow-hidden shadow-xl z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button onClick={() => { onEdit?.(); setShowMenu(false) }} className="w-full px-4 py-2 text-left text-sm text-white/80 hover:bg-white/5 flex items-center gap-2">
                    <RefreshCcw className="w-4 h-4" /> Duplicar
                  </button>
                  <button onClick={() => { onEdit?.(); setShowMenu(false) }} className="w-full px-4 py-2 text-left text-sm text-white/80 hover:bg-white/5 flex items-center gap-2">
                    <Zap className="w-4 h-4" /> Editar
                  </button>
                  <button onClick={() => { onDelete?.(); setShowMenu(false) }} className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2">
                    <X className="w-4 h-4" /> Deletar
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="absolute bottom-3 left-3 right-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-black/60 backdrop-blur rounded-full text-xs text-white/80">
            <span>{equipmentIcons[exercise.equipment || 'outro']}</span>
            <span className="capitalize">{exercise.equipment?.replace('_', ' ') || 'Outro'}</span>
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate">{exercise.name}</h3>
            <p className="text-sm text-white/50 mt-1 capitalize">{exercise.muscle_group}</p>
          </div>
        </div>
        {exercise.secondary_muscles && exercise.secondary_muscles.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {exercise.secondary_muscles.slice(0, 3).map((muscle, idx) => (
              <span key={idx} className="px-2 py-0.5 bg-white/5 rounded-full text-xs text-white/40 capitalize">
                {muscle}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

interface ExerciseDetailModalProps {
  exercise: ExerciseDetail | null
  isOpen: boolean
  onClose: () => void
  onFavorite?: (id: string) => void
  isFavorite?: boolean
}

export function ExerciseDetailModal({ 
  exercise, 
  isOpen, 
  onClose,
  onFavorite,
  isFavorite 
}: ExerciseDetailModalProps) {
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(true)
  const [currentStep, setCurrentStep] = useState(0)
  const [videoError, setVideoError] = useState(false)
  const [videoLoading, setVideoLoading] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    setCurrentStep(0)
    setVideoError(false)
    setIsMuted(true)

    if (!isOpen || !exercise?.video_url) {
      setIsPlaying(false)
      setVideoLoading(false)
      return
    }

    setIsPlaying(true)
    setVideoLoading(true)
  }, [exercise?.id, exercise?.video_url, isOpen])

  if (!exercise) return null

  const videoUrl = getExerciseVideo(exercise)
  const imageUrl = getExerciseImage(exercise)
  const level = getExerciseLevel(exercise.level)

  const togglePlayback = () => {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      void video.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false))
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }

  const steps = [
    { title: "Posição Inicial", content: exercise.steps?.initial || "Posicione-se corretamente no equipamento", icon: Target },
    { title: "Execução", content: exercise.steps?.execution || "Execute o movimento controlado", icon: Zap },
    { title: "Retorno", content: exercise.steps?.return || "Retorne à posição inicial", icon: RefreshCcw },
    { title: "Respiração", content: exercise.steps?.breathing || "Respire de forma controlada durante o movimento", icon: Wind },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl overflow-y-auto"
        >
          <div className="min-h-screen bg-[#0D0D0D]">
            <div className="sticky top-0 z-10 bg-gradient-to-b from-black to-transparent pt-4 pb-8 px-4">
              <div className="max-w-4xl mx-auto flex items-center justify-between">
                <button 
                  onClick={onClose}
                  className="p-3 bg-white/10 backdrop-blur rounded-xl border border-white/10 hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
                <div className="flex gap-2">
                  <button 
                    onClick={() => onFavorite?.(exercise.id)}
                    className={cn(
                      "p-3 rounded-xl border transition-colors",
                      isFavorite 
                        ? "bg-red-500/20 border-red-500/50 text-red-400" 
                        : "bg-white/10 border-white/10 text-white/60 hover:bg-white/20"
                    )}
                  >
                    <Heart className={cn("w-5 h-5", isFavorite && "fill-current")} />
                  </button>
                  <button className="p-3 bg-white/10 backdrop-blur rounded-xl border border-white/10 hover:bg-white/20 transition-colors">
                    <Share2 className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 pb-12 space-y-8">
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-[#1A1A1A] border border-white/10">
                {videoUrl && !videoError ? (
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    className="w-full h-full object-cover"
                    loop
                    playsInline
                    muted={isMuted}
                    autoPlay
                    preload="auto"
                    poster={imageUrl || undefined}
                    controls={false}
                    onCanPlay={() => setVideoLoading(false)}
                    onLoadedData={() => {
                      setVideoLoading(false)
                      setIsPlaying(!videoRef.current?.paused)
                    }}
                    onError={() => {
                      setVideoError(true)
                      setVideoLoading(false)
                      setIsPlaying(false)
                    }}
                    onClick={togglePlayback}
                  />
                ) : imageUrl ? (
                  <img src={imageUrl} alt={exercise.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Dumbbell className="w-20 h-20 text-white/20" />
                  </div>
                )}

                {videoLoading && videoUrl && !videoError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="h-10 w-10 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
                  </div>
                )}

                {videoError && imageUrl && (
                  <div className="absolute left-4 top-4 rounded-xl border border-amber-400/30 bg-black/70 px-3 py-2 text-sm text-amber-100 backdrop-blur">
                    Vídeo indisponível. Exibindo imagem do exercício.
                  </div>
                )}

                {videoUrl && !videoError && (
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <div className="flex gap-2">
                    <button 
                      onClick={togglePlayback}
                      className="p-3 bg-black/60 backdrop-blur rounded-xl border border-white/10 hover:bg-black/80 transition-colors"
                    >
                      {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white" />}
                    </button>
                    <button 
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.muted = !isMuted
                          setIsMuted(!isMuted)
                        }
                      }}
                      className="p-3 bg-black/60 backdrop-blur rounded-xl border border-white/10 hover:bg-black/80 transition-colors"
                    >
                      {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
                    </button>
                  </div>
                  <button className="p-3 bg-black/60 backdrop-blur rounded-xl border border-white/10 hover:bg-black/80 transition-colors">
                    <Maximize className="w-5 h-5 text-white" />
                  </button>
                </div>
                )}

                <div className="absolute top-4 left-4 flex gap-2">
                  <span className={cn("px-3 py-1.5 rounded-full text-sm font-medium", levelColors[level])}>
                    {getLevelLabel(level)}
                  </span>
                  {exercise.category && (
                    <span className="px-3 py-1.5 bg-primary/20 text-primary rounded-full text-sm font-medium">
                      {exercise.category}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h1 className="text-3xl font-bold text-white">{exercise.name}</h1>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] rounded-xl border border-white/10">
                    <Dumbbell className="w-4 h-4 text-primary" />
                    <span className="text-white/80 capitalize">{exercise.muscle_group}</span>
                  </div>
                  {exercise.equipment && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] rounded-xl border border-white/10">
                      <span className="text-lg">{equipmentIcons[exercise.equipment]}</span>
                      <span className="text-white/80 capitalize">{exercise.equipment.replace('_', ' ')}</span>
                    </div>
                  )}
                </div>
                {exercise.description && (
                  <p className="text-white/60 leading-relaxed">{exercise.description}</p>
                )}
              </div>

              <div className="bg-[#1A1A1A] rounded-2xl border border-white/10 overflow-hidden">
                <div className="px-6 py-4 border-b border-white/5">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Como Executar
                  </h2>
                </div>
                <div className="divide-y divide-white/5">
                  {steps.map((step, idx) => (
                    <div key={idx} className={cn("p-6 hover:bg-white/5 transition-colors", idx === currentStep && "bg-primary/5")}>
                      <div className="flex items-start gap-4">
                        <button
                          onClick={() => setCurrentStep(idx)}
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
                            idx === currentStep 
                              ? "bg-primary text-black" 
                              : "bg-white/10 text-white/60"
                          )}
                        >
                          {idx === currentStep ? <CheckCircle2 className="w-5 h-5" /> : <span className="text-sm font-medium">{idx + 1}</span>}
                        </button>
                        <div className="flex-1">
                          <h3 className="font-medium text-white mb-2">{step.title}</h3>
                          <p className="text-white/60">{step.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {exercise.common_mistakes && exercise.common_mistakes.length > 0 && (
                <div className="bg-[#1A1A1A] rounded-2xl border border-red-500/20 overflow-hidden">
                  <div className="px-6 py-4 bg-red-500/5 border-b border-red-500/10">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      Erros Comuns
                    </h2>
                  </div>
                  <div className="divide-y divide-white/5">
                    {exercise.common_mistakes.map((mistake, idx) => (
                      <div key={idx} className="p-4 flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                        <span className="text-white/80">{mistake}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {exercise.trainer_tips && exercise.trainer_tips.length > 0 && (
                <div className="bg-[#1A1A1A] rounded-2xl border border-amber-500/20 overflow-hidden">
                  <div className="px-6 py-4 bg-amber-500/5 border-b border-amber-500/10">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-amber-400" />
                      Dicas do Treinador
                    </h2>
                  </div>
                  <div className="p-6 space-y-3">
                    {exercise.trainer_tips.map((tip, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <Zap className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <span className="text-white/80">{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {exercise.variations && exercise.variations.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <RefreshCcw className="w-5 h-5 text-primary" />
                    Variações
                  </h2>
                  <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                    {exercise.variations.map((variation, idx) => (
                      <div key={idx} className="flex-shrink-0 w-48 p-4 bg-[#1A1A1A] rounded-xl border border-white/10">
                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-3">
                          <Dumbbell className="w-6 h-6 text-white/40" />
                        </div>
                        <h3 className="font-medium text-white text-sm">{variation.name}</h3>
                        <p className="text-xs text-white/40 mt-1">{variation.type}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {exercise.suggestions && (
                <div className="bg-gradient-to-r from-primary/20 to-primary/5 rounded-2xl border border-primary/20 p-6">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Sugestão de Treino
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {exercise.suggestions.sets && (
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">{exercise.suggestions.sets}</p>
                        <p className="text-sm text-white/50">Séries</p>
                      </div>
                    )}
                    {exercise.suggestions.reps && (
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">{exercise.suggestions.reps}</p>
                        <p className="text-sm text-white/50">Reps</p>
                      </div>
                    )}
                    {exercise.suggestions.rest && (
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">{exercise.suggestions.rest}</p>
                        <p className="text-sm text-white/50">Descanso</p>
                      </div>
                    )}
                    {exercise.suggestions.cadence && (
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">{exercise.suggestions.cadence}</p>
                        <p className="text-sm text-white/50">Cadência</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Wind({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
      <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
      <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
    </svg>
  )
}

interface ExerciseGridProps {
  exercises: ExerciseDetail[]
  onExerciseClick?: (exercise: ExerciseDetail) => void
  onFavorite?: (id: string) => void
  onEdit?: (exercise: ExerciseDetail) => void
  onDelete?: (id: string) => void
  favorites?: string[]
  loading?: boolean
}

export function ExerciseGrid({ 
  exercises, 
  onExerciseClick, 
  onFavorite, 
  onEdit,
  onDelete,
  favorites = [],
  loading 
}: ExerciseGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-[#1A1A1A] border border-white/5 rounded-2xl overflow-hidden">
            <div className="aspect-[4/3] bg-[#222] animate-pulse" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-[#222] rounded animate-pulse w-3/4" />
              <div className="h-3 bg-[#222] rounded animate-pulse w-1/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {exercises.map((exercise, idx) => (
        <ExerciseCard
          key={exercise.id}
          exercise={exercise}
          onClick={() => onExerciseClick?.(exercise)}
          onFavorite={() => onFavorite?.(exercise.id)}
          onEdit={() => onEdit?.(exercise)}
          onDelete={() => onDelete?.(exercise.id)}
          isFavorite={favorites.includes(exercise.id)}
        />
      ))}
    </div>
  )
}

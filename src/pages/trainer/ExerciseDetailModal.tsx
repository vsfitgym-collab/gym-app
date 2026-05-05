import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { getExerciseImage, getExerciseVideo } from "@/lib/getExerciseMedia"
import { X, Edit2 } from "lucide-react"

import { ExerciseInfoCard } from "@/components/exercise/ExerciseInfoCard"
import { ExerciseMedia } from "@/components/exercise/ExerciseMedia"
import { ExerciseDescriptionCard } from "@/components/exercise/ExerciseDescriptionCard"
import { ExecutionStepsCard } from "@/components/exercise/ExecutionStepsCard"
import { TipsCard } from "@/components/exercise/TipsCard"
import { MistakesCard } from "@/components/exercise/MistakesCard"
import { WorkoutConfigCard } from "@/components/exercise/WorkoutConfigCard"
import { ExerciseVariationsCard } from "@/components/exercise/ExerciseVariationsCard"

interface Exercise {
  name: string
  description?: string
  muscle_group: string
  secondary_muscles?: string[]
  equipment?: string
  level?: string
  category?: string
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

interface Step {
  title: string
  content?: string
}

interface ExerciseDetailModalProps {
  exercise: Exercise
  isPlaying: boolean
  isMuted: boolean
  videoError: boolean
  onClose: () => void
  onEdit: () => void
  onPlayToggle: () => void
  onMuteToggle: () => void
  onVideoError: () => void
}

export function ExerciseDetailModal({
  exercise,
  isPlaying,
  isMuted,
  videoError,
  onClose,
  onEdit,
  onPlayToggle,
  onMuteToggle,
  onVideoError,
}: ExerciseDetailModalProps) {
  const [imageLoading, setImageLoading] = useState(true)

  const steps: Step[] = exercise.steps
    ? [
        { title: "Posição Inicial", content: exercise.steps.initial },
        { title: "Execução", content: exercise.steps.execution },
        { title: "Retorno", content: exercise.steps.return },
        { title: "Respiração", content: exercise.steps.breathing },
      ].filter((s) => s.content)
    : []

  const hasBasicInfo = exercise.muscle_group || exercise.equipment || exercise.level || exercise.category
  const hasContent = 
    exercise.description ||
    steps.length > 0 ||
    (exercise.trainer_tips && exercise.trainer_tips.length > 0) ||
    (exercise.common_mistakes && exercise.common_mistakes.length > 0) ||
    exercise.suggestions ||
    (exercise.variations && exercise.variations.length > 0) ||
    hasBasicInfo

  if (!hasContent) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl">
        <div className="h-full overflow-y-auto">
          <div className="bg-[#0D0D0D] p-4 min-h-screen">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between py-4 sticky top-0 bg-gradient-to-b from-[#0D0D0D] to-transparent z-10 -mx-4 px-4">
                <button onClick={onClose} className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="py-8">
                <div className="text-center">
                  <h1 className="text-3xl font-bold text-white mb-4">{exercise.name}</h1>
                  <p className="text-white/50">Detalhes do exercício em breve...</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={onEdit} className="flex-1">
                  <Edit2 className="w-4 h-4 mr-2" />
                  Editar Exercício
                </Button>
                <Button onClick={onClose} variant="outline" className="flex-1">
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl">
      <div className="h-full overflow-y-auto">
        <div className="bg-[#0D0D0D] p-4 min-h-screen">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between sticky top-0 bg-gradient-to-b from-[#0D0D0D] via-[#0D0D0D] to-transparent z-10 -mx-4 px-4 py-4">
              <button 
                onClick={onClose} 
                className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              <h1 className="text-xl font-bold text-white truncate flex-1 mx-4">
                {exercise.name}
              </h1>
              <button 
                onClick={onEdit}
                className="p-3 bg-primary/20 text-primary rounded-xl hover:bg-primary/30 transition-colors"
              >
                <Edit2 className="w-5 h-5" />
              </button>
            </div>

            {/* Mídia */}
            <ExerciseMedia
              videoSrc={getExerciseVideo(exercise)}
              imageSrc={getExerciseImage(exercise)}
              exerciseName={exercise.name}
              isPlaying={isPlaying}
              isMuted={isMuted}
              videoError={videoError}
              onPlayToggle={onPlayToggle}
              onMuteToggle={onMuteToggle}
              onVideoError={onVideoError}
            />

            {/* Informações do Exercício */}
            <ExerciseInfoCard
              muscleGroup={exercise.muscle_group}
              secondaryMuscles={exercise.secondary_muscles}
              equipment={exercise.equipment}
              level={exercise.level}
              category={exercise.category}
            />

            {/* Descrição */}
            <ExerciseDescriptionCard description={exercise.description} />

            {/* Configuração do Treino */}
            <WorkoutConfigCard config={exercise.suggestions || {}} />

            {/* Passo a Passo */}
            <ExecutionStepsCard steps={steps} />

            {/* Dicas do Personal */}
            <TipsCard tips={exercise.trainer_tips || []} />

            {/* Erros Comuns */}
            <MistakesCard mistakes={exercise.common_mistakes || []} />

            {/* Variações */}
            <ExerciseVariationsCard variations={exercise.variations || []} />

            {/* Footer */}
            <div className="flex gap-3 pt-4 pb-8">
              <Button onClick={onEdit} className="flex-1">
                <Edit2 className="w-4 h-4 mr-2" />
                Editar Exercício
              </Button>
              <Button onClick={onClose} variant="outline" className="flex-1">
                Fechar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
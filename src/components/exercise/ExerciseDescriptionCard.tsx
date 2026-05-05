import { FileText } from "lucide-react"

interface ExerciseDescriptionCardProps {
  description?: string
}

export function ExerciseDescriptionCard({ description }: ExerciseDescriptionCardProps) {
  if (!description) return null

  return (
    <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Sobre o Exercício</h3>
          <p className="text-sm text-white/60">Informações gerais</p>
        </div>
      </div>

      <p className="text-white/80 leading-relaxed">{description}</p>
    </div>
  )
}
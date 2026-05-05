import { Copy } from "lucide-react"

interface Variation {
  name: string
  type: string
}

interface ExerciseVariationsCardProps {
  variations: Variation[]
}

export function ExerciseVariationsCard({ variations }: ExerciseVariationsCardProps) {
  if (!variations || variations.length === 0) return null

  return (
    <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
          <Copy className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Variações</h3>
          <p className="text-sm text-white/60">Alternativas para diversificar</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {variations.map((variation, idx) => (
          <div 
            key={idx}
            className="px-4 py-2 bg-white/10 rounded-xl border border-white/10"
          >
            <p className="font-medium text-white">{variation.name}</p>
            <p className="text-xs text-white/50 capitalize">{variation.type}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
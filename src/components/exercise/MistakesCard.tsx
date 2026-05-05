import { AlertTriangle, XCircle } from "lucide-react"

interface MistakesCardProps {
  mistakes: string[]
}

export function MistakesCard({ mistakes }: MistakesCardProps) {
  if (mistakes.length === 0) return null

  return (
    <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 backdrop-blur-sm rounded-2xl p-5 border border-red-500/20">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Erros Comuns</h3>
          <p className="text-sm text-white/60">O que evitar durante o exercício</p>
        </div>
      </div>

      <div className="space-y-3">
        {mistakes.map((mistake, idx) => (
          <div 
            key={idx} 
            className="flex items-start gap-3 p-4 bg-red-500/10 rounded-xl border border-red-500/10"
          >
            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-white/80">{mistake}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-red-500/10 rounded-xl border border-red-500/20 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-red-200">
          Evitar estes erros previne lesões e melhora a eficácia do exercício.
        </p>
      </div>
    </div>
  )
}
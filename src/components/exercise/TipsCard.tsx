import { Lightbulb, CheckCircle2 } from "lucide-react"

interface TipsCardProps {
  tips: string[]
}

export function TipsCard({ tips }: TipsCardProps) {
  if (tips.length === 0) return null

  return (
    <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 backdrop-blur-sm rounded-2xl p-5 border border-emerald-500/20">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
          <Lightbulb className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Dicas do Personal</h3>
          <p className="text-sm text-white/60">Técnicas para melhor resultado</p>
        </div>
      </div>

      <div className="grid gap-3">
        {tips.map((tip, idx) => (
          <div 
            key={idx} 
            className="flex items-start gap-3 p-4 bg-emerald-500/10 rounded-xl"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="text-white/90 font-medium">{tip}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 text-emerald-400/80 text-sm">
        <CheckCircle2 className="w-4 h-4" />
        <span>Siga estas dicas para maximizar resultados</span>
      </div>
    </div>
  )
}
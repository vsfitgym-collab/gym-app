import { Play, Circle } from "lucide-react"

interface Step {
  title: string
  content?: string
}

interface ExecutionStepsCardProps {
  steps: Step[]
}

export function ExecutionStepsCard({ steps }: ExecutionStepsCardProps) {
  if (steps.length === 0) return null

  return (
    <div className="bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-sm rounded-2xl p-5 border border-primary/20">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Play className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Como Executar</h3>
          <p className="text-sm text-white/60">Passo a passo detalhado</p>
        </div>
      </div>

      <div className="space-y-3">
        {steps.map((step, idx) => (
          <div 
            key={idx} 
            className="flex gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
          >
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                {idx + 1}
              </div>
              {idx < steps.length - 1 && (
                <div className="w-0.5 h-8 bg-primary/20 mt-1" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-white mb-1">{step.title}</h4>
              {step.content && (
                <p className="text-sm text-white/70 leading-relaxed">{step.content}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 flex items-start gap-2">
        <Circle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-amber-200">
          Execute o movimento de forma controlada. Se sentir dor diferente da muscular, pare imediatamente.
        </p>
      </div>
    </div>
  )
}
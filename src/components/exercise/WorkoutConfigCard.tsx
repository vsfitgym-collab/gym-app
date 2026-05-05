import { Settings, Repeat, Timer, ArrowDownToLine, Gauge } from "lucide-react"

interface WorkoutConfig {
  sets?: number
  reps?: string
  rest?: string
  cadence?: string
  weight?: string
}

interface WorkoutConfigCardProps {
  config: WorkoutConfig
}

export function WorkoutConfigCard({ config }: WorkoutConfigCardProps) {
  const hasAnyConfig = config.sets || config.reps || config.rest || config.cadence || config.weight
  
  if (!hasAnyConfig) return null

  const configItems = []

  if (config.sets) {
    configItems.push({
      icon: <Repeat className="w-5 h-5" />,
      label: "Séries",
      value: config.sets.toString(),
      bgColor: "bg-primary/20",
      borderColor: "border-primary/30",
    })
  }

  if (config.reps) {
    configItems.push({
      icon: <ArrowDownToLine className="w-5 h-5" />,
      label: "Reps",
      value: config.reps,
      bgColor: "bg-blue-500/20",
      borderColor: "border-blue-500/30",
    })
  }

  if (config.rest) {
    configItems.push({
      icon: <Timer className="w-5 h-5" />,
      label: "Descanso",
      value: config.rest,
      bgColor: "bg-violet-500/20",
      borderColor: "border-violet-500/30",
    })
  }

  if (config.cadence) {
    configItems.push({
      icon: <Gauge className="w-5 h-5" />,
      label: "Cadência",
      value: config.cadence,
      bgColor: "bg-amber-500/20",
      borderColor: "border-amber-500/30",
    })
  }

  if (config.weight) {
    configItems.push({
      icon: <Settings className="w-5 h-5" />,
      label: "Carga",
      value: config.weight,
      bgColor: "bg-rose-500/20",
      borderColor: "border-rose-500/30",
    })
  }

  return (
    <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
          <Settings className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Configuração do Treino</h3>
          <p className="text-sm text-white/60">Parâmetros recomendados</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {configItems.map((item, idx) => (
          <div 
            key={idx}
            className={`p-4 rounded-xl ${item.bgColor} border ${item.borderColor} text-center`}
          >
            <div className="flex justify-center mb-2 text-white/80">
              {item.icon}
            </div>
            <p className="text-2xl font-bold text-white mb-1">{item.value}</p>
            <p className="text-xs text-white/60 uppercase tracking-wider">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-white/5 rounded-xl">
        <p className="text-sm text-white/60 text-center">
          💡 Estes valores são sugestões. Ajuste conforme seu nível e capacidade.
        </p>
      </div>
    </div>
  )
}
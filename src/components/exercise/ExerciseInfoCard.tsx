import { 
  Dumbbell, 
  Target, 
  Zap, 
  Activity,
  TrendingUp,
  Gauge
} from "lucide-react"

interface ExerciseInfoCardProps {
  muscleGroup: string
  secondaryMuscles?: string[]
  equipment?: string
  level?: string
  category?: string
}

const levelConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  iniciante: { 
    label: "Iniciante", 
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    icon: <Gauge className="w-4 h-4" />
  },
  intermediario: { 
    label: "Intermediário", 
    color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    icon: <Zap className="w-4 h-4" />
  },
  avancado: { 
    label: "Avançado", 
    color: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    icon: <TrendingUp className="w-4 h-4" />
  },
}

const equipmentLabels: Record<string, string> = {
  halteres: "Halteres",
  barra: "Barra",
  maquina: "Máquina",
  cabo: "Cabo",
  peso_corporal: "Peso Corporal",
  elastico: "Elástico",
  kettlebell: "Kettlebell",
  banco: "Banco",
  outro: "Outro",
}

const categoryLabels: Record<string, string> = {
  isolado: "Isolado",
  composto: "Composto",
  cardiovascular: "Cardiovascular",
  flexibilidade: "Flexibilidade",
  mobilidade: "Mobilidade",
}

export function ExerciseInfoCard({ 
  muscleGroup, 
  secondaryMuscles, 
  equipment, 
  level,
  category 
}: ExerciseInfoCardProps) {
  const levelInfo = level ? levelConfig[level] : null

  return (
    <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
      <div className="grid grid-cols-2 gap-4">
        {/* Grupo Muscular Primário */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-white/50">
            <Target className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Músculo Principal</span>
          </div>
          <p className="text-lg font-semibold text-white">{muscleGroup}</p>
        </div>

        {/* Tipo de Exercício */}
        {category && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-white/50">
              <Activity className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">Tipo</span>
            </div>
            <p className="text-lg font-semibold text-white">
              {categoryLabels[category] || category}
            </p>
          </div>
        )}

        {/* Equipamento */}
        {equipment && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-white/50">
              <Dumbbell className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider">Equipamento</span>
            </div>
            <p className="text-lg font-semibold text-white">
              {equipmentLabels[equipment] || equipment.replace('_', ' ')}
            </p>
          </div>
        )}

        {/* Nível */}
        {levelInfo && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-white/50">
              {levelInfo.icon}
              <span className="text-xs uppercase tracking-wider">Nível</span>
            </div>
            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${levelInfo.color}`}>
              {levelInfo.icon}
              {levelInfo.label}
            </span>
          </div>
        )}
      </div>

      {/* Músculos Secundários */}
      {secondaryMuscles && secondaryMuscles.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2 text-white/50 mb-2">
            <Zap className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Músculos Auxiliares</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {secondaryMuscles.map((muscle, idx) => (
              <span 
                key={idx} 
                className="px-3 py-1 rounded-full bg-white/10 text-sm text-white/80"
              >
                {muscle}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
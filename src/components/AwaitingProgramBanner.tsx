import { Clock, Dumbbell } from 'lucide-react'

export default function AwaitingProgramBanner() {
  return (
    <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-6 md:p-8 relative overflow-hidden">
      {/* Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
          <Clock size={32} className="text-amber-400 animate-pulse" />
        </div>

        <div className="text-center md:text-left flex-1 space-y-2">
          <h3 className="text-lg font-bold text-amber-300">Aguardando seu Personal</h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            Sua ficha técnica foi enviada com sucesso! 🎉  
            O personal está preparando um <strong className="text-white">treino personalizado</strong> exclusivo para você.
          </p>
          <p className="text-xs text-slate-400">
            Você receberá uma notificação assim que o treino estiver pronto.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20">
          <Dumbbell size={14} className="text-amber-400" />
          <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider">Em preparação</span>
        </div>
      </div>
    </div>
  )
}

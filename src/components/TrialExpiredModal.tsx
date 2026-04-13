import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Crown, Zap, ArrowRight, Lock } from 'lucide-react'
import Button from './ui/Button'

export default function TrialExpiredModal() {
  const navigate = useNavigate()

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-slate-900/90 border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl shadow-purple-500/20 animate-in zoom-in-95 duration-300">
        {/* Banner Superior */}
        <div className="h-24 bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-24 h-24 bg-white/20 blur-3xl rounded-full translate-x-12 translate-y-12" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-400/20 blur-3xl rounded-full -translate-x-12 -translate-y-12" />
          </div>
          <Crown size={48} className="text-white/30 absolute -right-4 -bottom-4 rotate-12" />
          <div className="relative z-10 w-16 h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center shadow-xl">
             <Lock className="text-white animate-pulse" size={28} />
          </div>
        </div>

        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">
            Seu teste gratuito acabou
          </h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Esperamos que tenha gostado da experiência! Para continuar evoluindo e ter acesso a todos os recursos, escolha um dos nossos planos.
          </p>

          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5 text-left transition-colors hover:bg-white/10">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                <Zap className="text-purple-400" size={20} fill="currentColor" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Evolução Contínua</p>
                <p className="text-xs text-slate-400">Mantenha seu streak e históricos salvos.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => navigate('/planos')}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 group"
            >
              Ver Planos Disponíveis
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <button 
              onClick={() => navigate('/auth')}
              className="text-sm text-slate-500 hover:text-slate-300 transition-colors py-2"
            >
              Sair da conta
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

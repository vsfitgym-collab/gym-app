import React from 'react'
import { Lock, Zap } from 'lucide-react'
import { usePermissions } from '../context/PermissionsContext'
import { useNavigate } from 'react-router-dom'

interface ProtectedFeatureProps {
  feature: string
  children: React.ReactNode
}

export default function ProtectedFeature({ feature, children }: ProtectedFeatureProps) {
  const { hasPermission, loading } = usePermissions()
  const navigate = useNavigate()

  if (loading) {
    return <div className="animate-pulse bg-white/5 rounded-2xl h-full w-full min-h-[100px]" />
  }

  if (hasPermission(feature)) {
    return <>{children}</>
  }

  return (
    <div className="relative overflow-hidden rounded-2xl w-full h-full min-h-[200px] border border-white/5">
      {/* Blurred out background content */}
      <div className="absolute inset-0 filter blur-md opacity-30 pointer-events-none select-none">
        {children}
      </div>

      {/* Premium Lock Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 to-slate-900/90 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm z-10 transition-all hover:bg-black/70">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500/20 to-purple-500/20 flex items-center justify-center mb-4 border border-amber-500/30">
          <Lock className="text-amber-400" size={28} />
        </div>
        
        <h3 className="text-lg font-bold text-white mb-2">Recurso Premium</h3>
        <p className="text-sm text-slate-300 mb-6 max-w-[250px]">
          Esta funcionalidade não está liberada no seu plano atual.
        </p>
        
        <button 
          onClick={() => navigate('/planos')}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
        >
          <Zap size={16} fill="currentColor" />
          Fazer Upgrade
        </button>
      </div>
    </div>
  )
}

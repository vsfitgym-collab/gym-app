import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Dumbbell, Home, MessageCircle, Users, DollarSign, LogOut, Target, Trophy, Crown, User } from 'lucide-react'
import { useSubscription } from '../hooks/useSubscription'

const navItemsAluno = [
  { path: '/', label: 'Início', icon: Home },
  { path: '/treinos', label: 'Meus Treinos', icon: Dumbbell },
  { path: '/exercicios', label: 'Exercícios', icon: Target },
  { path: '/conquistas', label: 'Conquistas', icon: Trophy },
  { path: '/planos', label: 'Planos', icon: Crown },
  { path: '/chat', label: 'Chat', icon: MessageCircle },
  { path: '/perfil', label: 'Perfil', icon: User },
]

const navItemsPersonal = [
  { path: '/', label: 'Dashboard', icon: Home },
  { path: '/alunos', label: 'Alunos', icon: Users },
  { path: '/treinos', label: 'Treinos', icon: Dumbbell },
  { path: '/exercicios', label: 'Exercícios', icon: Target },
  { path: '/conquistas', label: 'Conquistas', icon: Trophy },
  { path: '/planos', label: 'Planos', icon: Crown },
  { path: '/pagamentos', label: 'Pagamentos', icon: DollarSign },
  { path: '/chat', label: 'Chat', icon: MessageCircle },
  { path: '/financeiro', label: 'Financeiro', icon: DollarSign },
  { path: '/perfil', label: 'Perfil', icon: User },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function SidebarAluno({ isOpen, onClose }: SidebarProps) {
  const { user, signOut, role } = useAuth()
  const { isPremium } = useSubscription()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)
  const navItems = role === 'personal' ? navItemsPersonal : navItemsAluno
  
  const userName = user?.email?.split('@')[0] || 'Usuário'
  const userInitial = userName.charAt(0).toUpperCase()

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch (error) {
      console.error('Erro ao sair:', error)
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''} bg-[#0a0a0f]/90 backdrop-blur-2xl border-r border-white/5`}>
      {/* Brand Header */}
      <div className="h-20 flex items-center gap-3 px-6 border-b border-white/5 bg-gradient-to-r from-purple-500/5 to-transparent">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
          <Dumbbell size={22} className="text-white" />
        </div>
        <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
          VSFit Gym
        </span>
      </div>

      {/* User Profile Card */}
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] transition-colors cursor-default">
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-purple-500 to-cyan-500 flex items-center justify-center text-lg font-bold text-white shadow-inner">
            {userInitial}
          </div>
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-sm text-slate-200 truncate">{userName}</span>
              {isPremium && (
                <Crown size={12} className="text-amber-400 shrink-0 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
              )}
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {role === 'personal' ? 'Personal Trainer' : 'Aluno Premium'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-5 px-3 flex flex-col gap-2 custom-scrollbar">
        <div className="px-3 pb-2">
          <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Menu Principal</span>
        </div>
        
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            end={item.path === '/'}
            className={({ isActive }) => `
              group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
              ${isActive 
                ? 'bg-gradient-to-r from-purple-500/20 to-transparent text-purple-300 border-l-2 border-purple-500' 
                : 'text-slate-400 hover:bg-zinc-800/60 hover:text-slate-200 border-l-2 border-transparent'}
            `}
          >
            {({ isActive }) => (
              <>
                <item.icon 
                  size={18} 
                  className={`transition-colors duration-200 ${isActive ? 'text-purple-400' : 'text-slate-500 group-hover:text-slate-300'}`} 
                />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/5 bg-black/20">
        <button 
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-200" 
          onClick={handleLogout}
          disabled={loggingOut}
        >
          <LogOut size={16} className={loggingOut ? 'animate-pulse' : ''} />
          <span>{loggingOut ? 'Saindo...' : 'Sair da conta'}</span>
        </button>
      </div>
    </aside>
  )
}

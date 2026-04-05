import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Dumbbell, Home, MessageCircle, Users, DollarSign, LogOut, Target, Trophy, Crown } from 'lucide-react'
import { useSubscription } from '../hooks/useSubscription'

const navItemsAluno = [
  { path: '/', label: 'Início', icon: Home },
  { path: '/treinos', label: 'Meus Treinos', icon: Dumbbell },
  { path: '/exercicios', label: 'Exercícios', icon: Target },
  { path: '/conquistas', label: 'Conquistas', icon: Trophy },
  { path: '/planos', label: 'Planos', icon: Crown },
  { path: '/chat', label: 'Chat', icon: MessageCircle },
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
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function SidebarAluno({ isOpen, onClose }: SidebarProps) {
  const { user, signOut, role } = useAuth()
  const { isPremium } = useSubscription()
  const navItems = role === 'personal' ? navItemsPersonal : navItemsAluno
  
  const userName = user?.email?.split('@')[0] || 'Usuário'
  const userInitial = userName.charAt(0).toUpperCase()

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <Dumbbell size={28} className="brand-icon" />
        <span className="brand-text">VSFit Gym</span>
      </div>

      <div className="sidebar-profile">
        <div className="profile-avatar">
          {userInitial}
        </div>
        <div className="profile-info">
          <div className="profile-name-row">
            <span className="profile-name">{userName}</span>
            {isPremium && (
              <span className="premium-badge" title="Premium">
                <Crown size={12} />
              </span>
            )}
          </div>
          <span className="profile-role">
            {role === 'personal' ? 'Personal Trainer' : 'Aluno'}
          </span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <span className="nav-section-title">Menu</span>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
              end={item.path === '/'}
            >
              <item.icon className="nav-icon" size={20} />
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={signOut}>
          <LogOut className="logout-icon" size={18} />
          <span>Sair da conta</span>
        </button>
        <div className="sidebar-copyright">
          © 2026 VSFit Gym
        </div>
      </div>
    </aside>
  )
}

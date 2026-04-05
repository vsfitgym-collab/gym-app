import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Home, Dumbbell, MessageCircle, Users, Target, Trophy, Crown } from 'lucide-react'

const navItemsAluno = [
  { path: '/', label: 'Início', icon: Home },
  { path: '/treinos', label: 'Treinos', icon: Dumbbell },
  { path: '/exercicios', label: 'Exercícios', icon: Target },
  { path: '/conquistas', label: 'Conquistas', icon: Trophy },
  { path: '/planos', label: 'Planos', icon: Crown },
  { path: '/chat', label: 'Chat', icon: MessageCircle },
]

const navItemsPersonal = [
  { path: '/', label: 'Início', icon: Home },
  { path: '/alunos', label: 'Alunos', icon: Users },
  { path: '/treinos', label: 'Treinos', icon: Dumbbell },
  { path: '/exercicios', label: 'Exercícios', icon: Target },
  { path: '/conquistas', label: 'Conquistas', icon: Trophy },
  { path: '/planos', label: 'Planos', icon: Crown },
  { path: '/chat', label: 'Chat', icon: MessageCircle },
]

export default function MobileNav() {
  const { role } = useAuth()
  const navItems = role === 'personal' ? navItemsPersonal : navItemsAluno

  return (
    <nav className="mobile-nav">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
          end={item.path === '/'}
        >
          <item.icon className="mobile-nav-icon" size={22} />
          <span className="mobile-nav-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
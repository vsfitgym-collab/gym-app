import { NavLink } from 'react-router-dom'
import { Home, Users, Dumbbell, MessageCircle, DollarSign, Target, Trophy, Crown } from 'lucide-react'

const navItemsPersonal = [
  { path: '/', label: 'Início', icon: Home },
  { path: '/alunos', label: 'Alunos', icon: Users },
  { path: '/treinos', label: 'Treinos', icon: Dumbbell },
  { path: '/exercicios', label: 'Exercíc', icon: Target },
  { path: '/conquistas', label: 'Conquistas', icon: Trophy },
  { path: '/chat', label: 'Chat', icon: MessageCircle },
]

const navItemsPersonalSecondary = [
  { path: '/planos', label: 'Planos', icon: Crown },
  { path: '/financeiro', label: 'Financ', icon: DollarSign },
]

export default function MobileNavPersonal() {
  return (
    <nav className="mobile-nav">
      {navItemsPersonal.map((item) => (
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
      {navItemsPersonalSecondary.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        >
          <item.icon className="mobile-nav-icon" size={22} />
          <span className="mobile-nav-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
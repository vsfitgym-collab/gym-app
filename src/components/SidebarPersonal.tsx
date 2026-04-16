import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/alunos', label: 'Alunos', icon: '👥' },
  { path: '/treinos', label: 'Treinos', icon: '💪' },
  { path: '/exercicios', label: 'Exercícios', icon: '🏋️' },
  { path: '/conquistas', label: 'Conquistas', icon: '🏆' },
  { path: '/planos', label: 'Planos', icon: '📋' },
  { path: '/pagamentos', label: 'Pagamentos', icon: '💳' },
  { path: '/chat', label: 'Chat', icon: '💬' },
  { path: '/financeiro', label: 'Financeiro', icon: '💰' },
]

export default function SidebarPersonal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)
  
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
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <h1>VSFit</h1>
        <span className="user-role personal">Personal</span>
      </div>
      <div className="sidebar-user">
        <span className="user-name">{user?.email?.split('@')[0] || 'Personal'}</span>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
            end={item.path === '/'}
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button 
          className="logout-btn" 
          onClick={handleLogout}
          disabled={loggingOut}
        >
          <span>🚪</span> {loggingOut ? 'Saindo...' : 'Sair'}
        </button>
      </div>
    </aside>
  )
}
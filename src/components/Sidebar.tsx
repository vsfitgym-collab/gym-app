import { NavLink } from 'react-router-dom'

const navItems = [
  { path: '/', label: 'Início', icon: '🏠' },
  { path: '/alunos', label: 'Alunos', icon: '👥' },
  { path: '/treinos', label: 'Treinos', icon: '💪' },
  { path: '/financeiro', label: 'Financeiro', icon: '💰' },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <h1>Gym App</h1>
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
    </aside>
  )
}
import { useAuth } from '../context/AuthContext'
import NotificationSettings from './NotificationSettings'

interface HeaderProps {
  title: string
  onMenuToggle?: () => void
  showMenuButton?: boolean
}

export default function Header({ title, onMenuToggle, showMenuButton }: HeaderProps) {
  const { signOut } = useAuth()
  
  return (
    <header className="header">
      {showMenuButton && (
        <button className="menu-toggle" onClick={onMenuToggle}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>
      )}
      <div className="header-title">
        <h2>{title}</h2>
      </div>
      <div className="header-actions">
        <NotificationSettings />
        <button className="logout-header" onClick={signOut} title="Sair">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
        </button>
      </div>
    </header>
  )
}

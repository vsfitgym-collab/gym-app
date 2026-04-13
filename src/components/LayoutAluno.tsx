import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import SidebarAluno from './SidebarAluno'
import Header from './Header'
import MobileNav from './MobileNav'
import { usePermissions } from '../context/PermissionsContext'
import TrialExpiredModal from './TrialExpiredModal'

const pageTitles: Record<string, string> = {
  '/': 'Início',
  '/treinos': 'Meus Treinos',
  '/exercicios': 'Exercícios',
  '/conquistas': 'Conquistas',
  '/exercicios/editar': 'Editar Exercício',
  '/planos': 'Planos',
  '/chat': 'Chat',
}

export default function LayoutAluno() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { status, loading } = usePermissions()
  const location = useLocation()
  
  const title = pageTitles[location.pathname] || 'Página'
  const isExpired = status === 'expirada'
  const isPlanPage = location.pathname === '/planos'

  return (
    <div className={`layout ${isExpired && !isPlanPage ? 'overflow-hidden max-h-screen' : ''}`}>
      <SidebarAluno isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className={`content transition-all duration-500 ${isExpired && !isPlanPage ? 'blur-md pointer-events-none select-none opacity-60' : ''}`}>
        <Header 
          title={title} 
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          showMenuButton={true}
        />
        <div className="page-content">
          <Outlet />
        </div>
        {!isExpired && <MobileNav />}
      </main>

      {isExpired && !isPlanPage && <TrialExpiredModal />}
    </div>
  )
}

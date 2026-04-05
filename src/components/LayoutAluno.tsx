import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import SidebarAluno from './SidebarAluno'
import Header from './Header'
import MobileNav from './MobileNav'

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
  const location = useLocation()
  const title = pageTitles[location.pathname] || 'Página'

  return (
    <div className="layout">
      <SidebarAluno isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="content">
        <Header 
          title={title} 
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          showMenuButton={true}
        />
        <div className="page-content">
          <Outlet />
        </div>
        <MobileNav />
      </main>
    </div>
  )
}

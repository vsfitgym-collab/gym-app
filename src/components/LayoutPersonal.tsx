import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import SidebarAluno from './SidebarAluno'
import Header from './Header'
import MobileNavPersonal from './MobileNavPersonal'

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/alunos': 'Alunos',
  '/treinos': 'Treinos',
  '/exercicios': 'Exercícios',
  '/conquistas': 'Conquistas',
  '/exercicios/editar': 'Editar Exercício',
  '/planos': 'Planos',
  '/pagamentos': 'Pagamentos Pendentes',
  '/chat': 'Chat',
  '/financeiro': 'Financeiro',
}

export default function LayoutPersonal() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const title = pageTitles[location.pathname] || 'Página'
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1025)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div className="layout">
      {!isMobile && <SidebarAluno isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
      <main className="content">
        <Header 
          title={title} 
          onMenuToggle={() => !isMobile && setSidebarOpen(!sidebarOpen)}
          showMenuButton={!isMobile}
        />
        <div className="page-content">
          <Outlet />
        </div>
        <MobileNavPersonal />
      </main>
    </div>
  )
}

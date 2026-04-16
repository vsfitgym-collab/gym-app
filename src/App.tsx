import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LayoutAluno from './components/LayoutAluno'
import LayoutPersonal from './components/LayoutPersonal'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import { initNotifications } from './lib/notificationManager'
import './styles/theme.css'
import './index.css'
import { lazy, Suspense } from 'react'
import type { ReactNode } from 'react'

initNotifications()

const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const DashboardPersonalPage = lazy(() => import('./pages/DashboardPersonalPage'))
const AlunosPage = lazy(() => import('./pages/AlunosPage'))
const TreinosPage = lazy(() => import('./pages/TreinosPage'))
const TreinoPage = lazy(() => import('./pages/TreinoPage'))
const TreinoDetalhesPage = lazy(() => import('./pages/TreinoDetalhesPage'))
const CriarTreinoPage = lazy(() => import('./pages/CriarTreinoPage'))
const ExercisesPage = lazy(() => import('./pages/ExercisesPage'))
const EditarExercicioPage = lazy(() => import('./pages/EditarExercicioPage'))
const ConquistasPage = lazy(() => import('./pages/ConquistasPage'))
const ChatPage = lazy(() => import('./pages/ChatPage'))
const FinanceiroPage = lazy(() => import('./pages/FinanceiroPage'))
const PlanosPage = lazy(() => import('./pages/PlanosPage'))
const PagamentosPage = lazy(() => import('./pages/PagamentosPage'))
const CriarPlanoPage = lazy(() => import('./pages/planos/CriarPlanoPage'))
const EditarPlanoPage = lazy(() => import('./pages/planos/EditarPlanoPage'))
const ConquistasAlunoPage = lazy(() => import('./pages/ConquistasAlunoPage'))
const CriarConquistaPage = lazy(() => import('./pages/CriarConquistaPage'))

function LoadingScreen() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      backgroundColor: '#0a0a0f',
      color: '#fff'
    }}>
      <div style={{ fontSize: '3rem' }}>🏋️</div>
      <div style={{ color: '#a0a0b0', marginTop: '1rem' }}>Carregando...</div>
    </div>
  )
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <LoadingScreen />
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

function AppRoutes() {
  const { role } = useAuth()
  
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<RegisterPage />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            {role === 'personal' ? <LayoutPersonal /> : <LayoutAluno />}
          </ProtectedRoute>
        }>
          <Route index element={role === 'personal' ? <DashboardPersonalPage /> : <DashboardPage />} />
          
          {/* Rotas Only Personal */}
          <Route path="alunos" element={role === 'personal' ? <AlunosPage /> : <Navigate to="/" replace />} />
          <Route path="financeiro" element={role === 'personal' ? <FinanceiroPage /> : <Navigate to="/" replace />} />
          <Route path="pagamentos" element={role === 'personal' ? <PagamentosPage /> : <Navigate to="/" replace />} />
          <Route path="treinos/criar" element={role === 'personal' ? <CriarTreinoPage /> : <Navigate to="/" replace />} />
          <Route path="treinos/editar/:id" element={role === 'personal' ? <CriarTreinoPage /> : <Navigate to="/" replace />} />
          <Route path="exercicios/editar/:id" element={role === 'personal' ? <EditarExercicioPage /> : <Navigate to="/" replace />} />
          <Route path="planos/criar" element={role === 'personal' ? <CriarPlanoPage /> : <Navigate to="/" replace />} />
          <Route path="planos/editar/:id" element={role === 'personal' ? <EditarPlanoPage /> : <Navigate to="/" replace />} />
          
          {/* Rotas para Todos */}
          <Route path="treinos" element={<TreinosPage />} />
          <Route path="treinos/:id" element={<TreinoDetalhesPage />} />
          <Route path="treinos/executar/:id" element={<TreinoPage />} />
          <Route path="planos" element={<PlanosPage />} />
          <Route path="exercicios" element={<ExercisesPage />} />
          <Route path="conquistas" element={<ConquistasPage />} />
          <Route path="conquistas/aluno/:id" element={role === 'personal' ? <ConquistasAlunoPage /> : <Navigate to="/" replace />} />
          <Route path="conquistas/criar" element={role === 'personal' ? <CriarConquistaPage /> : <Navigate to="/" replace />} />
          <Route path="chat" element={<ChatPage />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0f' }}>
        <AppRoutes />
      </div>
    </BrowserRouter>
  )
}
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
const AlunosPage = lazy(() => import('./pages/AlunosPage'))
const TreinosPage = lazy(() => import('./pages/TreinosPage'))
const TreinoPage = lazy(() => import('./pages/TreinoPage'))
const CriarTreinoPage = lazy(() => import('./pages/CriarTreinoPage'))
const ExercisesPage = lazy(() => import('./pages/ExercisesPage'))
const EditarExercicioPage = lazy(() => import('./pages/EditarExercicioPage'))
const ConquistasPage = lazy(() => import('./pages/ConquistasPage'))
const ChatPage = lazy(() => import('./pages/ChatPage'))
const FinanceiroPage = lazy(() => import('./pages/FinanceiroPage'))
const PlanosPage = lazy(() => import('./pages/PlanosPage'))
const PendingPaymentsPage = lazy(() => import('./pages/PendingPaymentsPage'))

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
          <Route index element={<DashboardPage />} />
          
          {/* Rotas Only Personal */}
          {role === 'personal' && (
            <>
              <Route path="alunos" element={<AlunosPage />} />
              <Route path="financeiro" element={<FinanceiroPage />} />
              <Route path="pagamentos" element={<PendingPaymentsPage />} />
              <Route path="treinos/criar" element={<CriarTreinoPage />} />
              <Route path="treinos/editar/:id" element={<CriarTreinoPage />} />
              <Route path="exercicios/editar/:id" element={<EditarExercicioPage />} />
            </>
          )}
          
          {/* Rotas para Todos */}
          <Route path="treinos" element={<TreinosPage />} />
          <Route path="treinos/executar/:id" element={<TreinoPage />} />
          <Route path="planos" element={<PlanosPage />} />
          <Route path="exercicios" element={<ExercisesPage />} />
          <Route path="conquistas" element={<ConquistasPage />} />
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
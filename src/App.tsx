import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LayoutAluno from './components/LayoutAluno'
import LayoutPersonal from './components/LayoutPersonal'
import DashboardPage from './pages/DashboardPage'
import AlunosPage from './pages/AlunosPage'
import TreinosPage from './pages/TreinosPage'
import TreinoPage from './pages/TreinoPage'
import CriarTreinoPage from './pages/CriarTreinoPage'
import ExercisesPage from './pages/ExercisesPage'
import EditarExercicioPage from './pages/EditarExercicioPage'
import ConquistasPage from './pages/ConquistasPage'
import ChatPage from './pages/ChatPage'
import FinanceiroPage from './pages/FinanceiroPage'
import PlanosPage from './pages/PlanosPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import { initNotifications } from './lib/notificationManager'
import './styles/theme.css'
import './index.css'

initNotifications()

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen flex-col gap-4">
      <div style={{ fontSize: '3rem' }}>🏋️</div>
      <div className="text-secondary">Carregando...</div>
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { role } = useAuth()
  
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<RegisterPage />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          {role === 'personal' ? <LayoutPersonal /> : <LayoutAluno />}
        </ProtectedRoute>
      }>
        <Route index element={<DashboardPage />} />
        {role === 'personal' && (
          <>
            <Route path="alunos" element={<AlunosPage />} />
            <Route path="financeiro" element={<FinanceiroPage />} />
          </>
        )}
        <Route path="treinos" element={<TreinosPage />} />
        <Route path="treinos/criar" element={<CriarTreinoPage />} />
        <Route path="treinos/editar/:id" element={<CriarTreinoPage />} />
        <Route path="treinos/executar/:id" element={<TreinoPage />} />
        <Route path="planos" element={<PlanosPage />} />
        <Route path="exercicios" element={<ExercisesPage />} />
        <Route path="exercicios/editar/:id" element={<EditarExercicioPage />} />
        <Route path="conquistas" element={<ConquistasPage />} />
        <Route path="chat" element={<ChatPage />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
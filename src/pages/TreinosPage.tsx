import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSubscription } from '../hooks/useSubscription'
import { supabase } from '../lib/supabase'
import { checkWorkoutLimit, showLimitToast } from '../lib/planLimits'
import { Dumbbell, FileText, Clock, TrendingUp, Plus, Play, Edit2, ChevronRight } from 'lucide-react'
import { type Workout, getLevelColor, getLevelLabel } from '../data/workoutsData'
import { SkeletonList } from '../components/ui/Skeleton'
import DataStateHandler, { type DataState } from '../components/DataStateHandler'
import './Treinos.css'

interface WorkoutCardProps {
  treino: Workout
  index: number
  role: string
  progress: number
  onCardClick: (id: string) => void
  onActionClick: (e: React.MouseEvent, id: string) => void
}

function WorkoutCard({ treino, index, role, progress, onCardClick, onActionClick }: WorkoutCardProps) {
  const navigate = useNavigate()
  return (
    <div 
      className={`treino-card flex flex-col p-5 h-full transition-all duration-300 hover:scale-[1.02] ${role !== 'personal' ? 'clickable' : ''}`}
      style={{ animationDelay: `${index * 0.06}s` }}
      onClick={() => onCardClick(treino.id)}
    >
      <div className="card-top">
        <div className="card-icon-circle">
          <Dumbbell size={20} />
        </div>
        <span 
          className="level-badge"
          style={{ 
            background: `${getLevelColor(treino.level)}18`,
            color: getLevelColor(treino.level),
            borderColor: `${getLevelColor(treino.level)}30`
          }}
        >
          {getLevelLabel(treino.level)}
        </span>
      </div>

      <div className="card-body">
        <h3 className="card-title">{treino.name}</h3>
        
        {treino.description && (
          <p className="card-description">{treino.description}</p>
        )}

        <div className="card-meta">
          <div className="meta-item">
            <FileText size={13} />
            <span>{treino.exercises_count} exercícios</span>
          </div>
          <div className="meta-item">
            <Clock size={13} />
            <span>{treino.duration_minutes} min</span>
          </div>
        </div>

        {role !== 'personal' && (
          <div className="card-progress">
            <div className="progress-track">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="progress-info">
              <TrendingUp size={12} />
              <span>{progress}%</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto pt-4 flex items-center justify-end gap-2">
        {role === 'personal' && (
          <button 
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-300 hover:scale-105 text-white"
            onClick={(e) => { 
                e.stopPropagation()
                navigate(`/treinos/editar/${treino.id}`) 
            }}
            title="Editar Treino"
          >
            <Edit2 size={16} />
          </button>
        )}
        <button 
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-300 hover:scale-105 text-white"
          onClick={(e) => { 
              e.stopPropagation()
              navigate(`/treinos/${treino.id}`) 
          }}
          title="Ver Treino"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

export default function TreinosPage() {
  const navigate = useNavigate()
  const { user, role } = useAuth()
  const { isPremium, limits } = useSubscription()
  const [treinos, setTreinos] = useState<Workout[]>([])
  const treinoCount = treinos.length
  const [dataState, setDataState] = useState<DataState>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [workoutProgress] = useState<Record<string, number>>(() => {
    const prog: Record<string, number> = {}
    for (let i = 0; i < 10; i++) {
      prog[String(i)] = Math.floor(Math.random() * 40 + 60)
    }
    return prog
  })

  useEffect(() => {
    if (!user) {
      return
    }
    carregarTreinos()
  }, [user])

  const carregarTreinos = async () => {
    try {
      setDataState('loading')
      setErrorMessage(null)
      
      console.log('TreinosPage: Carregando treinos para user:', user?.id)
      
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .order('created_at', { ascending: false })

      console.log('TreinosPage: Data:', data, 'Error:', error)

      if (error) {
        console.error('TreinosPage: Erro ao carregar workouts:', error)
        setErrorMessage(error.message)
        setDataState('error')
        return
      }

      if (!data || data.length === 0) {
        console.log('TreinosPage: Nenhum treino encontrado')
        setTreinos([])
        setDataState('empty')
        return
      }
      
      const workoutsWithCount = await Promise.all(
        data.map(async (treino) => {
          const { count } = await supabase
            .from('workout_plans')
            .select('*', { count: 'exact', head: true })
            .eq('workout_id', treino.id)
          
          return { 
            id: treino.id,
            name: treino.name,
            description: treino.description || '',
            duration_minutes: treino.duration_minutes || 45,
            exercises_count: count || 0,
            level: 'intermediario' as const,
            icon: '💪'
          }
        })
      )
      
      setTreinos(workoutsWithCount)
      console.log('Treinos carregados:', workoutsWithCount.length)
      setDataState('success')
    } catch (err: any) {
      console.error('Erro ao carregar treinos:', err)
      setErrorMessage(err.message || 'Erro ao carregar treinos')
      setDataState('error')
    }
  }

  const handleCardClick = (treinoId: string) => {
    if (role === 'personal') {
      navigate(`/treinos/editar/${treinoId}`)
    } else {
      navigate(`/treinos/executar/${treinoId}`)
    }
  }

  const handleActionClick = (e: React.MouseEvent, treinoId: string) => {
    e.stopPropagation()
    if (role === 'personal') {
      navigate(`/treinos/editar/${treinoId}`)
    } else {
      navigate(`/treinos/executar/${treinoId}`)
    }
  }

  const handleRetry = () => {
    carregarTreinos()
  }

  return (
    <div className="treinos-page">
      <div className="treinos-header">
        <div className="header-content">
          <h1 className="page-title">Meus Treinos</h1>
          <span className="page-subtitle">
            {dataState === 'success' ? `${treinos.length} treinos disponíveis` : ''}
          </span>
        </div>
        {role === 'personal' && dataState !== 'loading' && dataState !== 'error' && (
          <button 
            className="flex items-center gap-2 h-11 px-5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium transition-all duration-300 hover:scale-[1.03] border-none shadow-lg shadow-purple-500/20"
            onClick={() => navigate('/treinos/criar')}
          >
            <Plus size={18} />
            <span>Novo Treino</span>
          </button>
        )}
      </div>

      <DataStateHandler
        state={dataState}
        loadingComponent={<SkeletonList count={4} />}
        errorMessage={errorMessage || 'Erro ao carregar treinos'}
        errorAction={{ label: 'Tentar novamente', onClick: handleRetry }}
        emptyTitle="Nenhum treino encontrado"
        emptyMessage="Crie seu primeiro treino para começar"
        emptyAction={role === 'personal' ? { label: 'Criar Treino', onClick: () => navigate('/treinos/criar') } : undefined}
      >
        {treinos.length > 0 && (
          <div className="treinos-grid">
            {treinos.map((treino, index) => (
              <WorkoutCard
                key={treino.id}
                treino={treino}
                index={index}
                role={role}
                progress={workoutProgress[String(index)] || 0}
                onCardClick={handleCardClick}
                onActionClick={handleActionClick}
              />
            ))}
          </div>
        )}
      </DataStateHandler>
    </div>
  )
}

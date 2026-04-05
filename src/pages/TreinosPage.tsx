import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Dumbbell, Clock, FileText, Plus, Play, Edit2, ChevronRight, TrendingUp } from 'lucide-react'
import { workouts as workoutsData, type Workout, getLevelColor, getLevelLabel } from '../data/workoutsData'
import { SkeletonList } from '../components/ui/Skeleton'
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
  return (
    <div 
      className={`treino-card ${role !== 'personal' ? 'clickable' : ''}`}
      style={{ animationDelay: `${index * 0.06}s` }}
      onClick={() => onCardClick(treino.id)}
    >
      {/* Card Header */}
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

      {/* Card Body */}
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

        {/* Progress Bar (Alunos only) */}
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

      {/* CTA Button */}
      <button 
        className={`card-cta ${role === 'personal' ? 'edit' : 'start'}`}
        onClick={(e) => onActionClick(e, treino.id)}
      >
        {role === 'personal' ? (
          <>
            <Edit2 size={16} />
            <span>Editar</span>
          </>
        ) : (
          <>
            <Play size={14} />
            <span>Iniciar treino</span>
          </>
        )}
        <ChevronRight size={16} className="cta-arrow" />
      </button>
    </div>
  )
}

export default function TreinosPage() {
  const navigate = useNavigate()
  const { role } = useAuth()
  const [treinos, setTreinos] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [workoutProgress] = useState<Record<string, number>>(() => {
    const prog: Record<string, number> = {}
    workoutsData.forEach((_, i) => {
      prog[String(i)] = Math.floor(Math.random() * 40 + 60)
    })
    return prog
  })

  useEffect(() => {
    carregarTreinos()
  }, [])

  const carregarTreinos = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Carregando treinos...')
      
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .order('created_at', { ascending: false })

      console.log('Workouts data:', data, 'Error:', error)

      if (error) {
        console.error('Erro ao carregar workouts:', error)
        setError(error.message)
        setTreinos(workoutsData)
        return
      }

      if (!data || data.length === 0) {
        console.log('Nenhum treino encontrado, usando dados locais')
        setTreinos(workoutsData)
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
    } catch (err) {
      console.error('Erro ao carregar treinos:', err)
      setError('Erro ao carregar treinos')
      setTreinos(workoutsData)
    } finally {
      setLoading(false)
    }
  }

  const handleCardClick = (treinoId: string) => {
    if (role !== 'personal') {
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

  return (
    <div className="treinos-page">
      {/* Header */}
      <div className="treinos-header">
        <div className="header-content">
          <h1 className="page-title">Meus Treinos</h1>
          <span className="page-subtitle">{treinos.length} treinos disponíveis</span>
        </div>
        {role === 'personal' && (
          <button className="btn-novo" onClick={() => navigate('/treinos/criar')}>
            <Plus size={18} />
            <span>Novo Treino</span>
          </button>
        )}
      </div>

      {/* Loading / Empty / List */}
      {loading ? (
        <SkeletonList count={4} />
      ) : error ? (
        <div className="treinos-empty">
          <div className="empty-icon-wrapper">
            <Dumbbell size={48} />
          </div>
          <h3>Erro ao carregar</h3>
          <span>{error}</span>
        </div>
      ) : treinos.length === 0 ? (
        <div className="treinos-empty">
          <div className="empty-icon-wrapper">
            <Dumbbell size={48} />
          </div>
          <h3>Nenhum treino encontrado</h3>
          <span>Crie seu primeiro treino para começar sua jornada fitness</span>
          {role === 'personal' && (
            <button className="btn-criar" onClick={() => navigate('/treinos/criar')}>
              <Plus size={18} />
              Criar Treino
            </button>
          )}
        </div>
      ) : (
        <div className="treinos-list">
          {treinos.map((treino, index) => (
            <WorkoutCard
              key={treino.id}
              treino={treino}
              index={index}
              role={role || 'aluno'}
              progress={workoutProgress[treino.id] || Math.floor(Math.random() * 40 + 60)}
              onCardClick={handleCardClick}
              onActionClick={handleActionClick}
            />
          ))}
        </div>
      )}
    </div>
  )
}

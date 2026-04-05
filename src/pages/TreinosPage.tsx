import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Dumbbell, Clock, FileText, Plus, TrendingUp, ChevronRight, Edit2, Play } from 'lucide-react'
import { workouts as workoutsData, type Workout, getLevelColor, getLevelLabel } from '../data/workoutsData'
import { SkeletonList } from '../components/ui/Skeleton'
import './Treinos.css'

export default function TreinosPage() {
  const navigate = useNavigate()
  const { role } = useAuth()
  const [treinos, setTreinos] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    carregarTreinos()
  }, [])

  const carregarTreinos = async () => {
    try {
      setProgress(20)
      
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .order('created_at', { ascending: false })

      setProgress(40)

      if (error) {
        setTreinos(workoutsData)
        setProgress(100)
        setLoading(false)
        return
      }

      if (!data || data.length === 0) {
        setTreinos(workoutsData)
        setProgress(100)
        setLoading(false)
        return
      }
      
      setProgress(60)
      
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
            level: (treino.level as Workout['level']) || 'intermediario',
            icon: '💪'
          }
        })
      )
      
      setProgress(90)
      setTreinos(workoutsWithCount)
      setProgress(100)
    } catch (error) {
      setTreinos(workoutsData)
      setProgress(100)
    } finally {
      setTimeout(() => setLoading(false), 300)
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
      <div className="treinos-header">
        <div className="treinos-title">
          <h3>Meus Treinos</h3>
          <span className="treinos-count">{treinos.length} treinos</span>
        </div>
        {role === 'personal' && (
          <button className="btn-novo" onClick={() => navigate('/treinos/criar')}>
            <Plus size={18} />
            <span>Novo Treino</span>
          </button>
        )}
      </div>

      {loading ? (
        <>
          <div className="loading-progress">
            <div 
              className="loading-progress-bar" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <SkeletonList count={4} />
        </>
      ) : treinos.length === 0 ? (
        <div className="treinos-empty">
          <div className="empty-illustration">
            <Dumbbell size={64} />
          </div>
          <p>Nenhum treino encontrado</p>
          <span>Crie seu primeiro treino para começar sua jornada fitness</span>
          {role === 'personal' && (
            <button className="btn-criar" onClick={() => navigate('/treinos/criar')}>
              <Plus size={18} />
              Criar Treino
            </button>
          )}
        </div>
      ) : (
        <div className="treinos-grid">
          {treinos.map((treino, index) => (
            <div 
              key={treino.id} 
              className={`treino-card ${role !== 'personal' ? 'clickable' : ''}`}
              style={{ animationDelay: `${index * 0.05}s` }}
              onClick={() => handleCardClick(treino.id)}
            >
              <div className="treino-card-content">
                <div className="treino-card-header">
                  <div className="treino-icon-wrapper">
                    <Dumbbell size={24} />
                  </div>
                </div>

                <div className="treino-card-body">
                  <h4 className="treino-name">{treino.name}</h4>
                  <span 
                    className="treino-level"
                    style={{ background: getLevelColor(treino.level) }}
                  >
                    {getLevelLabel(treino.level)}
                  </span>
                </div>

                {treino.description && (
                  <p className="treino-description">{treino.description}</p>
                )}

                <div className="treino-card-meta">
                  <div className="treino-meta-item">
                    <FileText size={14} />
                    <span>{treino.exercises_count} exercícios</span>
                  </div>
                  <div className="treino-meta-item">
                    <Clock size={14} />
                    <span>{treino.duration_minutes} min</span>
                  </div>
                </div>

                {role !== 'personal' && (
                  <div className="treino-progress">
                    <div className="treino-progress-bar">
                      <div 
                        className="treino-progress-fill" 
                        style={{ width: `${Math.random() * 60 + 20}%` }}
                      />
                    </div>
                    <span className="treino-progress-text">
                      <TrendingUp size={12} />
                      {Math.floor(Math.random() * 40 + 60)}%
                    </span>
                  </div>
                )}
              </div>

              <button 
                className={`treino-card-action ${role === 'personal' ? 'edit' : 'start'}`}
                onClick={(e) => handleActionClick(e, treino.id)}
              >
                {role === 'personal' ? (
                  <>
                    <Edit2 size={16} />
                    <span>Editar treino</span>
                  </>
                ) : (
                  <>
                    <Play size={14} />
                    <span>Iniciar treino</span>
                  </>
                )}
                <ChevronRight size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

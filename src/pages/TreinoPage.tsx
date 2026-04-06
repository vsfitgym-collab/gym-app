import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Play, SkipForward, RotateCcw, CheckCircle, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { workouts as localWorkouts } from '../data/workoutsData'
import { useAuth } from '../context/AuthContext'
import {
  createSession,
  updateSessionProgress,
  completeSession,
  abandonSession,
  saveCompletedSet,
  getActiveSession,
} from '../lib/workoutSessionManager'
import PresenceCheckIn from '../components/PresenceCheckIn'
import './Treino.css'

interface Exercicio {
  id: string
  nome: string
  muscle_group: string
  gif_url: string | null
  sets: number
  reps: string
  rest_seconds: number
}

export default function TreinoPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()
  const [exercicios, setExercicios] = useState<Exercicio[]>([])
  const [loading, setLoading] = useState(true)
  const [exercicioAtual, setExercicioAtual] = useState(0)
  const [serieAtual, setSerieAtual] = useState(1)
  const [treinoConcluido, setTreinoConcluido] = useState(false)
  const [descansoAtivo, setDescansoAtivo] = useState(false)
  const [tempoRestante, setTempoRestante] = useState(0)
  const [mostrarProximo, setMostrarProximo] = useState(false)
  const [treinoNome, setTreinoNome] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [savedIndicator, setSavedIndicator] = useState(false)
  const [isPersonal, setIsPersonal] = useState(false)
  const timerRef = useRef<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const checkRole = async () => {
      if (!user) {
        setIsPersonal(false)
        return
      }
      try {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        setIsPersonal(data?.role === 'personal')
      } catch {
        setIsPersonal(false)
      }
    }
    checkRole()
  }, [user])

  useEffect(() => {
    if (user) {
      carregarTreino()
    } else {
      setLoading(false)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [id, user])

  const carregarTreino = async () => {
    if (!id) {
      navigate('/treinos')
      return
    }

    const foundWorkout = localWorkouts.find(w => w.id === id)
    
    if (foundWorkout) {
      setTreinoNome(foundWorkout.name)
      const exerciciosLocal: Exercicio[] = [
        { id: '1', nome: 'Supino Reto', muscle_group: 'Peito', gif_url: null, sets: foundWorkout.exercises_count > 0 ? 4 : 3, reps: '10-12', rest_seconds: 90 },
        { id: '2', nome: 'Puxada Vertical', muscle_group: 'Costas', gif_url: null, sets: 3, reps: '10-12', rest_seconds: 60 },
        { id: '3', nome: 'Agachamento', muscle_group: 'Perna', gif_url: null, sets: 4, reps: '12-15', rest_seconds: 120 },
        { id: '4', nome: 'Desenvolvimento', muscle_group: 'Ombro', gif_url: null, sets: 3, reps: '10-12', rest_seconds: 60 },
      ].slice(0, foundWorkout.exercises_count || 4)
      
      setExercicios(exerciciosLocal)
      setLoading(false)
      
      if (user) {
        const activeSession = await getActiveSession(user.id, id)
        if (activeSession) {
          setSessionId(activeSession.id)
          setExercicioAtual(activeSession.current_exercise_index)
          setSerieAtual(activeSession.current_set)
        }
      }
      return
    }

    try {
      const { data: treinoData, error: treinoError } = await supabase
        .from('workouts')
        .select('*')
        .eq('id', id)
        .single()

      if (treinoError || !treinoData) {
        navigate('/treinos')
        return
      }

      setTreinoNome(treinoData.name)

      const { data: exerciciosData } = await supabase
        .from('workout_plans')
        .select(`
          id,
          sets,
          reps,
          rest_seconds,
          order_index,
          exercises:exercise_id (
            id,
            name,
            muscle_group,
            gif_url
          )
        `)
        .eq('workout_id', id)
        .order('order_index', { ascending: true })

      const formattedExercicios = (exerciciosData || []).map((wp: any) => ({
        id: wp.exercises?.id || wp.id,
        nome: wp.exercises?.name || '',
        muscle_group: wp.exercises?.muscle_group || 'Geral',
        gif_url: wp.exercises?.gif_url || null,
        sets: wp.sets || 3,
        reps: wp.reps || '10-12',
        rest_seconds: wp.rest_seconds || 60
      }))

      if (formattedExercicios.length === 0) {
        const exerciciosLocal: Exercicio[] = [
          { id: '1', nome: 'Supino Reto', muscle_group: 'Peito', gif_url: null, sets: 4, reps: '10-12', rest_seconds: 90 },
          { id: '2', nome: 'Puxada Vertical', muscle_group: 'Costas', gif_url: null, sets: 3, reps: '10-12', rest_seconds: 60 },
        ]
        setExercicios(exerciciosLocal)
      } else {
        setExercicios(formattedExercicios)
      }

      if (user) {
        const activeSession = await getActiveSession(user.id, id)
        if (activeSession) {
          setSessionId(activeSession.id)
          setExercicioAtual(activeSession.current_exercise_index)
          setSerieAtual(activeSession.current_set)
        }
      }
    } catch {
      navigate('/treinos')
    } finally {
      setLoading(false)
    }
  }

  const exercicio = exercicios[exercicioAtual]
  const isUltimaSerie = serieAtual >= (exercicio?.sets || 1)
  const isUltimoExercicio = exercicioAtual >= exercicios.length - 1

  const totalSeries = exercicios.reduce((acc, ex) => acc + ex.sets, 0)
  const seriesConcluidas = exercicios
    .slice(0, exercicioAtual)
    .reduce((acc, ex) => acc + ex.sets, 0)
  const progressoPercentual = totalSeries > 0 
    ? Math.round(((seriesConcluidas + (serieAtual - 1)) / totalSeries) * 100) 
    : 0

  const autoSaveProgress = useCallback((exerciseIndex: number, setNumber: number) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    
    saveTimeoutRef.current = setTimeout(async () => {
      if (!sessionId || !user) return
      await Promise.all([
        updateSessionProgress(sessionId, exerciseIndex, setNumber),
        saveCompletedSet({
          session_id: sessionId,
          exercise_id: exercicios[exerciseIndex]?.id || '',
          set_number: setNumber,
          reps_completed: parseInt(exercicios[exerciseIndex]?.reps?.split('-')[0] || '0'),
        }),
      ])
      
      setSavedIndicator(true)
      setTimeout(() => setSavedIndicator(false), 2000)
    }, 1000)
  }, [sessionId, user, exercicios])

  const ensureSession = useCallback(async () => {
    if (sessionId || !user || !id) return sessionId
    
    const newSession = await createSession(user.id, id)
    if (newSession) {
      setSessionId(newSession.id)
      return newSession.id
    }
    return null
  }, [sessionId, user, id])

  const tocarSom = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {})
    }
  }, [])

  const iniciarDescanso = useCallback((duracao: number) => {
    setTempoRestante(duracao)
    setDescansoAtivo(true)
    setMostrarProximo(false)
    
    if (timerRef.current) clearInterval(timerRef.current)
    
    timerRef.current = window.setInterval(() => {
      setTempoRestante((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          setDescansoAtivo(false)
          tocarSom()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [tocarSom])

  const pularDescanso = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setDescansoAtivo(false)
    setTempoRestante(0)
    setMostrarProximo(true)
  }

  const proximoPasso = async () => {
    setMostrarProximo(false)
    if (!isUltimaSerie) {
      const nextSet = serieAtual + 1
      setSerieAtual(nextSet)
      await ensureSession()
      autoSaveProgress(exercicioAtual, nextSet)
    } else {
      if (!isUltimoExercicio) {
        const nextExercise = exercicioAtual + 1
        setExercicioAtual(nextExercise)
        setSerieAtual(1)
        await ensureSession()
        autoSaveProgress(nextExercise, 1)
      } else {
        setTreinoConcluido(true)
        if (sessionId) {
          await completeSession(sessionId)
        }
      }
    }
  }

  const iniciarSerie = async () => {
    if (!exercicio) return
    
    await ensureSession()
    
    if (!isUltimaSerie) {
      iniciarDescanso(exercicio.rest_seconds)
    } else {
      if (!isUltimoExercicio) {
        iniciarDescanso(exercicios[exercicioAtual + 1].rest_seconds)
      } else {
        setTreinoConcluido(true)
        if (sessionId) {
          await completeSession(sessionId)
        }
      }
    }
    proximoPasso()
  }

  const proximoExercicio = async () => {
    if (!isUltimoExercicio) {
      const nextExercise = exercicioAtual + 1
      setExercicioAtual(nextExercise)
      setSerieAtual(1)
      await ensureSession()
      autoSaveProgress(nextExercise, 1)
    }
  }

  const exercicioAnterior = async () => {
    if (exercicioAtual > 0) {
      const prevExercise = exercicioAtual - 1
      setExercicioAtual(prevExercise)
      setSerieAtual(1)
      await ensureSession()
      autoSaveProgress(prevExercise, 1)
    }
  }

  const reiniciarTreino = () => {
    setTreinoConcluido(false)
    setExercicioAtual(0)
    setSerieAtual(1)
    setDescansoAtivo(false)
    setTempoRestante(0)
    setMostrarProximo(false)
    setSessionId(null)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const sairTreino = async () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    
    if (sessionId && !treinoConcluido) {
      await abandonSession(sessionId)
    }
    
    navigate('/treinos')
  }

  if (loading) {
    return (
      <div className="treino-fullscreen treino-loading-screen">
        <div className="loading-spinner" />
        <span>Carregando treino...</span>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="treino-fullscreen">
        <div className="treino-loading">Acesso não autorizado</div>
        <button className="btn-sair" onClick={() => navigate('/treinos')}>Voltar</button>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="treino-fullscreen">
        <div className="treino-loading">Acesso não autorizado</div>
        <button className="btn-sair" onClick={() => navigate('/treinos')}>Voltar</button>
      </div>
    )
  }

  if (treinoConcluido) {
    return (
      <div className="treino-fullscreen treino-concluido">
        <div className="concluido-bg-glow" />
        
        <div className="concluido-content">
          {/* Header - Check Icon */}
          <div className="concluido-header">
            <div className="concluido-icon-wrapper">
              <CheckCircle size={80} className="concluido-check-icon" />
            </div>
            <h1 className="concluido-title">TREINO CONCLUÍDO</h1>
            <p className="concluido-subtitle">{treinoNome}</p>
          </div>

          {/* Quick Stats */}
          <div className="concluido-quick-stats">
            <div className="quick-stat">
              <span className="quick-stat-value green">{exercicios.length}</span>
              <span className="quick-stat-label">Exercícios</span>
            </div>
            <div className="quick-stat-divider" />
            <div className="quick-stat">
              <span className="quick-stat-value purple">{totalSeries}</span>
              <span className="quick-stat-label">Séries</span>
            </div>
          </div>

          {/* Success Card */}
          <div className="concluido-success-card">
            <div className="success-card-icon">
              <CheckCircle size={20} />
            </div>
            <div className="success-card-text">
              <span className="success-title">Treino concluído!</span>
              <span className="success-desc">Você está evoluindo a cada treino</span>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="concluido-stats-grid">
            <div className="stats-card glass">
              <div className="stats-card-icon streak">
                <span>🔥</span>
              </div>
              <div className="stats-card-content">
                <span className="stats-value">3</span>
                <span className="stats-label">Dias seguidos</span>
              </div>
            </div>

            <div className="stats-card glass">
              <div className="stats-card-icon week">
                <span>📅</span>
              </div>
              <div className="stats-card-content">
                <div className="week-progress">
                  <span className="stats-value">3/5</span>
                </div>
                <div className="week-bar">
                  <div className="week-bar-fill" style={{ width: '60%' }} />
                </div>
                <span className="stats-label">Esta semana</span>
              </div>
            </div>

            <div className="stats-card glass">
              <div className="stats-card-icon month">
                <span>📊</span>
              </div>
              <div className="stats-card-content">
                <span className="stats-value">12</span>
                <span className="stats-label">Este mês</span>
              </div>
            </div>
          </div>

          {/* Presence Check-in */}
          <PresenceCheckIn workoutId={id || ''} workoutName={treinoNome} />

          {/* Action Buttons */}
          <div className="concluido-actions">
            {isPersonal && (
              <button className="btn-cta-primary" onClick={reiniciarTreino}>
                <RotateCcw size={18} />
                <span>Novo Treino</span>
              </button>
            )}
            <button className="btn-cta-secondary" onClick={sairTreino}>
              <span>Sair</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (descansoAtivo || mostrarProximo) {
    const proximoEx = isUltimaSerie && !isUltimoExercicio 
      ? exercicios[exercicioAtual + 1]?.nome 
      : `Série ${serieAtual + 1}`

    const totalDescanso = isUltimaSerie && !isUltimoExercicio 
      ? exercicios[exercicioAtual + 1]?.rest_seconds 
      : exercicio?.rest_seconds

    return (
      <div className="treino-fullscreen descanso-screen">
        <button className="btn-fechar-descanso" onClick={sairTreino}>
          <X size={20} />
        </button>

        <div className="descanso-content">
          <span className="descanso-label">DESCANSO</span>
          
          <div className="contador-circular-grande">
            <svg viewBox="0 0 200 200">
              <circle className="circular-bg" cx="100" cy="100" r="90" />
              <circle
                className="circular-progress"
                cx="100"
                cy="100"
                r="90"
                style={{
                  strokeDasharray: 2 * Math.PI * 90,
                  strokeDashoffset: totalDescanso > 0 
                    ? ((totalDescanso - tempoRestante) / totalDescanso) * 2 * Math.PI * 90 
                    : 0
                }}
              />
            </svg>
            <div className="contador-texto">
              <span className="contador-tempo">
                {Math.floor(tempoRestante / 60) > 0 ? `${Math.floor(tempoRestante / 60)}:` : ''}
                {(tempoRestante % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>

          <div className="descanso-proximo">
            {mostrarProximo ? (
              <button className="btn-continuar" onClick={proximoPasso}>
                <Play size={24} />
                <span>Continuar</span>
              </button>
            ) : (
              <>
                <p className="proximo-label">Próximo:</p>
                <h3 className="proximo-exercicio">{proximoEx}</h3>
                {isPersonal && (
                  <button className="btn-pular-descanso" onClick={pularDescanso}>
                    <SkipForward size={18} />
                    <span>Pular Descanso</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!exercicio) {
    return (
      <div className="treino-fullscreen">
        <div className="treino-loading">Nenhum exercício encontrado</div>
        <button className="btn-sair" onClick={sairTreino}>Voltar</button>
      </div>
    )
  }

  return (
    <div className="treino-fullscreen">
      {/* Top Progress Bar */}
      <div className="treino-top-bar">
        <div className="treino-progress-bar">
          <div 
            className="treino-progress-fill" 
            style={{ width: `${progressoPercentual}%` }}
          />
        </div>
        <div className="treino-progress-info">
          <button className="btn-exit" onClick={sairTreino}>
            <X size={18} />
          </button>
          <div className="progress-text">
            <span className="progress-exercise">{exercicioAtual + 1} / {exercicios.length}</span>
            <span className="progress-percent">{progressoPercentual}%</span>
          </div>
          {savedIndicator && <span className="saved-indicator">✓ Salvo</span>}
          <div style={{ width: 34 }} />
        </div>
      </div>

      {/* Main Exercise Content */}
      <div className="treino-main">
        <div className="exercicio-header">
          <span className="muscle-group-tag">{exercicio.muscle_group}</span>
          <h1 className="exercicio-nome">{exercicio.nome}</h1>
        </div>

        <div className="exercicio-image-card">
          {exercicio.gif_url ? (
            <img src={exercicio.gif_url} alt={exercicio.nome} />
          ) : (
            <div className="gif-placeholder">
              <span className="placeholder-icon">💪</span>
              <span className="placeholder-text">{exercicio.nome}</span>
            </div>
          )}
        </div>

        <div className="exercicio-stats">
          <div className="stat-box">
            <div className="stat-box-value">
              <span className="stat-current">{serieAtual}</span>
              <span className="stat-divider">/</span>
              <span className="stat-total">{exercicio.sets}</span>
            </div>
            <span className="stat-box-label">SÉRIES</span>
          </div>
          <div className="stat-box highlight">
            <div className="stat-box-value">
              <span className="stat-current">{exercicio.reps}</span>
            </div>
            <span className="stat-box-label">REPETIÇÕES</span>
          </div>
          <div className="stat-box">
            <div className="stat-box-value">
              <span className="stat-current">{exercicio.rest_seconds}s</span>
            </div>
            <span className="stat-box-label">DESCANSO</span>
          </div>
        </div>
      </div>

      {/* Bottom Fixed Actions */}
      <div className="treino-bottom-bar">
        {isPersonal && (
        {isPersonal && (
          <div className="exercise-dots">
            {exercicios.map((_, index) => (
              <button
                key={index}
                className={`exercise-dot ${index === exercicioAtual ? 'active' : ''} ${index < exercicioAtual ? 'completed' : ''}`}
                onClick={() => {
                  setExercicioAtual(index)
                  setSerieAtual(1)
                  ensureSession()
                  autoSaveProgress(index, 1)
                }}
              />
            ))}
          </div>
        )}
        )}

        <div className="action-buttons">
          {isPersonal && (
            <button 
              className="btn-nav" 
              onClick={exercicioAnterior}
              disabled={exercicioAtual === 0}
            >
              <ChevronLeft size={22} />
            </button>
          )}
          
          <button className="btn-main-action" onClick={iniciarSerie}>
            {isUltimaSerie 
              ? (isUltimoExercicio ? 'FINALIZAR TREINO' : 'PRÓXIMO EXERCÍCIO') 
              : 'PRÓXIMA SÉRIE'}
          </button>
          
          {isPersonal && (
            <button 
              className="btn-nav" 
              onClick={proximoExercicio}
              disabled={isUltimoExercicio}
            >
              <ChevronRight size={22} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

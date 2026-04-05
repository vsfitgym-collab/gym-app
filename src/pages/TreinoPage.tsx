import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Play, SkipForward, RotateCcw, CheckCircle, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { workouts as localWorkouts } from '../data/workoutsData'
import { recordWorkout } from '../lib/streakManager'
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
  const timerRef = useRef<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    carregarTreino()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [id])

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
      
      // Restore session if exists
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

      // Restore session if exists
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

  // Debounced auto-save
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

  // Create session on first exercise start
  const ensureSession = useCallback(async () => {
    if (sessionId || !user || !id) return sessionId
    
    const newSession = await createSession(user.id, id)
    if (newSession) {
      setSessionId(newSession.id)
      return newSession.id
    }
    return null
  }, [sessionId, user, id])

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
        recordWorkout()
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
        recordWorkout()
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
    
    // Abandon session if in progress
    if (sessionId && !treinoConcluido) {
      await abandonSession(sessionId)
    }
    
    navigate('/treinos')
  }

  if (loading) {
    return (
      <div className="treino-fullscreen">
        <div className="treino-loading">Carregando treino...</div>
      </div>
    )
  }

  if (treinoConcluido) {
    return (
      <div className="treino-fullscreen treino-concluido">
        <audio ref={audioRef} preload="auto">
          <source src="https://assets.mixkit.co/active/storage/sفات/2869/2869-preview.mp3" type="audio/mp3" />
        </audio>
        <div className="concluido-icon">
          <CheckCircle size={100} />
        </div>
        <h2>TREINO CONCLUÍDO</h2>
        <div className="concluido-detalhes">
          <div className="detalhe-item">
            <span className="detalhe-valor">{exercicios.length}</span>
            <span className="detalhe-label">Exercícios</span>
          </div>
          <div className="detalhe-item">
            <span className="detalhe-valor">{exercicios.reduce((acc, ex) => acc + ex.sets, 0)}</span>
            <span className="detalhe-label">Séries</span>
          </div>
        </div>
        <PresenceCheckIn workoutId={id || ''} workoutName={treinoNome} />
        <button className="btn-reiniciar" onClick={reiniciarTreino}>
          <RotateCcw size={20} />
          <span>Novo Treino</span>
        </button>
        <button className="btn-sair" onClick={sairTreino}>
          <X size={20} />
          <span>Sair</span>
        </button>
      </div>
    )
  }

  if (descansoAtivo || mostrarProximo) {
    const proximoEx = isUltimaSerie && !isUltimoExercicio 
      ? exercicios[exercicioAtual + 1]?.nome 
      : (isUltimaSerie ? `Série ${serieAtual + 1}` : `Série ${serieAtual + 1}`)

    const totalDescanso = isUltimaSerie && !isUltimoExercicio 
      ? exercicios[exercicioAtual + 1]?.rest_seconds 
      : exercicio?.rest_seconds

    return (
      <div className="treino-fullscreen descanso-screen">
        <audio ref={audioRef} preload="auto">
          <source src="https://assets.mixkit.co/active/storage/sفات/2869/2869-preview.mp3" type="audio/mp3" />
        </audio>
        
        <button className="btn-fechar-descanso" onClick={sairTreino}>
          <X size={24} />
        </button>

        <div className="descanso-content">
          <span className="descanso-label">DESCANSO</span>
          
          <ContadorCircularGrandi tempo={tempoRestante} total={totalDescanso || 60} />

          <div className="descanso-proximo">
            {mostrarProximo ? (
              <button className="btn-continuar" onClick={proximoPasso}>
                <Play size={28} />
                <span>Continuar</span>
              </button>
            ) : (
              <>
                <p className="proximo-label">Próximo:</p>
                <h3 className="proximo-exercicio">{proximoEx}</h3>
                <button className="btn-pular-descanso" onClick={pularDescanso}>
                  <SkipForward size={20} />
                  <span>Pular</span>
                </button>
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
      <div className="treino-header">
        <button className="btn-voltar" onClick={sairTreino}>
          <X size={24} />
        </button>
        <div className="treino-titulo">
          <span className="progresso-text">{exercicioAtual + 1}/{exercicios.length}</span>
          {savedIndicator && (
            <span className="saved-indicator">✓ Salvo</span>
          )}
        </div>
        <div style={{ width: 40 }}></div>
      </div>

      <div className="treino-progress-bar">
        <div 
          className="treino-progress-fill" 
          style={{ width: `${progressoPercentual}%` }}
        />
        <span className="treino-progress-percent">{progressoPercentual}%</span>
      </div>

      <div className="exercicio-tela">
        <div className="exercicio-nome-tela">{exercicio.nome}</div>
        
        <div className="exercicio-gif-tela">
          {exercicio.gif_url ? (
            <img src={exercicio.gif_url} alt={exercicio.nome} />
          ) : (
            <div className="gif-placeholder-tela">
              <span>{exercicio.nome}</span>
            </div>
          )}
        </div>

        <div className="exercicio-info-tela">
          <div className="serie-tela">
            <span className="serie-numero">{serieAtual}</span>
            <span className="serie-total">/ {exercicio.sets}</span>
            <span className="serie-label">SÉRIE</span>
          </div>
          <div className="reps-tela">
            <span className="reps-numero">{exercicio.reps}</span>
            <span className="reps-label">REPETIÇÕES</span>
          </div>
        </div>
      </div>

      <div className="treino-acoes">
        <button 
          className="btn-navegar" 
          onClick={exercicioAnterior}
          disabled={exercicioAtual === 0}
        >
          <ChevronLeft size={32} />
        </button>
        
        <button className="btn-concluir-serie" onClick={iniciarSerie}>
          {isUltimaSerie 
            ? (isUltimoExercicio ? 'FINALIZAR' : 'PRÓXIMO EXERCÍCIO') 
            : 'PRÓXIMA SÉRIE'}
        </button>
        
        <button 
          className="btn-navegar" 
          onClick={proximoExercicio}
          disabled={isUltimoExercicio}
        >
          <ChevronRight size={32} />
        </button>
      </div>

      <div className="exercicios-lista-tela">
        {exercicios.map((ex, index) => (
          <button
            key={ex.id}
            className={`exercicio-item-tela ${index === exercicioAtual ? 'ativo' : ''} ${index < exercicioAtual ? 'concluido' : ''}`}
            onClick={() => {
              setExercicioAtual(index)
              setSerieAtual(1)
              ensureSession()
              autoSaveProgress(index, 1)
            }}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  )
}

function ContadorCircularGrandi({ tempo, total }: { tempo: number; total: number }) {
  const circumference = 2 * Math.PI * 90
  const progress = total > 0 ? ((total - tempo) / total) * circumference : 0
  const mins = Math.floor(tempo / 60)
  const secs = tempo % 60

  return (
    <div className="contador-circular-grande">
      <svg viewBox="0 0 200 200">
        <circle
          className="circular-bg"
          cx="100"
          cy="100"
          r="90"
        />
        <circle
          className="circular-progress"
          cx="100"
          cy="100"
          r="90"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: progress
          }}
        />
      </svg>
      <div className="contador-texto">
        <span className="contador-tempo">
          {mins > 0 ? `${mins}:` : ''}{secs.toString().padStart(2, '0')}
        </span>
      </div>
    </div>
  )
}

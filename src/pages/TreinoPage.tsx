import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Play, SkipForward, RotateCcw, CheckCircle, ChevronLeft, ChevronRight, X, Dumbbell } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { workouts as localWorkouts } from '../data/workoutsData'
import { useAuth } from '../context/AuthContext'
import { getSupabaseGifUrl } from '../lib/exerciseUtils'
import {
  createSession,
  updateSessionProgress,
  completeSession,
  abandonSession,
  saveCompletedSet,
  getActiveSession,
} from '../lib/workoutSessionManager'
import { useWorkoutCompletion } from '../hooks/useWorkoutCompletion'
import PresenceCheckIn from '../components/PresenceCheckIn'
import ProtectedFeature from '../components/ProtectedFeature'
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

function TreinoPageContent() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()
  const { completeWorkout } = useWorkoutCompletion()
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
  const [currentGifUrl, setCurrentGifUrl] = useState('')
  const [attemptedFallback, setAttemptedFallback] = useState(false)
  const [gifError, setGifError] = useState(false)
  const timerRef = useRef<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const endTimeRef = useRef<number | null>(null)

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
      // Se não tem user, esperamos um pouco ou deixamos carregar ser chamado quando o user chegar
      // Se o user realmente não existir, o ProtectedRoute no App.tsx cuidará do redirect
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

    setLoading(true)

    // 1. Tentar carregar do Supabase (Prioridade Total)
    try {
      // Validar se o ID se parece com um UUID antes de consultar
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
      
      if (isUUID) {
        const { data: treinoData, error: treinoError } = await supabase
          .from('workouts')
          .select('*')
          .eq('id', id)
          .single()

        if (treinoError) {
          console.error('Erro ao buscar treino no Supabase:', treinoError)
        }

        if (treinoData) {
          setTreinoNome(treinoData.name)

          const { data: plansData, error: plansError } = await supabase
            .from('workout_plans')
            .select('*')
            .eq('workout_id', id)
            .order('order_index', { ascending: true })

          if (plansError) {
            console.error('Erro ao buscar exercícios do treino:', plansError)
          }

          if (plansData && plansData.length > 0) {
            // Buscar detalhes dos exercícios separadamente para evitar erros de join
            const exerciseIds = plansData.map(p => p.exercise_id).filter(Boolean)
            const { data: exercisesData, error: exercisesError } = await supabase
              .from('exercises')
              .select('id, name, muscle_group, gif_url')
              .in('id', exerciseIds)

            if (exercisesError) {
              console.error('Erro ao buscar metadados dos exercícios:', exercisesError)
            }

            const formattedExercicios = plansData.map((wp: any) => {
              const matchedExercise = (exercisesData || []).find(e => e.id === wp.exercise_id)

              return {
                id: matchedExercise?.id || wp.id,
                nome: matchedExercise?.name || 'Exercício',
                muscle_group: matchedExercise?.muscle_group || 'Geral',
                gif_url: matchedExercise?.gif_url || null,
                sets: wp.sets || 3,
                reps: wp.reps || '10-12',
                rest_seconds: wp.rest_seconds || 60
              }
            })

            setExercicios(formattedExercicios)
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
          } else if (treinoData) {
            setExercicios([])
            setLoading(false)
            return
          }
        }
      }
    } catch (error) {
      console.error('Exceção ao carregar do Supabase:', error)
    }

    // 2. Fallback para localWorkouts (Apenas se não for UUID ou não encontrado no banco)
    const foundWorkout = localWorkouts.find(w => w.id === id)

    if (foundWorkout) {
      setTreinoNome(foundWorkout.name)
      const exerciciosLocal: Exercicio[] = [
        { id: '1', nome: 'Supino Reto', muscle_group: 'Peito', gif_url: null, sets: foundWorkout.exercises_count > 0 ? 4 : 3, reps: '10-12', rest_seconds: 60 },
        { id: '2', nome: 'Puxada Vertical', muscle_group: 'Costas', gif_url: null, sets: 3, reps: '10-12', rest_seconds: 60 },
        { id: '3', nome: 'Agachamento', muscle_group: 'Perna', gif_url: null, sets: 4, reps: '12-15', rest_seconds: 60 },
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

    // 3. Se realmente nada foi encontrado e o carregamento terminou
    console.warn(`Treino com ID ${id} não encontrado em lugar nenhum. Redirecionando...`)
    navigate('/treinos')
    setLoading(false)
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

  // Atualizar GIF ao mudar de exercício
  useEffect(() => {
    if (exercicio) {
      setCurrentGifUrl(getSupabaseGifUrl(exercicio.nome))
      setAttemptedFallback(false)
      setGifError(false)
    }
  }, [exercicio?.nome])

  const handleGifError = useCallback(() => {
    if (!attemptedFallback && exercicio?.gif_url) {
      setCurrentGifUrl(exercicio.gif_url)
      setAttemptedFallback(true)
    } else {
      setGifError(true)
    }
  }, [attemptedFallback, exercicio?.gif_url])

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
      audioRef.current.play().catch(() => { })
    }
  }, [])

  const syncTimer = useCallback(() => {
    const storagedEnd = localStorage.getItem('rest_end_time');
    if (!storagedEnd) {
      setDescansoAtivo(false);
      return;
    }

    const endTime = Number(storagedEnd);
    const agora = Date.now();
    const restante = Math.max(0, Math.ceil((endTime - agora) / 1000));

    if (restante <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      localStorage.removeItem('rest_end_time');
      localStorage.removeItem('rest_duration_total');
      localStorage.removeItem('rest_current_exercise');
      localStorage.removeItem('rest_current_set');
      setTempoRestante(0);
      setDescansoAtivo(false);
      tocarSom();
    } else {
      setTempoRestante(restante);
    }
  }, [tocarSom]);

  // Recuperação do timer ao carregar a página
  useEffect(() => {
    const storagedEnd = localStorage.getItem('rest_end_time');
    if (storagedEnd && !descansoAtivo) {
      const endTime = Number(storagedEnd);
      if (endTime > Date.now()) {
        // Restaurar estado do exercício e série
        const savedExercise = localStorage.getItem('rest_current_exercise');
        const savedSet = localStorage.getItem('rest_current_set');
        
        if (savedExercise !== null) setExercicioAtual(Number(savedExercise));
        if (savedSet !== null) setSerieAtual(Number(savedSet));

        setDescansoAtivo(true);
        const agora = Date.now();
        setTempoRestante(Math.max(0, Math.ceil((endTime - agora) / 1000)));
      } else {
        localStorage.removeItem('rest_end_time');
        localStorage.removeItem('rest_duration_total');
        localStorage.removeItem('rest_current_exercise');
        localStorage.removeItem('rest_current_set');
      }
    }
  }, [descansoAtivo]);

  useEffect(() => {
    if (descansoAtivo) {
      if (timerRef.current) clearInterval(timerRef.current)
      
      timerRef.current = window.setInterval(syncTimer, 1000)
      
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          syncTimer()
        }
      }
      
      window.addEventListener('visibilitychange', handleVisibilityChange)
      window.addEventListener('focus', syncTimer)
      
      return () => {
        if (timerRef.current) clearInterval(timerRef.current)
        window.removeEventListener('visibilitychange', handleVisibilityChange)
        window.removeEventListener('focus', syncTimer)
      }
    }
  }, [descansoAtivo, syncTimer])

  const iniciarDescanso = useCallback((duracao: number, exercicioIndex: number, serieNum: number) => {
    const endTime = Date.now() + (duracao * 1000);
    localStorage.setItem('rest_end_time', endTime.toString());
    localStorage.setItem('rest_duration_total', duracao.toString());
    localStorage.setItem('rest_current_exercise', exercicioIndex.toString());
    localStorage.setItem('rest_current_set', serieNum.toString());
    
    setTempoRestante(duracao);
    setDescansoAtivo(true);
    setMostrarProximo(false);
  }, []);

  const pularDescanso = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    localStorage.removeItem('rest_end_time');
    localStorage.removeItem('rest_duration_total');
    localStorage.removeItem('rest_current_exercise');
    localStorage.removeItem('rest_current_set');
    setDescansoAtivo(false);
    setTempoRestante(0);
    setMostrarProximo(true);
  }

  const proximoPasso = async () => {
    setMostrarProximo(false)
    
    // Predição do próximo estado
    const exercicio = exercicios[exercicioAtual]
    if (!exercicio) return

    const isUltimaSerieLocal = serieAtual >= exercicio.sets

    if (!isUltimaSerieLocal) {
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
        await finalizarTreinoComSucesso()
      }
    }
  }

  const finalizarTreinoComSucesso = async () => {
    setTreinoConcluido(true)
    
    // Haptic Feedback (vibrate)
    if ('vibrate' in navigator) {
      navigator.vibrate([40, 60, 40])
    }
    
    // Salvar persistência local
    if (id) {
      completeWorkout({
        workoutId: id,
        completedAt: new Date().toISOString(),
        exercisesCompleted: exercicios.length
      })
    }
    
    // Salvar no Supabase
    if (sessionId) {
      await completeSession(sessionId)
    }
  }

  const iniciarSerie = async () => {
    if (!exercicio) return

    await ensureSession()

    // Decidir se vai para descanso ou finaliza após a série atual
    if (!isUltimaSerie) {
      // Avançar série dentro do mesmo exercício
      iniciarDescanso(exercicio.rest_seconds, exercicioAtual, serieAtual + 1)
      proximoPasso()
    } else {
      if (!isUltimoExercicio) {
        // Mudar de exercício (descanso inter-exercício)
        iniciarDescanso(exercicios[exercicioAtual + 1].rest_seconds, exercicioAtual + 1, 1)
        proximoPasso()
      } else {
        // Era a última série do último exercício. Finalizar!
        await finalizarTreinoComSucesso()
      }
    }
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

  if (treinoConcluido) {
    return (
      <div className="treino-fullscreen treino-concluido">
        <div className="concluido-bg-glow" />

        <div className="concluido-content">
          <div className="concluido-header">
            <div className="concluido-icon-wrapper">
              <CheckCircle size={80} className="concluido-check-icon" />
            </div>
            <h1 className="concluido-title">TREINO CONCLUÍDO</h1>
            <p className="concluido-subtitle">{treinoNome}</p>
          </div>

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

          <div className="concluido-success-card">
            <div className="success-card-icon">
              <CheckCircle size={20} />
            </div>
            <div className="success-card-text">
              <span className="success-title">Treino concluído!</span>
              <span className="success-desc">Você está evoluindo a cada treino</span>
            </div>
          </div>

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

          <PresenceCheckIn workoutId={id || ''} workoutName={treinoNome} />

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
    const frasesMotivacionais = [
      "Respira fundo, foco na próxima série!",
      "O corpo alcança o que a mente acredita.",
      "Cada repetição conta. Mantenha a guarda alta!",
      "Sinta o progresso, abrace o esforço.",
      "Últimos segundos de pausa, prepara!",
      "Sua maior competição é com você mesmo.",
      "Não pare quando estiver cansado, pare quando terminar."
    ]

    // Selecionar frase baseada no índice do exercício para ser consistente durante o mesmo descanso
    const fraseIndex = (exercicioAtual + serieAtual) % frasesMotivacionais.length
    const fraseMotivacional = frasesMotivacionais[fraseIndex]

    const proximoEx = serieAtual > 1 
      ? `Série ${serieAtual}` 
      : (exercicio?.nome || 'Próximo Exercício')

    const totalDescanso = serieAtual === 1 && exercicioAtual > 0
      ? (exercicio?.rest_seconds || 60)
      : (exercicios[exercicioAtual > 0 ? exercicioAtual : 0]?.rest_seconds || 60)

    return (
      <div className="treino-fullscreen descanso-screen">
        <div className="descanso-glow-center" />
        
        <button className="btn-fechar-descanso" onClick={sairTreino}>
          <X size={20} />
        </button>

        <div className="descanso-content">
          <div className="descanso-header-info">
            <span className="descanso-label">RECUPERAÇÃO</span>
            <p className="descanso-phrase">"{fraseMotivacional}"</p>
          </div>

          <div className="contador-circular-grande">
            <div className="timer-pulse-ring" />
            <svg viewBox="0 0 200 200">
              <defs>
                <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
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
                {tempoRestante}
              </span>
            </div>
          </div>

          <div className="descanso-proximo">
            <div className="proximo-card">
              <span className="proximo-label">A SEGUIR</span>
              <h3 className="proximo-exercicio">{proximoEx}</h3>
              
              <div className="treino-mini-progress">
                <div 
                  className="mini-progress-fill" 
                  style={{ width: `${progressoPercentual}%` }} 
                />
              </div>
            </div>

            {mostrarProximo ? (
              <button className="btn-continuar" onClick={proximoPasso}>
                <Play size={20} fill="currentColor" />
                <span>Continuar</span>
              </button>
            ) : (
              isPersonal && (
                <button className="btn-pular-descanso" onClick={pularDescanso}>
                  <SkipForward size={18} />
                  <span>Pular Descanso</span>
                </button>
              )
            )}
          </div>
        </div>
      </div>
    )
  }

  if (exercicios.length === 0 && !loading) {
    return (
      <div className="treino-fullscreen">
        <div className="treino-header-minimal">
          <button className="btn-sair" onClick={sairTreino}><X size={24} /></button>
        </div>
        <div className="empty-state-central">
          <div className="empty-icon-wrapper">
             <Dumbbell size={48} className="text-slate-600" />
          </div>
          <h2 className="text-white text-xl font-bold mt-4">Nenhum exercício encontrado</h2>
          <p className="text-slate-400 mt-2 max-w-xs text-center">Este treino parece estar vazio ou não pôde ser carregado corretamente.</p>
          <button className="btn-cta-secondary mt-6" onClick={sairTreino}>Voltar para Meus Treinos</button>
        </div>
      </div>
    )
  }

  const fraseExecucao = (exercicioAtual + serieAtual) % 2 === 0 
    ? "Foco total na execução" 
    : "Controle o movimento";

  const vibrationFeedback = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(12);
    }
  };

  const handleIniciarSerieComFeedback = async () => {
    vibrationFeedback();
    await iniciarSerie();
  };

  if (!exercicio) return null;

  return (
    <div className="treino-fullscreen">
      {/* Immersive Depth Layers */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-600/10 blur-[130px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-indigo-500/10 blur-[100px]" />
      </div>

      <div className="treino-top-nav">
        <div className="header-progress-bar">
          <div
            className="header-progress-fill"
            style={{ width: `${progressoPercentual}%` }}
          />
        </div>
        <div className="nav-content">
          <button className="btn-close-minimal" onClick={sairTreino} title="Sair do treino">
            <X size={22} />
          </button>
          
          <div className="nav-badges">
            <span className="badge-glass">
              {exercicioAtual + 1} / {exercicios.length} EXERCÍCIOS
            </span>
            <span className="badge-glass badge-emerald">
              {progressoPercentual}% CONCLUÍDO
            </span>
          </div>

          <div className="flex items-center min-w-[44px] justify-end">
            {savedIndicator && (
              <div className="saved-indicator">
                <CheckCircle size={10} />
                <span>Salvo</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="treino-main-scroll">
        <div className="ultra-card-container" key={`${exercicioAtual}-${serieAtual}`}>
          <div className="ultra-card">
            <div className="card-header-premium">
              <span className="tag-muscle-elite">{exercicio.muscle_group}</span>
              <h1 className="title-exercise-elite">{exercicio.nome}</h1>
              <span className="phrase-motivational">{fraseExecucao}</span>
            </div>

            <div className="visual-exercise-box">
              {!gifError ? (
                <img 
                  src={currentGifUrl} 
                  alt={exercicio.nome} 
                  onError={handleGifError}
                />
              ) : (
                <div className="icon-placeholder-elite">
                  <Dumbbell size={64} className="opacity-40" />
                </div>
              )}
            </div>

            <div className="metrics-row">
              <div className="metric-brick">
                <span className="metric-label">SÉRIE</span>
                <div className="flex items-baseline gap-1">
                  <span className="metric-value">{serieAtual}</span>
                  <span className="text-[10px] text-zinc-500 font-bold">/{exercicio.sets}</span>
                </div>
              </div>
              
              <div className="metric-brick active-target">
                <span className="metric-label">REPS</span>
                <span className="metric-value">{exercicio.reps}</span>
              </div>
              
              <div className="metric-brick">
                <span className="metric-label">PAUSA</span>
                <span className="metric-value">{exercicio.rest_seconds}s</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="action-bar-ultra">
        <button
          className="btn-elite-cta"
          onClick={handleIniciarSerieComFeedback}
        >
          {isUltimaSerie && isUltimoExercicio ? 'Finalizar Treino' : 'Próxima Série'}
        </button>
      </div>
    </div>
  )
}

export default function TreinoPage() {
  return (
    <ProtectedFeature feature="Treinos Ativos">
      <TreinoPageContent />
    </ProtectedFeature>
  )
}

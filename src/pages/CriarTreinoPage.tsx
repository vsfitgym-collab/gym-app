import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSubscription } from '../hooks/useSubscription'
import { supabase } from '../lib/supabase'
import { checkWorkoutLimit, checkExerciseLimit, showLimitToast } from '../lib/planLimits'
import {
  ArrowLeft,
  Dumbbell,
  Plus,
  Save,
  Target,
  Repeat,
  Timer,
  GripVertical,
  Trash2,
  CheckCircle2,
  Search,
  X,
  ChevronDown,
  Edit2,
  Clock,
  Layers
} from 'lucide-react'
import { exerciseLibrary as localExercises, type Exercise } from '../data/exercises'
import './CriarTreino.css'

interface ExercicioSelecionado {
  id?: string
  exerciseId?: string
  nome: string
  grupoMuscular: string
  series: number
  repeticoes: string
  descanso: number
}

interface Treino {
  nome: string
  level: string
  duration_minutes: number
  is_custom_duration: boolean
  exercises: ExercicioSelecionado[]
}

const gruposMusculares = [
  { value: 'Peito', icon: '🏋️' },
  { value: 'Costas', icon: '🔙' },
  { value: 'Perna', icon: '🦵' },
  { value: 'Ombro', icon: '💪' },
  { value: 'Bíceps', icon: '💪' },
  { value: 'Tríceps', icon: '💪' },
  { value: 'Abdomen', icon: '🎯' },
  { value: 'Cardio', icon: '❤️' },
]

export default function CriarTreinoPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user, role } = useAuth()
  const { isPremium, limits } = useSubscription()
  const isEditMode = !!id

  useEffect(() => {
    if (user && role === 'aluno') {
      navigate('/', { replace: true })
    }
  }, [user, role])

  const [treino, setTreino] = useState<Treino>({
    nome: '',
    level: 'iniciante',
    duration_minutes: 45,
    is_custom_duration: false,
    exercises: []
  })

  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [showSelector, setShowSelector] = useState(false)
  const [apiExercises, setApiExercises] = useState<Exercise[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingExercises, setLoadingExercises] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [loading, setLoading] = useState(isEditMode)

  // Workout type toggle (FREE vs CUSTOM)
  const [workoutType, setWorkoutType] = useState<'free' | 'custom'>('custom')
  const [selectedAluno, setSelectedAluno] = useState<string>('')
  const [alunosList, setAlunosList] = useState<{ id: string; name: string; email: string }[]>([])
  const [selectedDay, setSelectedDay] = useState<number>(1) // 1=Monday default

  useEffect(() => {
    if (role === 'personal') {
      loadAlunos()
    }
  }, [role])

  const loadAlunos = async () => {
    const { data } = await supabase
      .from('profiles').select('id, name, email').eq('role', 'aluno')
    if (data) setAlunosList(data)
  }

  const getComputedDuration = () => {
    if (treino.exercises.length === 0) return 0
    const totalSecs = treino.exercises.reduce((acc, ex) => {
      const match = String(ex.repeticoes).match(/\d+/g)
      let reps = 12
      if (match) reps = Math.max(...match.map(Number))
      return acc + (ex.series * (reps * 2) + ex.descanso)
    }, 0)
    return Math.ceil(totalSecs / 60)
  }

  useEffect(() => {
    if (isEditMode) {
      carregarTreinoExistente()
    }
  }, [id])

  useEffect(() => {
    if (showSelector) {
      carregarExerciciosAPI()
    }
  }, [showSelector])

  const carregarTreinoExistente = async () => {
    if (!id) return
    try {
      const { data: treinoData, error: treinoError } = await supabase
        .from('workouts')
        .select('*')
        .eq('id', id)
        .single()

      if (treinoError || !treinoData) {
        alert('Treino não encontrado')
        navigate('/treinos')
        return
      }

      const { data: plansData, error: plansError } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('workout_id', id)
        .order('order_index', { ascending: true })

      if (plansError) throw plansError

      const exerciseIds = (plansData || []).map((p: any) => p.exercise_id)
      const { data: exercisesData } = await supabase
        .from('exercises')
        .select('id, name, muscle_group')
        .in('id', exerciseIds)

      const exercises: ExercicioSelecionado[] = (plansData || []).map((plan: any) => {
        const exercise = exercisesData?.find((e: any) => e.id === plan.exercise_id)
        return {
          id: plan.id,
          exerciseId: plan.exercise_id,
          nome: exercise?.name || 'Exercício',
          grupoMuscular: exercise?.muscle_group || 'Perna',
          series: plan.sets || 3,
          repeticoes: plan.reps || '10-12',
          descanso: plan.rest_seconds || 60,
        }
      })

      setTreino({
        nome: treinoData.name,
        level: treinoData.level || 'intermediario',
        duration_minutes: treinoData.duration_minutes || 45,
        is_custom_duration: treinoData.is_custom_duration || false,
        exercises,
      })
    } catch (error) {
      console.error('Erro ao carregar treino:', error)
    } finally {
      setLoading(false)
    }
  }

  const carregarExerciciosAPI = () => {
    setLoadingExercises(true)
    try {
      const mappedExercises: Exercise[] = localExercises.map(local => ({
        id: local.id,
        name: local.name,
        target: local.target,
        equipment: local.equipment,
        gifUrl: local.gifUrl || local.thumbnail || '',
        thumbnail: local.thumbnail || '',
        instructions: []
      }))
      setApiExercises(mappedExercises)
    } catch {
      setApiExercises([])
    } finally {
      setLoadingExercises(false)
    }
  }

  const filteredExercises = useMemo(() => {
    return apiExercises.filter(ex => {
      const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesFilter = selectedFilter === 'all' || ex.target === selectedFilter
      return matchesSearch && matchesFilter
    })
  }, [apiExercises, searchQuery, selectedFilter])

  const selecionarExercicio = (exercise: Exercise) => {
    if (!isPremium && treino.exercises.length >= limits.maxExercisesPerWorkout) {
      showLimitToast(`Limite de ${limits.maxExercisesPerWorkout} exercícios atingido. Faça upgrade para adicionar mais!`)
      return
    }

    setTreino(prev => ({
      ...prev,
      exercises: [...prev.exercises, {
        exerciseId: exercise.id,
        nome: exercise.name,
        grupoMuscular: exercise.target || 'Outros',
        series: 3,
        repeticoes: '10-12',
        descanso: 60,
      }]
    }))
    setShowSelector(false)
    setSearchQuery('')
    setSelectedFilter('all')
  }

  const removerExercicio = async (index: number) => {
    const ex = treino.exercises[index]

    if (isEditMode && ex.id) {
      try {
        await supabase.from('workout_plans').delete().eq('id', ex.id)
      } catch (error) {
        console.error('Erro ao remover exercício:', error)
      }
    }

    setTreino(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index)
    }))
  }

  const atualizarExercicio = (index: number, campo: string, valor: string | number) => {
    setTreino(prev => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) =>
        i === index ? { ...ex, [campo]: valor } : ex
      )
    }))
  }

  const salvarTreino = async () => {
    if (!treino.nome || !treino.nome.trim()) {
      alert('Nome do treino é obrigatório')
      return
    }

    if (treino.exercises.length === 0) {
      alert('Adicione pelo menos um exercício')
      return
    }

    if (!isEditMode && user) {
      const limitCheck = await checkExerciseLimit(user.id, treino.exercises.length)
      if (!limitCheck.allowed) {
        showLimitToast(limitCheck.upgradeMessage || 'Limite de exercícios atingido')
        navigate('/planos')
        return
      }
    }

    if (!isEditMode && user) {
      const { data: existingWorkouts } = await supabase
        .from('workouts')
        .select('id', { count: 'exact', head: true })
        .eq('created_by', user.id)

      const currentCount = existingWorkouts?.length || 0
      const workoutLimit = await checkWorkoutLimit(user.id, currentCount)

      if (!workoutLimit.allowed) {
        showLimitToast(workoutLimit.upgradeMessage || 'Limite de treinos atingido')
        navigate('/planos')
        return
      }
    }

    setSalvando(true)

    try {
      if (isEditMode && id) {
        await supabase.from('workouts').update({
          name: treino.nome,
          level: treino.level,
          duration_minutes: treino.is_custom_duration ? (treino.duration_minutes || getComputedDuration()) : null,
          is_custom_duration: treino.is_custom_duration
        }).eq('id', id)

        for (let i = 0; i < treino.exercises.length; i++) {
          const ex = treino.exercises[i]

          if (ex.id) {
            await supabase
              .from('workout_plans')
              .update({
                sets: ex.series,
                reps: ex.repeticoes,
                rest_seconds: ex.descanso,
                order_index: i,
              })
              .eq('id', ex.id)
          } else {
            const { data: exData, error: exError } = await supabase
              .from('exercises')
              .insert({
                name: ex.nome,
                muscle_group: ex.grupoMuscular,
                workout_id: id,
              })
              .select()
              .single()

            if (exError) throw exError

            await supabase.from('workout_plans').insert({
              workout_id: id,
              exercise_id: exData.id,
              sets: ex.series,
              reps: ex.repeticoes,
              rest_seconds: ex.descanso,
              order_index: i,
            })
          }
        }
      } else {
        const { data: treinoData, error: treinoError } = await supabase
          .from('workouts')
          .insert({
            name: treino.nome,
            level: treino.level,
            duration_minutes: treino.is_custom_duration ? (treino.duration_minutes || getComputedDuration()) : null,
            is_custom_duration: treino.is_custom_duration,
            created_by: user?.id,
            workout_type: workoutType,
            assigned_to: workoutType === 'custom' && selectedAluno ? selectedAluno : null,
          })
          .select()
          .single()

        if (treinoError) throw treinoError

        // If FREE workout, also create schedule entry
        if (workoutType === 'free' && treinoData) {
          await supabase.from('free_workout_schedule').upsert({
            workout_id: treinoData.id,
            day_of_week: selectedDay,
          }, { onConflict: 'day_of_week' })
        }

        for (let i = 0; i < treino.exercises.length; i++) {
          const ex = treino.exercises[i]

          const { data: exData, error: exError } = await supabase
            .from('exercises')
            .insert({
              name: ex.nome,
              muscle_group: ex.grupoMuscular,
              workout_id: treinoData.id,
            })
            .select()
            .single()

          if (exError) throw exError

          await supabase.from('workout_plans').insert({
            workout_id: treinoData.id,
            exercise_id: exData.id,
            sets: ex.series,
            reps: ex.repeticoes,
            rest_seconds: ex.descanso,
            order_index: i,
          })
        }
      }

      setSucesso(true)
      setTimeout(() => navigate('/treinos'), 1500)
    } catch (error: any) {
      console.error('Erro ao salvar:', error)
      alert('Erro ao salvar treino: ' + error.message)
    } finally {
      setSalvando(false)
    }
  }

  if (loading) {
    return (
      <div className="criar-treino">
        <div className="loading-treino">
          <div className="spinner" />
          <span>Carregando treino...</span>
        </div>
      </div>
    )
  }

  if (sucesso) {
    return (
      <div className="criar-treino criar-treino-sucesso">
        <div className="sucesso-content">
          <div className="sucesso-icon">
            <CheckCircle2 size={64} />
          </div>
          <h2>{isEditMode ? 'Treino Atualizado!' : 'Treino Criado!'}</h2>
          <p>{isEditMode ? 'Alterações salvas com sucesso' : 'Seu treino foi salvo com sucesso'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="criar-treino">
      <div className="criar-treino-header">
        <button className="btn-voltar" onClick={() => navigate('/treinos')}>
          <ArrowLeft size={24} />
        </button>
        <div className="header-info">
          <h2>{isEditMode ? 'Editar Treino' : 'Criar Novo Treino'}</h2>
          <span>{isEditMode ? 'Edite as informações do treino' : 'Configure o novo treino'}</span>
        </div>
      </div>

      <div className="section-card">
        {/* Workout Type Toggle (only for personal, only on create) */}
        {!isEditMode && (
          <div className="mb-6">
            <label className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-2 block">Tipo de Treino</label>
            <div className="flex gap-2">
              <button
                onClick={() => setWorkoutType('free')}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm border transition-all ${
                  workoutType === 'free'
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                🆓 Padrão (FREE)
                <p className="text-[10px] mt-1 font-normal opacity-70">Compartilhado com todos os alunos FREE</p>
              </button>
              <button
                onClick={() => setWorkoutType('custom')}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm border transition-all ${
                  workoutType === 'custom'
                    ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                🎯 Personalizado
                <p className="text-[10px] mt-1 font-normal opacity-70">Atribuído a um aluno específico</p>
              </button>
            </div>

            {/* Day of week selector for FREE */}
            {workoutType === 'free' && (
              <div className="mt-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-2 block">Dia da Semana</label>
                <div className="flex gap-2">
                  {[{v:1,l:'SEG'},{v:3,l:'QUA'},{v:5,l:'SEX'}].map(d => (
                    <button
                      key={d.v}
                      onClick={() => setSelectedDay(d.v)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                        selectedDay === d.v
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                      }`}
                    >{d.l}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Student selector for CUSTOM */}
            {workoutType === 'custom' && (
              <div className="mt-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-2 block">Aluno</label>
                <select
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                  value={selectedAluno}
                  onChange={e => setSelectedAluno(e.target.value)}
                >
                  <option value="">Selecione um aluno...</option>
                  {alunosList.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.email})</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        <div className="section-label">
          <Dumbbell size={18} />
          <span>Informações Principais</span>
        </div>

        <div className="form-group mb-4">
          <label className="text-sm font-medium text-slate-300 mb-2 block">Nome do Treino</label>
          <input
            type="text"
            className="input-nome !bg-white/5 !border !border-white/10 !rounded-xl !p-3 !text-white !w-full focus:!border-indigo-500"
            value={treino.nome}
            onChange={e => setTreino(prev => ({ ...prev, nome: e.target.value }))}
            placeholder="Ex: Treino A - Superior"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
              <Layers size={16} className="text-indigo-400" />
              Nível
            </label>
            <select
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
              value={treino.level}
              onChange={e => setTreino(prev => ({ ...prev, level: e.target.value }))}
            >
              <option value="iniciante">Iniciante</option>
              <option value="intermediario">Intermediário</option>
              <option value="avancado">Avançado</option>
            </select>
          </div>

          <div className="form-group">
            <label className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2 justify-between">
              <span className="flex items-center gap-2">
                <Clock size={16} className="text-indigo-400" />
                Duração (minutos)
              </span>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-normal">
                <input
                  type="checkbox"
                  className="accent-indigo-500 w-4 h-4"
                  checked={treino.is_custom_duration}
                  onChange={e => setTreino(prev => ({ ...prev, is_custom_duration: e.target.checked }))}
                />
                <span className={treino.is_custom_duration ? "text-indigo-400 font-bold" : "text-slate-400"}>Definir manual</span>
              </label>
            </label>
            <input
              type="number"
              className={`w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none transition-colors ${treino.is_custom_duration ? 'focus:border-indigo-500' : 'opacity-50 cursor-not-allowed text-indigo-300'}`}
              value={treino.is_custom_duration ? treino.duration_minutes : getComputedDuration()}
              onChange={e => treino.is_custom_duration ? setTreino(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 0 })) : null}
              disabled={!treino.is_custom_duration}
              min={10}
              max={180}
            />
            {!treino.is_custom_duration && (
              <p className="text-xs text-slate-500 mt-1">Tempo estimado automaticamente pelos exercícios</p>
            )}
          </div>
        </div>
      </div>

      <div className="section-card exercicios-section">
        <div className="section-header">
          <div className="section-label">
            <Target size={18} />
            <span>Exercícios ({treino.exercises.length})</span>
          </div>
          <button className="btn-adicionar" onClick={() => setShowSelector(true)}>
            <Plus size={16} />
            <span>Selecionar</span>
          </button>
        </div>

        {treino.exercises.length === 0 ? (
          <div className="empty-exercicios">
            <div className="empty-icon-wrapper">
              <Dumbbell size={40} />
            </div>
            <p>Nenhum exercício adicionado</p>
            <span>Selecione exercícios da biblioteca</span>
            <button className="btn-adicionar-empty" onClick={() => setShowSelector(true)}>
              <Plus size={18} />
              <span>Selecionar Exercício</span>
            </button>
          </div>
        ) : (
          <div className="exercicios-list">
            {treino.exercises.map((ex, index) => (
              <div
                key={ex.id || index}
                className="exercicio-card"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="exercicio-card-header">
                  <div className="exercicio-numero">
                    <GripVertical size={16} />
                    <span>{index + 1}</span>
                  </div>
                  <button
                    className="btn-remover"
                    onClick={() => removerExercicio(index)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="exercicio-form">
                  <div className="form-row">
                    <div className="form-group full">
                      <label>Exercício</label>
                      <div className="input-readonly">{ex.nome}</div>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Grupo Muscular</label>
                      <select
                        value={ex.grupoMuscular}
                        onChange={e => atualizarExercicio(index, 'grupoMuscular', e.target.value)}
                      >
                        {gruposMusculares.map(gm => (
                          <option key={gm.value} value={gm.value}>{gm.icon} {gm.value}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row details">
                    <div className="form-group">
                      <label><Repeat size={14} /> Séries</label>
                      <input
                        type="number"
                        value={ex.series}
                        onChange={e => atualizarExercicio(index, 'series', parseInt(e.target.value) || 0)}
                        min={1}
                        max={20}
                      />
                    </div>

                    <div className="form-group">
                      <label><Target size={14} /> Reps</label>
                      <input
                        type="text"
                        value={ex.repeticoes}
                        onChange={e => atualizarExercicio(index, 'repeticoes', e.target.value)}
                        placeholder="10-12"
                      />
                    </div>

                    <div className="form-group">
                      <label><Timer size={14} /> Descanso</label>
                      <input
                        type="number"
                        value={ex.descanso}
                        onChange={e => atualizarExercicio(index, 'descanso', parseInt(e.target.value) || 0)}
                        min={0}
                        max={300}
                        step={15}
                      />
                      <span className="input-suffix">seg</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="criar-treino-actions">
        <button className="btn-cancelar" onClick={() => navigate('/treinos')}>
          Cancelar
        </button>
        <button
          className="btn-salvar"
          onClick={salvarTreino}
          disabled={salvando}
        >
          {salvando ? (
            <>
              <div className="spinner" />
              {isEditMode ? 'Salvando...' : 'Salvando...'}
            </>
          ) : (
            <>
              {isEditMode ? <Edit2 size={18} /> : <Save size={18} />}
              {isEditMode ? 'Atualizar Treino' : 'Salvar Treino'}
            </>
          )}
        </button>
      </div>

      {showSelector && (
        <div 
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6" 
          onClick={() => setShowSelector(false)}
        >
          <div 
            className="w-full max-w-2xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh] sm:h-[75vh]" 
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/5">
              <h3 className="text-lg font-semibold text-white">Selecionar Exercício</h3>
              <button 
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/5 text-zinc-400 hover:bg-white/10 hover:text-white transition-all"
                onClick={() => setShowSelector(false)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Search */}
            <div className="px-5 sm:px-6 pt-5 pb-3">
              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Buscar exercício..."
                  className="w-full h-11 pl-11 pr-4 bg-zinc-800/60 border border-white/10 rounded-xl text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Filters */}
            <div className="px-5 sm:px-6 pb-4 overflow-x-auto custom-scrollbar-hide">
              <div className="flex gap-2 min-w-max pb-1">
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'Peito', label: 'Peito' },
                  { id: 'Costas', label: 'Costas' },
                  { id: 'Perna', label: 'Perna' },
                  { id: 'Ombro', label: 'Ombro' },
                  { id: 'Bíceps', label: 'Bíceps' },
                  { id: 'Tríceps', label: 'Tríceps' },
                  { id: 'Funcional', label: 'Funcional' },
                ].map(filter => (
                  <button
                    key={filter.id}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      selectedFilter === filter.id 
                        ? 'bg-purple-600 text-white border-purple-500/50' 
                        : 'bg-zinc-800 text-zinc-300 border-white/5 hover:bg-zinc-700/80 hover:text-zinc-100'
                    }`}
                    onClick={() => setSelectedFilter(filter.id)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-6 pb-6 custom-scrollbar">
              {loadingExercises ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-zinc-800/40 border border-white/5 rounded-xl h-[72px] w-full" />
                  ))}
                </div>
              ) : filteredExercises.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center border border-white/5 text-zinc-500">
                    <Search size={32} />
                  </div>
                  <div>
                    <p className="text-zinc-300 font-medium">Nenhum exercício encontrado</p>
                    <p className="text-sm text-zinc-500">Tente ajustar seus filtros de busca.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredExercises.map((exercise) => (
                    <button
                      key={exercise.id}
                      className="group flex items-center gap-4 p-4 bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/5 rounded-xl transition-all duration-200 hover:scale-[1.01] hover:border-purple-500/30 text-left w-full"
                      onClick={() => selecionarExercicio(exercise)}
                    >
                      <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-zinc-800 flex items-center justify-center border border-white/10">
                        {exercise.gifUrl ? (
                          <video 
                            src={exercise.gifUrl} 
                            muted 
                            loop 
                            playsInline 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            onMouseEnter={e => e.currentTarget.play()}
                            onMouseLeave={e => {e.currentTarget.pause(); e.currentTarget.currentTime = 0;}}
                          />
                        ) : exercise.thumbnail ? (
                          <img 
                            src={exercise.thumbnail} 
                            alt={exercise.name} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                          />
                        ) : (
                          <Dumbbell size={24} className="text-zinc-600" />
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-1.5 flex-1">
                        <span className="text-white font-medium group-hover:text-purple-300 transition-colors line-clamp-2">
                          {exercise.name}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {exercise.target}
                          </span>
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {exercise.equipment}
                          </span>
                        </div>
                      </div>
                      <ChevronDown size={18} className="text-zinc-600 group-hover:text-purple-400 -rotate-90 transition-colors shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

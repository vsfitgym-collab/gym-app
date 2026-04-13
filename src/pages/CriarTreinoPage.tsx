import { useState, useEffect } from 'react'
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
import { fetchExercises, getMockExercises } from '../lib/exerciseApi'
import type { Exercise } from '../lib/exerciseTranslations'
import { translateTarget, translateEquipment } from '../lib/exerciseTranslations'
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

  const carregarExerciciosAPI = async () => {
    setLoadingExercises(true)
    try {
      const result = await fetchExercises(100, 0)
      if (result.error || result.data.length === 0) {
        const mock = await getMockExercises()
        setApiExercises(mock)
      } else {
        setApiExercises(result.data)
      }
    } catch {
      const mock = await getMockExercises()
      setApiExercises(mock)
    } finally {
      setLoadingExercises(false)
    }
  }

  const filteredExercises = apiExercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = selectedFilter === 'all' || ex.target === selectedFilter || ex.bodyPart === selectedFilter
    return matchesSearch && matchesFilter
  })

  const selecionarExercicio = (exercise: Exercise) => {
    if (!isPremium && treino.exercises.length >= limits.maxExercisesPerWorkout) {
      showLimitToast(`Limite de ${limits.maxExercisesPerWorkout} exercícios atingido. Faça upgrade para adicionar mais!`)
      return
    }

    const grupoMap: Record<string, string> = {
      'pectorals': 'Peito',
      'lats': 'Costas',
      'upper back': 'Costas',
      'spine': 'Costas',
      'quads': 'Perna',
      'glutes': 'Perna',
      'hamstrings': 'Perna',
      'calves': 'Perna',
      'abductors': 'Perna',
      'adductors': 'Perna',
      'delts': 'Ombro',
      'biceps': 'Bíceps',
      'triceps': 'Tríceps',
      'forearms': 'Bíceps',
      'abs': 'Abdomen',
      'cardiovascular system': 'Cardio',
    }

    setTreino(prev => ({
      ...prev,
      exercises: [...prev.exercises, {
        exerciseId: exercise.id,
        nome: exercise.name,
        grupoMuscular: grupoMap[exercise.target] || 'Perna',
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
            created_by: user?.id
          })
          .select()
          .single()

        if (treinoError) throw treinoError

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
        <div className="exercise-selector-overlay" onClick={() => setShowSelector(false)}>
          <div className="exercise-selector" onClick={e => e.stopPropagation()}>
            <div className="selector-header">
              <h3>Selecionar Exercício</h3>
              <button className="btn-fechar-selector" onClick={() => setShowSelector(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="selector-search">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Buscar exercício..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="selector-filters">
              <button 
                className={`filter-chip ${selectedFilter === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedFilter('all')}
              >
                Todos
              </button>
              <button 
                className={`filter-chip ${selectedFilter === 'pectorals' ? 'active' : ''}`}
                onClick={() => setSelectedFilter('pectorals')}
              >
                Peito
              </button>
              <button 
                className={`filter-chip ${selectedFilter === 'lats' || selectedFilter === 'upper back' ? 'active' : ''}`}
                onClick={() => setSelectedFilter('lats')}
              >
                Costas
              </button>
              <button 
                className={`filter-chip ${selectedFilter === 'quads' || selectedFilter === 'glutes' ? 'active' : ''}`}
                onClick={() => setSelectedFilter('quads')}
              >
                Perna
              </button>
              <button 
                className={`filter-chip ${selectedFilter === 'delts' ? 'active' : ''}`}
                onClick={() => setSelectedFilter('delts')}
              >
                Ombro
              </button>
              <button 
                className={`filter-chip ${selectedFilter === 'biceps' ? 'active' : ''}`}
                onClick={() => setSelectedFilter('biceps')}
              >
                Bíceps
              </button>
              <button 
                className={`filter-chip ${selectedFilter === 'triceps' ? 'active' : ''}`}
                onClick={() => setSelectedFilter('triceps')}
              >
                Tríceps
              </button>
              <button 
                className={`filter-chip ${selectedFilter === 'abs' ? 'active' : ''}`}
                onClick={() => setSelectedFilter('abs')}
              >
                Abdômen
              </button>
            </div>

            <div className="selector-list">
              {loadingExercises ? (
                <div className="selector-loading">
                  <div className="spinner" />
                  <span>Carregando exercícios...</span>
                </div>
              ) : filteredExercises.length === 0 ? (
                <div className="selector-empty">
                  <Search size={32} />
                  <p>Nenhum exercício encontrado</p>
                </div>
              ) : (
                filteredExercises.map((exercise) => (
                  <button
                    key={exercise.id}
                    className="selector-item"
                    onClick={() => selecionarExercicio(exercise)}
                  >
                    <div className="selector-item-info">
                      <span className="selector-item-name">{exercise.name}</span>
                      <div className="selector-item-tags">
                        <span className="tag-muscle">{translateTarget(exercise.target)}</span>
                        <span className="tag-equipment">{translateEquipment(exercise.equipment)}</span>
                      </div>
                    </div>
                    <ChevronDown size={16} className="selector-arrow" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

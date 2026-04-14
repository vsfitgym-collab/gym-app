import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePermissions } from '../context/PermissionsContext'
import { supabase } from '../lib/supabase'
import {
  Dumbbell, FileText, Clock, TrendingUp, Plus,
  Edit2, ChevronRight, Trash2, Users, Search,
  X, Check, Lock, Zap, Star, Flame
} from 'lucide-react'
import { type Workout, getLevelLabel } from '../data/workoutsData'
import { SkeletonList } from '../components/ui/Skeleton'
import DataStateHandler, { type DataState } from '../components/DataStateHandler'
import { useWorkoutCompletion } from '../hooks/useWorkoutCompletion'
import './Treinos.css'

/* ─── Level Config ─────────────────────────────────── */
const levelConfig = {
  iniciante:    { label: 'Iniciante',    className: 'iniciante',    icon: '🌱' },
  intermediario:{ label: 'Intermediário',className: 'intermediario',icon: '⚡' },
  avancado:     { label: 'Avançado',     className: 'avancado',     icon: '🔥' },
}

/* ─── WorkoutCard ──────────────────────────────────── */
interface WorkoutCardProps {
  treino: Workout
  index: number
  role: string
  progress: number
  isRecommended: boolean
  isLocked: boolean
  isCompleted: boolean
  onCardClick: (id: string) => void
  onDeleteClick?: (e: React.MouseEvent, id: string) => void
  onAssignClick?: (e: React.MouseEvent, id: string) => void
}

function WorkoutCard({
  treino, index, role, progress,
  isRecommended, isLocked, isCompleted,
  onCardClick, onDeleteClick, onAssignClick
}: WorkoutCardProps) {
  const navigate = useNavigate()
  const lvl = levelConfig[treino.level as keyof typeof levelConfig] || levelConfig.intermediario

  return (
    <div
      className={`treino-card ${role !== 'personal' ? 'clickable' : ''} ${isRecommended ? 'recommended' : ''} ${isCompleted ? 'completed' : ''}`}
      style={{ animationDelay: `${index * 0.07}s` }}
      onClick={() => !isLocked && onCardClick(treino.id)}
    >

      {/* ── Top Row ── */}
      <div className="card-top">
        <div className="card-top-left">
          <div className={`card-icon-circle ${isCompleted ? 'completed-glow' : ''}`}>
            {isCompleted ? <Check size={22} className="text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.7)]" strokeWidth={3} /> : <Dumbbell size={22} />}
          </div>
          {isRecommended && !isCompleted && (
            <div className="recommended-label">
              <Star size={9} fill="currentColor" /> Recomendado para você
            </div>
          )}
          {isCompleted && (
            <div className="completed-badge-premium">
              <Check size={10} strokeWidth={3} /> Concluído
            </div>
          )}
        </div>
        {!isCompleted && (
          <span className={`level-badge ${lvl.className}`}>
            {lvl.icon} {lvl.label}
          </span>
        )}
      </div>

      {/* ── Body ── */}
      <div className="card-body">
        <h3 className="card-title">{treino.name}</h3>
        {treino.description && (
          <p className="card-description">{treino.description}</p>
        )}

        {/* Meta chips */}
        <div className="card-meta">
          <div className="meta-item">
            <FileText size={13} />
            <span>{treino.exercises_count} exerc.</span>
          </div>
          <div className="meta-item">
            <Clock size={13} />
            <span>{treino.duration_minutes} min</span>
          </div>
        </div>

        {/* Progress — students only */}
        {role !== 'personal' && (
          <div className="card-progress">
            <div className="progress-label">
              <span className="progress-label-text">
                <TrendingUp size={11} />
                Progresso
              </span>
              <span className="progress-pct">{progress}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* ── Footer actions ── */}
      <div className="card-footer-actions">
        {role === 'personal' ? (
          <div className="card-admin-actions">
            <button
              className="btn-card-icon assign"
              onClick={(e) => { e.stopPropagation(); onAssignClick && onAssignClick(e, treino.id) }}
              title="Atribuir para Alunos"
            >
              <Users size={15} />
            </button>
            <button
              className="btn-card-icon edit"
              onClick={(e) => { e.stopPropagation(); navigate(`/treinos/editar/${treino.id}`) }}
              title="Editar Treino"
            >
              <Edit2 size={15} />
            </button>
            <button
              className="btn-card-icon danger"
              onClick={(e) => { e.stopPropagation(); onDeleteClick && onDeleteClick(e, treino.id) }}
              title="Excluir Treino"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ) : (
          <span className="text-xs text-white/30">{isLocked ? 'Bloqueado' : 'Toque para iniciar'}</span>
        )}

        <button
          className="btn-card-cta"
          onClick={(e) => { e.stopPropagation(); !isLocked && navigate(`/treinos/${treino.id}`) }}
          title="Ver Treino"
        >
          <ChevronRight size={18} className="cta-icon" />
        </button>
      </div>

      {/* ── Locked Overlay ── */}
      {isLocked && (
        <div className="card-locked-overlay">
          <div className="lock-icon-wrapper">
            <Lock size={22} />
          </div>
          <p className="lock-title">Treino Bloqueado</p>
          <p className="lock-subtitle">Disponível no plano PRO ou superior</p>
          <button
            className="btn-upgrade-lock"
            onClick={(e) => { e.stopPropagation(); navigate('/planos') }}
          >
            <Zap size={12} fill="currentColor" /> Fazer Upgrade
          </button>
        </div>
      )}
    </div>
  )
}

/* ─── Main Page ────────────────────────────────────── */
export default function TreinosPage() {
  const navigate = useNavigate()
  const { user, role } = useAuth()
  const { hasPermission } = usePermissions()
  const { isWorkoutCompleted, getCompletionStats } = useWorkoutCompletion()

  const [treinos, setTreinos] = useState<Workout[]>([])
  const [dataState, setDataState] = useState<DataState>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Assignment Modal
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [selectedTreinoId, setSelectedTreinoId] = useState<string | null>(null)
  const [alunos, setAlunos] = useState<any[]>([])
  const [searchAluno, setSearchAluno] = useState('')
  const [savingAssign, setSavingAssign] = useState(false)
  const [selectedAlunosIds, setSelectedAlunosIds] = useState<string[]>([])
  const [assignToast, setAssignToast] = useState<string | null>(null)

  // Deterministic progress per workout
  const [workoutProgress] = useState<Record<string, number>>(() => {
    const prog: Record<string, number> = {}
    for (let i = 0; i < 20; i++) {
      prog[String(i)] = 55 + ((i * 23) % 41)
    }
    return prog
  })

  useEffect(() => {
    if (!user) return
    carregarTreinos()
  }, [user, role])

  const carregarTreinos = async () => {
    try {
      setDataState('loading')
      setErrorMessage(null)

      let query = supabase.from('workouts').select('*').order('created_at', { ascending: false })
      if (role === 'personal') query = query.eq('created_by', user?.id)

      const { data, error } = await query
      if (error) { setErrorMessage(error.message); setDataState('error'); return }
      if (!data || data.length === 0) { setTreinos([]); setDataState('empty'); return }

      const workoutsWithCount = await Promise.all(
        data.map(async (treino) => {
          const { data: plansData } = await supabase
            .from('workout_plans')
            .select('id, sets, reps, rest_seconds')
            .eq('workout_id', treino.id)

          let calcDuration = 0
          if (!treino.is_custom_duration && plansData && plansData.length > 0) {
            const totalSecs = plansData.reduce((acc: number, plan: any) => {
              const match = String(plan.reps).match(/\d+/g)
              let reps = 12
              if (match) reps = Math.max(...match.map(Number))
              return acc + (plan.sets * (reps * 2) + plan.rest_seconds)
            }, 0)
            calcDuration = Math.ceil(totalSecs / 60)
          }

          return {
            id: treino.id,
            name: treino.name,
            description: treino.description || '',
            duration_minutes: treino.is_custom_duration ? (treino.duration_minutes || 0) : calcDuration,
            exercises_count: plansData?.length || 0,
            level: (treino.level || 'intermediario') as any,
            icon: '💪'
          }
        })
      )

      setTreinos(workoutsWithCount)
      setDataState('success')
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao carregar treinos')
      setDataState('error')
    }
  }

  const loadAlunos = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles').select('id, name, email, avatar_url').eq('role', 'aluno')
      if (!error && data) setAlunos(data)
    } catch (err) { console.error(err) }
  }

  const toggleAluno = (id: string) =>
    setSelectedAlunosIds(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id])

  const batchAssignTreino = async () => {
    if (!selectedTreinoId) return
    if (selectedAlunosIds.length === 0) {
      setAssignToast('Selecione pelo menos um aluno.')
      setTimeout(() => setAssignToast(null), 3000)
      return
    }
    setSavingAssign(true)
    try {
      const inserts = selectedAlunosIds.map(aId => ({ treino_id: selectedTreinoId, aluno_id: aId }))
      const { error } = await supabase.from('treinos_alunos').upsert(inserts, { onConflict: 'treino_id,aluno_id' })
      if (error) throw error
      setAssignToast('✅ Treino atribuído com sucesso!')
      setTimeout(() => { setAssignToast(null); setAssignModalOpen(false) }, 1500)
    } catch (err: any) {
      setAssignToast('Erro: ' + (err.message || String(err)))
      setTimeout(() => setAssignToast(null), 3000)
    } finally {
      setSavingAssign(false)
    }
  }

  const handleDeleteClick = async (e: React.MouseEvent, treinoId: string) => {
    e.stopPropagation()
    if (window.confirm('Deseja realmente excluir este treino? A ação não pode ser desfeita.')) {
      try {
        const { error } = await supabase.from('workouts').delete().eq('id', treinoId)
        if (error) throw error
        carregarTreinos()
      } catch (err: any) { alert('Erro ao excluir: ' + err.message) }
    }
  }

  const handleAssignClick = async (e: React.MouseEvent, treinoId: string) => {
    e.stopPropagation()
    setSelectedTreinoId(treinoId)
    setSelectedAlunosIds([])
    setSearchAluno('')
    setAssignToast(null)
    setAssignModalOpen(true)
    await loadAlunos()
  }

  const handleCardClick = (treinoId: string) => {
    if (role === 'personal') navigate(`/treinos/editar/${treinoId}`)
    else navigate(`/treinos/executar/${treinoId}`)
  }

  const filteredAlunos = alunos.filter(a =>
    a.name?.toLowerCase().includes(searchAluno.toLowerCase()) ||
    a.email?.toLowerCase().includes(searchAluno.toLowerCase())
  )

  const isTreinosLocked = role !== 'personal' && !hasPermission('Treinos Ativos')
  const { completedCount, percentage } = getCompletionStats(treinos.length)

  return (
    <div className="treinos-page">

      {/* ── Progress Dashboard (Alunos Only) ── */}
      {role !== 'personal' && dataState === 'success' && treinos.length > 0 && (
        <div className="completion-dashboard animate-in slide-in-from-top duration-500">
          <div className="dashboard-content">
            <div className="dashboard-info">
              <div className="info-text">
                <h2 className="dashboard-title">Progresso da Semana</h2>
                <p className="dashboard-subtitle">Você já concluiu <strong>{completedCount}</strong> de {treinos.length} treinos.</p>
              </div>
              <div className="dashboard-percentage">
                <span className="pct-value">{percentage}%</span>
              </div>
            </div>
            <div className="dashboard-progress-track">
              <div 
                className="dashboard-progress-fill" 
                style={{ width: `${percentage}%` }}
              >
                <div className="fill-shimmer" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="treinos-header">
        <div className="header-content">
          <h1 className="page-title">
            {role === 'personal' ? 'Gerenciar Treinos' : 'Meus Treinos'}
          </h1>
          <p className="page-subtitle">
            {role === 'personal' ? 'Crie e gerencie os treinos dos seus alunos' : 'Seus treinos personalizados pelo personal'}
          </p>
          {dataState === 'success' && (
            <div className="header-badge">
              <Flame size={11} />
              {treinos.length} treino{treinos.length !== 1 ? 's' : ''} disponível{treinos.length !== 1 ? 'is' : ''}
            </div>
          )}
        </div>
        {role === 'personal' && dataState !== 'loading' && dataState !== 'error' && (
          <button
            className="flex items-center gap-2 h-11 px-5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/30 border-none shadow-lg shadow-purple-500/25 text-sm"
            onClick={() => navigate('/treinos/criar')}
          >
            <Plus size={17} />
            <span>Novo Treino</span>
          </button>
        )}
      </div>

      {/* ── Cards Grid ── */}
      <DataStateHandler
        state={dataState}
        loadingComponent={<SkeletonList count={4} />}
        errorMessage={errorMessage || 'Erro ao carregar treinos'}
        errorAction={{ label: 'Tentar novamente', onClick: carregarTreinos }}
        emptyTitle="Nenhum treino criado ainda"
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
                progress={workoutProgress[String(index)] ?? 70}
                isRecommended={index === 0 && role !== 'personal'}
                isLocked={isTreinosLocked}
                isCompleted={isWorkoutCompleted(treino.id)}
                onCardClick={handleCardClick}
                onDeleteClick={handleDeleteClick}
                onAssignClick={handleAssignClick}
              />
            ))}
          </div>
        )}
      </DataStateHandler>

      {/* ── Assignment Modal ── */}
      {assignModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
          onClick={() => !savingAssign && setAssignModalOpen(false)}
        >
          <div
            className="bg-[#12121a] rounded-[2rem] w-full max-w-lg p-8 border border-white/10 shadow-2xl shadow-indigo-500/10 flex flex-col gap-6 animate-in zoom-in-95 duration-200 relative overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />

            <div className="flex justify-between items-center z-10">
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Atribuir a Alunos</h3>
                <p className="text-slate-400 text-sm mt-1">Selecione quem fará este treino</p>
              </div>
              <button
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                onClick={() => !savingAssign && setAssignModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="relative z-10">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                className="w-full bg-black/40 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500 focus:bg-white/5 transition-all"
                placeholder="Pesquisar por nome ou email..."
                value={searchAluno}
                onChange={e => setSearchAluno(e.target.value)}
              />
            </div>

            {assignToast && (
              <div className="bg-indigo-500/20 border border-indigo-500/30 text-indigo-200 px-4 py-3 rounded-xl text-sm font-medium z-10 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                {assignToast}
              </div>
            )}

            <div className="flex-1 max-h-[300px] overflow-y-auto pr-2 space-y-2 z-10">
              {alunos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 opacity-50">
                  <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mb-3" />
                  <p className="text-slate-400">Carregando alunos...</p>
                </div>
              ) : filteredAlunos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 opacity-50">
                  <Users size={32} className="text-slate-500 mb-3" />
                  <p className="text-slate-400">Nenhum aluno encontrado</p>
                </div>
              ) : (
                filteredAlunos.map(aluno => {
                  const isSelected = selectedAlunosIds.includes(aluno.id)
                  return (
                    <button
                      key={aluno.id}
                      onClick={() => toggleAluno(aluno.id)}
                      className={`w-full text-left flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 group ${
                        isSelected
                          ? 'bg-indigo-500/15 border-indigo-500/50 shadow-inner'
                          : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold overflow-hidden transition-colors ${
                            isSelected ? 'bg-indigo-500 text-white' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                          }`}>
                            {aluno.avatar_url
                              ? <img src={aluno.avatar_url} alt={aluno.name} className="w-full h-full object-cover" />
                              : aluno.name?.charAt(0).toUpperCase() || 'A'
                            }
                          </div>
                          {isSelected && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#12121a] flex items-center justify-center text-white">
                              <Check size={12} strokeWidth={3} />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className={`font-semibold ${isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>{aluno.name}</p>
                          <p className="text-xs text-slate-400">{aluno.email}</p>
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-white/20 group-hover:border-white/40'
                      }`}>
                        {isSelected && <Check size={14} />}
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-white/10 z-10 w-full">
              <button
                onClick={() => setAssignModalOpen(false)}
                disabled={savingAssign}
                className="flex-1 py-3.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={batchAssignTreino}
                disabled={savingAssign || selectedAlunosIds.length === 0}
                className={`flex-1 py-3.5 px-4 rounded-xl font-semibold transition-all flex justify-center items-center gap-2 ${
                  selectedAlunosIds.length === 0
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:scale-[1.02] text-white shadow-lg shadow-indigo-500/20'
                } disabled:opacity-70`}
              >
                {savingAssign
                  ? <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  : <><Check size={18} /> Confirmar ({selectedAlunosIds.length})</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

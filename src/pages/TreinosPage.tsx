import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSubscription } from '../hooks/useSubscription'
import { supabase } from '../lib/supabase'
import { Dumbbell, FileText, Clock, TrendingUp, Plus, Edit2, ChevronRight, Trash2, Users, Search, X, Check } from 'lucide-react'
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
  onDeleteClick?: (e: React.MouseEvent, id: string) => void
  onAssignClick?: (e: React.MouseEvent, id: string) => void
}

function WorkoutCard({ treino, index, role, progress, onCardClick, onActionClick, onDeleteClick, onAssignClick }: WorkoutCardProps) {
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
          <>
            <button 
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 hover:bg-indigo-500/20 transition-all duration-300 hover:scale-105 text-indigo-400 border border-transparent hover:border-indigo-500/30"
              onClick={(e) => onAssignClick && onAssignClick(e, treino.id)}
              title="Atribuir para Alunos"
            >
              <Users size={16} />
            </button>
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
            <button 
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 hover:bg-red-500/20 transition-all duration-300 hover:scale-105 text-red-500"
              onClick={(e) => onDeleteClick && onDeleteClick(e, treino.id)}
              title="Excluir Treino"
            >
              <Trash2 size={16} />
            </button>
          </>
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
  const [dataState, setDataState] = useState<DataState>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Assignment Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [selectedTreinoId, setSelectedTreinoId] = useState<string | null>(null)
  const [alunos, setAlunos] = useState<any[]>([])
  const [searchAluno, setSearchAluno] = useState('')
  const [savingAssign, setSavingAssign] = useState(false)
  const [selectedAlunosIds, setSelectedAlunosIds] = useState<string[]>([])
  const [assignToast, setAssignToast] = useState<string | null>(null)

  const [workoutProgress] = useState<Record<string, number>>(() => {
    const prog: Record<string, number> = {}
    for (let i = 0; i < 10; i++) {
      prog[String(i)] = Math.floor(Math.random() * 40 + 60)
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
      
      let query = supabase.from('workouts').select('*').order('created_at', { ascending: false });

      if (role === 'personal') {
         query = query.eq('created_by', user?.id)
      }

      const { data, error } = await query

      if (error) {
        setErrorMessage(error.message)
        setDataState('error')
        return
      }

      if (!data || data.length === 0) {
        setTreinos([])
        setDataState('empty')
        return
      }
      
      const workoutsWithCount = await Promise.all(
        data.map(async (treino) => {
          const { data: plansData } = await supabase
            .from('workout_plans')
            .select('id, sets, reps, rest_seconds')
            .eq('workout_id', treino.id)
          
          let calcDuration = 0
          if (!treino.is_custom_duration && plansData && plansData.length > 0) {
             const totalSecs = plansData.reduce((acc, plan) => {
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
        .from('profiles')
        .select('id, name, email, avatar_url')
        .eq('role', 'aluno')

      if (!error && data) {
        setAlunos(data)
      }
    } catch(err) {
      console.error(err)
    }
  }

  const toggleAluno = (alunoId: string) => {
    setSelectedAlunosIds(prev => 
      prev.includes(alunoId) ? prev.filter(id => id !== alunoId) : [...prev, alunoId]
    )
  }

  const batchAssignTreino = async () => {
    if (!selectedTreinoId) return;
    if (selectedAlunosIds.length === 0) {
      setAssignToast('Selecione pelo menos um aluno.');
      setTimeout(() => setAssignToast(null), 3000);
      return;
    }
    setSavingAssign(true);
    try {
      const inserts = selectedAlunosIds.map(aId => ({
        treino_id: selectedTreinoId,
        aluno_id: aId
      }));
      const { error } = await supabase.from('treinos_alunos').upsert(inserts, { onConflict: 'treino_id,aluno_id' });
      if (error) throw error;
      
      setAssignToast('Treino atribuído com sucesso!');
      setTimeout(() => {
         setAssignToast(null);
         setAssignModalOpen(false);
      }, 1500);
    } catch(err: any) {
      setAssignToast('Erro: ' + (err.message || String(err)));
      setTimeout(() => setAssignToast(null), 3000);
    } finally {
      setSavingAssign(false);
    }
  }

  const handleDeleteClick = async (e: React.MouseEvent, treinoId: string) => {
    e.stopPropagation()
    if (window.confirm("Deseja realmente excluir este treino? A ação não pode ser desfeita.")) {
      try {
        const { error } = await supabase.from('workouts').delete().eq('id', treinoId)
        if (error) throw error
        carregarTreinos() // recarregar lista
      } catch (err: any) {
        alert('Erro ao excluir: ' + err.message)
      }
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

  const filteredAlunos = alunos.filter(a => a.name?.toLowerCase().includes(searchAluno.toLowerCase()) || a.email?.toLowerCase().includes(searchAluno.toLowerCase()))

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
                progress={workoutProgress[String(index)] || 0}
                onCardClick={handleCardClick}
                onActionClick={handleActionClick}
                onDeleteClick={handleDeleteClick}
                onAssignClick={handleAssignClick}
              />
            ))}
          </div>
        )}
      </DataStateHandler>

      {/* Modal de Atribuição (Premium) */}
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

            <div className="flex-1 max-h-[300px] overflow-y-auto pr-2 space-y-2 !scrollbar-thin !scrollbar-thumb-white/10 z-10">
              {alunos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 opacity-50">
                   <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mb-3"></div>
                   <p className="text-slate-400">Carregando alunos...</p>
                </div>
              ) : filteredAlunos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 opacity-50">
                   <Users size={32} className="text-slate-500 mb-3" />
                   <p className="text-slate-400">Nenhum aluno encontrado</p>
                </div>
              ) : (
                filteredAlunos.map(aluno => {
                  const isSelected = selectedAlunosIds.includes(aluno.id);
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
                            }`}
                          >
                            {aluno.avatar_url ? (
                              <img src={aluno.avatar_url} alt={aluno.name} className="w-full h-full object-cover" />
                            ) : (
                              aluno.name?.charAt(0).toUpperCase() || 'A'
                            )}
                          </div>
                          {isSelected && (
                             <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#12121a] flex items-center justify-center text-white">
                               <Check size={12} strokeWidth={3} />
                             </div>
                          )}
                        </div>
                        <div>
                          <p className={`font-semibold  ${isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>{aluno.name}</p>
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
                {savingAssign ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <>
                    <Check size={18} />
                    Confirmar ({selectedAlunosIds.length})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

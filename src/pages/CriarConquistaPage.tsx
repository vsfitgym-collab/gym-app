import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Trophy, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface AlunoOption {
  id: string
  name: string
}

const TIPOS_META = [
  { value: 'treinos', label: 'Treinos completados' },
  { value: 'consecutivos', label: 'Dias consecutivos' },
  { value: 'tempo', label: 'Tempo total (minutos)' },
]

const ICONES = ['🏆', '🔥', '⚡', '🎯', '💪', '🌟', '👑', '🥇', '🏅', '💎', '🚀', '⚔️']

type Status = 'idle' | 'loading' | 'success' | 'error'

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-sm font-medium text-gray-300">{children}</label>
}

function ErrorMsg({ msg }: { msg: string }) {
  return <p className="text-xs text-red-400 mt-1 flex items-center gap-1"><AlertCircle size={12} />{msg}</p>
}

export default function CriarConquistaPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const alunoIdFromQuery = searchParams.get('aluno') || ''

  const [alunos, setAlunos] = useState<AlunoOption[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState({
    nome: '',
    descricao: '',
    tipo_meta: 'treinos',
    meta: '',
    icone: '🏆',
    aluno_id: alunoIdFromQuery,
  })

  useEffect(() => {
    const fetchAlunos = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('role', 'aluno')
        .order('name', { ascending: true })
      if (data) setAlunos(data)
    }
    fetchAlunos()
  }, [])

  const set = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.nome.trim()) e.nome = 'Nome é obrigatório'
    if (!form.descricao.trim()) e.descricao = 'Descrição é obrigatória'
    if (!form.meta || isNaN(Number(form.meta)) || Number(form.meta) <= 0)
      e.meta = 'Informe uma meta válida (número maior que 0)'
    if (!form.aluno_id) e.aluno_id = 'Selecione um aluno'
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setStatus('loading')
    try {
      const { error } = await supabase.from('achievements').insert({
        title: form.nome.trim(),
        description: form.descricao.trim(),
        goal_type: form.tipo_meta,
        goal_value: Number(form.meta),
        icon: form.icone,
        user_id: form.aluno_id,
        unlocked: false,
        progress: 0,
        xp: 100,
        category: 'marco',
        rarity: 'comum',
      })

      if (error) throw error
      setStatus('success')
      setTimeout(() => {
        navigate(form.aluno_id ? `/conquistas/aluno/${form.aluno_id}` : '/conquistas')
      }, 1800)
    } catch (err) {
      console.error('Erro ao salvar conquista:', err)
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  const inputBase =
    'w-full bg-white/5 border border-white/10 rounded-xl px-4 h-11 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/50 transition-all duration-200'

  return (
    <div
      className="max-w-xl mx-auto px-4 md:px-6 py-8 text-white"
      style={{ animation: 'fadeSlideIn 0.35s ease both' }}
    >
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Voltar */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6 w-fit"
      >
        <ArrowLeft size={16} />
        Voltar
      </button>

      {/* Título */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Criar Conquista</h1>
        <p className="text-gray-400 mt-1 text-sm">Defina um objetivo personalizado para o aluno.</p>
      </div>

      {/* Card do formulário */}
      <form
        onSubmit={handleSubmit}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 flex flex-col gap-5"
      >
        {/* Nome */}
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Nome da conquista *</FieldLabel>
          <input
            type="text"
            value={form.nome}
            onChange={e => set('nome', e.target.value)}
            placeholder="Ex: Semana Perfeita"
            className={inputBase}
          />
          {errors.nome && <ErrorMsg msg={errors.nome} />}
        </div>

        {/* Descrição */}
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Descrição *</FieldLabel>
          <textarea
            value={form.descricao}
            onChange={e => set('descricao', e.target.value)}
            placeholder="Descreva o que o aluno precisa fazer para conquistar..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 p-4 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/50 transition-all duration-200 min-h-[120px] resize-none"
          />
          {errors.descricao && <ErrorMsg msg={errors.descricao} />}
        </div>

        {/* Tipo de meta + Meta lado a lado */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Tipo de meta *</FieldLabel>
            <select
              value={form.tipo_meta}
              onChange={e => set('tipo_meta', e.target.value)}
              className={`${inputBase} cursor-pointer`}
            >
              {TIPOS_META.map(t => (
                <option key={t.value} value={t.value} className="bg-[#1a1a2e] text-white">
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <FieldLabel>Meta (quantidade) *</FieldLabel>
            <input
              type="number"
              min={1}
              value={form.meta}
              onChange={e => set('meta', e.target.value)}
              placeholder="Ex: 7"
              className={inputBase}
            />
            {errors.meta && <ErrorMsg msg={errors.meta} />}
          </div>
        </div>

        {/* Ícone */}
        <div className="flex flex-col gap-2">
          <FieldLabel>Ícone da conquista</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {ICONES.map(ic => (
              <button
                key={ic}
                type="button"
                onClick={() => set('icone', ic)}
                className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all duration-200 ${
                  form.icone === ic
                    ? 'bg-purple-500/30 border-2 border-purple-500 scale-110'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-105'
                }`}
              >
                {ic}
              </button>
            ))}
          </div>
        </div>

        {/* Aluno vinculado */}
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Aluno vinculado *</FieldLabel>
          <select
            value={form.aluno_id}
            onChange={e => set('aluno_id', e.target.value)}
            className={`${inputBase} cursor-pointer`}
          >
            <option value="" className="bg-[#1a1a2e] text-gray-400">Selecione um aluno...</option>
            {alunos.map(a => (
              <option key={a.id} value={a.id} className="bg-[#1a1a2e] text-white">
                {a.name}
              </option>
            ))}
          </select>
          {errors.aluno_id && <ErrorMsg msg={errors.aluno_id} />}
        </div>

        {/* Feedback de erro global */}
        {status === 'error' && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
            <AlertCircle size={16} />
            Erro ao salvar. Verifique os dados e tente novamente.
          </div>
        )}

        {/* Botão */}
        <button
          type="submit"
          disabled={status === 'loading' || status === 'success'}
          className={`h-12 rounded-xl font-semibold text-white text-sm transition-all duration-300 flex items-center justify-center gap-2 mt-1 ${
            status === 'success'
              ? 'bg-emerald-600'
              : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:scale-[1.02] active:scale-[0.98]'
          }`}
        >
          {status === 'loading' && <Loader2 size={18} className="animate-spin" />}
          {status === 'success' && <CheckCircle2 size={18} />}
          {status === 'loading'
            ? 'Salvando...'
            : status === 'success'
            ? 'Conquista criada!'
            : (
              <>
                <Trophy size={16} />
                Salvar Conquista
              </>
            )}
        </button>
      </form>
    </div>
  )
}

import { useState } from 'react'
import { User, Ruler, Weight, Target, Activity, AlertTriangle, MessageSquare, Save, Loader2, Edit2 } from 'lucide-react'
import type { StudentProfileInput } from '../hooks/useStudentProfile'
import type { StudentProfile } from '../hooks/useStudentProfile'

interface Props {
  onSubmit: (data: StudentProfileInput) => Promise<boolean>
  saving: boolean
  existingProfile?: StudentProfile | null
}

const objetivos = [
  'Emagrecimento',
  'Hipertrofia',
  'Condicionamento Físico',
  'Saúde e Bem-estar',
  'Reabilitação',
  'Performance Esportiva',
]

const niveis = [
  { value: 'iniciante', label: 'Iniciante', desc: 'Nunca treinei ou treino há menos de 6 meses' },
  { value: 'intermediario', label: 'Intermediário', desc: 'Treino regularmente há 6 meses a 2 anos' },
  { value: 'avancado', label: 'Avançado', desc: 'Treino há mais de 2 anos com consistência' },
] as const

export default function StudentProfileForm({ onSubmit, saving, existingProfile }: Props) {
  const isEditing = !!existingProfile

  const [form, setForm] = useState<StudentProfileInput>({
    nome: existingProfile?.nome || '',
    idade: existingProfile?.idade || 0,
    altura: existingProfile?.altura || 0,
    peso: existingProfile?.peso || 0,
    objetivo: existingProfile?.objetivo || '',
    nivel_experiencia: existingProfile?.nivel_experiencia || 'iniciante',
    lesoes: existingProfile?.lesoes || '',
    limitacoes: existingProfile?.limitacoes || '',
    observacoes: existingProfile?.observacoes || '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!form.nome.trim()) e.nome = 'Nome é obrigatório'
    if (!form.idade || form.idade < 10 || form.idade > 100) e.idade = 'Idade inválida (10-100)'
    if (!form.altura || form.altura < 100 || form.altura > 250) e.altura = 'Altura inválida (100-250cm)'
    if (!form.peso || form.peso < 30 || form.peso > 300) e.peso = 'Peso inválido (30-300kg)'
    if (!form.objetivo) e.objetivo = 'Selecione um objetivo'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    await onSubmit(form)
  }

  const update = (field: keyof StudentProfileInput, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n })
  }

  const calcProgress = () => {
    let filled = 0
    if (form.nome.trim()) filled++
    if (form.idade && form.idade > 0) filled++
    if (form.altura && form.altura > 0) filled++
    if (form.peso && form.peso > 0) filled++
    if (form.objetivo) filled++
    return Math.round((filled / 5) * 100)
  }
  const progress = calcProgress()

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-8">
      {/* Header & Progress */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[0_0_20px_rgba(139,92,246,0.15)]">
            {isEditing ? <Edit2 size={28} /> : <User size={28} />}
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent tracking-tight">
              {isEditing ? 'Editar Ficha Técnica' : 'Ficha Técnica'}
            </h2>
            <p className="text-sm text-slate-400">
              {isEditing ? 'Atualize suas informações para o seu personal' : 'Preencha seus dados para montarmos o treino ideal'}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Progresso do Perfil</span>
            <span className={progress === 100 ? 'text-emerald-400' : 'text-purple-400'}>{progress}% Completo</span>
          </div>
          <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5">
            <div 
              className={`h-full transition-all duration-700 ease-out ${progress === 100 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-gradient-to-r from-purple-600 to-indigo-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Card 1: Dados Pessoais */}
        <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <User size={16} />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">Dados Pessoais</h3>
          </div>

          <div className="flex flex-col gap-6">
            {/* Nome */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Nome Completo</label>
              <div className="relative">
                <input
                  type="text"
                  value={form.nome}
                  onChange={e => update('nome', e.target.value)}
                  className={`w-full bg-zinc-950/50 border ${errors.nome ? 'border-red-500/50 focus:ring-red-500/20' : 'border-zinc-800 focus:border-purple-500 focus:ring-purple-500/20'} rounded-xl px-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-4 transition-all`}
                  placeholder="Ex: João da Silva"
                />
              </div>
              {errors.nome && <span className="text-xs text-red-400 ml-1 font-medium">{errors.nome}</span>}
            </div>

            {/* Idade + Altura + Peso */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Idade</label>
                <input
                  type="number"
                  value={form.idade || ''}
                  onChange={e => update('idade', Number(e.target.value))}
                  className={`w-full bg-zinc-950/50 border ${errors.idade ? 'border-red-500/50' : 'border-zinc-800 focus:border-purple-500'} rounded-xl px-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-purple-500/20 transition-all`}
                  placeholder="Anos"
                />
                {errors.idade && <span className="text-xs text-red-400 ml-1 font-medium">{errors.idade}</span>}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1 flex items-center gap-1.5"><Ruler size={12}/> Altura (cm)</label>
                <input
                  type="number"
                  value={form.altura || ''}
                  onChange={e => update('altura', Number(e.target.value))}
                  className={`w-full bg-zinc-950/50 border ${errors.altura ? 'border-red-500/50' : 'border-zinc-800 focus:border-purple-500'} rounded-xl px-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-purple-500/20 transition-all`}
                  placeholder="Ex: 175"
                />
                {errors.altura && <span className="text-xs text-red-400 ml-1 font-medium">{errors.altura}</span>}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1 flex items-center gap-1.5"><Weight size={12}/> Peso (kg)</label>
                <input
                  type="number"
                  value={form.peso || ''}
                  onChange={e => update('peso', Number(e.target.value))}
                  className={`w-full bg-zinc-950/50 border ${errors.peso ? 'border-red-500/50' : 'border-zinc-800 focus:border-purple-500'} rounded-xl px-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-purple-500/20 transition-all`}
                  placeholder="Ex: 75"
                />
                {errors.peso && <span className="text-xs text-red-400 ml-1 font-medium">{errors.peso}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Objetivo */}
        <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Target size={16} />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">Objetivo Principal</h3>
          </div>
          
          <div className="flex flex-wrap gap-4">
            {objetivos.map(obj => (
              <button
                key={obj}
                onClick={() => update('objetivo', obj)}
                className={`px-6 py-3 rounded-full text-sm font-bold border transition-all duration-200 active:scale-95 ${
                  form.objetivo === obj
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                {obj}
              </button>
            ))}
          </div>
          {errors.objetivo && <span className="text-xs text-red-400 font-medium ml-1">{errors.objetivo}</span>}
        </div>

        {/* Card 3: Nível de Experiência */}
        <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Activity size={16} />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">Nível de Experiência</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {niveis.map(n => (
              <button
                key={n.value}
                onClick={() => update('nivel_experiencia', n.value)}
                className={`relative overflow-hidden p-6 rounded-2xl border text-left transition-all duration-200 group hover:-translate-y-1 ${
                  form.nivel_experiencia === n.value
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_4px_20px_rgba(245,158,11,0.15)]'
                    : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05] hover:border-white/20'
                }`}
              >
                {form.nivel_experiencia === n.value && (
                  <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                )}
                <span className={`block font-bold mb-2 ${form.nivel_experiencia === n.value ? 'text-amber-400' : 'text-slate-200'}`}>
                  {n.label}
                </span>
                <span className="block text-xs leading-relaxed text-slate-500">{n.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Card 4: Saúde e Observações */}
        <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400">
              <AlertTriangle size={16} />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">Saúde e Observações</h3>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Lesões ou Restrições</label>
              <textarea
                value={form.lesoes}
                onChange={e => update('lesoes', e.target.value)}
                rows={2}
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all resize-none"
                placeholder="Ex: tendinite no ombro direito, dor na lombar... (opcional)"
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Limitações Físicas</label>
              <textarea
                value={form.limitacoes}
                onChange={e => update('limitacoes', e.target.value)}
                rows={2}
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all resize-none"
                placeholder="Ex: não consigo fazer agachamento completo... (opcional)"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Outras Observações</label>
              <textarea
                value={form.observacoes}
                onChange={e => update('observacoes', e.target.value)}
                rows={2}
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all resize-none"
                placeholder="Algo mais que seu personal deva saber? (opcional)"
              />
            </div>
          </div>
        </div>

        {/* Submit Action */}
        <div className="flex flex-col items-center">
          <button
            onClick={handleSubmit}
            disabled={saving || progress < 100}
            className={`w-fit px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 ${
              progress === 100 && !saving
                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:opacity-90 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]'
                : 'bg-zinc-800 border border-zinc-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            {saving ? (
              <><Loader2 size={20} className="animate-spin" /> Salvando...</>
            ) : progress < 100 ? (
              <>Preencha os dados para enviar</>
            ) : (
              <><Save size={20} /> {isEditing ? 'Atualizar Ficha' : 'Enviar Ficha'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { usePlan } from '../context/PlanContext'
import { supabase } from '../lib/supabase'
import { 
  User, 
  Mail, 
  Crown, 
  CreditCard, 
  Calendar, 
  Clock,
  Check,
  AlertTriangle,
  Loader2,
  LogOut,
  Settings,
  ChevronRight
} from 'lucide-react'

interface ProfileData {
  name: string
  email: string
  role: string
  plan: string
  plan_expires_at: string | null
  trial_ends_at: string | null
  is_trial_active: boolean
  created_at: string
}

export default function ProfilePage() {
  const { user, role, signOut } = useAuth()
  const { userPlan, loading: planLoading, refreshPlan } = usePlan()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProfile()
  }, [user])

  const loadProfile = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error

      setProfile(data)
    } catch (err) {
      console.error('Error loading profile:', err)
      setError('Erro ao carregar perfil')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    if (confirm('Tem certeza que deseja sair?')) {
      await signOut()
    }
  }

  const getStatusInfo = () => {
    if (!profile) return { label: 'Carregando...', color: 'gray', icon: Loader2 }

    if (userPlan?.isTrial) {
      return { 
        label: 'Teste Premium', 
        color: 'amber', 
        icon: Crown,
        subtitle: `${userPlan.trialDaysRemaining} dias restantes`
      }
    }

    if (userPlan?.plan === 'personal') {
      return { 
        label: 'Personal Trainer', 
        color: 'blue', 
        icon: Crown,
        subtitle: 'Acesso total'
      }
    }

    if (userPlan?.isActive) {
      return { 
        label: 'Ativo', 
        color: 'green', 
        icon: Check,
        subtitle: profile.plan_expires_at 
          ? `Expira em ${new Date(profile.plan_expires_at).toLocaleDateString('pt-BR')}`
          : 'Plano ativo'
      }
    }

    return { 
      label: 'Plano Expirado', 
      color: 'red', 
      icon: AlertTriangle,
      subtitle: 'Renove para continuar'
    }
  }

  const getPlanDisplayName = () => {
    if (!profile) return 'Carregando...'

    if (userPlan?.isTrial) return 'Teste Premium'
    if (profile.role === 'personal') return 'Personal Trainer'
    
    const planMap: Record<string, string> = {
      'basic': 'Plano Essencial',
      'pro': 'Plano Personal',
      'premium': 'Plano Elite',
      'free': 'Plano Gratuito'
    }
    
    return planMap[profile.plan] || profile.plan || 'Plano Gratuito'
  }

  const getRoleDisplayName = () => {
    const roleMap: Record<string, string> = {
      'user': 'Aluno',
      'personal': 'Personal Trainer',
      'admin': 'Administrador'
    }
    return roleMap[profile?.role || ''] || profile?.role || 'Usuário'
  }

  if (loading || planLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] text-slate-400 gap-4">
        <Loader2 className="animate-spin text-purple-500" size={32} />
        <span className="font-medium tracking-wide">Carregando perfil...</span>
      </div>
    )
  }

  const statusInfo = getStatusInfo()
  const StatusIcon = statusInfo.icon

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent tracking-tight">
            Meu Perfil
          </h1>
          <p className="text-sm text-slate-500">Gerencie sua conta e assinatura</p>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all text-sm font-semibold shadow-sm">
          <LogOut size={16} /> <span className="hidden sm:inline">Sair da Conta</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3 font-medium">
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* User Card */}
          <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 flex flex-col items-center text-center relative overflow-hidden group">
            {/* Glow effect */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-purple-500/20 transition-colors duration-500" />
            
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-purple-600 to-cyan-500 p-[3px] shadow-[0_0_30px_rgba(139,92,246,0.2)] group-hover:shadow-[0_0_40px_rgba(139,92,246,0.3)] transition-shadow duration-500">
                <div className="w-full h-full bg-zinc-950 rounded-full flex items-center justify-center text-4xl font-bold text-transparent bg-gradient-to-tr from-purple-400 to-cyan-300 bg-clip-text">
                  {profile?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              </div>
              
              <div className="flex flex-col gap-2 items-center">
                <h2 className="text-xl font-bold text-white">{profile?.name || 'Usuário'}</h2>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-slate-300 shadow-sm">
                  <User size={14} className="text-purple-400" />
                  {getRoleDisplayName()}
                </div>
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 flex flex-col gap-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Settings size={14} /> Detalhes da Conta
            </h3>
            
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 shrink-0">
                  <Mail size={18} />
                </div>
                <div className="flex flex-col gap-1 overflow-hidden">
                  <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Email</span>
                  <span className="text-sm font-medium text-slate-200 truncate">{profile?.email || user?.email || 'Não informado'}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 shrink-0">
                  <Calendar size={18} />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Membro desde</span>
                  <span className="text-sm font-medium text-slate-200">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Não disponível'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Subscription Card */}
          <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 relative overflow-hidden group flex flex-col sm:flex-row items-start justify-between gap-6">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-cyan-500/10 opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] uppercase tracking-widest font-bold border ${statusInfo.color === 'green' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : statusInfo.color === 'amber' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : statusInfo.color === 'blue' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                  <StatusIcon size={12} strokeWidth={3} /> {statusInfo.label}
                </div>
                <h3 className="text-2xl font-bold text-white tracking-tight">{getPlanDisplayName()}</h3>
              </div>
              <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
                {statusInfo.subtitle || 'Você tem acesso a todos os recursos premium do seu plano atual.'}
              </p>
            </div>

            <button className="relative z-10 shrink-0 w-fit px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:opacity-90 transition shadow-[0_0_20px_rgba(139,92,246,0.2)] text-white font-bold flex items-center justify-center gap-2">
              Gerenciar Assinatura
            </button>
          </div>

          {/* Quick Settings */}
          <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 flex flex-col gap-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Settings size={14} /> Preferências do Aplicativo
            </h3>
            
            <div className="flex flex-col gap-4">
              {[
                { label: 'Editar Perfil Pessoal', icon: User, desc: 'Atualize seu nome e informações' },
                { label: 'Preferências de Notificação', icon: Mail, desc: 'Gerencie alertas e e-mails' },
                { label: 'Privacidade e Segurança', icon: Check, desc: 'Senha e proteção de conta' },
              ].map((setting, idx) => (
                <button key={idx} className="w-full flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.03] hover:bg-zinc-800/60 hover:border-white/10 transition group text-left">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-zinc-800/60 text-slate-400 flex items-center justify-center group-hover:text-purple-400 group-hover:bg-purple-500/10 transition-colors shadow-inner">
                      <setting.icon size={20} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="block font-semibold text-slate-200 group-hover:text-white transition-colors">{setting.label}</span>
                      <span className="block text-xs text-slate-500">{setting.desc}</span>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-slate-600 group-hover:text-purple-400 transition-colors" />
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useUserRole } from '../hooks/useUserRole'
import {
  DollarSign,
  Calendar,
  Users,
  AlertTriangle,
  Download,
  ChevronDown,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowUpRight,
  Search,
  X,
  Crown,
  Zap,
  Loader2,
} from 'lucide-react'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import CardBloqueio from '../components/CardBloqueio'
import { useSubscription } from '../hooks/useSubscription'
import './Financeiro.css'

interface Student {
  id: string
  name: string
  email: string
  plan: string
  planPrice: number
  status: 'active' | 'late' | 'pending'
  lastPayment: string
  totalPaid: number
  nextPayment: string
}

interface MonthlyRevenue {
  month: string
  revenue: number
  students: number
}

interface PaymentStats {
  totalRevenue: number
  monthlyRevenue: number
  activeStudents: number
  lateStudents: number
  monthlyGrowth: number
}

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const periodOptions = [
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
  { value: 'year', label: 'Ano' },
]

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  basic: 'Básico',
  premium: 'Premium',
}

const PLAN_PRICES: Record<string, number> = {
  free: 0,
  basic: 14.9,
  premium: 29.9,
}

export default function FinanceiroPage() {
  const { user } = useAuth()
  const { role } = useUserRole()
  const { isPremium } = useSubscription()
  const [period, setPeriod] = useState('month')
  const [students, setStudents] = useState<Student[]>([])
  const [revenueData, setRevenueData] = useState<MonthlyRevenue[]>([])
  const [stats, setStats] = useState<PaymentStats>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    activeStudents: 0,
    lateStudents: 0,
    monthlyGrowth: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  useEffect(() => {
    if (!user) return
    loadData()
  }, [user, period])

  const loadData = async () => {
    if (!user) return
    setLoading(true)
    try {
      await Promise.all([loadStudents(), loadRevenueAndStats()])
    } catch (error) {
      console.error('FinanceiroPage: Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStudents = async () => {
    // Buscar perfis de alunos
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, email, plan, plan_expires_at')
      .eq('role', 'aluno')

    if (profilesError || !profiles) return

    // Buscar subscriptions para todos os alunos
    const studentIds = profiles.map(p => p.id)

    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('user_id, plan, status, end_date')
      .in('user_id', studentIds)

    // Buscar pagamentos aprovados para cada aluno
    const { data: approvedPayments } = await supabase
      .from('pending_payments')
      .select('user_id, amount, reviewed_at')
      .eq('status', 'approved')
      .in('user_id', studentIds)
      .order('reviewed_at', { ascending: false })

    const subMap = new Map(subscriptions?.map(s => [s.user_id, s]) ?? [])
    const paymentsByUser = new Map<string, Array<{ amount: number; reviewed_at: string }>>()

    for (const p of approvedPayments ?? []) {
      if (!paymentsByUser.has(p.user_id)) paymentsByUser.set(p.user_id, [])
      paymentsByUser.get(p.user_id)!.push({ amount: p.amount, reviewed_at: p.reviewed_at })
    }

    const now = new Date()

    const enriched: Student[] = profiles.map(profile => {
      const sub = subMap.get(profile.id)
      const payments = paymentsByUser.get(profile.id) ?? []
      const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0)
      const lastPayment = payments[0]?.reviewed_at
        ? new Date(payments[0].reviewed_at).toLocaleDateString('pt-BR')
        : 'Nunca'

      const planKey = sub?.plan ?? profile.plan ?? 'free'
      const planPrice = PLAN_PRICES[planKey] ?? 0

      let status: 'active' | 'late' | 'pending' = 'pending'
      if (sub) {
        if (sub.status === 'active' || sub.status === 'trial') {
          status = 'active'
        } else if (sub.status === 'canceled' || sub.status === 'expired') {
          status = 'late'
        }
      } else if (payments.length > 0) {
        status = 'active'
      }

      const endDate = sub?.end_date ? new Date(sub.end_date) : null
      const nextPayment = endDate && endDate > now
        ? endDate.toLocaleDateString('pt-BR')
        : '-'

      return {
        id: profile.id,
        name: profile.name || profile.email?.split('@')[0] || 'Aluno',
        email: profile.email || '',
        plan: PLAN_LABELS[planKey] ?? planKey,
        planPrice,
        status,
        lastPayment,
        totalPaid,
        nextPayment,
      }
    })

    setStudents(enriched)
  }

  const loadRevenueAndStats = async () => {
    const { data: payments } = await supabase
      .from('pending_payments')
      .select('amount, reviewed_at, user_id')
      .eq('status', 'approved')
      .order('reviewed_at', { ascending: true })

    if (!payments || payments.length === 0) {
      setRevenueData([])
      setStats({
        totalRevenue: 0,
        monthlyRevenue: 0,
        activeStudents: 0,
        lateStudents: 0,
        monthlyGrowth: 0,
      })
      return
    }

    // Calcular dados do gráfico por mês (últimos 6 meses)
    const now = new Date()
    const monthlyMap = new Map<string, { revenue: number; studentIds: Set<string> }>()

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      monthlyMap.set(key, { revenue: 0, studentIds: new Set() })
    }

    for (const p of payments) {
      if (!p.reviewed_at) continue
      const d = new Date(p.reviewed_at)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      if (monthlyMap.has(key)) {
        const month = monthlyMap.get(key)!
        month.revenue += Number(p.amount)
        month.studentIds.add(p.user_id)
      }
    }

    const revenueArray: MonthlyRevenue[] = []
    monthlyMap.forEach((val, key) => {
      const [year, month] = key.split('-').map(Number)
      revenueArray.push({
        month: MONTH_NAMES[month],
        revenue: val.revenue,
        students: val.studentIds.size,
      })
    })

    setRevenueData(revenueArray)

    // Stats
    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0)

    const currentMonthKey = `${now.getFullYear()}-${now.getMonth()}`
    const prevMonthKey = `${now.getFullYear()}-${now.getMonth() - 1 < 0 ? 11 : now.getMonth() - 1}`
    const currentMonthRev = monthlyMap.get(currentMonthKey)?.revenue ?? 0
    const prevMonthRev = monthlyMap.get(prevMonthKey)?.revenue ?? 0
    const monthlyGrowth = prevMonthRev > 0
      ? Math.round(((currentMonthRev - prevMonthRev) / prevMonthRev) * 100 * 10) / 10
      : 0

    // Contar alunos ativos
    const { data: activeSubs } = await supabase
      .from('subscriptions')
      .select('user_id, status')
      .in('status', ['active', 'trial'])

    const { data: allAlunos } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'aluno')

    const activeCount = activeSubs?.length ?? 0
    const totalAlunos = allAlunos?.length ?? 0
    const lateCount = Math.max(0, totalAlunos - activeCount)

    setStats({
      totalRevenue,
      monthlyRevenue: currentMonthRev,
      activeStudents: activeCount,
      lateStudents: lateCount,
      monthlyGrowth,
    })
  }

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="status-badge active"><CheckCircle2 size={12} /> Ativo</span>
      case 'late':
        return <span className="status-badge late"><XCircle size={12} /> Atrasado</span>
      case 'pending':
        return <span className="status-badge pending"><Clock size={12} /> Pendente</span>
      default:
        return null
    }
  }

  const getPlanIcon = (planName: string) => {
    if (planName === 'Premium') return <Crown size={14} />
    if (planName === 'Básico') return <Zap size={14} />
    return null
  }

  const exportToPDF = () => {
    const now = new Date()
    const dateStr = now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    const statusMap: Record<string, string> = { active: 'Ativo', late: 'Atrasado', pending: 'Pendente' }
    const totalRevFormatted = stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
    const monthRevFormatted = stats.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })

    const studentRows = students.map(s => {
      const statusColor = s.status === 'active' ? '#166534' : s.status === 'late' ? '#991b1b' : '#854d0e'
      const statusBg = s.status === 'active' ? '#dcfce7' : s.status === 'late' ? '#fee2e2' : '#fef9c3'
      return `<tr>
        <td style="padding:10px 12px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#8b5cf6,#7c3aed);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:12px;flex-shrink:0;">${s.name.charAt(0).toUpperCase()}</div>
            <div><div style="font-weight:600;color:#1a1a2e;">${s.name}</div><div style="font-size:10px;color:#888;">${s.email}</div></div>
          </div>
        </td>
        <td style="padding:10px 8px;text-align:center;"><span style="background:${s.plan === 'Premium' ? '#f5f0ff' : s.plan === 'Básico' ? '#f0f9ff' : '#f3f4f6'};color:${s.plan === 'Premium' ? '#7c3aed' : s.plan === 'Básico' ? '#0369a1' : '#374151'};padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;">${s.plan}</span></td>
        <td style="padding:10px 8px;text-align:center;"><span style="background:${statusBg};color:${statusColor};padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;">${statusMap[s.status] || s.status}</span></td>
        <td style="padding:10px 8px;text-align:right;font-weight:600;">R$ ${s.planPrice.toFixed(2).replace('.', ',')}</td>
        <td style="padding:10px 8px;text-align:center;font-size:12px;">${s.lastPayment}</td>
        <td style="padding:10px 8px;text-align:right;font-weight:700;color:#7c3aed;">R$ ${s.totalPaid.toFixed(2).replace('.', ',')}</td>
        <td style="padding:10px 8px;text-align:center;font-size:12px;">${s.nextPayment}</td>
      </tr>`
    }).join('')

    const maxRev = Math.max(...revenueData.map(r => r.revenue), 1)
    const chartBars = revenueData.map(d => {
      const heightPct = Math.max(5, Math.round((d.revenue / maxRev) * 100))
      return `<div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;">
        <div style="font-size:10px;font-weight:700;color:#7c3aed;">${d.revenue > 0 ? 'R$' + Math.round(d.revenue).toLocaleString('pt-BR') : '-'}</div>
        <div style="width:100%;background:#f3e8ff;border-radius:6px 6px 0 0;height:80px;display:flex;align-items:flex-end;">
          <div style="width:100%;background:linear-gradient(180deg,#8b5cf6,#7c3aed);border-radius:6px 6px 0 0;height:${heightPct}%;"></div>
        </div>
        <div style="font-size:11px;color:#666;font-weight:500;">${d.month}</div>
      </div>`
    }).join('')

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Relatório Financeiro — VSFit Gym</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#1a1a2e;padding:24px;}
@page{margin:1.5cm;size:A4 landscape;}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;padding:0;}.no-print{display:none!important;}}
.header{background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);color:white;padding:28px 36px;display:flex;justify-content:space-between;align-items:center;border-radius:12px;margin-bottom:20px;}
.header h1{font-size:22px;font-weight:800;letter-spacing:-0.5px;}
.header .sub{font-size:12px;color:rgba(255,255,255,0.6);margin-top:4px;}
.header .right{text-align:right;}
.header .badge{background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.2);padding:6px 14px;border-radius:20px;font-size:11px;color:rgba(255,255,255,0.8);}
.header .date{font-size:12px;color:rgba(255,255,255,0.5);margin-top:6px;}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;}
.sc{background:#fafafa;border:1.5px solid #e5e7eb;border-radius:10px;padding:16px;}
.sc .lb{font-size:11px;color:#6b7280;font-weight:500;text-transform:uppercase;letter-spacing:0.5px;}
.sc .vl{font-size:20px;font-weight:800;color:#1a1a2e;margin-top:4px;letter-spacing:-0.5px;}
.sc .sb{font-size:11px;margin-top:2px;font-weight:600;}
.sc.purple{border-color:#ddd6fe;} .sc.purple .vl{color:#7c3aed;}
.sc.green{border-color:#bbf7d0;} .sc.green .vl{color:#15803d;}
.sc.blue{border-color:#bae6fd;} .sc.blue .vl{color:#0369a1;}
.sc.red{border-color:#fecaca;} .sc.red .vl{color:#dc2626;}
.section{margin-bottom:20px;}
.stitle{font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #8b5cf6;padding-bottom:6px;margin-bottom:12px;}
.chart{display:flex;align-items:flex-end;gap:8px;padding:12px;background:#fafafa;border:1.5px solid #e5e7eb;border-radius:10px;height:130px;}
table{width:100%;border-collapse:collapse;font-size:12px;}
thead tr{background:linear-gradient(135deg,#8b5cf6,#7c3aed);color:white;}
thead th{padding:10px 12px;text-align:left;font-size:11px;font-weight:600;letter-spacing:0.3px;}
tbody tr{border-bottom:1px solid #f3f4f6;}
tbody tr:nth-child(even){background:#f9fafb;}
.footer{margin-top:24px;padding-top:12px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;}
.footer p{font-size:10px;color:#9ca3af;}
.pbtn{position:fixed;bottom:24px;right:24px;background:linear-gradient(135deg,#8b5cf6,#7c3aed);color:white;border:none;padding:14px 28px;border-radius:50px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 4px 20px rgba(139,92,246,0.4);z-index:9999;}
</style>
</head>
<body>
<button class="pbtn no-print" onclick="window.print()">⬇ Salvar como PDF</button>
<div class="header">
  <div><h1>🏋️ VSFit Gym — Relatório Financeiro</h1><p class="sub">Controle financeiro completo de alunos e assinaturas</p></div>
  <div class="right"><div class="badge">📊 ${students.length} aluno${students.length !== 1 ? 's' : ''}</div><div class="date">Gerado em ${dateStr}</div></div>
</div>
<div class="stats">
  <div class="sc purple"><div class="lb">Receita Total</div><div class="vl">R$ ${totalRevFormatted}</div><div class="sb" style="color:#7c3aed;">acumulado</div></div>
  <div class="sc green"><div class="lb">Receita do Mês</div><div class="vl">R$ ${monthRevFormatted}</div><div class="sb" style="color:${stats.monthlyGrowth >= 0 ? '#15803d' : '#dc2626'};">${stats.monthlyGrowth >= 0 ? '+' : ''}${stats.monthlyGrowth}% vs anterior</div></div>
  <div class="sc blue"><div class="lb">Alunos Ativos</div><div class="vl">${stats.activeStudents}</div><div class="sb" style="color:#0369a1;">assinaturas ativas</div></div>
  <div class="sc red"><div class="lb">Sem Assinatura</div><div class="vl">${stats.lateStudents}</div><div class="sb" style="color:#dc2626;">precisam atenção</div></div>
</div>
${revenueData.length > 0 ? `<div class="section"><div class="stitle">Evolução da Receita — Últimos 6 Meses</div><div class="chart">${chartBars}</div></div>` : ''}
<div class="section">
  <div class="stitle">Alunos e Pagamentos</div>
  <table>
    <thead><tr><th>Aluno</th><th style="text-align:center;">Plano</th><th style="text-align:center;">Status</th><th style="text-align:right;">Mensalidade</th><th style="text-align:center;">Último Pag.</th><th style="text-align:right;">Total Pago</th><th style="text-align:center;">Próx. Venc.</th></tr></thead>
    <tbody>${studentRows || '<tr><td colspan="7" style="text-align:center;padding:20px;color:#9ca3af;">Nenhum aluno cadastrado</td></tr>'}</tbody>
  </table>
</div>
<div class="footer"><p>VSFit Gym — Sistema de Gestão Fitness · Relatório gerado automaticamente</p><p>${dateStr}</p></div>
</body></html>`

    const win = window.open('', '_blank', 'width=1200,height=800')
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.focus()
  }

  if (loading) {
    return (
      <div className="financeiro-page">
        <div className="financeiro-loading">
          <Loader2 size={32} className="spinner" />
          <span>Carregando dados financeiros...</span>
        </div>
      </div>
    )
  }

  if (role !== 'personal' && !isPremium) {
    return (
      <div className="financeiro-page">
        <div className="financeiro-header">
          <div className="header-info">
            <h1>Financeiro</h1>
            <p>Visão geral dos seus ganhos</p>
          </div>
        </div>
        <CardBloqueio feature="controle financeiro completo" />
      </div>
    )
  }

  return (
    <div className="financeiro-page">
      {/* Header */}
      <div className="financeiro-header">
        <div className="header-info">
          <h1>Financeiro</h1>
          <p>Visão geral dos seus ganhos</p>
        </div>
        <div className="header-actions">
          <div className="period-filter">
            {periodOptions.map(opt => (
              <button
                key={opt.value}
                className={`period-btn ${period === opt.value ? 'active' : ''}`}
                onClick={() => setPeriod(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button className="btn-export" onClick={exportToPDF}>
            <Download size={16} />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="finance-stats">
        <div className="finance-stat-card">
          <div className="stat-card-header">
            <div className="stat-icon revenue">
              <DollarSign size={20} />
            </div>
            <span className={`stat-trend ${stats.monthlyGrowth >= 0 ? 'up' : 'down'}`}>
              <ArrowUpRight size={12} />
              {stats.monthlyGrowth >= 0 ? '+' : ''}{stats.monthlyGrowth}%
            </span>
          </div>
          <div className="stat-card-content">
            <span className="stat-value">R$ {stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            <span className="stat-label">Receita total</span>
          </div>
        </div>

        <div className="finance-stat-card">
          <div className="stat-card-header">
            <div className="stat-icon monthly">
              <Calendar size={20} />
            </div>
          </div>
          <div className="stat-card-content">
            <span className="stat-value">R$ {stats.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            <span className="stat-label">Receita do mês</span>
          </div>
        </div>

        <div className="finance-stat-card">
          <div className="stat-card-header">
            <div className="stat-icon students">
              <Users size={20} />
            </div>
          </div>
          <div className="stat-card-content">
            <span className="stat-value">{stats.activeStudents}</span>
            <span className="stat-label">Alunos ativos</span>
          </div>
        </div>

        <div className="finance-stat-card">
          <div className="stat-card-header">
            <div className="stat-icon late">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="stat-card-content">
            <span className="stat-value">{stats.lateStudents}</span>
            <span className="stat-label">Sem assinatura</span>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="finance-card finance-card-wide">
        <div className="card-header">
          <div className="card-title">
            <h2>Evolução da Receita</h2>
            <span>Últimos 6 meses</span>
          </div>
        </div>
        {revenueData.length > 0 ? (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => v === 0 ? 'R$0' : `R$${(v / 1000).toFixed(1)}k`}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(21, 21, 31, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  }}
                  labelStyle={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                  formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Receita'] as const}
                />
                <Bar
                  dataKey="revenue"
                  fill="url(#revenueGradient)"
                  radius={[6, 6, 0, 0]}
                  animationDuration={800}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="students-empty" style={{ padding: '3rem' }}>
            <DollarSign size={40} />
            <p>Nenhum pagamento registrado ainda</p>
          </div>
        )}
      </div>

      {/* Students List */}
      <div className="finance-card finance-card-full">
        <div className="card-header">
          <div className="card-title">
            <h2>Alunos e Pagamentos</h2>
            <span>{students.length} aluno{students.length !== 1 ? 's' : ''} cadastrado{students.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="card-actions">
            <div className="search-input">
              <Search size={14} />
              <input
                type="text"
                placeholder="Buscar aluno..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="students-list">
          {filteredStudents.length === 0 ? (
            <div className="students-empty">
              <Users size={40} />
              <p>Nenhum aluno encontrado</p>
            </div>
          ) : (
            filteredStudents.map((student) => (
              <div key={student.id} className="student-row">
                <div className="student-info">
                  <div className="student-avatar">
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="student-details">
                    <span className="student-name">{student.name}</span>
                    <span className="student-plan">
                      {getPlanIcon(student.plan)} {student.plan}
                    </span>
                  </div>
                </div>
                <div className="student-status">
                  {getStatusBadge(student.status)}
                </div>
                <div className="student-value">
                  <span className="value-amount">R$ {student.planPrice.toFixed(2).replace('.', ',')}</span>
                  <span className="value-label">/mês</span>
                </div>
                <div className="student-payment">
                  <span className="payment-date">Último: {student.lastPayment}</span>
                </div>
                <button
                  className="btn-details"
                  onClick={() => setSelectedStudent(student)}
                >
                  Detalhes
                  <ChevronDown size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="student-modal-overlay" onClick={() => setSelectedStudent(null)}>
          <div className="student-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-student-info">
                <div className="modal-avatar">
                  {selectedStudent.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3>{selectedStudent.name}</h3>
                  <span>{selectedStudent.email}</span>
                </div>
              </div>
              <button className="modal-close" onClick={() => setSelectedStudent(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-stats">
                <div className="modal-stat">
                  <span className="modal-stat-label">Plano</span>
                  <span className="modal-stat-value">{selectedStudent.plan}</span>
                </div>
                <div className="modal-stat">
                  <span className="modal-stat-label">Valor mensal</span>
                  <span className="modal-stat-value">R$ {selectedStudent.planPrice.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="modal-stat">
                  <span className="modal-stat-label">Total pago</span>
                  <span className="modal-stat-value">R$ {selectedStudent.totalPaid.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="modal-stat">
                  <span className="modal-stat-label">Próxima cobrança</span>
                  <span className="modal-stat-value">{selectedStudent.nextPayment}</span>
                </div>
              </div>
              <div className="modal-history">
                <h4>Informações de Status</h4>
                <div className="payment-history">
                  <div className={`payment-item ${selectedStudent.status === 'active' ? 'paid' : 'late'}`}>
                    {selectedStudent.status === 'active' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                    <div className="payment-item-info">
                      <span className="payment-item-label">Status da assinatura</span>
                      <span className="payment-item-date">Último pagamento: {selectedStudent.lastPayment}</span>
                    </div>
                    <span className="payment-item-amount">
                      {selectedStudent.status === 'active' ? 'Ativo' : selectedStudent.status === 'late' ? 'Atrasado' : 'Pendente'}
                    </span>
                  </div>
                  {selectedStudent.nextPayment !== '-' && (
                    <div className="payment-item">
                      <Clock size={16} />
                      <div className="payment-item-info">
                        <span className="payment-item-label">Próximo vencimento</span>
                        <span className="payment-item-date">{selectedStudent.nextPayment}</span>
                      </div>
                      <span className="payment-item-amount">R$ {selectedStudent.planPrice.toFixed(2).replace('.', ',')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

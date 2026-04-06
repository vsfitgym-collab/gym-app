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
  Plus,
  Bell,
  ChevronDown,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowUpRight,
  Search,
  X,
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

const periodOptions = [
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
  { value: 'year', label: 'Ano' },
]

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
    if (!user) {
      console.log('FinanceiroPage: User not loaded, skipping...')
      return
    }
    loadData()
  }, [user, period])

  const loadData = async () => {
    if (!user) return
    setLoading(true)
    try {
      console.log('FinanceiroPage: Loading data for user:', user.id)
      await Promise.all([loadStudents(), loadRevenueData(), loadStats()])
      console.log('FinanceiroPage: Data loaded successfully')
    } catch (error) {
      console.error('FinanceiroPage: Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStudents = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, name, email, plan, plan_price, status, last_payment, total_paid, next_payment')
      .eq('role', 'aluno')

    if (data) {
      setStudents(data.map((p: any) => ({
        id: p.id,
        name: p.name || p.email?.split('@')[0] || 'Aluno',
        email: p.email || '',
        plan: p.plan || 'Básico',
        planPrice: p.plan_price || 0,
        status: p.status || 'active',
        lastPayment: p.last_payment || 'Nunca',
        totalPaid: p.total_paid || 0,
        nextPayment: p.next_payment || '-',
      })))
    }
  }

  const loadRevenueData = async () => {
    const mockData: MonthlyRevenue[] = [
      { month: 'Jan', revenue: 2400, students: 8 },
      { month: 'Fev', revenue: 3200, students: 10 },
      { month: 'Mar', revenue: 2800, students: 9 },
      { month: 'Abr', revenue: 3600, students: 12 },
      { month: 'Mai', revenue: 4200, students: 14 },
      { month: 'Jun', revenue: 3800, students: 13 },
    ]
    setRevenueData(mockData)
  }

  const loadStats = async () => {
    const mockStats: PaymentStats = {
      totalRevenue: 24500,
      monthlyRevenue: 4200,
      activeStudents: 14,
      lateStudents: 3,
      monthlyGrowth: 12.5,
    }
    setStats(mockStats)
  }

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
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

  const exportToCSV = () => {
    const headers = ['Nome', 'Email', 'Plano', 'Valor Mensal', 'Status', 'Último Pagamento', 'Total Pago', 'Próxima Cobrança']
    const statusMap: Record<string, string> = { active: 'Ativo', late: 'Atrasado', pending: 'Pendente' }
    
    const rows = students.map(s => [
      s.name,
      s.email,
      s.plan,
      `R$ ${s.planPrice.toFixed(2)}`,
      statusMap[s.status] || s.status,
      s.lastPayment,
      `R$ ${s.totalPaid.toFixed(2)}`,
      s.nextPayment,
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `relatorio_financeiro_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="financeiro-page">
        <div className="financeiro-loading">
          <div className="spinner" />
          <span>Carregando dados financeiros...</span>
        </div>
      </div>
    )
  }

   // Allow personal role access to finance regardless of plan
   // Only block non-personal users who aren't premium
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
          <button className="btn-export" onClick={exportToCSV}>
            <Download size={16} />
            Exportar
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
            <span className="stat-trend up">
              <ArrowUpRight size={12} />
              +{stats.monthlyGrowth}%
            </span>
          </div>
          <div className="stat-card-content">
            <span className="stat-value">R$ {stats.totalRevenue.toLocaleString('pt-BR')}</span>
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
            <span className="stat-value">R$ {stats.monthlyRevenue.toLocaleString('pt-BR')}</span>
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
            <span className="stat-label">Inadimplentes</span>
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
                tickFormatter={(v) => `R$${v / 1000}k`}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(21, 21, 31, 0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                }}
                labelStyle={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'Receita'] as const}
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
      </div>

      {/* Students List */}
      <div className="finance-card finance-card-full">
        <div className="card-header">
          <div className="card-title">
            <h2>Alunos e Pagamentos</h2>
            <span>{students.length} alunos cadastrados</span>
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
            <button className="btn-add" onClick={() => {}}>
              <Plus size={14} />
              Adicionar
            </button>
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
                    <span className="student-plan">{student.plan}</span>
                  </div>
                </div>
                <div className="student-status">
                  {getStatusBadge(student.status)}
                </div>
                <div className="student-value">
                  <span className="value-amount">R$ {student.planPrice.toLocaleString('pt-BR')}</span>
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
                  <span className="modal-stat-value">R$ {selectedStudent.planPrice}</span>
                </div>
                <div className="modal-stat">
                  <span className="modal-stat-label">Total pago</span>
                  <span className="modal-stat-value">R$ {selectedStudent.totalPaid}</span>
                </div>
                <div className="modal-stat">
                  <span className="modal-stat-label">Próxima cobrança</span>
                  <span className="modal-stat-value">{selectedStudent.nextPayment}</span>
                </div>
              </div>
              <div className="modal-history">
                <h4>Histórico de Pagamentos</h4>
                <div className="payment-history">
                  <div className="payment-item paid">
                    <CheckCircle2 size={16} />
                    <div className="payment-item-info">
                      <span className="payment-item-label">Pagamento mensal</span>
                      <span className="payment-item-date">15/03/2026</span>
                    </div>
                    <span className="payment-item-amount">R$ {selectedStudent.planPrice}</span>
                  </div>
                  <div className="payment-item paid">
                    <CheckCircle2 size={16} />
                    <div className="payment-item-info">
                      <span className="payment-item-label">Pagamento mensal</span>
                      <span className="payment-item-date">15/02/2026</span>
                    </div>
                    <span className="payment-item-amount">R$ {selectedStudent.planPrice}</span>
                  </div>
                  <div className="payment-item late">
                    <XCircle size={16} />
                    <div className="payment-item-info">
                      <span className="payment-item-label">Pagamento mensal</span>
                      <span className="payment-item-date">15/01/2026</span>
                    </div>
                    <span className="payment-item-amount">R$ {selectedStudent.planPrice}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-notify">
                <Bell size={14} />
                Cobrar aluno
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

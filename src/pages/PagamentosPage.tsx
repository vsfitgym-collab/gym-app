import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { 
  CreditCard, Search, Download, Plus, 
  TrendingUp, TrendingDown, DollarSign, 
  Clock, CheckCircle, XCircle, MoreVertical,
  Activity
} from 'lucide-react'
import './Pagamentos.css'

interface Payment {
  id: string
  created_at: string
  user_id: string
  plan: string
  amount: number
  status: 'pending' | 'approved' | 'rejected'
  reviewed_at?: string
  users?: { raw_user_meta_data?: { name?: string }; email?: string } // Joined
}

type FilterTab = 'todos' | 'pending' | 'approved' | 'rejected';

export default function PagamentosPage() {
  const { user, role, loading } = useAuth()
  const navigate = useNavigate()
  const isAdmin = role === 'personal'
  
  const [payments, setPayments] = useState<Payment[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<FilterTab>('todos')

  useEffect(() => {
    if (!isAdmin && !loading) {
      navigate('/')
      return
    }
    
    if (!loading) {
       loadPayments()
    }
  }, [loading, isAdmin, navigate])

  const loadPayments = async () => {
    setLoadingData(true)
    try {
      // Fetch payments with user data logic (using users table if we had full access)
      // Since it's foreign key, we can try to join profiles.
      const { data, error } = await supabase
        .from('pending_payments')
        .select(`
          id, created_at, user_id, plan, amount, status, reviewed_at
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error

      // Need to fetch user profiles separately due to common Supabase auth issues
      const userIds = Array.from(new Set(data?.map(p => p.user_id) || []))
      
      let profilesMap: Record<string, {name: string, email: string}> = {}
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', userIds)
          
        if (profiles) {
           profilesMap = profiles.reduce((acc, curr) => {
             acc[curr.id] = { name: curr.name || 'Aluno', email: curr.email || '' }
             return acc
           }, {} as any)
        }
      }

      const formatted = (data || []).map(p => ({
        ...p,
        users: { 
          raw_user_meta_data: { name: profilesMap[p.user_id]?.name || 'Usuário ' + p.user_id.substring(0,4) },
          email: profilesMap[p.user_id]?.email
        }
      })) as Payment[]

      setPayments(formatted)
    } catch (err) {
      console.error('Error loading payments', err)
    } finally {
      setLoadingData(false)
    }
  }

  const kpis = useMemo(() => {
    const totalRevenue = payments.filter(p => p.status === 'approved').reduce((acc, p) => acc + (p.amount || 0), 0)
    const pendingCount = payments.filter(p => p.status === 'pending').length
    const approvedCount = payments.filter(p => p.status === 'approved').length
    const rejectedCount = payments.filter(p => p.status === 'rejected').length
    
    const conversionRate = payments.length > 0 ? (approvedCount / payments.length) * 100 : 0

    return { totalRevenue, pendingCount, approvedCount, conversionRate }
  }, [payments])

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const matchTab = activeTab === 'todos' || p.status === activeTab;
      const userName = p.users?.raw_user_meta_data?.name?.toLowerCase() || '';
      const planName = p.plan?.toLowerCase() || '';
      const matchSearch = userName.includes(search.toLowerCase()) || planName.includes(search.toLowerCase());
      return matchTab && matchSearch;
    })
  }, [payments, activeTab, search])

  const getStatusBadge = (status: string) => {
    if (status === 'pending') return <span className="pg-status-badge pg-status-pending">Pendente</span>
    if (status === 'approved') return <span className="pg-status-badge pg-status-approved">Aprovado</span>
    if (status === 'rejected') return <span className="pg-status-badge pg-status-rejected">Rejeitado</span>
    return null
  }

  return (
    <div className="pagamentos-page">
      {/* HEADER */}
      <div className="pg-header">
        <div className="pg-header-left">
          <h1><CreditCard size={28} className="text-indigo-400" /> Pagamentos</h1>
          <p>Gerencie assinaturas e cobranças dos alunos</p>
        </div>
        <div className="pg-header-actions">
          <button className="pg-btn pg-btn-outline" onClick={() => alert('Em breve!')}>
            <Download size={16} /> Exportar
          </button>
          <button className="pg-btn pg-btn-primary" onClick={() => navigate('/planos/criar')}>
            <Plus size={16} /> Novo pagamento
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="pg-kpi-grid">
        <div className="pg-kpi-card">
          <div className="pg-kpi-icon"><DollarSign size={20} /></div>
          <p className="pg-kpi-label">Receita Acumulada</p>
          <h2 className="pg-kpi-value">R$ {kpis.totalRevenue.toFixed(2).replace('.', ',')}</h2>
          <div className="pg-kpi-trend up"><TrendingUp size={12} /> +12%</div>
        </div>
        <div className="pg-kpi-card">
          <div className="pg-kpi-icon" style={{color: '#fbbf24', background: 'rgba(245, 158, 11, 0.1)'}}><Clock size={20} /></div>
          <p className="pg-kpi-label">Aguardando Avaliação</p>
          <h2 className="pg-kpi-value">{kpis.pendingCount}</h2>
          <div className="pg-kpi-trend neutral"><Activity size={12} /> Ação requerida</div>
        </div>
        <div className="pg-kpi-card">
          <div className="pg-kpi-icon" style={{color: '#34d399', background: 'rgba(16, 185, 129, 0.1)'}}><CheckCircle size={20} /></div>
          <p className="pg-kpi-label">Pagamentos Aprovados</p>
          <h2 className="pg-kpi-value">{kpis.approvedCount}</h2>
          <div className="pg-kpi-trend up"><TrendingUp size={12} /> Recebidos</div>
        </div>
        <div className="pg-kpi-card">
          <div className="pg-kpi-icon" style={{color: '#f87171', background: 'rgba(239, 68, 68, 0.1)'}}><TrendingDown size={20} /></div>
          <p className="pg-kpi-label">Taxa de Conversão</p>
          <h2 className="pg-kpi-value">{kpis.conversionRate.toFixed(1)}%</h2>
          <div className="pg-kpi-trend neutral"><Activity size={12} /> Geral</div>
        </div>
      </div>

      {/* ALUNOS TAB & SEARCH */}
      <div className="pg-toolbar">
        <div className="pg-filters">
          <button 
            className={`pg-filter-pill ${activeTab === 'todos' ? 'active' : ''}`}
            onClick={() => setActiveTab('todos')}
          >
            Todos <span className="pg-badge-count">{payments.length}</span>
          </button>
          <button 
            className={`pg-filter-pill ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Pendentes <span className="pg-badge-count">{kpis.pendingCount}</span>
          </button>
          <button 
            className={`pg-filter-pill ${activeTab === 'approved' ? 'active' : ''}`}
            onClick={() => setActiveTab('approved')}
          >
            Aprovados
          </button>
          <button 
            className={`pg-filter-pill ${activeTab === 'rejected' ? 'active' : ''}`}
            onClick={() => setActiveTab('rejected')}
          >
            Rejeitados
          </button>
        </div>

        <div className="pg-search">
          <Search size={16} className="pg-search-icon" />
          <input 
            type="text" 
            placeholder="Buscar por aluno ou plano..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="pg-table-container">
        {loadingData ? (
          <div style={{padding: '2rem'}}>
            <div className="pg-skeleton" style={{height: '40px', marginBottom: '1rem'}}></div>
            <div className="pg-skeleton" style={{height: '40px', marginBottom: '1rem'}}></div>
            <div className="pg-skeleton" style={{height: '40px'}}></div>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="pg-empty-state">
             <div className="pg-empty-icon">
               <CreditCard size={40} />
             </div>
             <h3>Nenhum pagamento encontrado</h3>
             <p>Você ainda não possui registros ou nenhum bateu com sua busca.</p>
             <button className="pg-btn pg-btn-primary" onClick={() => navigate('/planos')}>Ir para Planos</button>
          </div>
        ) : (
          <table className="pg-table">
            <thead>
              <tr>
                <th>Aluno</th>
                <th>Plano</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Data</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map(p => (
                <tr key={p.id}>
                  <td>
                    <div className="pg-cell-user">
                      <div className="pg-avatar">
                        {(p.users?.raw_user_meta_data?.name || 'A').charAt(0).toUpperCase()}
                      </div>
                      <div className="pg-user-info">
                        <p>{p.users?.raw_user_meta_data?.name}</p>
                        <span>{p.users?.email || 'N/A'}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="font-semibold text-slate-300">{p.plan}</span>
                  </td>
                  <td>
                    <span className="pg-cell-amount">R$ {(p.amount || 0).toFixed(2).replace('.', ',')}</span>
                  </td>
                  <td>
                    {getStatusBadge(p.status)}
                  </td>
                  <td>
                    <span className="pg-cell-date">{new Date(p.created_at).toLocaleDateString('pt-BR')}</span>
                  </td>
                  <td style={{textAlign: 'right'}}>
                    <button className="pg-btn-icon" onClick={() => navigate('/planos')}>
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

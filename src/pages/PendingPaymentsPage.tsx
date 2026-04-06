import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Search,
  Crown,
  Zap,
  Loader2,
  Eye,
} from 'lucide-react'
import './PendingPayments.css'

interface PendingPayment {
  id: string
  user_id: string
  plan: 'basic' | 'premium'
  amount: number
  status: 'pending' | 'approved' | 'rejected'
  pix_key: string
  created_at: string
  reviewed_at: string | null
  notes: string | null
  user_name: string
  user_email: string
}

export default function PendingPaymentsPage() {
  const { user } = useAuth()
  const [payments, setPayments] = useState<PendingPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null)

  useEffect(() => {
    if (!user) {
      console.log('PendingPaymentsPage: User not loaded, skipping...')
      return
    }
    loadPayments()
  }, [user])

  const loadPayments = async () => {
    if (!user) return
    setLoading(true)
    console.log('PendingPaymentsPage: Loading payments...')

    try {
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('pending_payments')
        .select('*')
        .order('created_at', { ascending: false })

      if (paymentsError) {
        console.error('PendingPaymentsPage: Erro ao carregar pagamentos:', paymentsError)
        setLoading(false)
        return
      }

      if (!paymentsData || paymentsData.length === 0) {
        console.log('PendingPaymentsPage: Nenhum pagamento pendente')
        setPayments([])
        setLoading(false)
        return
      }

      const enrichedPayments: PendingPayment[] = []

      for (const payment of paymentsData || []) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, email')
          .eq('id', payment.user_id)
          .single()

        enrichedPayments.push({
          ...payment,
          user_name: profile?.name || profile?.email?.split('@')[0] || 'Aluno',
          user_email: profile?.email || '',
        })
      }

      setPayments(enrichedPayments)
      console.log('PendingPaymentsPage: Payments loaded:', enrichedPayments.length)
    } catch (error) {
      console.error('PendingPaymentsPage: Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (paymentId: string, plan: string, userId: string) => {
    if (!user) return
    setProcessing(paymentId)

    try {
      // Update payment status
      await supabase
        .from('pending_payments')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq('id', paymentId)

      // Activate subscription
      const now = new Date()
      const endDate = new Date(now)
      endDate.setMonth(endDate.getMonth() + 1)

      await supabase.from('subscriptions').upsert({
        user_id: userId,
        plan,
        status: 'active',
        start_date: now.toISOString(),
        end_date: endDate.toISOString(),
        updated_at: now.toISOString(),
      }, {
        onConflict: 'user_id',
      })

      setPayments(prev => prev.map(p =>
        p.id === paymentId ? { ...p, status: 'approved', reviewed_at: new Date().toISOString() } : p
      ))
    } catch (error) {
      console.error('Erro ao aprovar:', error)
    } finally {
      setProcessing(null)
      setSelectedPayment(null)
    }
  }

  const handleReject = async (paymentId: string) => {
    if (!user) return
    setProcessing(paymentId)

    try {
      await supabase
        .from('pending_payments')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq('id', paymentId)

      setPayments(prev => prev.map(p =>
        p.id === paymentId ? { ...p, status: 'rejected', reviewed_at: new Date().toISOString() } : p
      ))
    } catch (error) {
      console.error('Erro ao rejeitar:', error)
    } finally {
      setProcessing(null)
      setSelectedPayment(null)
    }
  }

  const filteredPayments = payments.filter(p => {
    const matchesSearch = p.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.user_email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filter === 'all' || p.status === filter
    return matchesSearch && matchesFilter
  })

  const pendingCount = payments.filter(p => p.status === 'pending').length

  if (loading) {
    return (
      <div className="pending-payments-page">
        <div className="pending-loading">
          <Loader2 size={32} className="spinner" />
          <span>Carregando pagamentos...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="pending-payments-page">
      <div className="pending-header">
        <div className="pending-title">
          <h1>Pagamentos Pendentes</h1>
          <p>Gerencie as assinaturas dos alunos</p>
        </div>
        {pendingCount > 0 && (
          <div className="pending-badge">
            <Clock size={16} />
            <span>{pendingCount} pendente{pendingCount > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      <div className="pending-filters">
        <div className="pending-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Buscar aluno..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="pending-filter-btns">
          {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'pending' && '⏳ Pendentes'}
              {f === 'approved' && '✅ Aprovados'}
              {f === 'rejected' && '❌ Rejeitados'}
              {f === 'all' && '📋 Todos'}
            </button>
          ))}
        </div>
      </div>

      {filteredPayments.length === 0 ? (
        <div className="pending-empty">
          <Users size={48} />
          <p>Nenhum pagamento encontrado</p>
        </div>
      ) : (
        <div className="pending-list">
          {filteredPayments.map((payment) => (
            <div key={payment.id} className={`pending-card ${payment.status}`}>
              <div className="pending-card-header">
                <div className="pending-user-info">
                  <div className="pending-user-avatar">
                    {payment.user_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="pending-user-details">
                    <span className="pending-user-name">{payment.user_name}</span>
                    <span className="pending-user-email">{payment.user_email}</span>
                  </div>
                </div>
                <div className={`pending-status-badge ${payment.status}`}>
                  {payment.status === 'pending' && <><Clock size={12} /> Pendente</>}
                  {payment.status === 'approved' && <><CheckCircle2 size={12} /> Aprovado</>}
                  {payment.status === 'rejected' && <><XCircle size={12} /> Rejeitado</>}
                </div>
              </div>

              <div className="pending-card-body">
                <div className="pending-plan-info">
                  <div className={`plan-icon ${payment.plan}`}>
                    {payment.plan === 'premium' ? <Crown size={16} /> : <Zap size={16} />}
                  </div>
                  <div>
                    <span className="plan-name">{payment.plan === 'basic' ? 'Básico' : 'Premium'}</span>
                    <span className="plan-amount">R$ {payment.amount.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
                <div className="pending-date">
                  Solicitado em: {new Date(payment.created_at).toLocaleDateString('pt-BR')}
                </div>
              </div>

              <div className="pending-card-actions">
                <button
                  className="btn-view"
                  onClick={() => setSelectedPayment(payment)}
                >
                  <Eye size={14} />
                  Ver detalhes
                </button>
                {payment.status === 'pending' && (
                  <>
                    <button
                      className="btn-approve"
                      onClick={() => handleApprove(payment.id, payment.plan, payment.user_id)}
                      disabled={processing === payment.id}
                    >
                      {processing === payment.id ? (
                        <Loader2 size={14} className="spinner" />
                      ) : (
                        <CheckCircle2 size={14} />
                      )}
                      Aprovar
                    </button>
                    <button
                      className="btn-reject"
                      onClick={() => handleReject(payment.id)}
                      disabled={processing === payment.id}
                    >
                      {processing === payment.id ? (
                        <Loader2 size={14} className="spinner" />
                      ) : (
                        <XCircle size={14} />
                      )}
                      Rejeitar
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payment Detail Modal */}
      {selectedPayment && (
        <div className="payment-detail-overlay" onClick={() => setSelectedPayment(null)}>
          <div className="payment-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="detail-header">
              <h3>Detalhes do Pagamento</h3>
              <button className="detail-close" onClick={() => setSelectedPayment(null)}>
                <XCircle size={20} />
              </button>
            </div>
            <div className="detail-body">
              <div className="detail-section">
                <h4>Aluno</h4>
                <div className="detail-row">
                  <span>Nome:</span>
                  <strong>{selectedPayment.user_name}</strong>
                </div>
                <div className="detail-row">
                  <span>Email:</span>
                  <strong>{selectedPayment.user_email}</strong>
                </div>
              </div>
              <div className="detail-section">
                <h4>Pagamento</h4>
                <div className="detail-row">
                  <span>Plano:</span>
                  <strong>{selectedPayment.plan === 'basic' ? 'Básico' : 'Premium'}</strong>
                </div>
                <div className="detail-row">
                  <span>Valor:</span>
                  <strong>R$ {selectedPayment.amount.toFixed(2).replace('.', ',')}</strong>
                </div>
                <div className="detail-row">
                  <span>Chave PIX:</span>
                  <code>{selectedPayment.pix_key}</code>
                </div>
                <div className="detail-row">
                  <span>Data:</span>
                  <strong>{new Date(selectedPayment.created_at).toLocaleString('pt-BR')}</strong>
                </div>
                <div className="detail-row">
                  <span>Status:</span>
                  <span className={`detail-status ${selectedPayment.status}`}>
                    {selectedPayment.status === 'pending' && '⏳ Pendente'}
                    {selectedPayment.status === 'approved' && '✅ Aprovado'}
                    {selectedPayment.status === 'rejected' && '❌ Rejeitado'}
                  </span>
                </div>
              </div>
            </div>
            {selectedPayment.status === 'pending' && (
              <div className="detail-actions">
                <button
                  className="btn-approve-full"
                  onClick={() => handleApprove(selectedPayment.id, selectedPayment.plan, selectedPayment.user_id)}
                  disabled={processing === selectedPayment.id}
                >
                  {processing === selectedPayment.id ? (
                    <>
                      <Loader2 size={16} className="spinner" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      Aprovar e Ativar Plano
                    </>
                  )}
                </button>
                <button
                  className="btn-reject-full"
                  onClick={() => handleReject(selectedPayment.id)}
                  disabled={processing === selectedPayment.id}
                >
                  {processing === selectedPayment.id ? (
                    <>
                      <Loader2 size={16} className="spinner" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <XCircle size={16} />
                      Rejeitar
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

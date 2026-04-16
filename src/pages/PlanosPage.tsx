import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  Check,
  X,
  Crown,
  Zap,
  Gift,
  Bot,
  Send,
  Loader2,
  ArrowLeft,
  Shield,
  Copy,
  CheckCircle2,
  Clock,
  Plus,
  Pencil,
  Trash2,
  CheckSquare
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { usePermissions } from '../context/PermissionsContext'
import './Planos.css'

const PIX_KEY = 'vsfitgym@gmail.com'

interface DBPlan {
  id: string
  nome: string
  descricao: string
  preco: number
  popular?: boolean // Can be added locally later or extended in DB
  duracao_dias: number // Adicionado
  features: string[] // Extracted from plano_itens
  assinantes?: number // Adicionado para rastrear número de alunos
}

interface ChatMessage {
  id: number
  role: 'bot' | 'user'
  text: string
  pixData?: {
    pixKey: string
    amount: string
    planName: string
  }
}

interface PendingAssinatura {
  id: string
  aluno_id: string
  plano_id: string
  created_at: string
  planos: { nome: string }
  users: { raw_user_meta_data?: any } // or profiles
}

export default function PlanosPage() {
  const { user, role, loading } = useAuth()
  const { refreshPermissions } = usePermissions()
  const navigate = useNavigate()
  const isAdmin = role === 'personal'
  
  const [plans, setPlans] = useState<DBPlan[]>([])
  const [loadingPlans, setLoadingPlans] = useState(true)
  const [userAssinatura, setUserAssinatura] = useState<any>(null) // { plano_id, status }

  const [selectedPlan, setSelectedPlan] = useState<DBPlan | null>(null)
  const [showAssistant, setShowAssistant] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [processing, setProcessing] = useState(false)
  const [chatStep, setChatStep] = useState<'greeting' | 'plan_selected' | 'payment' | 'confirming' | 'done'>('greeting')
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Personal admin state
  const [pendingAssinaturas, setPendingAssinaturas] = useState<PendingAssinatura[]>([])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!loading) {
      loadData()
    }
  }, [loading, user])

  const loadData = async () => {
    setLoadingPlans(true)
    try {
      // Load plans and features
      const { data: planosData } = await supabase
        .from('planos')
        .select(`
          *,
          plano_itens (
            itens (nome)
          )
        `)
        .order('preco', { ascending: true })

      let currentPlans = plans
      if (planosData) {
        let formatted = planosData.map((p: any) => ({
          id: p.id,
          nome: p.nome,
          descricao: p.descricao || '',
          preco: p.preco,
          duracao_dias: p.duracao_dias || 30,
          popular: p.recomendado,
          features: (p.plano_itens || []).map((pi: any) => pi.itens?.nome).filter(Boolean),
          assinantes: 0
        }))
        
        if (isAdmin) {
          // Fetch real counts map for the Admin view
          const { data: allActiveSubs } = await supabase
            .from('subscriptions')
            .select('plan, status')
            .in('status', ['ativa', 'trial'])
            
          if (allActiveSubs) {
            formatted = formatted.map((p: any) => {
               const planKey = p.nome.toLowerCase()
               const count = allActiveSubs.filter((sub: any) => {
                 const subPlan = sub.plan.toLowerCase()
                 return subPlan === planKey ||
                   subPlan.includes(planKey) ||
                   (subPlan === 'free' && planKey === 'free') ||
                   (subPlan === 'basic' && planKey.includes('básico')) ||
                   (subPlan === 'pro' && planKey.includes('pro') && !planKey.includes('premium')) ||
                   (subPlan === 'premium' && planKey.includes('premium'))
               }).length
               return { ...p, assinantes: count }
            })
          }
        }
        
        setPlans(formatted)
        currentPlans = formatted
      }

      if (user && !isAdmin) {
        // Load active subscription first
        const { data: subData } = await supabase
          .from('subscriptions')
          .select('plan, status')
          .eq('user_id', user.id)
          .in('status', ['ativa', 'trial'])
          .maybeSingle()

        if (subData) {
          // Match plan by name: "basic" -> "Plano Básico", "pro" -> "Plano Pro", etc.
          const planKey = subData.plan.toLowerCase()
          const planObj = currentPlans.find(p => {
            const nomeLower = p.nome.toLowerCase()
            // Exact match or key match (e.g. "free"=>"Free", "basic"=>"Plano Básico")
            return nomeLower === planKey ||
              nomeLower.includes(planKey) ||
              (planKey === 'free' && nomeLower === 'free') ||
              (planKey === 'basic' && nomeLower.includes('básico')) ||
              (planKey === 'pro' && nomeLower.includes('pro') && !nomeLower.includes('premium')) ||
              (planKey === 'premium' && nomeLower.includes('premium')) ||
              (subData.status === 'trial' && nomeLower === 'free')
          })
          
          setUserAssinatura({ 
            plano_id: planObj?.id || null, 
            status: 'ativa'
          })
        } else {
          // If no active sub, check for pending payment
          const { data: pendingData } = await supabase
            .from('pending_payments')
            .select('plan, status')
            .eq('user_id', user.id)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (pendingData) {
            const planObj = currentPlans.find(p => p.nome === pendingData.plan)
            setUserAssinatura({ 
              plano_id: planObj?.id || pendingData.plan, 
              status: 'pendente' 
            })
          }
        }
      }

      if (user && isAdmin) {
        // Load pending assinaturas to approve
        loadPendingApprovals()
      }

    } catch (err) {
      console.error('Error loading data', err)
    } finally {
      setLoadingPlans(false)
    }
  }

  const loadPendingApprovals = async () => {
    // Sync with pending_payments table
    const { data } = await supabase
      .from('pending_payments')
      .select('id, created_at, user_id, plan, amount')
      .eq('status', 'pending')
    
    if (data) {
      // Map to the Interface format used in the UI
      const formatted = data.map(p => ({
        id: p.id,
        created_at: p.created_at,
        aluno_id: p.user_id,
        plano_id: p.plan, // using name as id for display
        planos: { nome: p.plan },
        amount: p.amount
      }))
      setPendingAssinaturas(formatted as any)
    }
  }

  const addMessage = (role: 'bot' | 'user', text: string, pixData?: ChatMessage['pixData']) => {
    setMessages(prev => [...prev, { id: Date.now(), role, text, pixData }])
  }

  const startAssistant = (plan: DBPlan) => {
    setSelectedPlan(plan)
    setShowAssistant(true)
    setMessages([])
    setChatStep('greeting')
    setProcessing(false)

    setTimeout(() => {
      addMessage('bot', `Olá! 👋 Eu sou o assistente da VSFit Gym.
Você selecionou o plano **${plan.nome}**. Vamos finalizar sua assinatura?`)
    }, 500)
  }

  const generatePixInfo = async () => {
    if (!selectedPlan || !user) return

    setProcessing(true)
    setChatStep('confirming')

    const amount = selectedPlan.preco
    const planName = selectedPlan.nome

    // Insert pending payment into the official tracking table
    await supabase.from('pending_payments').insert({
      user_id: user.id,
      plan: selectedPlan.nome,
      amount: selectedPlan.preco,
      status: 'pending',
      pix_key: PIX_KEY
    })

    // Refresh memory
    setUserAssinatura({ plano_id: selectedPlan.id, status: 'pendente' })

    addMessage('bot', `Perfeito! 📱 Aqui está a chave PIX:

**Plano:** ${planName}
**Valor:** R$ ${amount.toFixed(2).replace('.', ',')}
**Chave PIX:** ${PIX_KEY}

⏳ **Após pagar, clique em "Já paguei"**
Sua assinatura foi criada e o personal validará o pagamento logo em seguida.`, {
      pixKey: PIX_KEY,
      amount: amount.toFixed(2),
      planName,
    })
    setProcessing(false)
  }

  const confirmPayment = async () => {
    if (!user || !selectedPlan) return
    setProcessing(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setProcessing(false)
    setChatStep('done')

    addMessage('bot', `✅ **Solitação Finalizada!**

Você receberá acesso quando o personal confirmar o recebimento via Painel de Controle.

⏱️ Prazo: até 24 horas.`)
  }

  const handleUserMessage = async (text: string) => {
    addMessage('user', text)
    setInputText('')
    const lowerText = text.toLowerCase()

    if (chatStep === 'greeting') {
      if (lowerText.includes('sim') || lowerText.includes('ok') || lowerText.includes('quero')) {
        setChatStep('payment')
        setTimeout(() => addMessage('bot', `Ótimo! O pagamento será via **PIX**. Clique em "Gerar PIX".`), 800)
      } else {
        setTimeout(() => addMessage('bot', `Deseja prosseguir? Digite 'sim'.`), 800)
      }
    } else if (chatStep === 'payment') {
      if (lowerText.includes('gerar') || lowerText.includes('pix')) {
        await generatePixInfo()
      } else {
        setTimeout(() => addMessage('bot', `Clique em **"Gerar PIX"**.`), 800)
      }
    } else if (chatStep === 'confirming') {
      if (lowerText.includes('já paguei') || lowerText.includes('paguei')) {
        await confirmPayment()
      } else {
        setTimeout(() => addMessage('bot', `Após pagar, clique em **"Já paguei"**.`), 800)
      }
    } else if (chatStep === 'done') {
      setTimeout(() => setShowAssistant(false), 2000)
    }
  }

  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text)

  const handleApprove = async (paymentId: string, planName: string, userId: string) => {
    // Approve in pending_payments
    await supabase.from('pending_payments').update({ 
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: user?.id
    }).eq('id', paymentId)

    // Activate subscription
    const now = new Date()
    const endDate = new Date(now)
    endDate.setMonth(endDate.getMonth() + 1)

    await supabase.from('subscriptions').upsert({
      user_id: userId,
      plan: planName, // Salvando o nome exato (ex: "Plano Básico")
      status: 'ativa',
      start_date: now.toISOString(),
      end_date: endDate.toISOString(),
      updated_at: now.toISOString()
    }, { onConflict: 'user_id' })

    loadPendingApprovals()
    alert('Assinatura ativada!')
  }

  const handleReject = async (paymentId: string) => {
    if(confirm('Recusar o pagamento e cancelar assinatura?')) {
      await supabase.from('pending_payments').update({ 
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id
      }).eq('id', paymentId)
      loadPendingApprovals()
    }
  }

  if (loading || loadingPlans) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#8b5cf6' }}>
        <Loader2 className="animate-spin" size={32} />
      </div>
    )
  }

  return (
    <div className="planos-page">
      
      {/* ── Hero Header ── */}
      <div className="pl-hero">
        <div className="pl-hero-left">
          <div className="pl-hero-icon">
            <Crown size={30} />
          </div>
          <div className="pl-hero-text">
            <h1>{isAdmin ? 'Planos e ' : 'Escolha seu '}<span>{isAdmin ? 'Assinaturas' : 'Plano'}</span></h1>
            <p>{isAdmin ? 'Gerencie e otimize seus pacotes para aumentar seus resultados e faturamento' : 'Selecione o plano ideal para atingir seus objetivos mais rápido'}</p>
          </div>
        </div>
        {isAdmin && (
          <div className="pl-hero-actions">
            <button className="pl-btn pl-btn-primary" onClick={() => navigate('/planos/criar')}>
              <Plus size={16} />
              Criar Novo Plano
            </button>
          </div>
        )}
      </div>

      {/* ── Pendências (Apenas Admin) ── */}
      {isAdmin && pendingAssinaturas.length > 0 && (
        <div className="pl-approvals-box">
          <h3 className="text-lg font-bold text-amber-400 mb-4 flex items-center gap-2">
            <Clock size={18} /> Aprovações Pendentes
          </h3>
          <div className="flex flex-col gap-3">
            {pendingAssinaturas.map(pa => (
              <div key={pa.id} className="pl-approval-item">
                 <div>
                   <p className="text-white font-medium">Assinatura solicitada: <span className="text-amber-400">{pa.planos?.nome || 'Plano'}</span></p>
                   <p className="text-xs text-slate-400 mt-1">ID Aluno: {pa.aluno_id}</p>
                 </div>
                 <div className="flex gap-2 w-full md:w-auto">
                    <button onClick={() => handleApprove(pa.id, pa.planos.nome, pa.aluno_id)} className="pl-btn pl-btn-primary" style={{flex: 1, padding: '0.5rem 1rem'}}>
                     <CheckSquare size={16} /> Aprovar
                   </button>
                   <button onClick={() => handleReject(pa.id)} className="pl-btn pl-btn-ghost text-red-400 hover:text-red-300 hover:border-red-500/30" style={{flex: 1, padding: '0.5rem 1rem'}}>
                     <X size={16} /> Recusar
                   </button>
                 </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Grid de Planos ── */}
      {plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-slate-400 border border-white/10 bg-white/5 rounded-2xl">
           <Crown size={48} className="mb-4 opacity-50" />
           <p className="text-center">Nenhum plano cadastrado.</p>
           {isAdmin && <p className="text-sm mt-2">Clique em "Criar Novo Plano" para começar.</p>}
        </div>
      ) : (
        <div className="pl-grid">
          {plans.map((p) => {
            const isCurrentActive = userAssinatura?.plano_id === p.id && userAssinatura?.status === 'ativa'
            const isPendingThis = userAssinatura?.plano_id === p.id && userAssinatura?.status === 'pendente'
            
            return (
              <div
                key={p.id}
                className={`pl-card ${p.popular ? 'pl-card-popular' : ''} ${(isCurrentActive || isPendingThis) ? 'current' : ''}`}
              >
                {p.popular && (
                  <div className="pl-badge-popular">
                    <Crown size={12} /> MAIS POPULAR
                  </div>
                )}

                <div className="pl-card-header">
                  <div className="pl-card-icon">
                    <Zap size={24} />
                  </div>
                  <h3 className="pl-card-title">{p.nome}</h3>
                  <p className="pl-card-desc">{p.descricao || 'Desbloqueie todo o seu potencial com este pacote.'}</p>
                </div>

                <div className="pl-price-wrap">
                  <span className="pl-price-currency">R$</span>
                  <span className="pl-price-value">{p.preco.toFixed(2).replace('.',',')}</span>
                  <span className="pl-price-period">/ {p.duracao_dias} dias</span>
                </div>

                <div className="pl-features">
                  {[
                    { dbName: 'Treinos Ativos', label: 'Treinos ativos ilimitados' },
                    { dbName: 'Biblioteca de Exercícios', label: 'Biblioteca de exercícios premium' },
                    { dbName: 'Exercícios Personalizados', label: 'Criação de exercícios customizados' },
                    { dbName: 'Gamificação e Conquistas', label: 'Gamificação e Conquistas' },
                    { dbName: 'Gráficos e Analytics', label: 'Gráficos e Analytics avançados' },
                    { dbName: 'Chat e Suporte', label: 'Chat VIP com o Personal' },
                  ].map((feat) => {
                    // Match the feature if it's included logically
                    const included = p.features.some(f => f.toLowerCase().includes(feat.dbName.toLowerCase()) || (feat.dbName === 'Gamificação e Conquistas' && f.toLowerCase().includes('gamif')))
                    return (
                      <div key={feat.dbName} className={`pl-feature ${included ? 'included' : 'excluded'}`}>
                        {included ? (
                          <Check size={16} className="pl-feat-icon inc" />
                        ) : (
                          <X size={16} className="pl-feat-icon exc" />
                        )}
                        <span>{feat.label}</span>
                      </div>
                    )
                  })}
                  
                  {/* Extra features directly from DB (if they don't match the standard ones) */}
                  {p.features.filter(f => !['Treinos Ativos', 'Biblioteca de Exercícios', 'Chat e Suporte', 'Gamificação e Conquistas', 'Gráficos e Analytics'].some(base => f.toLowerCase().includes(base.toLowerCase()))).map((extraFeature, i) => (
                    <div key={`extra-${i}`} className="pl-feature included">
                      <Check size={16} className="pl-feat-icon inc" />
                      <span>{extraFeature}</span>
                    </div>
                  ))}
                </div>

                {/* Status Administrativo no Card */}
                {isAdmin && (
                  <div className="pl-admin-stats">
                     <div className="pl-admin-stat">
                       <span className="pl-admin-stat-lbl">Status</span>
                       <span className="pl-admin-stat-val text-emerald-400">Ativo</span>
                     </div>
                     <div className="pl-admin-stat" style={{textAlign: 'right'}}>
                       <span className="pl-admin-stat-lbl">Assinantes</span>
                       <span className="pl-admin-stat-val">{p.assinantes || 0}</span>
                     </div>
                  </div>
                )}

                <div className="pl-card-actions">
                  {isAdmin ? (
                    <>
                      <button 
                        className="pl-btn pl-btn-edit"
                        onClick={() => navigate(`/planos/editar/${p.id}`)}
                      >
                        <Pencil size={16} /> Editar plano
                      </button>
                      <button 
                        className="pl-btn pl-btn-delete"
                        onClick={async () => {
                          if (confirm('Tem certeza que deseja excluir o plano?')) {
                             await supabase.from('planos').delete().eq('id', p.id);
                             loadData()
                          }
                        }}
                        title="Excluir plano"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  ) : (
                    <button
                      className={`pl-btn ${p.popular ? 'pl-btn-primary' : 'pl-btn-secondary'}`}
                      disabled={isCurrentActive || userAssinatura?.status === 'pendente'}
                      onClick={() => startAssistant(p)}
                      style={{width: '100%'}}
                    >
                      {isPendingThis ? (
                        <>
                          <Clock size={16} /> Aguardando Pgto.
                        </>
                      ) : userAssinatura?.status === 'pendente' ? (
                        'Outro Aguardando'
                      ) : isCurrentActive ? (
                        <>
                          <CheckCircle2 size={16} /> Meu Plano Atual
                        </>
                      ) : (
                        <>
                          <Zap size={16} /> Selecionar Plano
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── AI Assistant Modal ── */}
      {showAssistant && (
        <div className="assistant-overlay" onClick={() => setShowAssistant(false)}>
          <div className="assistant-modal" onClick={e => e.stopPropagation()}>
            <div className="assistant-header">
              <div className="assistant-header-info">
                <div className="assistant-avatar">
                  <Bot size={20} />
                </div>
                <div>
                  <h3>Assistente Pagamento</h3>
                  <span className="assistant-status">Online</span>
                </div>
              </div>
              <button className="assistant-close" onClick={() => setShowAssistant(false)}>
                <ArrowLeft size={18} />
              </button>
            </div>

            <div className="assistant-messages">
              {messages.map((msg) => (
                <div key={msg.id} className={`message ${msg.role}`}>
                  {msg.role === 'bot' && (
                    <div className="message-avatar">
                      <Bot size={14} />
                    </div>
                  )}
                  <div className="message-bubble">
                    {msg.text.split('\n').map((line, i) => {
                      if (line.startsWith('**') && line.endsWith('**')) {
                         return <strong key={i}>{line.slice(2, -2)}</strong>
                      }
                      return (
                        <span key={i}>
                          {line}
                          {i < msg.text.split('\n').length - 1 && <br />}
                        </span>
                      )
                    })}

                    {msg.pixData && (
                      <div className="payment-qr-code">
                        <div className="pix-key-display">
                          <span className="pix-key-icon">📧</span>
                          <code className="pix-key-code">{msg.pixData.pixKey}</code>
                          <button className="btn-copy" onClick={() => copyToClipboard(msg.pixData!.pixKey)}>
                            <Copy size={14} /> Copiar Chave
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {processing && (
                <div className="message bot">
                  <div className="message-avatar"><Bot size={14} /></div>
                  <div className="message-bubble processing">
                    <Loader2 size={16} className="spinner border-none" />
                    <span>Processando...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="assistant-input-area">
              <div className="quick-actions" style={{marginBottom: '0.5rem'}}>
                {chatStep === 'greeting' && (
                  <button onClick={() => handleUserMessage('Sim')}>✅ Sim, continuar</button>
                )}
                {chatStep === 'payment' && (
                  <button onClick={() => handleUserMessage('Gerar PIX')} style={{color: '#a78bfa', borderColor: '#8b5cf6'}}>
                    💳 Gerar PIX
                  </button>
                )}
                {chatStep === 'confirming' && (
                  <button onClick={() => handleUserMessage('Já paguei')} style={{color: '#34d399', borderColor: '#10b981'}}>✅ Já paguei</button>
                )}
                {chatStep === 'done' && (
                  <button onClick={() => { setShowAssistant(false); loadData(); }}>🏠 Fechar</button>
                )}
              </div>
              <div className="input-wrapper" style={{display: 'none'}}>
                <input
                  type="text"
                  value={inputText}
                  disabled
                  placeholder="Selecione uma opção acima..."
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

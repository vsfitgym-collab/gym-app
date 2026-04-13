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
        const formatted = planosData.map((p: any) => ({
          id: p.id,
          nome: p.nome,
          descricao: p.descricao || '',
          preco: p.preco,
          duracao_dias: p.duracao_dias || 30,
          popular: p.recomendado,
          features: (p.plano_itens || []).map((pi: any) => pi.itens?.nome).filter(Boolean)
        }))
        setPlans(formatted)
        currentPlans = formatted
      }

      if (user && !isAdmin) {
        // Load active subscription first
        const { data: subData } = await supabase
          .from('subscriptions')
          .select('plan, status')
          .eq('user_id', user.id)
          .in('status', ['active', 'trial'])
          .maybeSingle()

        if (subData) {
          // Flexible mapping for trial/active plans
          const planObj = currentPlans.find(p => 
            p.nome === subData.plan || 
            p.nome.toLowerCase().includes(subData.plan.toLowerCase()) ||
            (subData.status === 'trial' && p.nome.toLowerCase().includes('trial'))
          )
          
          setUserAssinatura({ 
            plano_id: planObj?.id || subData.plan, 
            status: subData.status === 'trial' ? 'ativa' : 'ativa' 
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
      status: 'active',
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
      <div className="planos-header">
        <div className="planos-title">
          <h2>{isAdmin ? 'Gerenciar Planos' : 'Escolha seu Plano'}</h2>
          <p>{isAdmin ? 'Configure os pacotes ou ative alunos pendentes' : 'Selecione o plano ideal'}</p>
        </div>
        {isAdmin && (
          <button className="btn-create-plan" onClick={() => navigate('/planos/criar')}>
            <Plus size={18} />
            Novo Plano
          </button>
        )}
      </div>

      {isAdmin && pendingAssinaturas.length > 0 && (
         <div className="bg-white/5 border border-amber-500/20 rounded-2xl p-6 mb-8 mt-4">
           <h3 className="text-lg font-bold text-amber-400 mb-4 flex items-center gap-2">
             <Clock size={18} /> Aprovações Pendentes (Alunos Aguardando PIX)
           </h3>
           <div className="flex flex-col gap-3">
             {pendingAssinaturas.map(pa => (
               <div key={pa.id} className="bg-black/30 border border-white/5 p-4 rounded-xl flex items-center justify-between">
                 <div>
                   <p className="text-white font-medium">Assinatura solicitada via {pa.planos?.nome || 'Plano'}</p>
                   <p className="text-xs text-slate-400 mt-1">ID Aluno: {pa.aluno_id}</p>
                 </div>
                 <div className="flex gap-2">
                    <button onClick={() => handleApprove(pa.id, pa.planos.nome, pa.aluno_id)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-colors">
                     <CheckSquare size={16} /> Aprovar
                   </button>
                   <button onClick={() => handleReject(pa.id)} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors border border-red-500/20">
                     <X size={16} /> Recusar
                   </button>
                 </div>
               </div>
             ))}
           </div>
         </div>
      )}

      {plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-slate-400 border border-white/10 bg-white/5 rounded-2xl">
           <Crown size={48} className="mb-4 opacity-50" />
           <p className="text-center">Nenhum plano cadastrado no banco de dados.</p>
           {isAdmin && <p className="text-sm mt-2">Clique em "Novo Plano" para criar um.</p>}
        </div>
      ) : (
        <div className="planos-grid">
          {plans.map((p) => {
            const isCurrentActive = userAssinatura?.plano_id === p.id && userAssinatura?.status === 'ativa'
            const isPendingThis = userAssinatura?.plano_id === p.id && userAssinatura?.status === 'pendente'
            
            return (
              <div
                key={p.id}
                className={`plano-card ${p.popular ? 'popular' : ''} ${(isCurrentActive || isPendingThis) ? 'current' : ''}`}
              >
                {p.popular && (
                  <div className="plano-badge-popular">
                    <Crown size={12} />
                    <span>Recomendado</span>
                  </div>
                )}

                <div className="plano-header">
                  <div className="plano-icon" style={{ background: `rgba(139, 92, 246, 0.1)`, color: '#8b5cf6' }}>
                    <Zap size={28} />
                  </div>
                  <div className="plano-info">
                    <h3>{p.nome}</h3>
                    <p>{p.descricao}</p>
                  </div>
                </div>

                <div className="plano-price">
                  <span className="price-value">R$ {p.preco.toFixed(2).replace('.',',')}</span>
                  <span className="price-period">/ {p.duracao_dias} dias</span>
                </div>

                <div className="plano-features pb-4">
                  <span className="text-xs text-slate-400 block mb-2 font-semibold tracking-wider">Acessos Liberados:</span>
                  {[
                    { dbName: 'Treinos Ativos', label: 'Treinos Ativos (sem limite ou até 3)' },
                    { dbName: 'Biblioteca de Exercícios', label: 'Biblioteca de Exercícios' },
                    { dbName: 'Exercícios Personalizados', label: 'Exercícios Personalizados' },
                    { dbName: 'Chat e Suporte', label: 'Chat e Suporte' },
                    { dbName: 'Gamificação e Conquistas', label: 'Gamificação' },
                    { dbName: 'Gráficos e Analytics', label: 'Gráficos e Analytics' },
                    { dbName: 'Suporte Prioritário', label: 'Suporte Prioritário' },
                  ].sort((a, b) => {
                    const aIncluded = p.features.includes(a.dbName)
                    const bIncluded = p.features.includes(b.dbName)
                    if (aIncluded && !bIncluded) return -1
                    if (!aIncluded && bIncluded) return 1
                    return 0
                  }).map((feat) => {
                    const included = p.features.includes(feat.dbName)
                    return (
                      <div key={feat.dbName} className={`plano-feature ${included ? 'included' : 'excluded opacity-50'}`}>
                        {included ? (
                          <Check size={14} className="feature-check text-emerald-500" />
                        ) : (
                          <X size={14} className="feature-x text-red-500" />
                        )}
                        <span className={included ? 'text-white' : 'text-slate-500 line-through'}>{feat.label}</span>
                      </div>
                    )
                  })}
                  
                  {/* Additional features not predefined */}
                  {p.features.filter(f => !['Treinos Ativos', 'Biblioteca de Exercícios', 'Chat e Suporte', 'Gamificação e Conquistas', 'Gráficos e Analytics'].includes(f)).map((extraFeature, i) => (
                    <div key={`extra-${i}`} className="plano-feature included">
                      <Check size={14} className="feature-check text-emerald-500" />
                      <span className="text-white">{extraFeature}</span>
                    </div>
                  ))}
                </div>

                <div className="plano-actions">
                  {isAdmin ? (
                    <>
                      <button 
                        className="btn-action-edit"
                        onClick={() => navigate(`/planos/editar/${p.id}`)}
                      >
                        <Pencil size={16} /> Edit
                      </button>
                      <button 
                        className="btn-action-delete"
                        onClick={async () => {
                          if (confirm('Tem certeza?')) {
                             await supabase.from('planos').delete().eq('id', p.id);
                             loadData()
                          }
                        }}
                      >
                        <Trash2 size={16} /> Del
                      </button>
                    </>
                  ) : (
                    <button
                      className={`plano-btn ${p.popular ? 'btn-premium' : 'btn-basic'}`}
                      disabled={isCurrentActive || userAssinatura?.status === 'pendente'}
                      onClick={() => startAssistant(p)}
                    >
                      {isPendingThis ? (
                        <>
                          <Clock size={16} /> Ag. Pagamento
                        </>
                      ) : userAssinatura?.status === 'pendente' ? (
                        'Outro Aguardando'
                      ) : isCurrentActive ? (
                        <>
                          <CheckCircle2 size={16} /> Plano Ativo
                        </>
                      ) : (
                        <>
                          <Zap size={16} /> Assinar
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

      {/* AI Assistant Modal */}
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
                            <Copy size={14} /> Copiar
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
              <div className="quick-actions">
                {chatStep === 'greeting' && (
                  <button onClick={() => handleUserMessage('Sim')}>✅ Sim, continuar</button>
                )}
                {chatStep === 'payment' && (
                  <button onClick={() => handleUserMessage('Gerar PIX')} className="btn-generate-pix">
                    💳 Gerar PIX
                  </button>
                )}
                {chatStep === 'confirming' && (
                  <button onClick={() => handleUserMessage('Já paguei')}>✅ Já paguei</button>
                )}
                {chatStep === 'done' && (
                  <button onClick={() => { setShowAssistant(false); loadData(); }}>🏠 Fechar</button>
                )}
              </div>
              <div className="input-wrapper">
                <input
                  type="text"
                  value={inputText}
                  disabled
                  placeholder="Selecione acima..."
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

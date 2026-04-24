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
import { motion, AnimatePresence } from 'framer-motion'
import './Planos.css'


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
  
  const chatRef = useRef<HTMLDivElement>(null)

  const isAtBottom = () => {
    const el = chatRef.current
    if (!el) return false
    return el.scrollHeight - el.scrollTop <= el.clientHeight + 50
  }

  useEffect(() => {
    if (messages.length === 0) return
    const lastMessage = messages[messages.length - 1]

    if (lastMessage?.role === 'user') {
      chatRef.current?.scrollTo({
        top: chatRef.current.scrollHeight,
        behavior: 'smooth'
      })
    } else if (lastMessage?.role === 'bot' && isAtBottom()) {
      chatRef.current?.scrollTo({
        top: chatRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [messages])

  // Personal admin state
  const [pendingAssinaturas, setPendingAssinaturas] = useState<PendingAssinatura[]>([])

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
            .in('status', ['pending', 'pending_payment', 'pending_confirmation'])
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
      .in('status', ['pending', 'pending_confirmation'])
    
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

  const startAssistant = async (plan: DBPlan) => {
    setSelectedPlan(plan)
    setShowAssistant(true)
    setMessages([])
    setProcessing(false)

    // Check if there is already a payment pending confirmation
    const { data: existingPayment } = await supabase.from('pending_payments')
      .select('status, pix_key')
      .eq('user_id', user!.id)
      .eq('plan', plan.nome)
      .in('status', ['pending', 'pending_payment'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingPayment) {
      setChatStep('confirming')
      addMessage('bot', `Olá novamente! Recuperando sua solicitação para o **${plan.nome}**...`)
      setTimeout(() => {
        addMessage('bot', `A chave PIX já foi gerada:
        
**Chave PIX:** ${existingPayment.pix_key || 'Chave indisponível'}

⏳ **Status:** Pagamento Pendente
Se você já realizou a transferência, clique em "Já realizei o pagamento" para enviarmos para avaliação.`, {
          pixKey: existingPayment.pix_key || '',
          amount: plan.preco.toFixed(2),
          planName: plan.nome,
        })
      }, 500)
    } else {
      setChatStep('greeting')
      setTimeout(() => {
        addMessage('bot', `Olá! 👋 Eu sou o assistente da VSFit Gym.
Você selecionou o plano **${plan.nome}**. Vamos finalizar sua assinatura?`)
      }, 500)
    }
  }

  const generatePixInfo = async () => {
    if (!selectedPlan || !user) return

    setProcessing(true)
    setChatStep('confirming')

    const amount = selectedPlan.preco
    const planName = selectedPlan.nome

    const { data: fetchPixKey } = await supabase.rpc('get_pix_key')
    const actualPixKey = fetchPixKey || 'Chave indisponível'

    // Insert pending payment into the official tracking table
    await supabase.from('pending_payments').insert({
      user_id: user.id,
      plan: selectedPlan.nome,
      amount: selectedPlan.preco,
      status: 'pending_payment',
      pix_key: actualPixKey
    })

    // Refresh memory
    setUserAssinatura({ plano_id: selectedPlan.id, status: 'pendente' })

    addMessage('bot', `Perfeito! 📱 Aqui está a chave PIX:

**Plano:** ${planName}
**Valor:** R$ ${amount.toFixed(2).replace('.', ',')}
**Chave PIX:** ${actualPixKey}

⏳ **Status:** Pagamento Pendente
Após realizar a transferência, clique no botão "Já realizei o pagamento" para enviarmos para avaliação do personal.`, {
      pixKey: actualPixKey,
      amount: amount.toFixed(2),
      planName,
    })
    setProcessing(false)
  }

  const confirmPayment = async () => {
    if (!user || !selectedPlan) return
    setProcessing(true)
    
    // Update status to pending_confirmation
    await supabase.from('pending_payments').update({ status: 'pending_confirmation' })
      .eq('user_id', user.id)
      .eq('plan', selectedPlan.nome)
      .in('status', ['pending', 'pending_payment'])

    setProcessing(false)
    setChatStep('done')

    addMessage('bot', `✅ **Status:** Aguardando Confirmação

Recebemos seu aviso! O acesso será liberado estritamente **após a confirmação do personal** no painel de controle.

⏱️ Prazo de avaliação: até 24 horas.`)
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
    // Map plan name to plan key
    const planKey = planName.toLowerCase().includes('essencial') || planName.toLowerCase().includes('basic') ? 'basic' :
                  planName.toLowerCase().includes('personal') || planName.toLowerCase().includes('pro') ? 'pro' :
                  planName.toLowerCase().includes('elite') || planName.toLowerCase().includes('premium') ? 'premium' : 'basic'

    // Aprovar payment via função segura
    const { error } = await supabase.rpc('confirm_payment', {
      p_target_user_id: userId,
      p_plan_type: planKey
    })

    if (error) {
      alert('Erro ao confirmar: ' + error.message)
      return
    }

    // Atualizar status do pagamento
    await supabase.from('pending_payments').update({ 
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: user?.id
    }).eq('id', paymentId)

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
                      disabled={isCurrentActive || (userAssinatura?.status === 'pendente' && !isPendingThis)}
                      onClick={() => startAssistant(p)}
                      style={{width: '100%'}}
                    >
                      {isPendingThis ? (
                        <>
                          <Clock size={16} /> Retomar Pagamento
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
      <AnimatePresence>
        {showAssistant && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="assistant-overlay" 
            onClick={() => setShowAssistant(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="assistant-modal bg-gradient-to-b from-[#0B0F1A] to-[#0E1424] bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.6)]" 
              onClick={e => e.stopPropagation()}
            >
              <div className="assistant-header border-b border-white/10 p-4 pb-4">
                <div className="assistant-header-info flex items-center gap-3">
                  <div className="assistant-avatar bg-gradient-to-br from-purple-500/20 to-indigo-500/20 text-purple-400 p-2 rounded-xl border border-purple-500/20">
                    <Bot size={22} />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold flex items-center gap-2">Assistente Virtual</h3>
                    <span className="text-xs text-emerald-400 font-medium flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block"></span> Online</span>
                  </div>
                </div>
                <button className="assistant-close text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full" onClick={() => setShowAssistant(false)}>
                  <X size={18} />
                </button>
              </div>

              <div ref={chatRef} className="assistant-messages flex flex-col space-y-4 px-4 py-6 max-w-2xl mx-auto w-full">
                {messages.map((msg) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={msg.id} 
                    className={`message flex items-start gap-2 w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'bot' && (
                      <div className="message-avatar shrink-0 mt-1">
                         <div className="bg-purple-500/20 text-purple-400 p-1.5 rounded-lg border border-purple-500/20">
                           <Bot size={16} />
                         </div>
                      </div>
                    )}
                    <div className={`message-bubble inline-block max-w-[80%] text-sm px-4 py-3 ${
                      msg.role === 'bot' 
                        ? 'rounded-2xl bg-white/5 border border-white/10 text-white/80' 
                        : 'rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                    }`}>
                      {msg.text.split('\n').map((line, i) => {
                        if (line.startsWith('**') && line.endsWith('**')) {
                           return <strong key={i} className="text-white font-semibold">{line.slice(2, -2)}</strong>
                        }
                        return (
                          <span key={i} className="block leading-relaxed">
                            {line.includes('Pagamento Pendente') ? (
                              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 mt-1 rounded-full bg-yellow-500/10 text-yellow-300 border border-yellow-500/20 font-medium">
                                <Clock size={12} /> Pagamento Pendente
                              </span>
                            ) : line.includes('Aguardando Confirmação') ? (
                              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 mt-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 font-medium">
                                <CheckCircle2 size={12} /> Aguardando Confirmação
                              </span>
                            ) : line.includes('Status:') ? null : line}
                          </span>
                        )
                      })}

                      {msg.pixData && (
                        <div className="mt-3 p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                          <div className="flex items-center gap-2 pb-3 border-b border-white/10">
                            <Crown size={16} className="text-purple-400" />
                            <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-md font-medium tracking-wide">ASSINATURA PREMIUM</span>
                          </div>
                          
                          <div className="flex justify-between items-end">
                            <div className="space-y-1">
                              <span className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">Valor do Plano</span>
                              <div className="text-2xl font-bold text-white flex items-baseline gap-1">
                                <span className="text-sm font-medium text-white/60">R$</span> {msg.pixData.amount}
                              </div>
                            </div>
                            <div className="text-right space-y-1">
                               <span className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">Plano Selecionado</span>
                               <div className="text-sm font-medium text-purple-300">{msg.pixData.planName}</div>
                            </div>
                          </div>
                          
                          <div className="space-y-2 pt-2">
                            <span className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">Chave PIX (E-mail)</span>
                            <div className="flex items-center gap-2 w-full">
                              <code className="flex-1 bg-black/40 px-3 py-2.5 rounded-xl text-sm font-mono text-purple-200 border border-white/5 overflow-hidden text-ellipsis whitespace-nowrap">
                                {msg.pixData.pixKey}
                              </code>
                              <button 
                                className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 transition-colors shrink-0 shadow-lg shadow-purple-500/20 hover:scale-105 active:scale-95 flex items-center justify-center text-white" 
                                onClick={() => copyToClipboard(msg.pixData!.pixKey)}
                                title="Copiar chave PIX"
                              >
                                <Copy size={18} />
                              </button>
                            </div>
                          </div>
                          
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
                {processing && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="message flex items-start gap-2 w-full justify-start">
                    <div className="message-avatar shrink-0 mt-1">
                      <div className="bg-purple-500/20 text-purple-400 p-1.5 rounded-lg border border-purple-500/20">
                         <Bot size={16} />
                      </div>
                    </div>
                    <div className="message-bubble inline-block max-w-[80%] rounded-2xl bg-white/5 border border-white/10 text-white/80 px-4 py-3 flex items-center gap-2">
                       <Loader2 size={16} className="animate-spin text-purple-400" />
                       <span className="text-sm">Processando...</span>
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="assistant-input-area p-4 border-t border-white/10 bg-[#0B0F1A]/80 backdrop-blur-md">
                <div className="flex gap-2 flex-wrap mt-4 max-w-2xl mx-auto w-full">
                  {chatStep === 'greeting' && (
                    <button className="rounded-xl px-5 py-2.5 font-medium bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 transition-all duration-200 shadow-lg shadow-purple-500/20 text-white text-sm" onClick={() => handleUserMessage('Sim')}>✅ Sim, continuar</button>
                  )}
                  {chatStep === 'payment' && (
                    <button className="rounded-xl px-5 py-2.5 font-medium border border-purple-500 text-purple-400 hover:bg-purple-500/10 transition-all duration-200 shadow-[0_0_15px_rgba(139,92,246,0.1)] text-sm flex items-center gap-2" onClick={() => handleUserMessage('Gerar PIX')}>
                      <Copy size={16}/> Gerar Chave PIX
                    </button>
                  )}
                  {chatStep === 'confirming' && (
                    <button className="rounded-xl px-5 py-2.5 font-medium bg-gradient-to-r from-emerald-500 to-emerald-600 hover:opacity-90 transition-all duration-200 shadow-lg shadow-emerald-500/20 text-white text-sm flex items-center gap-2" onClick={() => handleUserMessage('Já paguei')}>
                      <CheckCircle2 size={16}/> ✅ Já realizei o pagamento
                    </button>
                  )}
                  {chatStep === 'done' && (
                    <button className="rounded-xl px-5 py-2.5 font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all duration-200 text-white text-sm" onClick={() => { setShowAssistant(false); loadData(); }}>🏠 Fechar Assistente</button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

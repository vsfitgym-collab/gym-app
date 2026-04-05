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
} from 'lucide-react'
import { type Plan } from '../lib/subscriptionService'
import { useSubscription } from '../hooks/useSubscription'
import { supabase } from '../lib/supabase'
import './Planos.css'

const PIX_KEY = 'vsfitgym@gmail.com'

const planAmounts: Record<string, number> = {
  basic: 14.90,
  premium: 29.90,
}

const plans = [
  {
    id: 'free' as Plan,
    name: 'Free',
    price: 'R$ 0',
    period: '/7 dias',
    description: 'Experimente gratuitamente',
    icon: Gift,
    color: '#10b981',
    trial: true,
    features: [
      { text: '1 treino ativo', included: true },
      { text: '5 exercícios por treino', included: true },
      { text: 'Biblioteca de exercícios', included: true },
      { text: 'Streak básico', included: true },
      { text: 'Treinos ilimitados', included: false },
      { text: 'Gráficos e analytics', included: false },
      { text: 'Controle financeiro', included: false },
      { text: 'Histórico de presença', included: false },
      { text: 'Exercícios personalizados', included: false },
      { text: 'Exportar relatórios', included: false },
    ],
  },
  {
    id: 'basic' as Plan,
    name: 'Básico',
    price: 'R$ 14,90',
    period: '/mês',
    description: 'Para quem leva treino a sério',
    icon: Zap,
    color: '#06b6d4',
    features: [
      { text: '5 treinos ativos', included: true },
      { text: '15 exercícios por treino', included: true },
      { text: 'Biblioteca de exercícios', included: true },
      { text: 'Streak completo', included: true },
      { text: 'Gráficos e analytics', included: true },
      { text: 'Histórico de presença', included: true },
      { text: 'Treinos ilimitados', included: false },
      { text: 'Controle financeiro', included: false },
      { text: 'Exercícios personalizados', included: false },
      { text: 'Exportar relatórios', included: false },
    ],
  },
  {
    id: 'premium' as Plan,
    name: 'Premium',
    price: 'R$ 29,90',
    period: '/mês',
    description: 'Tudo que você precisa para evoluir',
    icon: Crown,
    color: '#f59e0b',
    popular: true,
    features: [
      { text: 'Treinos ilimitados', included: true },
      { text: 'Exercícios ilimitados', included: true },
      { text: 'Biblioteca completa (+1500)', included: true },
      { text: 'Streak completo + histórico', included: true },
      { text: 'Gráficos e analytics', included: true },
      { text: 'Controle financeiro', included: true },
      { text: 'Histórico de presença', included: true },
      { text: 'Exercícios personalizados', included: true },
      { text: 'Exportar relatórios', included: true },
      { text: 'Suporte prioritário', included: true },
    ],
  },
]

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

export default function PlanosPage() {
  const { user } = useAuth()
  const { plan: currentPlan, isPremium: isSubscribed, refresh: refreshSubscription } = useSubscription()
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [showAssistant, setShowAssistant] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [processing, setProcessing] = useState(false)
  const [chatStep, setChatStep] = useState<'greeting' | 'plan_selected' | 'payment' | 'confirming' | 'done'>('greeting')
  const [hasPendingPayment, setHasPendingPayment] = useState(false)
  const [planJustApproved, setPlanJustApproved] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    checkPendingPayment()
  }, [user])

  useEffect(() => {
    if (hasPendingPayment && user) {
      pollingRef.current = setInterval(async () => {
        const { data: payment } = await supabase
          .from('pending_payments')
          .select('status')
          .eq('user_id', user!.id)
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (payment) {
          await refreshSubscription()
          setHasPendingPayment(false)
          setPlanJustApproved(true)
          if (pollingRef.current) clearInterval(pollingRef.current)
          setTimeout(() => setPlanJustApproved(false), 5000)
        }
      }, 5000)
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [hasPendingPayment, user])

  const checkPendingPayment = async () => {
    if (!user) return
    const { data } = await supabase
      .from('pending_payments')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .single()
    
    setHasPendingPayment(!!data)
  }

  const addMessage = (role: 'bot' | 'user', text: string, pixData?: ChatMessage['pixData']) => {
    setMessages(prev => [...prev, { id: Date.now(), role, text, pixData }])
  }

  const startAssistant = (planId: Plan) => {
    setSelectedPlan(planId)
    setShowAssistant(true)
    setMessages([])
    setChatStep('greeting')
    setProcessing(false)

    setTimeout(() => {
      addMessage('bot', `Olá! 👋 Eu sou o assistente de pagamento da VSFit Gym.

Posso te ajudar a escolher o melhor plano e finalizar sua assinatura. Qual plano te interessou?`)
    }, 500)
  }

  const generatePixInfo = async () => {
    if (!selectedPlan || !user) return

    setProcessing(true)
    setChatStep('confirming')

    const amount = planAmounts[selectedPlan] || 0
    const planName = selectedPlan === 'basic' ? 'Básico' : 'Premium'

    // Save pending payment
    await supabase.from('pending_payments').insert({
      user_id: user.id,
      plan: selectedPlan,
      amount,
      status: 'pending',
      pix_key: PIX_KEY,
    })

    setHasPendingPayment(true)

    addMessage('bot', `Perfeito! 📱 Aqui está a chave PIX para pagamento:

**Plano:** ${planName}
**Valor:** R$ ${amount.toFixed(2).replace('.', ',')}
**Chave PIX (E-mail):** ${PIX_KEY}

Copie a chave abaixo e faça o pagamento pelo seu app bancário:

⏳ **Após pagar, clique em "Já paguei"**
Seu pagamento será verificado pelo personal e o plano ativado em até 24h.`, {
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

    addMessage('bot', `✅ **Solicitação enviada!**

Seu pagamento será verificado pelo personal. Você receberá uma notificação quando o plano for ativado.

⏱️ Prazo: até 24 horas úteis

Obrigado pela preferência! 💪`)
  }

  const handleUserMessage = async (text: string) => {
    addMessage('user', text)
    setInputText('')

    const lowerText = text.toLowerCase()

    if (chatStep === 'greeting') {
      if (lowerText.includes('free') || lowerText.includes('grátis') || lowerText.includes('trial')) {
        setSelectedPlan('free')
        setChatStep('plan_selected')
        setTimeout(() => addMessage('bot', `O plano **Free** é perfeito para começar! 🎉

✅ 7 dias totalmente grátis
✅ 1 treino ativo
✅ Acesso à biblioteca de exercícios

Quando o trial acabar, você pode fazer upgrade a qualquer momento. Quer ativar agora?`), 800)
      } else if (lowerText.includes('básico') || lowerText.includes('basico') || lowerText.includes('14')) {
        setSelectedPlan('basic')
        setChatStep('plan_selected')
        setTimeout(() => addMessage('bot', `O plano **Básico** é ótimo para quem treina regularmente! ⚡

✅ 5 treinos ativos
✅ 15 exercícios por treino
✅ Gráficos e analytics
✅ Histórico de presença

Valor: **R$ 14,90/mês**

Posso prosseguir com a assinatura?`), 800)
      } else if (lowerText.includes('premium') || lowerText.includes('29')) {
        setSelectedPlan('premium')
        setChatStep('plan_selected')
        setTimeout(() => addMessage('bot', `Excelente escolha! O **Premium** é o mais completo! 👑

✅ Treinos e exercícios ilimitados
✅ Biblioteca completa (+1500 exercícios)
✅ Controle financeiro
✅ Exercícios personalizados
✅ Exportar relatórios
✅ Suporte prioritário

Valor: **R$ 29,90/mês**

Posso prosseguir com a assinatura?`), 800)
      } else {
        setTimeout(() => addMessage('bot', `Entendi! Posso te ajudar com:

🎁 **Free** - 7 dias grátis
⚡ **Básico** - R$ 14,90/mês
👑 **Premium** - R$ 29,90/mês

Digite o nome do plano que te interessou.`), 800)
      }
    } else if (chatStep === 'plan_selected') {
      if (lowerText.includes('sim') || lowerText.includes('quero') || lowerText.includes('ativar') || lowerText.includes('prosiga') || lowerText.includes('ok') || lowerText.includes('pode')) {
        setChatStep('payment')
        setTimeout(() => addMessage('bot', `Ótimo! 💳 O pagamento será via **PIX** (instantâneo).

**Plano:** ${selectedPlan === 'basic' ? 'Básico - R$ 14,90/mês' : 'Premium - R$ 29,90/mês'}

Clique em **"Gerar PIX"** para ver a chave e o QR Code.`), 800)
      } else if (lowerText.includes('trocar') || lowerText.includes('outro') || lowerText.includes('mudar')) {
        setChatStep('greeting')
        setTimeout(() => addMessage('bot', `Sem problema! Qual plano você prefere?

🎁 **Free** - 7 dias grátis
⚡ **Básico** - R$ 14,90/mês
👑 **Premium** - R$ 29,90/mês`), 800)
      } else {
        setTimeout(() => addMessage('bot', `Deseja prosseguir com a assinatura do plano ${selectedPlan === 'free' ? 'Free' : selectedPlan === 'basic' ? 'Básico' : 'Premium'}? Digite **sim** para continuar.`), 800)
      }
    } else if (chatStep === 'payment') {
      if (lowerText.includes('gerar') || lowerText.includes('pix') || lowerText.includes('qr') || lowerText.includes('pagar') || lowerText.includes('sim')) {
        await generatePixInfo()
      } else if (lowerText.includes('trocar') || lowerText.includes('outro')) {
        setChatStep('plan_selected')
        setTimeout(() => addMessage('bot', `Sem problema! Qual plano você prefere?

🎁 **Free** - 7 dias grátis
⚡ **Básico** - R$ 14,90/mês
👑 **Premium** - R$ 29,90/mês`), 800)
      } else {
        setTimeout(() => addMessage('bot', `Clique em **"Gerar PIX"** para ver a chave e o QR Code.`), 800)
      }
    } else if (chatStep === 'confirming') {
      if (lowerText.includes('já paguei') || lowerText.includes('ja paguei') || lowerText.includes('confirmar') || lowerText.includes('paguei')) {
        await confirmPayment()
      } else if (lowerText.includes('trocar') || lowerText.includes('outro')) {
        setChatStep('plan_selected')
        setTimeout(() => addMessage('bot', `Sem problema! Qual plano você prefere?

🎁 **Free** - 7 dias grátis
⚡ **Básico** - R$ 14,90/mês
👑 **Premium** - R$ 29,90/mês`), 800)
      } else {
        setTimeout(() => addMessage('bot', `Após fazer o PIX, clique em **"Já paguei"** para enviar a solicitação de ativação.`), 800)
      }
    } else if (chatStep === 'done') {
      setTimeout(() => setShowAssistant(false), 3000)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="planos-page">
      <div className="planos-header">
        <div className="planos-title">
          <h2>Escolha seu Plano</h2>
          <p>Selecione o plano ideal para sua jornada fitness</p>
        </div>
        {planJustApproved && (
          <div className="plan-approved-toast">
            <CheckCircle2 size={16} />
            <span>Plano ativado com sucesso!</span>
          </div>
        )}
      </div>

      <div className="planos-grid">
        {plans.map((p) => {
          const isCurrentPlan = p.id === currentPlan && !isSubscribed
          
          return (
            <div
              key={p.id}
              className={`plano-card ${p.popular ? 'popular' : ''} ${isCurrentPlan ? 'current' : ''}`}
            >
              {p.popular && (
                <div className="plano-badge-popular">
                  <Crown size={12} />
                  <span>Mais popular</span>
                </div>
              )}

              {p.trial && (
                <div className="plano-badge-trial">
                  <Gift size={12} />
                  <span>7 dias grátis</span>
                </div>
              )}

              <div className="plano-header">
                <div className="plano-icon" style={{ background: `${p.color}15`, color: p.color }}>
                  <p.icon size={28} />
                </div>
                <div className="plano-info">
                  <h3>{p.name}</h3>
                  <p>{p.description}</p>
                </div>
              </div>

              <div className="plano-price">
                <span className="price-value">{p.price}</span>
                <span className="price-period">{p.period}</span>
              </div>

              <div className="plano-features">
                {p.features.map((feature, i) => (
                  <div key={i} className={`plano-feature ${feature.included ? '' : 'disabled'}`}>
                    {feature.included ? (
                      <Check size={14} className="feature-check" />
                    ) : (
                      <X size={14} className="feature-x" />
                    )}
                    <span>{feature.text}</span>
                  </div>
                ))}
              </div>

              <button
                className={`plano-btn ${p.popular ? 'btn-premium' : p.id === 'basic' ? 'btn-basic' : 'btn-free'}`}
                disabled={isCurrentPlan || hasPendingPayment}
                onClick={() => startAssistant(p.id)}
              >
                {hasPendingPayment ? (
                  <>
                    <Clock size={16} />
                    Pagamento pendente
                  </>
                ) : isCurrentPlan ? (
                  <>
                    <CheckCircle2 size={16} />
                    Plano atual
                  </>
                ) : (
                  <>
                    <Bot size={16} />
                    Assinar com IA
                  </>
                )}
              </button>
            </div>
          )
        })}
      </div>

      <div className="planos-guarantee">
        <Shield size={20} />
        <div>
          <span className="guarantee-title">Garantia de 7 dias</span>
          <span className="guarantee-text">Cancele a qualquer momento sem custo</span>
        </div>
      </div>

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
                  <h3>Assistente VSFit</h3>
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
                          {line.split(/(\*\*[^*]+\*\*)/).map((part, j) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                              return <strong key={j}>{part.slice(2, -2)}</strong>
                            }
                            return <span key={j}>{part}</span>
                          })}
                          {i < msg.text.split('\n').length - 1 && <br />}
                        </span>
                      )
                    })}

                    {/* PIX Key */}
                    {msg.pixData && (
                      <div className="payment-qr-code">
                        <div className="pix-key-display">
                          <span className="pix-key-icon">📧</span>
                          <code className="pix-key-code">{msg.pixData.pixKey}</code>
                          <button className="btn-copy" onClick={() => copyToClipboard(msg.pixData!.pixKey)}>
                            <Copy size={14} />
                            Copiar chave
                          </button>
                        </div>
                        <div className="pix-info">
                          <span>💡 Abra seu app bancário → PIX → Cole a chave e envie</span>
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
                    <Loader2 size={16} className="spinner" />
                    <span>Gerando PIX...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="assistant-input-area">
              <div className="quick-actions">
                {chatStep === 'greeting' && (
                  <>
                    <button onClick={() => handleUserMessage('Quero o Free')}>🎁 Free</button>
                    <button onClick={() => handleUserMessage('Quero o Básico')}>⚡ Básico</button>
                    <button onClick={() => handleUserMessage('Quero o Premium')}>👑 Premium</button>
                  </>
                )}
                {chatStep === 'plan_selected' && (
                  <>
                    <button onClick={() => handleUserMessage('Sim, quero assinar')}>✅ Sim, assinar</button>
                    <button onClick={() => handleUserMessage('Quero trocar de plano')}>🔄 Trocar plano</button>
                  </>
                )}
                {chatStep === 'payment' && (
                  <button onClick={() => handleUserMessage('Gerar PIX')} className="btn-generate-pix">
                    💳 Gerar PIX
                  </button>
                )}
                {chatStep === 'confirming' && (
                  <>
                    <button onClick={() => handleUserMessage('Já paguei')}>✅ Já paguei</button>
                    <button onClick={() => handleUserMessage('Trocar plano')}>🔄 Trocar</button>
                  </>
                )}
                {chatStep === 'done' && (
                  <button onClick={() => setShowAssistant(false)}>🏠 Voltar aos treinos</button>
                )}
              </div>
              <div className="input-wrapper">
                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && inputText.trim() && handleUserMessage(inputText.trim())}
                  placeholder="Digite sua mensagem..."
                  disabled={processing || chatStep === 'done'}
                />
                <button
                  className="send-btn"
                  onClick={() => inputText.trim() && handleUserMessage(inputText.trim())}
                  disabled={processing || chatStep === 'done' || !inputText.trim()}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

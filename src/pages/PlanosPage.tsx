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
  QrCode,
  CreditCard,
  FileText,
  CheckCircle2,
} from 'lucide-react'
import { subscribeToPlan, startTrial, type Plan } from '../lib/subscriptionService'
import { useSubscription } from '../hooks/useSubscription'
import './Planos.css'

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
  paymentMethod?: string
}

export default function PlanosPage() {
  const { user } = useAuth()
  const { plan: currentPlan, isPremium: isSubscribed, refresh } = useSubscription()
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [showAssistant, setShowAssistant] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [processing, setProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null)
  const [paymentConfirmed, setPaymentConfirmed] = useState(false)
  const [chatStep, setChatStep] = useState<'greeting' | 'plan_selected' | 'payment' | 'confirming' | 'done'>('greeting')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardName, setCardName] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const addMessage = (role: 'bot' | 'user', text: string, paymentMethod?: string) => {
    setMessages(prev => [...prev, { id: Date.now(), role, text, paymentMethod }])
  }

  const startAssistant = (planId: Plan) => {
    setSelectedPlan(planId)
    setShowAssistant(true)
    setMessages([])
    setPaymentMethod(null)
    setPaymentConfirmed(false)
    setCardNumber('')
    setCardExpiry('')
    setCardName('')
    setCardCvv('')

    setTimeout(() => {
      addMessage('bot', `Olá! 👋 Eu sou o assistente de pagamento da VSFit Gym.

Posso te ajudar a escolher o melhor plano e finalizar sua assinatura. Qual plano te interessou?`)
    }, 500)
  }

  const handlePayment = async () => {
    if (!user || !selectedPlan) return
    setProcessing(true)

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2500))

    if (selectedPlan === 'free') {
      await startTrial(user.id, 7)
    } else {
      await subscribeToPlan(user.id, selectedPlan)
    }
    await refresh()

    setProcessing(false)
    setPaymentConfirmed(true)

    addMessage('bot', `🎉 **Assinatura ativada com sucesso!**

Seu plano **${selectedPlan === 'basic' ? 'Básico' : selectedPlan === 'premium' ? 'Premium' : 'Free'}** já está ativo. Aproveite todos os recursos!

Qualquer dúvida, é só me chamar. Bons treinos! 💪`)
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
        setTimeout(() => addMessage('bot', `Ótimo! 💳 Escolha a forma de pagamento:

1. **PIX** - Pagamento instantâneo (QR Code)
2. **Cartão de Crédito** - Parcelamento disponível
3. **Boleto** - Vencimento em 3 dias

Digite o método desejado.`), 800)
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
      if (lowerText.includes('pix')) {
        setPaymentMethod('pix')
        setChatStep('confirming')
        const planPrice = selectedPlan === 'basic' ? '14,90' : selectedPlan === 'premium' ? '29,90' : '0'
        setTimeout(() => addMessage('bot', `Perfeito! Aqui está o QR Code PIX para pagamento:

**Plano:** ${selectedPlan === 'basic' ? 'Básico' : selectedPlan === 'premium' ? 'Premium' : 'Free'}
**Valor:** R$ ${planPrice}

Escaneie o QR Code abaixo com seu app bancário:`, 'pix'), 800)
      } else if (lowerText.includes('cartão') || lowerText.includes('cartao') || lowerText.includes('credito')) {
        setPaymentMethod('card')
        setChatStep('confirming')
        setTimeout(() => addMessage('bot', `Ótimo! 💳 Preencha os dados do cartão:

**Plano:** ${selectedPlan === 'basic' ? 'Básico' : selectedPlan === 'premium' ? 'Premium' : 'Free'}
**Valor:** R$ ${selectedPlan === 'basic' ? '14,90' : selectedPlan === 'premium' ? '29,90' : '0'}/mês

Digite os dados do cartão abaixo ou clique em "Confirmar" para prosseguir.`, 'card'), 800)
      } else if (lowerText.includes('boleto')) {
        setPaymentMethod('boleto')
        setChatStep('confirming')
        setTimeout(() => addMessage('bot', `Perfeito! Aqui está o boleto para pagamento:

**Plano:** ${selectedPlan === 'basic' ? 'Básico' : selectedPlan === 'premium' ? 'Premium' : 'Free'}
**Valor:** R$ ${selectedPlan === 'basic' ? '14,90' : selectedPlan === 'premium' ? '29,90' : '0'}
**Vencimento:** 3 dias úteis

Código de barras:
**23793.38128 60000.000003 00000.000400 1 84340000001490

O boleto será compensado em até 3 dias úteis após o pagamento. Clique em "Já paguei" para confirmar.`, 'boleto'), 800)
      } else if (lowerText.includes('trocar') || lowerText.includes('outro')) {
        setChatStep('plan_selected')
        setTimeout(() => addMessage('bot', `Sem problema! Qual plano você prefere?

🎁 **Free** - 7 dias grátis
⚡ **Básico** - R$ 14,90/mês
👑 **Premium** - R$ 29,90/mês`), 800)
      } else {
        setTimeout(() => addMessage('bot', `Escolha uma forma de pagamento:

1. **PIX** - Pagamento instantâneo
2. **Cartão de Crédito**
3. **Boleto`), 800)
      }
    } else if (chatStep === 'confirming') {
      if (lowerText.includes('já paguei') || lowerText.includes('ja paguei') || lowerText.includes('confirmar') || lowerText.includes('pagar') || lowerText.includes('sim')) {
        setChatStep('done')
        await handlePayment()
      } else if (lowerText.includes('trocar') || lowerText.includes('outro')) {
        setPaymentMethod(null)
        setChatStep('payment')
        setTimeout(() => addMessage('bot', `Qual forma de pagamento prefere?

1. **PIX** - Pagamento instantâneo
2. **Cartão de Crédito**
3. **Boleto`), 800)
      } else {
        setTimeout(() => addMessage('bot', `Para confirmar o pagamento, digite **já paguei** ou **confirmar**.`), 800)
      }
    } else if (chatStep === 'done') {
      setTimeout(() => {
        setShowAssistant(false)
      }, 2000)
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
                disabled={isCurrentPlan}
                onClick={() => startAssistant(p.id)}
              >
                {isCurrentPlan ? (
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

                    {/* PIX QR Code */}
                    {msg.paymentMethod === 'pix' && (
                      <div className="payment-qr-code">
                        <div className="qr-placeholder">
                          <QrCode size={120} />
                          <span>QR Code PIX</span>
                        </div>
                        <div className="pix-payload">
                          <span className="pix-label">PIX Copia e Cola:</span>
                          <code className="pix-code">00020126580014br.gov.bcb.pix0136a629532e-7693-4846-b0f3-7772b5e5f1235204000053039865405{selectedPlan === 'basic' ? '14.90' : selectedPlan === 'premium' ? '29.90' : '0.00'}5802BR5913VSFIT_GYM6009SAO_PAULO62070503***63041D3D</code>
                          <button className="btn-copy" onClick={() => copyToClipboard('00020126580014br.gov.bcb.pix0136a629532e-7693-4846-b0f3-7772b5e5f123')}>
                            <Copy size={14} />
                            Copiar código
                          </button>
                        </div>
                        <button className="btn-confirm-payment" onClick={() => handlePayment()}>
                          <CheckCircle2 size={16} />
                          Já fiz o pagamento
                        </button>
                      </div>
                    )}

                    {/* Card Form */}
                    {msg.paymentMethod === 'card' && (
                      <div className="payment-card-form">
                        <div className="card-input-group">
                          <label><CreditCard size={14} /> Número do Cartão</label>
                          <input
                            type="text"
                            placeholder="0000 0000 0000 0000"
                            value={cardNumber}
                            onChange={e => setCardNumber(e.target.value)}
                            maxLength={19}
                          />
                        </div>
                        <div className="card-input-group">
                          <label>Nome no Cartão</label>
                          <input
                            type="text"
                            placeholder="Nome como está no cartão"
                            value={cardName}
                            onChange={e => setCardName(e.target.value)}
                          />
                        </div>
                        <div className="card-input-row">
                          <div className="card-input-group">
                            <label>Validade</label>
                            <input
                              type="text"
                              placeholder="MM/AA"
                              value={cardExpiry}
                              onChange={e => setCardExpiry(e.target.value)}
                              maxLength={5}
                            />
                          </div>
                          <div className="card-input-group">
                            <label>CVV</label>
                            <input
                              type="text"
                              placeholder="000"
                              value={cardCvv}
                              onChange={e => setCardCvv(e.target.value)}
                              maxLength={4}
                            />
                          </div>
                        </div>
                        <button className="btn-confirm-payment" onClick={() => handlePayment()} disabled={processing}>
                          {processing ? (
                            <>
                              <Loader2 size={16} className="spinner" />
                              Processando...
                            </>
                          ) : (
                            <>
                              <CreditCard size={16} />
                              Confirmar Pagamento
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Boleto */}
                    {msg.paymentMethod === 'boleto' && (
                      <div className="payment-boleto">
                        <div className="boleto-barcode">
                          <FileText size={48} />
                          <div className="barcode-lines">
                            {Array.from({ length: 40 }).map((_, i) => (
                              <div key={i} className={`barcode-line ${Math.random() > 0.5 ? 'thick' : 'thin'}`} />
                            ))}
                          </div>
                          <code className="boleto-code">23793.38128 60000.000003 00000.000400 1 84340000001490</code>
                        </div>
                        <button className="btn-copy" onClick={() => copyToClipboard('23793381286000000000300000000400184340000001490')}>
                          <Copy size={14} />
                          Copiar código de barras
                        </button>
                        <button className="btn-confirm-payment" onClick={() => handlePayment()} disabled={processing}>
                          {processing ? (
                            <>
                              <Loader2 size={16} className="spinner" />
                              Verificando...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={16} />
                              Já paguei o boleto
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {processing && !messages.some(m => m.role === 'bot' && m.text.includes('Processando')) && (
                <div className="message bot">
                  <div className="message-avatar"><Bot size={14} /></div>
                  <div className="message-bubble processing">
                    <Loader2 size={16} className="spinner" />
                    <span>Processando pagamento...</span>
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
                  <>
                    <button onClick={() => handleUserMessage('PIX')}>📱 PIX</button>
                    <button onClick={() => handleUserMessage('Cartão de Crédito')}>💳 Cartão</button>
                    <button onClick={() => handleUserMessage('Boleto')}>📄 Boleto</button>
                  </>
                )}
                {(chatStep === 'confirming' || chatStep === 'done') && paymentMethod && (
                  <button onClick={() => handleUserMessage('Confirmar')}>✅ Confirmar pagamento</button>
                )}
              </div>
              <div className="input-wrapper">
                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && inputText.trim() && handleUserMessage(inputText.trim())}
                  placeholder="Digite sua mensagem..."
                  disabled={processing || paymentConfirmed}
                />
                <button
                  className="send-btn"
                  onClick={() => inputText.trim() && handleUserMessage(inputText.trim())}
                  disabled={processing || paymentConfirmed || !inputText.trim()}
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

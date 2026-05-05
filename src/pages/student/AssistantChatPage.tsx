import { useState, useRef, useEffect, useCallback } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useAuthStore } from "@/stores/authStore"
import { supabase } from "@/lib/supabase"
import { createPixPayment, getPlansFromDB, type PixPaymentResult, type PlanFromDB } from "@/lib/payments"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Sparkles, Copy, Check, QrCode, Clock, CheckCircle, Loader2 } from "lucide-react"

interface Message {
  id: number
  sender: "user" | "assistant"
  text: string
  type?: "text" | "payment" | "success" | "waiting" | "button"
  paymentData?: PixPaymentResult
  buttonText?: string
  buttonAction?: () => void
}

const PLANS_INFO: Record<string, { name: string; price: number }> = {}

function generateQRCodeDataUrl(pixCode: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixCode)}`
}

export function AssistantChatPage() {
  const { user } = useAuthStore()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const planParam = searchParams.get("plan")
  
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [copied, setCopied] = useState(false)
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "paid" | null>(null)
  const [plansFromDB, setPlansFromDB] = useState<PlanFromDB[]>([])
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadPlans()
  }, [])

  useEffect(() => {
    if (plansFromDB.length > 0) {
      initializeChat()
    }
  }, [plansFromDB])

  const loadPlans = async () => {
    try {
      const plans = await getPlansFromDB()
      setPlansFromDB(plans)
      const plansMap: Record<string, { name: string; price: number }> = {}
      plans.forEach(p => {
        plansMap[p.id] = { name: p.name, price: p.price }
        plansMap[p.name.toLowerCase()] = { name: p.name, price: p.price }
      })
      Object.assign(PLANS_INFO, plansMap)
    } catch (error) {
      console.error("Error loading plans:", error)
    }
  }

  const getPlanFromParam = () => {
    if (!planParam) return null
    
    const found = plansFromDB.find(p => 
      p.id === planParam || 
      p.id.toLowerCase() === planParam.toLowerCase() ||
      p.name.toLowerCase() === planParam.toLowerCase() ||
      p.name.toLowerCase().includes(planParam.toLowerCase()) ||
      planParam.toLowerCase().includes(p.name.toLowerCase())
    )
    
    if (found) return { name: found.name, price: found.price }
    
    const planInfo = PLANS_INFO[planParam]
    return planInfo ? { name: planInfo.name, price: planInfo.price } : null
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (!currentPaymentId) return

    const channel = supabase
      .channel(`payment-${currentPaymentId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "payments",
          filter: `id=eq.${currentPaymentId}`,
        },
        (payload: any) => {
          if (payload.new?.status === "approved") {
            setPaymentStatus("paid")
            const successMsg: Message = {
              id: Date.now(),
              sender: "assistant",
              text: "Pagamento confirmado! 🎉\n\nSeu plano está ativo. Aproveite todos os benefícios!",
              type: "success",
              buttonText: "Ir para Dashboard",
              buttonAction: () => navigate("/dashboard")
            }
            setMessages(prev => [...prev, successMsg])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentPaymentId, navigate])

  const initializeChat = async () => {
    if (plansFromDB.length === 0) {
      await loadPlans()
    }
    
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const planInfo = getPlanFromParam()
    
    const initialMessages: Message[] = [
      {
        id: 1,
        sender: "assistant",
        text: "Olá! Seja bem-vindo ao VSFit Gym!"
      },
      {
        id: 2,
        sender: "assistant",
        text: "Sou seu assistente virtual e vou te ajudar a ativar seu plano hoje."
      },
    ]

    if (planInfo) {
      initialMessages.push({
        id: 3,
        sender: "assistant",
        text: `Você escolheu o plano ${planInfo.name}. O valor é R$ ${planInfo.price.toFixed(2)}/mês.`
      })
      
      if (planInfo.price > 0) {
        const planInDB = plansFromDB.find(p => p.name.toLowerCase() === planInfo.name.toLowerCase())
        const planIdToUse = planInDB?.id || planParam || "basic"
        initialMessages.push({
          id: 4,
          sender: "assistant",
          text: "Vou gerar o PIX para você realizar o pagamento agora.",
          type: "button",
          buttonText: "Gerar PIX",
          buttonAction: () => handleGeneratePix(planIdToUse, planInfo.price)
        })
      } else {
        initialMessages.push({
          id: 4,
          sender: "assistant",
          text: "Como é o plano Trial, já está liberado! Pode começar a treinar agora.",
          type: "button",
          buttonText: "Ver Meus Treinos",
          buttonAction: () => navigate("/workouts")
        })
      }
    } else {
      initialMessages.push({
        id: 3,
        sender: "assistant",
        text: "Escolha um dos planos disponíveis: Trial (grátis), Básico (R$ 49,90), Pro (R$ 89,90) ou Premium (R$ 149,90)."
      })
    }

    setMessages(initialMessages)
    setIsTyping(false)
  }

  const handleGeneratePix = async (plan: string, amount: number) => {
    if (!user || !plan) return

    setIsTyping(true)

    try {
      const paymentResult = await createPixPayment(plan, user.id, amount)
      setCurrentPaymentId(paymentResult.payment_id)
      setPaymentStatus("pending")

      const paymentMsg: Message = {
        id: Date.now(),
        sender: "assistant",
        text: "Pagamento gerado! Escaneie o QR Code ou copie o código Pix.",
        type: "payment",
        paymentData: paymentResult
      }
      setMessages(prev => [...prev, paymentMsg])

      await new Promise(resolve => setTimeout(resolve, 800))

      const confirmMsg: Message = {
        id: Date.now() + 1,
        sender: "assistant",
        text: "Faça o pagamento e aguarde. Seu personal será notificado para confirmar.",
        type: "waiting",
        buttonText: "Já paguei",
        buttonAction: () => handleConfirmPayment(paymentResult)
      }
      setMessages(prev => [...prev, confirmMsg])

    } catch (error) {
      console.error("Error generating pix:", error)
      const errorMsg: Message = {
        id: Date.now(),
        sender: "assistant",
        text: "Desculpe, houve um erro ao gerar o pagamento. Tente novamente."
      }
      setMessages(prev => [...prev, errorMsg])
    }

    await new Promise(resolve => setTimeout(resolve, 500))
    setIsTyping(false)
  }

  const handleConfirmPayment = async (paymentResult: PixPaymentResult) => {
    if (!user) return

    const confirmMsg: Message = {
      id: Date.now(),
      sender: "user",
      text: "Já realizei o pagamento!"
    }
    setMessages(prev => [...prev, confirmMsg])

    setIsTyping(true)
    await new Promise(resolve => setTimeout(resolve, 1500))

    const responseMsg: Message = {
      id: Date.now() + 1,
      sender: "assistant",
      text: "Perfeito! Seu pagamento foi registrado.\n\nAguarde a confirmação do seu personal trainer. Você receberá uma notificação quando seu plano estiver ativo.",
      type: "button",
      buttonText: "Voltar aos Planos",
      buttonAction: () => navigate("/plans")
    }
    setMessages(prev => [...prev, responseMsg])

    await new Promise(resolve => setTimeout(resolve, 500))
    setIsTyping(false)
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return

    const userMsg: Message = {
      id: Date.now(),
      sender: "user",
      text: inputValue.trim()
    }
    setMessages(prev => [...prev, userMsg])
    setInputValue("")

    setIsTyping(true)
    await new Promise(resolve => setTimeout(resolve, 1000))

    const text = inputValue.toLowerCase()
    let response: Message

    if (text.includes("plano") || text.includes("assinar")) {
      response = {
        id: Date.now() + 1,
        sender: "assistant",
        text: "Vá até a página de Planos para escolher e assinar seu plano. Lá você receberá as instruções de pagamento."
      }
    } else if (text.includes("treino") || text.includes("treinar")) {
      response = {
        id: Date.now() + 1,
        sender: "assistant",
        text: "Para treinar, vá até Meus Treinos. Lá você encontrará seus treinos asignados.",
        type: "button",
        buttonText: "Ver Treinos",
        buttonAction: () => navigate("/workouts")
      }
    } else if (text.includes("oi") || text.includes("olá")) {
      response = {
        id: Date.now() + 1,
        sender: "assistant",
        text: "Olá! Como posso te ajudar hoje? Posso auxiliar com informações sobre planos, treinos ou dúvidas gerais."
      }
    } else {
      response = {
        id: Date.now() + 1,
        sender: "assistant",
        text: "Obrigado pela mensagem! Para um atendimento mais detalhado, entre em contato com seu personal trainer."
      }
    }

    setMessages(prev => [...prev, response])
    
    await new Promise(resolve => setTimeout(resolve, 500))
    setIsTyping(false)
  }

  const handleCopyPix = (pixCode: string) => {
    navigator.clipboard.writeText(pixCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatPixCode = (code: string): string => {
    if (code.length > 50) {
      return code.substring(0, 50) + "..."
    }
    return code
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Assistente Virtual</h1>
        <p className="text-muted-foreground text-sm">Tire suas dúvidas e ative seu plano</p>
      </div>

      <Card className="flex-1 flex flex-col bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border-zinc-800 overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjAyIi8+PC9nPjwvc3ZnPg==')] opacity-30" />
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center h-full space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <p className="text-muted-foreground text-center">
                Conectando com assistente...
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {messages.map((msg, idx) => (
                <motion.div
                  key={msg.id || `msg-${idx}-${Date.now()}`}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: idx * 0.05, duration: 0.3 }}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex items-end gap-3 max-w-[85%] ${msg.sender === "user" ? "flex-row-reverse" : ""}`}>
                    {msg.sender === "assistant" && (
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/25">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                    )}
                    
                    <div className={`px-5 py-4 rounded-2xl ${
                      msg.sender === "user"
                        ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-purple-500/20"
                        : msg.type === "payment"
                          ? "bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl"
                          : msg.type === "success"
                            ? "bg-emerald-500/20 backdrop-blur-xl border border-emerald-500/30 shadow-lg shadow-emerald-500/10"
                            : msg.type === "waiting"
                              ? "bg-amber-500/10 backdrop-blur-xl border border-amber-500/20"
                              : "bg-zinc-800/80 backdrop-blur-xl border border-zinc-700/50"
                    }`}>
                      {msg.type === "payment" && msg.paymentData && (
                        <div className="space-y-4">
                          <div className="text-center">
                            <p className="font-semibold text-lg">{msg.paymentData.plan_name}</p>
                            <p className="text-3xl font-bold text-primary">R$ {msg.paymentData.amount.toFixed(2)}</p>
                          </div>

                          <div className="flex justify-center">
                            <div className="p-3 bg-white rounded-xl">
                              <img 
                                src={generateQRCodeDataUrl(msg.paymentData.pix_code)} 
                                alt="QR Code PIX"
                                className="w-40 h-40"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground text-center font-medium">PIX Copia e Cola</p>
                            <div className="flex items-center gap-2 p-3 bg-black/30 rounded-lg">
                              <code className="text-xs text-emerald-400 flex-1 break-all font-mono">
                                {formatPixCode(msg.paymentData.pix_code)}
                              </code>
                              <button
                                onClick={() => handleCopyPix(msg.paymentData!.pix_code)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-all flex-shrink-0"
                              >
                                {copied ? (
                                  <Check className="w-4 h-4 text-emerald-500" />
                                ) : (
                                  <Copy className="w-4 h-4 text-muted-foreground" />
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>Expira em 24 horas</span>
                          </div>
                        </div>
                      )}

                      {msg.type === "success" && (
                        <div className="space-y-3">
                          <div className="flex justify-center">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                              <CheckCircle className="w-8 h-8 text-emerald-500" />
                            </div>
                          </div>
                          <p className="text-center whitespace-pre-line">{msg.text}</p>
                        </div>
                      )}

                      {msg.type === "waiting" && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-center gap-2 text-amber-400">
                            <Clock className="w-5 h-5 animate-pulse" />
                            <span className="font-medium">Aguardando confirmação</span>
                          </div>
                          <p className="text-center text-sm text-muted-foreground whitespace-pre-line">{msg.text}</p>
                        </div>
                      )}

                      {!msg.type || msg.type === "text" ? (
                        <p className="text-sm whitespace-pre-line leading-relaxed">{msg.text}</p>
                      ) : null}
                      
                      {msg.buttonText && (
                        <div className="mt-4 flex justify-center">
                          <Button
                            size="sm"
                            onClick={msg.buttonAction}
                            disabled={isTyping}
                            className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500"
                          >
                            {msg.buttonText}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex items-end gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div className="p-4 rounded-2xl bg-zinc-800/80 backdrop-blur-xl border border-zinc-700/50">
                      <div className="flex gap-1.5">
                        <span className="w-2.5 h-2.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2.5 h-2.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2.5 h-2.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </AnimatePresence>
          )}
        </div>

        <div className="p-4 border-t border-zinc-800/50 bg-black/50 backdrop-blur-xl relative z-10">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage()
            }}
            className="flex gap-3"
          >
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1 bg-zinc-900/80 border-zinc-700/50 backdrop-blur-xl"
              disabled={isTyping}
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={!inputValue.trim() || isTyping}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500"
            >
              {isTyping ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
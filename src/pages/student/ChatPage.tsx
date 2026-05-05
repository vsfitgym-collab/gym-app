import { useState, useRef, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useAuthStore } from "@/stores/authStore"
import { supabase } from "@/lib/supabase"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Sparkles, Copy, Check, User, Zap } from "lucide-react"

interface Message {
  id: number
  sender: "user" | "assistant"
  text: string
  type?: "text" | "payment" | "button"
  buttonText?: string
  buttonAction?: () => void
}

const PLANS_INFO: Record<string, { name: string; price: number }> = {
  trial: { name: "Trial", price: 0 },
  basico: { name: "Básico", price: 49.90 },
  pro: { name: "Pro", price: 89.90 },
  premium: { name: "Premium", price: 149.90 },
}

const PIX_KEY = "vsfitgym@gmail.com"

export function ChatPage() {
  const { user } = useAuthStore()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const planParam = searchParams.get("plan")
  
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [hasPaid, setHasPaid] = useState(false)
  const [copied, setCopied] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    initializeChat()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const initializeChat = async () => {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const planInfo = planParam ? PLANS_INFO[planParam] : null
    
    const initialMessages: Message[] = [
      {
        id: 1,
        sender: "assistant",
        text: "👋 Olá! Seja bem-vindo ao VSFit Gym!"
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
        initialMessages.push({
          id: 4,
          sender: "assistant",
          text: "Vou gerar uma chave PIX para você realizar o pagamento ahora.",
          type: "button",
          buttonText: "Gerar PIX",
          buttonAction: () => handleGeneratePix(planParam, planInfo.price)
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

  const handleGeneratePix = async (plan: string | null, amount: number) => {
    if (!user || !plan) return

    setIsTyping(true)

    const paymentMsg: Message = {
      id: Date.now(),
      sender: "assistant",
      text: `📱 Chave PIX:\n\n${PIX_KEY}\n\nCopie e faça o pagamento no seu banco.`,
      type: "payment"
    }
    setMessages(prev => [...prev, paymentMsg])

    await new Promise(resolve => setTimeout(resolve, 800))

    const confirmMsg: Message = {
      id: Date.now() + 1,
      sender: "assistant",
      text: "Após realizar o pagamento, clique em 'Já paguei' para confirmarmos.",
      type: "button",
      buttonText: "Já paguei ✅",
      buttonAction: () => handleConfirmPayment(plan, amount)
    }
    setMessages(prev => [...prev, confirmMsg])

    await supabase.from("payments").insert({
      user_id: user.id,
      plan: plan,
      amount: amount,
      status: "pending",
    })

    await new Promise(resolve => setTimeout(resolve, 500))
    setIsTyping(false)
  }

  const handleConfirmPayment = async (plan: string, amount: number) => {
    if (!user) return

    setHasPaid(true)

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
      text: "✅ Perfeito! Seu pagamento foi registrado.\n\nSeu personal será notificado para confirmar. Em até 24h seu plano estará ativo!"
    }
    setMessages(prev => [...prev, responseMsg])

    await supabase
      .from("payments")
      .update({ status: "paid" })
      .eq("user_id", user.id)
      .eq("plan", plan)
      .eq("status", "pending")

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
    } else if (text.includes("oi") || text.includes("olá") || text.includes("hello")) {
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

  const handleCopyPix = () => {
    navigator.clipboard.writeText(PIX_KEY)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Assistente Virtual</h1>
        <p className="text-muted-foreground text-sm">Tire suas dúvidas e ative seu plano</p>
      </div>

      <Card className="flex-1 flex flex-col bg-zinc-950 border-zinc-800 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center h-full space-y-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <p className="text-muted-foreground text-center">
                Conectando com assistente...
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {messages.map((msg, idx) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex items-end gap-2 max-w-[85%] ${msg.sender === "user" ? "flex-row-reverse" : ""}`}>
                    {msg.sender === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className={`p-4 rounded-2xl ${
                      msg.sender === "user"
                        ? "bg-primary text-primary-foreground"
                        : msg.type === "payment"
                          ? "bg-emerald-500/20 border border-emerald-500/30"
                          : "bg-zinc-800"
                    }`}>
                      {msg.type === "payment" ? (
                        <div className="space-y-3">
                          <p className="text-sm whitespace-pre-line">{msg.text}</p>
                          <div className="flex items-center gap-2 p-2 bg-zinc-900/50 rounded-lg">
                            <code className="text-sm text-emerald-400 flex-1">{PIX_KEY}</code>
                            <button
                              onClick={handleCopyPix}
                              className="p-1.5 hover:bg-white/10 rounded transition-colors"
                            >
                              {copied ? (
                                <Check className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <Copy className="w-4 h-4 text-muted-foreground" />
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-line">{msg.text}</p>
                      )}
                      
                      {msg.buttonText && !hasPaid && (
                        <div className="mt-3">
                          <Button
                            size="sm"
                            onClick={msg.buttonAction}
                            disabled={isTyping}
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
                  <div className="flex items-end gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="p-3 rounded-2xl bg-zinc-800">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </AnimatePresence>
          )}
        </div>

        <div className="p-4 border-t border-zinc-800">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage()
            }}
            className="flex gap-2"
          >
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1 bg-zinc-900 border-zinc-800"
              disabled={isTyping}
            />
            <Button type="submit" size="icon" disabled={!inputValue.trim() || isTyping}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
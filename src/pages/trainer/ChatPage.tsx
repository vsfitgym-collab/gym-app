import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { useAuthStore } from "@/stores/authStore"
import { supabase } from "@/lib/supabase"
import { MessageSquare, Search, Send } from "lucide-react"

interface ChatContact {
  chat_id: string
  student_id: string
  name: string
  email: string
  lastMessage: string
  time: string
}

interface Message {
  id: string
  chat_id: string
  sender_id: string
  content: string
  created_at: string
}

function formatRelativeTime(value?: string) {
  if (!value) return ""
  const date = new Date(value)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMinutes < 1) return "agora"
  if (diffMinutes < 60) return `${diffMinutes}min`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays === 1) return "ontem"
  if (diffDays < 7) return `${diffDays}d`
  
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
}

export function TrainerChatPage() {
  const { user } = useAuthStore()
  const [search, setSearch] = useState("")
  const [contacts, setContacts] = useState<ChatContact[]>([])
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchContacts()
  }, [user?.id])

  // Carrega conversa da URL ao montar componente
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const chatId = params.get("chatId")
    const name = params.get("name")
    const email = params.get("email")
    
    if (chatId) {
      setSelectedContact({
        chat_id: chatId,
        student_id: "",
        name: name ? decodeURIComponent(name) : "Aluno",
        email: email ? decodeURIComponent(email) : "",
        lastMessage: "",
        time: ""
      })
    }
  }, [])

  useEffect(() => {
    if (contacts.length > 0 && selectedContact) {
      // Atualiza com dados do contato existente
      const existing = contacts.find(c => c.chat_id === selectedContact.chat_id)
      if (existing) {
        setSelectedContact(existing)
      }
    }
  }, [contacts])

  useEffect(() => {
    if (selectedContact?.chat_id) {
      fetchMessages(selectedContact.chat_id)
    }
  }, [selectedContact])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const fetchContacts = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Busca todos os chats que o personal participa
      const { data: myChats } = await supabase
        .from("chat_participants")
        .select("chat_id")
        .eq("user_id", user.id)

      if (!myChats || myChats.length === 0) {
        setLoading(false)
        return
      }

      const chatIds = [...new Set(myChats.map(c => c.chat_id))]
      
      // Busca participantes de todos os chats
      const { data: participants } = await supabase
        .from("chat_participants")
        .select("chat_id, user_id")
        .in("chat_id", chatIds)

      const contacts: ChatContact[] = []
      const seenStudents = new Set<string>()

      for (const chatId of chatIds) {
        const parts = (participants || []).filter(p => p.chat_id === chatId)
        const student = parts.find(p => p.user_id !== user.id)
        
        if (student && !seenStudents.has(student.user_id)) {
          seenStudents.add(student.user_id)

          // Busca última mensagem
          const { data: lastMsg } = await supabase
            .from("messages")
            .select("content, created_at")
            .eq("chat_id", chatId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle()

          // Busca perfil do aluno
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", student.user_id)
            .single()

          contacts.push({
            chat_id: chatId,
            student_id: student.user_id,
            name: profile?.full_name || "Aluno",
            email: profile?.email || "",
            lastMessage: lastMsg?.content || "Sem mensagens ainda",
            time: formatRelativeTime(lastMsg?.created_at),
          })
        }
      }

      setContacts(contacts)
    } catch (error) {
      console.error("Error fetching trainer chats:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (chatId: string) => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching messages:", error)
      return
    }

    setMessages(data || [])
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !selectedContact || sending) return

    setSending(true)
    
    const { error } = await supabase.from("messages").insert({
      chat_id: selectedContact.chat_id,
      sender_id: user?.id,
      content: inputValue.trim(),
    })

    if (!error) {
      setInputValue("")
      fetchMessages(selectedContact.chat_id)
      fetchContacts()
    }

    setSending(false)
  }

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(search.toLowerCase()) ||
    contact.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mensagens</h1>
          <p className="text-sm text-zinc-400 mt-1">Comunique-se com seus alunos</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-white/10">
          <span className="text-xs text-zinc-400">{filteredContacts.length}</span>
          <span className="text-xs text-zinc-500">conversas</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        <Card variant="glass" className="lg:col-span-1 flex flex-col max-h-[600px]">
          <CardHeader className="pb-2">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Buscar conversas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-white/10 rounded-xl text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="w-14 h-14 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center mb-4">
                  <MessageSquare className="w-6 h-6 text-zinc-600" />
                </div>
                <p className="text-sm text-zinc-400 text-center font-medium">Nenhuma conversa ainda</p>
                <p className="text-xs text-zinc-500 text-center mt-1">Comece falando com seus alunos</p>
              </div>
            ) : (
              filteredContacts.map((contact) => (
                <button
                  key={contact.chat_id}
                  onClick={() => setSelectedContact(contact)}
                  className={`w-full p-3 rounded-xl transition-all duration-200 flex items-center gap-3 text-left active:scale-[0.98] ${
                    selectedContact?.chat_id === contact.chat_id 
                      ? "bg-primary/10 border border-primary/30" 
                      : "hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-semibold shrink-0">
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-sm font-semibold text-white truncate">{contact.name}</p>
                      <span className="text-xs text-zinc-500 shrink-0 ml-2">{contact.time}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-zinc-400 truncate flex-1">{contact.lastMessage}</p>
                      <div className="w-2 h-2 rounded-full bg-primary shrink-0 ml-2 opacity-0" />
                    </div>
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card variant="glass" className="lg:col-span-2 flex flex-col">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center gap-2">
              {selectedContact ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center text-white font-medium">
                    {selectedContact.name.charAt(0)}
                  </div>
                  <span>{selectedContact.name}</span>
                </>
              ) : (
                <span>Conversa</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-6">
            {!selectedContact ? (
              <div className="h-full flex flex-col justify-center items-center">
                <MessageSquare className="w-16 h-16 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground text-center">Selecione uma conversa para ver as mensagens</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center">
                <MessageSquare className="w-16 h-16 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground text-center">Nenhuma mensagem nesta conversa</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map(message => (
                  <div key={message.id} className={`flex ${message.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${message.sender_id === user?.id ? "bg-primary text-primary-foreground" : "bg-white/10"}`}>
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </CardContent>
          
          {selectedContact && (
            <div className="p-4 border-t border-white/10">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSendMessage()
                }}
                className="flex gap-2"
              >
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="flex-1"
                  disabled={sending}
                />
                <Button type="submit" size="icon" disabled={!inputValue.trim() || sending}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

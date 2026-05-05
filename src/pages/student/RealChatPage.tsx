import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { useAuthStore } from "@/stores/authStore"
import { supabase } from "@/lib/supabase"
import { Send, MessageSquare, Search } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface ChatContact {
  chat_id: string
  trainer_id: string
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
  const diffMs = Date.now() - new Date(value).getTime()
  const diffMinutes = Math.floor(diffMs / 60000)

  if (diffMinutes < 60) return `${Math.max(diffMinutes, 1)}min`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h`

  return `${Math.floor(diffHours / 24)}d`
}

export function StudentChatPage() {
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

  useEffect(() => {
    if (selectedContact) {
      fetchMessages(selectedContact.chat_id)
    }
  }, [selectedContact?.chat_id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const fetchContacts = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data: trainers } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .eq("role", "trainer")
        .limit(1)

      const { data: myChats } = await supabase
        .from("chat_participants")
        .select("chat_id")
        .eq("user_id", user.id)

      if (!myChats || myChats.length === 0) {
        if (trainers && trainers[0]) {
          const { data: newChat } = await supabase
            .from("chats")
            .insert({})
            .select()
            .single()

          if (newChat) {
            await supabase.from("chat_participants").insert([
              { chat_id: newChat.id, user_id: user.id },
              { chat_id: newChat.id, user_id: trainers[0].id },
            ])

            setContacts([{
              chat_id: newChat.id,
              trainer_id: trainers[0].id,
              name: trainers[0].full_name,
              email: trainers[0].email,
              lastMessage: "Sem mensagens ainda",
              time: "",
            }])
          }
        }
      } else {
        const chatIds = [...new Set(myChats.map(c => c.chat_id))]
        
        const { data: participants } = await supabase
          .from("chat_participants")
          .select("chat_id, user_id")
          .in("chat_id", chatIds)

        for (const chatId of chatIds) {
          const parts = (participants || []).filter(p => p.chat_id === chatId)
          const other = parts.find(p => p.user_id !== user.id)
          
          if (other) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name, email")
              .eq("id", other.user_id)
              .single()

            setContacts([{
              chat_id: chatId,
              trainer_id: other.user_id,
              name: profile?.full_name || "Personal",
              email: profile?.email || "",
              lastMessage: "Sem mensagens ainda",
              time: "",
            }])
            break
          }
        }
      }
    } catch (error) {
      console.error("Error fetching student chats:", error)
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
      <div>
        <h1 className="text-3xl font-bold">Mensagens</h1>
        <p className="text-muted-foreground">Converse com seu personal trainer</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        <Card variant="glass" className="lg:col-span-1">
          <CardHeader>
            <Input 
              placeholder="Buscar conversa..." 
              icon={<Search className="w-4 h-4" />} 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </CardHeader>
          <CardContent className="p-2 space-y-1">
            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            ) : filteredContacts.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma conversa encontrada</p>
            ) : (
              filteredContacts.map((contact) => (
                <button
                  key={contact.chat_id}
                  onClick={() => setSelectedContact(contact)}
                  className={`w-full p-3 rounded-xl hover:bg-white/5 transition-colors flex items-center gap-3 text-left ${
                    selectedContact?.chat_id === contact.chat_id ? "bg-white/10" : ""
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center text-white font-medium">
                    {contact.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">{contact.name}</p>
                      <span className="text-xs text-muted-foreground">{contact.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{contact.lastMessage}</p>
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
                <p className="text-sm text-muted-foreground/70 mt-2">Envie uma mensagem para começar!</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.sender_id === user?.id ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                        message.sender_id === user?.id 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-white/10"
                      }`}>
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
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
import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Message, Profile } from '../types'

const PERSONAL_ID = '76c42a5c-9e3b-42a4-b3a5-6e5df6d18240'

interface UseChatOptions {
  currentUserId: string
  role: 'aluno' | 'personal'
  selectedUser?: { id: string; name: string; email?: string } | null
}

interface UseChatReturn {
  messages: Message[]
  loading: boolean
  conversations: Profile[]
  sendMessage: (content: string) => Promise<void>
  refresh: () => void
}

export function useChat({ currentUserId, role, selectedUser }: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [conversations, setConversations] = useState<Profile[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const otherUserId = role === 'personal' ? selectedUser?.id : PERSONAL_ID

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadMessages = useCallback(async () => {
    if (!currentUserId || !otherUserId) {
      setLoading(false)
      return
    }

    setLoading(true)
    console.log('Chat: Carregando mensagens entre', currentUserId, 'e', otherUserId)
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true })
      
      if (error) {
        console.error('Chat: Erro ao carregar mensagens:', error)
        setMessages([])
      } else {
        console.log('Chat: Mensagens carregadas:', data?.length || 0)
        setMessages(data || [])
      }
    } catch (err) {
      console.error('Chat: Erro:', err)
      setMessages([])
    } finally {
      setLoading(false)
    }
  }, [currentUserId, otherUserId])

  const loadAlunos = useCallback(async () => {
    console.log('Chat: Carregando lista de alunos...')
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('role', 'aluno')
      
      if (error) {
        console.error('Chat: Erro ao carregar alunos:', error)
        setConversations([])
      } else {
        console.log('Chat: Alunos carregados:', data?.length || 0)
        setConversations(data?.map(p => ({
          id: p.id,
          name: p.name || p.email?.split('@')[0] || 'Aluno',
          email: p.email,
          role: 'aluno'
        })) || [])
      }
    } catch (err) {
      console.error('Chat: Erro ao carregar alunos:', err)
      setConversations([])
    }
  }, [])

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !currentUserId || !otherUserId) return

    const { data, error } = await supabase.from('messages').insert({
      sender_id: currentUserId,
      receiver_id: otherUserId,
      content: content.trim()
    }).select()

    if (!error && data && data.length > 0) {
      setMessages(prev => [...prev, data[0]])
    } else if (error) {
      console.error('Chat: Erro ao enviar mensagem:', error)
      throw error
    }
  }, [currentUserId, otherUserId])

  const refresh = useCallback(() => {
    loadMessages()
    if (role === 'personal') {
      loadAlunos()
    }
  }, [loadMessages, loadAlunos, role])

  useEffect(() => {
    if (!currentUserId || !otherUserId) return

    const channel = supabase
      .channel('chat-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new as Message
        if ((newMsg.sender_id === currentUserId && newMsg.receiver_id === otherUserId) ||
            (newMsg.sender_id === otherUserId && newMsg.receiver_id === currentUserId)) {
          setMessages(prev => [...prev, newMsg])
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId, otherUserId])

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  useEffect(() => {
    if (role === 'personal') {
      loadAlunos()
    }
  }, [role, loadAlunos])

  return {
    messages,
    loading,
    conversations,
    sendMessage,
    refresh
  }
}

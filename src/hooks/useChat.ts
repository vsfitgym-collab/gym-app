import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Message, Profile } from '../types'

export interface Conversation {
  id: string
  name: string
  avatar_url?: string
  lastMessage?: string
  lastMessageTime?: string
  unreadCount: number
  isOnline?: boolean
}

interface UseChatOptions {
  currentUserId: string
  role: 'aluno' | 'personal'
  selectedUserId?: string | null
}

interface UseChatReturn {
  messages: Message[]
  loading: boolean
  conversations: Conversation[]
  isTyping: boolean
  sendMessage: (content: string) => Promise<void>
  setTyping: (isTyping: boolean) => void
  markAsRead: (senderId: string) => Promise<void>
  refresh: () => void
}

export function useChat({ currentUserId, role, selectedUserId }: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [personalId, setPersonalId] = useState<string | null>(null)
  
  // Realtime Channel for Presence/Typing
  const channelRef = useRef<any>(null)

  const otherUserId = role === 'personal' ? selectedUserId : personalId

  // 1. Load Personal Trainer ID if needed
  useEffect(() => {
    if (role === 'aluno') {
      const getPersonal = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'personal')
          .single()
        if (data) setPersonalId(data.id)
      }
      getPersonal()
    }
  }, [role])

  // 2. Load Conversations List (Sidebar)
  const loadConversations = useCallback(async () => {
    if (!currentUserId) return

    try {
      let users: any[] = []
      
      if (role === 'personal') {
        // Personal trainer sees all students
        const { data } = await supabase
          .from('profiles')
          .select('id, name, avatar_url')
          .eq('role', 'aluno')
        users = data || []
      } else if (personalId) {
        // Aluno sees their personal (and maybe others in future, but 1 for now)
        const { data } = await supabase
          .from('profiles')
          .select('id, name, avatar_url')
          .eq('id', personalId)
        users = data || []
      }

      // Fetch last messages and unread counts for each user
      const convs = await Promise.all(users.map(async (u) => {
        // Last message
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('content, created_at')
          .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${u.id}),and(sender_id.eq.${u.id},receiver_id.eq.${currentUserId})`)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        // Unread count
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('sender_id', u.id)
          .eq('receiver_id', currentUserId)
          .is('read_at', null)

        return {
          id: u.id,
          name: u.name || 'Usuário',
          avatar_url: u.avatar_url,
          lastMessage: lastMsg?.content,
          lastMessageTime: lastMsg?.created_at,
          unreadCount: count || 0
        }
      }))

      // Sort by last message time
      setConversations(convs.sort((a, b) => {
        if (!a.lastMessageTime) return 1
        if (!b.lastMessageTime) return -1
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      }))
    } catch (err) {
      console.error('Chat Hook: Error loading conversations', err)
    }
  }, [currentUserId, role, personalId])

  // 3. Load Messages for Active Conversation
  const loadMessages = useCallback(async () => {
    if (!currentUserId || !otherUserId) {
      setMessages([])
      setLoading(false)
      return
    }
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true })
      
      if (error) throw error
      setMessages(data || [])
      
      // Mark as read
      await markAsRead(otherUserId)
    } catch (err) {
      console.error('Chat Hook: Error loading messages', err)
      setMessages([])
    } finally {
      setLoading(false)
    }
  }, [currentUserId, otherUserId])

  const markAsRead = async (senderId: string) => {
    if (!currentUserId) return
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('sender_id', senderId)
      .eq('receiver_id', currentUserId)
      .is('read_at', null)
    
    // Update local sidebar
    setConversations(prev => prev.map(c => 
      c.id === senderId ? { ...c, unreadCount: 0 } : c
    ))
  }

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !currentUserId || !otherUserId) return

    const { data, error } = await supabase.from('messages').insert({
      sender_id: currentUserId,
      receiver_id: otherUserId,
      content: content.trim()
    }).select().single()

    if (error) {
      console.error('Chat Hook: Error sending message', error)
      throw error
    }

    if (data) {
      setMessages(prev => [...prev, data])
      loadConversations() // update sidebar preview
    }
  }, [currentUserId, otherUserId, loadConversations])

  // 4. Typing Indicator Logic
  const setTyping = (typing: boolean) => {
    if (!channelRef.current) return
    channelRef.current.track({
      user_id: currentUserId,
      is_typing: typing
    })
  }

  // 5. Realtime Subscriptions
  useEffect(() => {
    if (!currentUserId) return

    // Global channel for conversation updates and presence
    const channel = supabase.channel(`chat_global_${currentUserId}`)
    channelRef.current = channel

    channel
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `receiver_id=eq.${currentUserId}`
      }, (payload) => {
        const newMsg = payload.new as Message
        // If it's for the currently open chat, add to messages
        if (newMsg.sender_id === otherUserId) {
          setMessages(prev => [...prev, newMsg])
          markAsRead(otherUserId)
        }
        // Always refresh conversations list for sidebar updates
        loadConversations()
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        // Check if other user is typing
        if (otherUserId) {
          const otherPresence: any = Object.values(state).flat().find((p: any) => p.user_id === otherUserId)
          setIsTyping(otherPresence?.is_typing || false)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId, otherUserId, loadConversations])

  // Initial loads
  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  return {
    messages,
    loading,
    conversations,
    isTyping,
    sendMessage,
    setTyping,
    markAsRead,
    refresh: () => {
      loadMessages()
      loadConversations()
    }
  }
}

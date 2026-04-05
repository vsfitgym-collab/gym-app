import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useChat } from '../hooks/useChat'
import { SkeletonText } from '../components/ui/Skeleton'
import './Chat.css'

export default function ChatPage() {
  const { user, role } = useAuth()
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; email: string } | null>(null)

  const { messages, loading, conversations, sendMessage } = useChat({
    currentUserId: user?.id || '',
    role,
    selectedUser
  })

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const input = form.elements.namedItem('message') as HTMLInputElement
    const content = input.value.trim()
    
    if (!content) return

    try {
      await sendMessage(content)
      input.value = ''
    } catch {
      alert('Erro ao enviar mensagem')
    }
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  if (!selectedUser && role === 'personal') {
    return (
      <div className="chat-conversations">
        <h3>Conversas</h3>
        {conversations.length === 0 ? (
          <p className="no-conversations">Nenhum aluno encontrado</p>
        ) : (
          conversations.map(conv => (
            <div 
              key={conv.id} 
              className="conversation-item"
              onClick={() => setSelectedUser({ id: conv.id, name: conv.name, email: conv.email || '' })}
            >
              <div className="conversation-avatar">
                {conv.name?.charAt(0).toUpperCase()}
              </div>
              <div className="conversation-info">
                <div className="conversation-name">{conv.name}</div>
                <div className="conversation-preview">{conv.email}</div>
              </div>
            </div>
          ))
        )}
      </div>
    )
  }

  return (
    <div className="chat-page">
      {role === 'personal' && selectedUser && (
        <div className="chat-header">
          <button className="back-btn" onClick={() => setSelectedUser(null)}>←</button>
          <h3>{selectedUser.name}</h3>
        </div>
      )}
      
      {role === 'aluno' && (
        <div className="chat-header">
          <h3>Chat com Personal</h3>
        </div>
      )}

      <div className="chat-messages">
        {loading ? (
          <div className="chat-loading">
            <SkeletonText lines={5} />
          </div>
        ) : messages.length === 0 ? (
          <div className="chat-empty">
            <span>💬</span>
            <p>Nenhuma mensagem ainda</p>
            <p className="chat-empty-sub">Envie uma mensagem para começar</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`message ${msg.sender_id === user?.id ? 'sent' : 'received'}`}
            >
              <div className="message-content">{msg.content}</div>
              <div className="message-time">{formatTime(msg.created_at)}</div>
            </div>
          ))
        )}
      </div>

      <form className="chat-input" onSubmit={handleSendMessage}>
        <input
          name="message"
          type="text"
          placeholder="Digite sua mensagem..."
          autoComplete="off"
        />
        <button type="submit">
          ➤
        </button>
      </form>
    </div>
  )
}

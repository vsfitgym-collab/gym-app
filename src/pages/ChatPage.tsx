import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useChat } from '../hooks/useChat'
import { SkeletonText } from '../components/ui/Skeleton'
import DataStateHandler, { type DataState } from '../components/DataStateHandler'
import './Chat.css'

export default function ChatPage() {
  const { user, role } = useAuth()
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; email: string } | null>(null)
  const [chatState, setChatState] = useState<DataState>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { messages, loading, conversations, sendMessage, refresh } = useChat({
    currentUserId: user?.id || '',
    role,
    selectedUser
  })

  useEffect(() => {
    if (user) {
      setChatState(loading ? 'loading' : messages.length === 0 ? 'empty' : 'success')
    }
  }, [user, loading, messages.length])

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const input = form.elements.namedItem('message') as HTMLInputElement
    const content = input.value.trim()
    
    if (!content) return

    try {
      await sendMessage(content)
      input.value = ''
      setChatState('success')
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao enviar mensagem')
      setChatState('error')
    }
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const handleRetry = () => {
    refresh()
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

      <DataStateHandler
        state={chatState}
        loadingComponent={
          <div className="chat-loading">
            <SkeletonText lines={5} />
          </div>
        }
        errorMessage={errorMessage || 'Erro ao carregar mensagens'}
        errorAction={{ label: 'Tentar novamente', onClick: handleRetry }}
        emptyTitle="Nenhuma mensagem ainda"
        emptyMessage="Comece a conversa enviando uma mensagem"
      >
        <div className="chat-messages">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`message ${msg.sender_id === user?.id ? 'sent' : 'received'}`}
            >
              <div className="message-content">{msg.content}</div>
              <div className="message-time">{formatTime(msg.created_at)}</div>
            </div>
          ))}
        </div>
      </DataStateHandler>

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

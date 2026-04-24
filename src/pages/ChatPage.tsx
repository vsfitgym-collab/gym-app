import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useChat, type Conversation } from "../hooks/useChat";
import {
  Send,
  Search,
  ArrowLeft,
  MoreVertical,
  Check,
  CheckCheck,
  User,
  MessageSquare,
} from "lucide-react";
import ProtectedFeature from "../components/ProtectedFeature";
import "./Chat.css";

export default function ChatPage() {
  const { user, role } = useAuth();
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const userScrolledRef = useRef(false);
  const scrollTimeoutRef = useRef<number | null>(null);

  const {
    messages,
    loading,
    conversations,
    isTyping,
    sendMessage,
    setTyping,
    refresh,
  } = useChat({
    currentUserId: user?.id || "",
    role,
    selectedUserId: activeConversation?.id,
  });

  const isAtBottom = () => {
    const el = chatScrollRef.current;
    if (!el) return false;
    const threshold = 100;
    return el.scrollHeight - el.scrollTop <= el.clientHeight + threshold;
  };

  const handleScroll = () => {
    const el = chatScrollRef.current;
    if (!el) return;

    const isNearBottom =
      el.scrollHeight - el.scrollTop <= el.clientHeight + 100;
    userScrolledRef.current = !isNearBottom;

    if (scrollTimeoutRef.current) {
      window.clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = window.setTimeout(() => {
      userScrolledRef.current = false;
    }, 3000);
  };

  useEffect(() => {
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    const isFromOther = lastMessage && lastMessage.sender_id !== user?.id;

    if (isFromOther && !userScrolledRef.current && isAtBottom()) {
      setTimeout(() => {
        chatScrollRef.current?.scrollTo({
          top: chatScrollRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 50);
    }
  }, [messages, user?.id]);

  // Mobile responsiveness: hide sidebar when conversation is open
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setShowSidebar(true);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSelectConversation = (conv: Conversation) => {
    setActiveConversation(conv);
    userScrolledRef.current = false;
    if (window.innerWidth <= 768) {
      setShowSidebar(false);
    }
  };

  const handleBackToList = () => {
    setShowSidebar(true);
    setActiveConversation(null);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputRef.current) return;

    const content = inputRef.current.value.trim();
    if (!content) return;

    try {
      await sendMessage(content);
      inputRef.current.value = "";
      setTyping(false);
    } catch (err) {
      console.error("Erro ao enviar mensagem", err);
    }
  };

  const handleInputChange = () => {
    if (inputRef.current?.value) {
      setTyping(true);
    } else {
      setTyping(false);
    }
  };

  const formatMessageTime = (date: string) => {
    return new Date(date).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getInitials = (name: string) => {
    return name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <ProtectedFeature feature="Chat e Suporte">
      <div className="chat-container glass">
        {/* Sidebar - Lista de Conversas */}
        <aside className={`chat-sidebar ${!showSidebar ? "hidden" : ""}`}>
          <div className="sidebar-header">
            <h2>Mensagens</h2>
            <div className="search-wrapper">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Pesquisar conversas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="conversations-list">
            {filteredConversations.length === 0 ? (
              <div className="empty-conversations">
                <MessageSquare size={48} className="opacity-20 mb-2" />
                <p>Nenhuma conversa encontrada</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`conversation-item ${activeConversation?.id === conv.id ? "active" : ""}`}
                  onClick={() => handleSelectConversation(conv)}
                >
                  <div className="avatar">
                    {conv.avatar_url ? (
                      <img src={conv.avatar_url} alt={conv.name} />
                    ) : (
                      <div className="avatar-initials">
                        {getInitials(conv.name)}
                      </div>
                    )}
                    {conv.isOnline && <div className="online-indicator" />}
                  </div>

                  <div className="conv-content">
                    <div className="conv-header">
                      <span className="name">{conv.name}</span>
                      {conv.lastMessageTime && (
                        <span className="time">
                          {new Date(
                            conv.lastMessageTime,
                          ).toLocaleDateString() ===
                          new Date().toLocaleDateString()
                            ? formatMessageTime(conv.lastMessageTime)
                            : new Date(conv.lastMessageTime).toLocaleDateString(
                                "pt-BR",
                                { day: "2-digit", month: "2-digit" },
                              )}
                        </span>
                      )}
                    </div>
                    <div className="conv-footer">
                      <p className="last-msg">
                        {conv.lastMessage || "Inicie uma conversa..."}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="unread-badge">{conv.unreadCount}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Chat Window - Conversa Ativa */}
        <main
          className={`chat-window ${showSidebar && window.innerWidth <= 768 ? "hidden" : ""}`}
        >
          {activeConversation ? (
            <>
              <header className="chat-window-header">
                <div className="header-info">
                  <button
                    className="mobile-only back-btn"
                    onClick={handleBackToList}
                  >
                    <ArrowLeft size={24} />
                  </button>
                  <div className="header-avatar">
                    {activeConversation.avatar_url ? (
                      <img
                        src={activeConversation.avatar_url}
                        alt={activeConversation.name}
                      />
                    ) : (
                      <div className="avatar-initials">
                        {getInitials(activeConversation.name)}
                      </div>
                    )}
                  </div>
                  <div className="user-status">
                    <h3>{activeConversation.name}</h3>
                    <span className={`status-text ${isTyping ? "typing" : ""}`}>
                      {isTyping
                        ? "digitando..."
                        : activeConversation.isOnline
                          ? "online"
                          : "visto por último recentemente"}
                    </span>
                  </div>
                </div>
                <button className="icon-btn">
                  <MoreVertical size={20} />
                </button>
              </header>

              <div
                ref={chatScrollRef}
                className="messages-area"
                onScroll={handleScroll}
              >
                {messages.length === 0 ? (
                  <div className="first-message-hint">
                    <div className="hint-icon">👋</div>
                    <p>Diga "Olá" para {activeConversation.name}!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.sender_id === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`message-wrapper ${isMine ? "mine" : "theirs"}`}
                      >
                        <div className="message-bubble">
                          <p className="message-text">{msg.content}</p>
                          <div className="message-footer">
                            <span className="message-time">
                              {formatMessageTime(msg.created_at)}
                            </span>
                            {isMine && (
                              <span className="delivery-status">
                                {msg.read_at ? (
                                  <CheckCheck size={14} className="read" />
                                ) : (
                                  <Check size={14} />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                {isTyping && (
                  <div className="message-wrapper theirs">
                    <div className="message-bubble typing-bubble">
                      <div className="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form className="chat-input-row" onSubmit={handleSendMessage}>
                <div className="input-wrapper">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Digite uma mensagem..."
                    onInput={handleInputChange}
                    onFocus={() => refresh()}
                  />
                </div>
                <button type="submit" className="send-button">
                  <Send size={20} fill="currentColor" />
                </button>
              </form>
            </>
          ) : (
            <div className="no-chat-selected">
              <div className="empty-state-visual">
                <MessageSquare size={64} className="opacity-10" />
                <h2>Suas Conversas</h2>
                <p>
                  Selecione um {role === "personal" ? "aluno" : "personal"} para
                  começar a conversar agora mesmo.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedFeature>
  );
}

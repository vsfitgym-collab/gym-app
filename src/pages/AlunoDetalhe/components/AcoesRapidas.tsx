import { MessageSquare, Plus } from 'lucide-react'

interface AcoesRapidasProps {
  onChat: () => void
  onNovoTreino: () => void
}

export function AcoesRapidas({ onChat, onNovoTreino }: AcoesRapidasProps) {
  const botoes = [
    { icon: MessageSquare, label: 'Chat', onClick: onChat, color: '#8b5cf6' },
    { icon: Plus, label: 'Novo Treino', onClick: onNovoTreino, color: '#10b981' }
  ]

  return (
    <div style={{
      marginTop: '1.5rem',
      padding: '1.5rem',
      background: 'rgba(18, 18, 30, 0.95)',
      borderRadius: '1rem',
      border: '1px solid rgba(255, 255, 255, 0.08)'
    }}>
      <h3 style={{
        margin: '0 0 1rem',
        fontSize: '1rem',
        fontWeight: 600,
        color: '#fff'
      }}>
        Ações Rápidas
      </h3>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {botoes.map((botao, index) => (
          <button
            key={index}
            onClick={botao.onClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.25rem',
              background: `${botao.color}20`,
              border: `1px solid ${botao.color}40`,
              borderRadius: '0.75rem',
              color: botao.color,
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
          >
            <botao.icon size={18} />
            {botao.label}
          </button>
        ))}
      </div>
    </div>
  )
}
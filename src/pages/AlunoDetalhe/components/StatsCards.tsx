import { Dumbbell, Calendar, Clock, TrendingUp } from 'lucide-react'

interface Stats {
  totalTreinos: number
  frequenciaSemanal: number
  ultimoTreino: string
  evolucao: number
}

interface StatsCardsProps {
  stats: Stats
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      icon: Dumbbell,
      label: 'Treinos Totais',
      value: stats.totalTreinos,
      color: '#8b5cf6'
    },
    {
      icon: Calendar,
      label: 'Frequência Semanal',
      value: `${stats.frequenciaSemanal}x`,
      color: '#06b6d4'
    },
    {
      icon: Clock,
      label: 'Último Treino',
      value: stats.ultimoTreino,
      color: '#f59e0b'
    },
    {
      icon: TrendingUp,
      label: 'Evolução',
      value: `+${stats.evolucao}%`,
      color: '#10b981'
    }
  ]

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1rem'
    }}>
      {cards.map((card, index) => (
        <div
          key={index}
          style={{
            padding: '1.25rem',
            background: 'rgba(18, 18, 30, 0.95)',
            borderRadius: '1rem',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}
        >
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: `${card.color}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <card.icon size={24} color={card.color} />
          </div>
          <div>
            <p style={{
              margin: 0,
              fontSize: '0.75rem',
              color: 'rgba(255,255,255,0.5)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {card.label}
            </p>
            <p style={{
              margin: '0.25rem 0 0',
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#fff'
            }}>
              {card.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
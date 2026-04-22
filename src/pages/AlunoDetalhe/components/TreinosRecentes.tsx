import { Dumbbell, Clock } from 'lucide-react'

interface Treino {
  id: string
  nome: string
  data: string
  duracao: string
}

interface TreinosRecentesProps {
  treinos: Treino[]
}

export function TreinosRecentes({ treinos }: TreinosRecentesProps) {
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
        Treinos Recentes
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {treinos.map((treino) => (
          <div
            key={treino.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '0.75rem',
              border: '1px solid rgba(255,255,255,0.05)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(139, 92, 246, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Dumbbell size={20} color="#8b5cf6" />
              </div>
              <div>
                <p style={{
                  margin: 0,
                  fontWeight: 600,
                  color: '#fff',
                  fontSize: '0.9rem'
                }}>
                  {treino.nome}
                </p>
                <p style={{
                  margin: '0.25rem 0 0',
                  fontSize: '0.8rem',
                  color: 'rgba(255,255,255,0.5)'
                }}>
                  {treino.data}
                </p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              color: 'rgba(255,255,255,0.5)',
              fontSize: '0.8rem'
            }}>
              <Clock size={14} />
              {treino.duracao}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
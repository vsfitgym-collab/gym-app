interface HeaderAlunoProps {
  nome: string
  email: string
  status: 'active' | 'inactive'
}

export function HeaderAluno({ nome, email, status }: HeaderAlunoProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '1.5rem',
      padding: '1.5rem',
      background: 'rgba(18, 18, 30, 0.95)',
      borderRadius: '1rem',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      marginBottom: '1.5rem'
    }}>
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '2rem',
        fontWeight: 700,
        color: '#fff'
      }}>
        {nome.charAt(0).toUpperCase()}
      </div>

      <div style={{ flex: 1 }}>
        <h2 style={{
          margin: 0,
          fontSize: '1.75rem',
          fontWeight: 700,
          color: '#fff'
        }}>
          {nome}
        </h2>
        <p style={{
          margin: '0.25rem 0 0',
          color: 'rgba(255,255,255,0.5)',
          fontSize: '0.9rem'
        }}>
          {email}
        </p>
      </div>

      <span style={{
        padding: '0.5rem 1rem',
        borderRadius: '99px',
        fontSize: '0.75rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        background: status === 'active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
        color: status === 'active' ? '#10b981' : '#ef4444',
        border: `1px solid ${status === 'active' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
      }}>
        {status === 'active' ? 'Ativo' : 'Inativo'}
      </span>
    </div>
  )
}
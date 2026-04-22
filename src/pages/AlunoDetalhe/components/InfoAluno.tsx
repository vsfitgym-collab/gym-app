import { CreditCard, Calendar, FileText } from 'lucide-react'

interface InfoAlunoProps {
  plano: string
  dataCadastro: string
  observacoes?: string
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('pt-BR')
}

export function InfoAluno({ plano, dataCadastro, observacoes }: InfoAlunoProps) {
  return (
    <div style={{
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
        Informações
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <CreditCard size={18} color="#8b5cf6" />
          <div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Plano</p>
            <p style={{ margin: '0.25rem 0 0', color: '#fff', fontWeight: 500 }}>{plano}</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Calendar size={18} color="#06b6d4" />
          <div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Cadastro</p>
            <p style={{ margin: '0.25rem 0 0', color: '#fff', fontWeight: 500 }}>{formatDate(dataCadastro)}</p>
          </div>
        </div>

        {observacoes && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <FileText size={18} color="#f59e0b" style={{ marginTop: '0.25rem' }} />
            <div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Observações</p>
              <p style={{ margin: '0.25rem 0 0', color: '#fff', fontWeight: 400, fontSize: '0.9rem' }}>{observacoes}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
import { useParams, useNavigate } from 'react-router-dom'
import { HeaderAluno } from './components/HeaderAluno'
import { StatsCards } from './components/StatsCards'
import { EvolucaoChart } from './components/EvolucaoChart'
import { TreinosRecentes } from './components/TreinosRecentes'
import { InfoAluno } from './components/InfoAluno'
import { AcoesRapidas } from './components/AcoesRapidas'
import { useAlunoDetalhe } from './useAlunoDetalhe'
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react'

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('pt-BR')
}

export default function AlunoDetalhe() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { aluno, treinos, progresso, stats, loading, error } = useAlunoDetalhe(id)

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#0f0f13',
        color: '#fff'
      }}>
        <Loader2 size={32} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  if (error || !aluno) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#0f0f13',
        color: '#fff',
        gap: '1rem'
      }}>
        <AlertCircle size={48} color="#ef4444" />
        <h2>{error || 'Aluno não encontrado'}</h2>
        <button
          onClick={() => navigate('/alunos')}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#8b5cf6',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            cursor: 'pointer'
          }}
        >
          Voltar para alunos
        </button>
      </div>
    )
  }

  const evolucaoData = progresso.map(p => ({
    mes: new Date(p.data).toLocaleDateString('pt-BR', { month: 'short' }),
    peso: p.peso || 0,
    gordura: p.gordura || 0,
    massa_muscular: p.massa_muscular || 0
  }))

  const treinosFormatados = treinos.slice(0, 5).map(t => ({
    id: t.id,
    nome: t.nome,
    data: formatDate(t.data),
    duracao: t.duracao > 0 ? `${t.duracao}min` : '-'
  }))

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f0f13',
      paddingBottom: '2rem'
    }}>
      <button
        onClick={() => navigate('/alunos')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '1rem 1.5rem',
          background: 'transparent',
          border: 'none',
          color: 'rgba(255,255,255,0.7)',
          cursor: 'pointer',
          fontSize: '0.9rem'
        }}
      >
        <ArrowLeft size={18} />
        Voltar
      </button>

      <div style={{ padding: '0 1.5rem' }}>
        <HeaderAluno
          nome={aluno.name}
          email={aluno.email}
          status={aluno.status}
        />

        <StatsCards 
          stats={{
            ...stats,
            ultimoTreino: formatDate(stats.ultimoTreino)
          }} 
        />

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
          marginTop: '1.5rem'
        }}>
          <EvolucaoChart data={evolucaoData} />
          <InfoAluno
            plano={aluno.plano || 'Plano Premium'}
            dataCadastro={aluno.created_at}
            observacoes={aluno.observacoes}
          />
        </div>

        <TreinosRecentes treinos={treinosFormatados} />

        <AcoesRapidas
          onChat={() => navigate('/chat')}
          onNovoTreino={() => navigate('/treinos/criar')}
        />
      </div>
    </div>
  )
}
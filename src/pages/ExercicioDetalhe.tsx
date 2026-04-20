import { useParams, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { exercicios } from '../data/exercicios';
import { ArrowLeft, Play } from 'lucide-react';

const instrucoesBase: Record<string, string[]> = {
  default: [
    "Posicione o corpo de forma estável e confortável",
    "Mantenha a postura correta durante todo o movimento",
    "Execute o movimento de forma controlada",
    "Respire de maneira rhythmada"
  ],
  antebraco: [
    "Segure o peso com firmeza",
    "Mantenha os antebraços apoiados em uma superfície",
    "Flexione o punho lentamente",
    "Retorne controlando o movimento"
  ],
  biceps: [
    "Mantenha os cotovelos próximos ao corpo",
    "Flexione o antebraço elevando o peso",
    "Contrate o bíceps no topo do movimento",
    "Retorne lentamente à posição inicial"
  ]
};

export default function ExercicioDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();

  const exercicio = useMemo(() => {
    return exercicios.find(e => e.id === id);
  }, [id]);

  const instrucoes = useMemo(() => {
    if (!exercicio) return instrucoesBase.default;
    const grupo = exercicio.grupoMuscular;
    return instrucoesBase[grupo] || instrucoesBase.default;
  }, [exercicio]);

  if (!exercicio) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0f0f0f',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
        <h2 style={{ color: '#fff', marginBottom: '0.5rem' }}>Exercício não encontrado</h2>
        <p style={{ color: '#888', marginBottom: '1.5rem' }}>O exercício que você procura não existe em nosso banco de dados.</p>
        <button
          onClick={() => navigate('/exercicios')}
          style={{
            backgroundColor: '#6366f1',
            color: '#fff',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '500'
          }}
        >
          Voltar aos exercícios
        </button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f0f0f',
      padding: '1.5rem'
    }}>
      <div style={{
        maxWidth: '520px',
        margin: '0 auto'
      }}>
        <button
          onClick={() => navigate('/exercicios')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff',
            cursor: 'pointer',
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            transition: 'background 0.2s'
          }}
        >
          <ArrowLeft size={18} />
          Voltar
        </button>

        <div style={{
          backgroundColor: '#1a1a1f',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          marginBottom: '1.5rem'
        }}>
          <video
            src={exercicio.video}
            controls
            autoPlay
            loop
            muted
            playsInline
            style={{
              width: '100%',
              display: 'block',
              backgroundColor: '#121216'
            }}
          />
        </div>

        <div style={{
          backgroundColor: '#1a1a1f',
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: '0 2px 12px rgba(0,0,0,0.3)'
        }}>
          <span style={{
            backgroundColor: 'rgba(99,102,241,0.2)',
            color: '#818cf8',
            fontSize: '0.75rem',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            padding: '0.25rem 0.75rem',
            borderRadius: '20px',
            display: 'inline-block',
            marginBottom: '0.75rem'
          }}>
            {exercicio.grupoMuscular}
          </span>

          <h1 style={{
            color: '#fff',
            fontSize: '1.5rem',
            fontWeight: '600',
            marginBottom: '0',
            lineHeight: '1.3'
          }}>
            {exercicio.nome}
          </h1>
        </div>

        <div style={{
          backgroundColor: '#1a1a1f',
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
          marginTop: '1rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}>
            <Play size={18} style={{ color: '#6366f1' }} />
            <h3 style={{
              color: '#fff',
              fontSize: '1.1rem',
              fontWeight: '600',
              margin: 0
            }}>
              Instruções
            </h3>
          </div>

          <ol style={{
            margin: 0,
            paddingLeft: '1.25rem'
          }}>
            {instrucoes.map((instrucao, index) => (
              <li
                key={index}
                style={{
                  color: '#a1a1aa',
                  fontSize: '0.95rem',
                  lineHeight: '1.6',
                  marginBottom: '0.75rem',
                  paddingLeft: '0.25rem'
                }}
              >
                <span style={{ color: '#fff' }}>{instrucao}</span>
              </li>
            ))}
          </ol>
        </div>

        <div style={{
          textAlign: 'center',
          marginTop: '2rem',
          paddingBottom: '2rem'
        }}>
          <p style={{ color: '#555', fontSize: '0.8rem' }}>
            Dados do exercício
          </p>
          <p style={{ color: '#444', fontSize: '0.75rem', fontFamily: 'monospace' }}>
            ID: {exercicio.id}
          </p>
        </div>
      </div>
    </div>
  );
}
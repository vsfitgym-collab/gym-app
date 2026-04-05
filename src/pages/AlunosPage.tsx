import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { SkeletonList } from '../components/ui/Skeleton'
import { Mail, Calendar, User, Search } from 'lucide-react'
import './Alunos.css'

interface Aluno {
  id: string
  nome: string
  email: string
  plano: string
  avatar_url?: string
  created_at?: string
  status: 'ativo' | 'inativo'
}

export default function AlunosPage() {
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    carregarAlunos()
  }, [])

  const carregarAlunos = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, role, name, created_at, avatar_url')
        .eq('role', 'aluno')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro Supabase:', error)
        setError(error.message)
        setAlunos([])
        return
      }

      const formattedAlunos = (data || []).map((profile: any) => ({
        id: profile.id,
        nome: profile.name || profile.email?.split('@')[0] || 'Aluno',
        email: profile.email || '',
        plano: 'Básico',
        avatar_url: profile.avatar_url || null,
        created_at: profile.created_at || null,
        status: 'ativo' as const,
      }))

      setAlunos(formattedAlunos)
    } catch (error: any) {
      console.error('Erro ao carregar alunos:', error)
      setError(error.message)
      setAlunos([])
    } finally {
      setLoading(false)
    }
  }

  const filteredAlunos = alunos.filter(aluno =>
    aluno.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
    aluno.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="alunos-page">
      <div className="alunos-header">
        <div className="alunos-title">
          <h3>Meus Alunos</h3>
          <span className="alunos-count">{alunos.length} alunos</span>
        </div>
        <div className="alunos-search">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar aluno..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {loading ? (
        <SkeletonList count={5} />
      ) : error ? (
        <div className="alunos-error">
          <p>Erro ao carregar alunos</p>
          <span>{error}</span>
        </div>
      ) : filteredAlunos.length === 0 ? (
        <div className="alunos-empty">
          <User size={48} />
          <p>{searchQuery ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado'}</p>
        </div>
      ) : (
        <div className="alunos-grid">
          {filteredAlunos.map((aluno) => (
            <div key={aluno.id} className="aluno-card">
              <div className="aluno-card-header">
                <div className="aluno-avatar">
                  {aluno.avatar_url ? (
                    <img src={aluno.avatar_url} alt={aluno.nome} />
                  ) : (
                    <span>{aluno.nome.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <span className={`aluno-status ${aluno.status}`}>
                  {aluno.status === 'ativo' ? '●' : '○'}
                </span>
              </div>
              
              <div className="aluno-card-body">
                <h4>{aluno.nome}</h4>
                <div className="aluno-detail">
                  <Mail size={14} />
                  <span>{aluno.email}</span>
                </div>
                <div className="aluno-detail">
                  <Calendar size={14} />
                  <span>
                    {aluno.created_at 
                      ? new Date(aluno.created_at).toLocaleDateString('pt-BR')
                      : 'Data não informada'}
                  </span>
                </div>
              </div>
              
              <div className="aluno-card-footer">
                <span className="aluno-plano">{aluno.plano}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

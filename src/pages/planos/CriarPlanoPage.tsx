import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Plus, X, CheckCircle2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import '../Planos.css'

interface ItemDB {
  id: string
  nome: string
}

export default function CriarPlanoPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    duration: 30,
    description: '',
    popular: false,
    recomendado: false
  })

  const [availableItems, setAvailableItems] = useState<ItemDB[]>([])
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
  const [newFeature, setNewFeature] = useState('')

  useEffect(() => {
    loadItems()
  }, [])

  const loadItems = async () => {
    const { data } = await supabase.from('itens').select('*').order('nome')
    if (data) setAvailableItems(data)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // 1. Inserir o Plano
      const { data: planoData, error: planoError } = await supabase
        .from('planos')
        .insert({
          nome: formData.name,
          descricao: formData.description,
          preco: parseFloat(formData.price) || 0,
          duracao_dias: formData.duration,
          recomendado: formData.recomendado
        })
        .select()
        .single()

      if (planoError) throw planoError

      // 2. Vincular os itens ao Plano
      if (selectedItemIds.length > 0) {
        const refs = selectedItemIds.map(itemId => ({
          plano_id: planoData.id,
          item_id: itemId
        }))
        const { error: itemsError } = await supabase.from('plano_itens').insert(refs)
        if (itemsError) throw itemsError
      }

      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        navigate('/planos')
      }, 1500)
    } catch (err: any) {
      console.error(err)
      alert('Erro ao salvar plano: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const addFeature = async () => {
    if (!newFeature.trim()) return
    const nomeItem = newFeature.trim()
    try {
      const { data, error } = await supabase
        .from('itens')
        .insert({ nome: nomeItem })
        .select()
        .single()
      
      if (!error && data) {
        setAvailableItems(prev => [...prev, data].sort((a,b) => a.nome.localeCompare(b.nome)))
        setSelectedItemIds(prev => [...prev, data.id])
      }
    } catch {
      // already exists maybe
    }
    setNewFeature('')
    loadItems() // recarrega por segurança
  }

  const deleteFeature = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este recurso? Isso vai remover essa marcação de todos os planos.')) {
      try {
        await supabase.from('itens').delete().eq('id', id)
        setAvailableItems(prev => prev.filter(item => item.id !== id))
        setSelectedItemIds(prev => prev.filter(itemId => itemId !== id))
      } catch (err: any) {
        alert('Erro ao excluir: ' + err.message)
      }
    }
  }

  const toggleItem = (id: string) => {
    setSelectedItemIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  return (
    <div className="editar-plano-container">
      <div className="editar-plano-header">
        <button className="btn-back" onClick={() => navigate('/planos')}>
          <ArrowLeft size={20} />
          Voltar
        </button>
        <div className="header-titles">
          <h1>Novo Plano</h1>
          <p>Crie um pacote de assinatura real no banco de dados</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="editar-plano-form">
        <div className="form-section glass">
          <h3>Informações Básicas</h3>
          
          <div className="input-group">
            <label>Nome do Plano</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="Ex: Plano Semestral"
              required
            />
          </div>

          <div className="input-row">
            <div className="input-group">
              <label>Preço Base (R$)</label>
              <input 
                type="number" 
                step="0.01"
                min="0"
                value={formData.price}
                onChange={e => setFormData({...formData, price: e.target.value})}
                placeholder="0.00"
                required
              />
            </div>
            
            <div className="input-group">
              <label>Duração (Dias)</label>
              <input 
                type="number" 
                min="1"
                value={formData.duration}
                onChange={e => setFormData({...formData, duration: parseInt(e.target.value) || 0})}
                required
                placeholder="Ex: 7 para trial, 30 mensal"
              />
            </div>
            <div className="input-group checkbox">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={formData.recomendado}
                  onChange={e => setFormData({...formData, recomendado: e.target.checked})}
                />
                Plano Recomendado (Destaque)
              </label>
            </div>
          </div>

          <div className="input-group">
            <label>Descrição Curta</label>
            <textarea 
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              placeholder="Ex: Acesso total aos treinos e suporte via chat..."
              rows={2}
              required
            />
          </div>
        </div>

        <div className="form-section glass">
          <h3>Acessos e Permissões do Plano</h3>
          <p className="text-sm text-slate-400 mb-2">Marque os recursos que o aluno terá acesso automático.</p>
          
          <div className="features-builder">
            <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              {availableItems.map(item => (
                <div key={item.id} className="feature-item hover:bg-white/10 transition-colors" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ display: 'flex', gap: '8px', cursor: 'pointer', flex: 1 }}>
                    <input 
                      type="checkbox" 
                      checked={selectedItemIds.includes(item.id)}
                      onChange={() => toggleItem(item.id)}
                      style={{ width: 18, height: 18, cursor: 'pointer' }}
                    />
                    <span>{item.nome}</span>
                  </label>
                  <button type="button" onClick={() => deleteFeature(item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="add-feature pt-4 border-t border-white/10">
              <input 
                type="text" 
                value={newFeature}
                onChange={e => setNewFeature(e.target.value)}
                placeholder="Ou crie um novo recurso no sistema..."
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addFeature())}
              />
              <button type="button" onClick={addFeature}>
                <Plus size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-save" disabled={loading || selectedItemIds.length === 0}>
            {loading ? 'Salvando...' : (
              <>
                <Plus size={18} />
                Criar Plano Oficial
              </>
            )}
          </button>
          {!loading && selectedItemIds.length === 0 && (
             <p style={{textAlign: 'center', marginTop: '10px', color: '#ff4444', fontSize: '13px'}}>Selecione ao menos 1 recurso.</p>
          )}
        </div>
      </form>

      {showSuccess && (
        <div className="success-overlay">
          <div className="success-modal">
            <CheckCircle2 size={48} className="success-icon" />
            <h2>Plano Criado!</h2>
            <p>Salvo no banco de dados com segurança RLS.</p>
          </div>
        </div>
      )}

      <style>{`
        .editar-plano-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem 1rem;
          animation: fadeIn 0.4s ease-out;
        }

        .editar-plano-header {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }

        .btn-back {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(139, 92, 246, 0.05); /* Usando cor primária suave */
          border: 1px solid var(--color-border);
          padding: 0.625rem 1rem;
          border-radius: 0.75rem;
          color: var(--color-text-secondary);
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-back:hover {
          background: rgba(139, 92, 246, 0.1);
          color: var(--color-text-primary);
        }

        .header-titles h1 {
          font-size: 1.75rem;
          font-weight: 800;
          margin: 0;
        }

        .header-titles p {
          color: var(--color-text-muted);
          margin: 0.25rem 0 0;
        }

        .editar-plano-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-section {
          padding: 1.5rem;
          border-radius: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-section.glass {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .form-section h3 {
          font-size: 1.125rem;
          font-weight: 700;
          margin: 0;
          color: var(--color-primary);
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .input-group label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--color-text-secondary);
        }

        .input-group input, 
        .input-group textarea {
          background: rgba(0, 0, 0, 0.2);
          border: 1.5px solid var(--color-border);
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          color: white;
          font-size: 0.9375rem;
          transition: all 0.2s;
        }

        .input-group input:focus, 
        .input-group textarea:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
        }

        .input-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          align-items: center;
        }

        .features-builder {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .add-feature {
          display: flex;
          gap: 0.5rem;
        }

        .add-feature input {
          flex: 1;
          background: rgba(0, 0, 0, 0.2);
          border: 1.5px solid var(--color-border);
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          color: white;
        }

        .add-feature button {
          width: 48px;
          background: var(--color-primary);
          border: none;
          border-radius: 0.75rem;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .feature-item {
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.05);
          padding: 0.875rem 1rem;
          border-radius: 0.625rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
        }

        .feature-item span {
          font-size: 0.9375rem;
          font-weight: 500;
        }

        .form-actions {
          margin-top: 1rem;
        }

        .btn-save {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 1rem;
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          border: none;
          border-radius: 1rem;
          color: white;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
          transition: all 0.2s;
        }

        .btn-save:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(139, 92, 246, 0.5);
        }

        .btn-save:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: #333;
        }

        .success-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.8);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.3s ease;
        }

        .success-modal {
          background: #1a1a2e;
          padding: 3rem;
          border-radius: 2rem;
          text-align: center;
          border: 1px solid rgba(139, 92, 246, 0.3);
          box-shadow: 0 0 40px rgba(139, 92, 246, 0.2);
        }

        .success-icon {
          color: #10b981;
          margin-bottom: 1.5rem;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 640px) {
          .input-row, .features-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}

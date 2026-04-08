import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Plus, X, CheckCircle2 } from 'lucide-react'
import '../Planos.css'

export default function CriarPlanoPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    popular: false,
    features: [] as string[]
  })

  const [newFeature, setNewFeature] = useState('')

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Simular salvamento
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setLoading(false)
    setShowSuccess(true)
    setTimeout(() => {
      setShowSuccess(false)
      navigate('/planos')
    }, 1500)
  }

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }))
      setNewFeature('')
    }
  }

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }))
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
          <p>Crie um novo pacote de assinatura para seus alunos</p>
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
              <label>Preço Mensal (R$)</label>
              <input 
                type="number" 
                step="0.01"
                value={formData.price}
                onChange={e => setFormData({...formData, price: e.target.value})}
                placeholder="0.00"
                required
              />
            </div>
            <div className="input-group checkbox">
              <label>
                <input 
                  type="checkbox" 
                  checked={formData.popular}
                  onChange={e => setFormData({...formData, popular: e.target.checked})}
                />
                Plano Popular (Destaque)
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
          <h3>Vantagens e Recursos</h3>
          
          <div className="features-builder">
            <div className="add-feature">
              <input 
                type="text" 
                value={newFeature}
                onChange={e => setNewFeature(e.target.value)}
                placeholder="Adicionar nova vantagem..."
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addFeature())}
              />
              <button type="button" onClick={addFeature}>
                <Plus size={18} />
              </button>
            </div>

            <div className="features-list">
              {formData.features.map((feature, index) => (
                <div key={index} className="feature-item">
                  <span>{feature}</span>
                  <button type="button" onClick={() => removeFeature(index)}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-save" disabled={loading}>
            {loading ? 'Criando...' : (
              <>
                <Plus size={18} />
                Criar Plano
              </>
            )}
          </button>
        </div>
      </form>

      {showSuccess && (
        <div className="success-overlay">
          <div className="success-modal">
            <CheckCircle2 size={48} className="success-icon" />
            <h2>Plano Criado!</h2>
            <p>O novo plano já está disponível para os alunos.</p>
          </div>
        </div>
      )}

      <style>{`
        /* Reusando estilos do editar (embutidos para garantir consistência) */
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

        .input-group.checkbox label {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          user-select: none;
        }

        .input-group.checkbox input {
          width: 20px;
          height: 20px;
          cursor: pointer;
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

        .features-list {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }

        .feature-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255, 255, 255, 0.05);
          padding: 0.625rem 0.875rem;
          border-radius: 0.625rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .feature-item span {
          font-size: 0.8125rem;
        }

        .feature-item button {
          background: none;
          border: none;
          color: #ef4444;
          cursor: pointer;
          display: flex;
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

        .btn-save:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(139, 92, 246, 0.5);
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
          .input-row, .features-list {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}

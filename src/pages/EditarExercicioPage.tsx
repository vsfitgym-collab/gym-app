import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Image, Plus, X } from 'lucide-react'
import type { Exercise } from '../lib/exerciseTranslations'
import './EditarExercicio.css'

const bodyPartOptions = [
  { value: 'waist', label: 'Cintura' },
  { value: 'upper legs', label: 'Coxas Superiores' },
  { value: 'back', label: 'Costas' },
  { value: 'lower legs', label: 'Inferiores' },
  { value: 'shoulders', label: 'Ombros' },
  { value: 'arms', label: 'Braços' },
  { value: 'chest', label: 'Peito' },
  { value: 'upper arms', label: 'Braços Superiores' },
  { value: 'lower arms', label: 'Braços Inferiores' },
  { value: 'neck', label: 'Pescoço' },
  { value: 'cardio', label: 'Cardio' },
]

const targetOptions = [
  { value: 'abs', label: 'Abdômen' },
  { value: 'abductors', label: 'Abdutores' },
  { value: 'adductors', label: 'Adutores' },
  { value: 'biceps', label: 'Bíceps' },
  { value: 'calves', label: 'Panturrilhas' },
  { value: 'delts', label: 'Deltóides' },
  { value: 'forearms', label: 'Antebraços' },
  { value: 'glutes', label: 'Glúteos' },
  { value: 'hamstrings', label: 'Posterior' },
  { value: 'lats', label: 'Latíssimo' },
  { value: 'pectorals', label: 'Peitorais' },
  { value: 'quads', label: 'Quadríceps' },
  { value: 'spine', label: 'Coluna' },
  { value: 'traps', label: 'Trapézio' },
  { value: 'triceps', label: 'Tríceps' },
  { value: 'upper back', label: 'Costas Superiores' },
  { value: 'cardiovascular system', label: 'Sistema Cardiovascular' },
]

const equipmentOptions = [
  { value: 'body weight', label: 'Peso Corporal' },
  { value: 'barbell', label: 'Barra' },
  { value: 'dumbbell', label: 'Halteres' },
  { value: 'cable', label: 'Cabo' },
  { value: 'kettlebell', label: 'Kettlebell' },
  { value: 'leverage machine', label: 'Máquina' },
  { value: 'resistance band', label: 'Elástico' },
  { value: 'smith machine', label: 'Smith Machine' },
  { value: 'weighted', label: 'Com Peso' },
  { value: 'ez barbell', label: 'Barra EZ' },
  { value: 'medicine ball', label: 'Bola Medicinal' },
  { value: 'fitball', label: 'Bola de Ginástica' },
  { value: 'rope', label: 'Corda' },
]

export default function EditarExercicioPage() {
  const navigate = useNavigate()
  const exerciseData = localStorage.getItem('selectedExercise')
  const exercise: Exercise | null = exerciseData ? JSON.parse(exerciseData) : null

  const [name, setName] = useState(exercise?.name || '')
  const [bodyPart, setBodyPart] = useState(exercise?.bodyPart || '')
  const [target, setTarget] = useState(exercise?.target || '')
  const [equipment, setEquipment] = useState(exercise?.equipment || '')
  const [gifUrl, setGifUrl] = useState(exercise?.gifUrl || '')
  const [instructions, setInstructions] = useState<string[]>(exercise?.instructions || [])
  const [newInstruction, setNewInstruction] = useState('')
  const [saving, setSaving] = useState(false)
  const [previewError, setPreviewError] = useState(false)

  const addInstruction = useCallback(() => {
    if (newInstruction.trim()) {
      setInstructions(prev => [...prev, newInstruction.trim()])
      setNewInstruction('')
    }
  }, [newInstruction])

  const removeInstruction = useCallback((index: number) => {
    setInstructions(prev => prev.filter((_, i) => i !== index))
  }, [])

  const updateInstruction = useCallback((index: number, value: string) => {
    setInstructions(prev => prev.map((inst, i) => i === index ? value : inst))
  }, [])

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Nome do exercício é obrigatório')
      return
    }

    setSaving(true)
    try {
      const updatedExercise = {
        ...exercise,
        name: name.trim(),
        bodyPart,
        target,
        equipment,
        gifUrl: gifUrl.trim(),
        instructions: instructions.filter(inst => inst.trim()),
      }

      localStorage.setItem('selectedExercise', JSON.stringify(updatedExercise))
      
      const savedExercises = JSON.parse(localStorage.getItem('customExercises') || '[]')
      const existingIndex = savedExercises.findIndex((e: Exercise) => e.id === exercise?.id)
      if (existingIndex >= 0) {
        savedExercises[existingIndex] = updatedExercise
      } else {
        savedExercises.push(updatedExercise)
      }
      localStorage.setItem('customExercises', JSON.stringify(savedExercises))

      alert('Exercício salvo com sucesso!')
      navigate('/exercicios')
    } catch (error) {
      alert('Erro ao salvar exercício')
    } finally {
      setSaving(false)
    }
  }

  if (!exercise) {
    return (
      <div className="editar-exercicio">
        <div className="empty-state">
          <p>Exercício não encontrado</p>
          <button onClick={() => navigate('/exercicios')}>Voltar</button>
        </div>
      </div>
    )
  }

  return (
    <div className="editar-exercicio">
      <div className="editar-header">
        <button className="btn-voltar" onClick={() => navigate('/exercicios')}>
          <ArrowLeft size={24} />
        </button>
        <h2>Editar Exercício</h2>
      </div>

      <div className="editar-content">
        <div className="exercise-preview">
          {gifUrl && !previewError ? (
            <img 
              src={gifUrl} 
              alt={name} 
              onError={() => setPreviewError(true)}
            />
          ) : (
            <div className="preview-placeholder">
              <Image size={48} />
              <span>Adicione um GIF</span>
            </div>
          )}
        </div>

        <div className="form-grid">
          <div className="form-section">
            <label>Nome do Exercício</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Supino Reto"
            />
          </div>

          <div className="form-section">
            <label>Parte do Corpo</label>
            <select value={bodyPart} onChange={(e) => setBodyPart(e.target.value)}>
              {bodyPartOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="form-section">
            <label>Grupo Muscular Alvo</label>
            <select value={target} onChange={(e) => setTarget(e.target.value)}>
              {targetOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="form-section">
            <label>Equipamento</label>
            <select value={equipment} onChange={(e) => setEquipment(e.target.value)}>
              {equipmentOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="form-section full-width">
            <label>GIF do Exercício (URL)</label>
            <input
              type="url"
              value={gifUrl}
              onChange={(e) => {
                setGifUrl(e.target.value)
                setPreviewError(false)
              }}
              placeholder="https://exemplo.com/exercicio.gif"
            />
            <span className="help-text">
              Cole a URL de um GIF ou imagem do exercício
            </span>
          </div>
        </div>

        <div className="form-section">
          <label>Instruções</label>
          <div className="instructions-editable">
            {instructions.map((inst, i) => (
              <div key={i} className="instruction-editable">
                <span className="instruction-number">{i + 1}</span>
                <input
                  type="text"
                  value={inst}
                  onChange={(e) => updateInstruction(i, e.target.value)}
                  placeholder="Descreva o passo"
                />
                <button 
                  className="btn-remove-instruction"
                  onClick={() => removeInstruction(i)}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
          <div className="add-instruction">
            <input
              type="text"
              value={newInstruction}
              onChange={(e) => setNewInstruction(e.target.value)}
              placeholder="Nova instrução..."
              onKeyDown={(e) => e.key === 'Enter' && addInstruction()}
            />
            <button className="btn-add-instruction" onClick={addInstruction}>
              <Plus size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="editar-actions">
        <button 
          className="btn-salvar"
          onClick={handleSave}
          disabled={saving}
        >
          <Save size={18} />
          <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
        </button>
      </div>
    </div>
  )
}
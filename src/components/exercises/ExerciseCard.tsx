import { useState, useCallback, memo, useEffect } from 'react'
import { ChevronDown, ChevronUp, Target, Wrench, Clock } from 'lucide-react'
import type { Exercise } from '../../lib/exerciseTranslations'
import { getSupabaseGifUrl } from '../../lib/exerciseUtils'
import './ExerciseCard.css'

interface ExerciseCardProps {
  exercise: Exercise
  onClick?: (exercise: Exercise) => void
}

const ExerciseCard = memo(function ExerciseCard({ exercise, onClick }: ExerciseCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [currentGifUrl, setCurrentGifUrl] = useState(() => getSupabaseGifUrl(exercise.name))
  const [attemptedFallback, setAttemptedFallback] = useState(false)

  // Reset states when the exercise changes
  useEffect(() => {
    setCurrentGifUrl(getSupabaseGifUrl(exercise.name))
    setAttemptedFallback(false)
    setImageError(false)
    setImageLoaded(false)
  }, [exercise.name])

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onClick?.(exercise)
  }, [exercise, onClick])

  const handleToggleInstructions = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setShowInstructions(prev => !prev)
  }, [])

  const handleImageError = useCallback(() => {
    if (!attemptedFallback) {
      // Prioridade 2: Tentar GIF da API (fallback)
      if (exercise.gifUrl && exercise.gifUrl !== currentGifUrl) {
        setCurrentGifUrl(exercise.gifUrl)
        setAttemptedFallback(true)
      } else {
        // Se não houver URL da API ou for a mesma, pula para erro final
        setImageError(true)
      }
    } else {
      // Prioridade 3: Falhou ambos, usar placeholder
      setImageError(true)
    }
  }, [attemptedFallback, exercise.gifUrl, currentGifUrl])

  return (
    <div className="exercise-card" onClick={handleClick}>
      <div className="exercise-image-wrapper">
        {(!imageLoaded && !imageError) && (
          <div className="exercise-image-skeleton" />
        )}
        {imageError ? (
          <div className="exercise-image-placeholder">
            <span className="placeholder-icon">💪</span>
            <span className="placeholder-text">Sem imagem disponível</span>
          </div>
        ) : (
          <img
            src={currentGifUrl}
            alt={exercise.name}
            className={`exercise-image ${imageLoaded ? 'loaded' : ''}`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={handleImageError}
          />
        )}
        <div className="exercise-image-overlay" />
      </div>

      <div className="exercise-body">
        <div className="exercise-title-section">
          <h3 className="exercise-name">{exercise.name}</h3>
          <span className="exercise-body-part">{exercise.bodyPart}</span>
        </div>

        <div className="exercise-tags">
          <span className="exercise-tag target">
            <Target size={12} />
            {exercise.target}
          </span>
          <span className="exercise-tag equipment">
            <Wrench size={12} />
            {exercise.equipment}
          </span>
        </div>

        {exercise.instructions && exercise.instructions.length > 0 && (
          <div className="exercise-instructions">
            <button 
              className="instructions-toggle"
              onClick={handleToggleInstructions}
            >
              <Clock size={14} />
              <span>Como executar</span>
              {showInstructions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            
            {showInstructions && (
              <ol className="instructions-list">
                {exercise.instructions.slice(0, 4).map((instruction, index) => (
                  <li key={index}>
                    <span className="instruction-step">{index + 1}</span>
                    <span className="instruction-text">{instruction}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </div>
    </div>
  )
})

interface ExerciseListProps {
  exercises: Exercise[]
  loading?: boolean
  error?: string | null
  onExerciseClick?: (exercise: Exercise) => void
}

export const ExerciseList = memo(function ExerciseList({ 
  exercises, 
  loading, 
  error, 
  onExerciseClick 
}: ExerciseListProps) {
  if (loading) {
    return (
      <div className="exercise-list">
        {Array.from({ length: 6 }).map((_, index) => (
          <ExerciseCardSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="exercise-empty">
        <span className="empty-icon">⚠️</span>
        <p>Erro ao carregar exercícios</p>
        <span>{error}</span>
      </div>
    )
  }

  if (exercises.length === 0) {
    return (
      <div className="exercise-empty">
        <span className="empty-icon">🔍</span>
        <p>Nenhum exercício encontrado</p>
        <span>Tente buscar por outro termo ou filtro</span>
      </div>
    )
  }

  return (
    <div className="exercise-list">
      {exercises.map((exercise, index) => (
        <div 
          key={exercise.id} 
          className="exercise-card-wrapper"
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          <ExerciseCard 
            exercise={exercise} 
            onClick={onExerciseClick}
          />
        </div>
      ))}
    </div>
  )
})

function ExerciseCardSkeleton() {
  return (
    <div className="exercise-card exercise-card-skeleton">
      <div className="exercise-image-wrapper">
        <div className="exercise-image-skeleton" />
      </div>
      <div className="exercise-body">
        <div className="skeleton-line skeleton-title" />
        <div className="skeleton-line skeleton-subtitle" />
        <div className="skeleton-tags">
          <div className="skeleton-tag" />
          <div className="skeleton-tag" />
        </div>
      </div>
    </div>
  )
}

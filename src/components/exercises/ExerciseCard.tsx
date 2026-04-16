import { useState, useCallback, memo, useEffect } from 'react'
import { Target, Wrench, Edit3, Plus, Trash2 } from 'lucide-react'
import type { Exercise } from '../../lib/exerciseTranslations'
import { getSupabaseGifUrl } from '../../lib/exerciseUtils'
import './ExerciseCard.css'

interface ExerciseCardProps {
  exercise: Exercise
  onClick?: (exercise: Exercise) => void
  onEdit?: (exercise: Exercise) => void
}

export const ExerciseCard = memo(function ExerciseCard({ exercise, onClick, onEdit }: ExerciseCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [currentGifUrl, setCurrentGifUrl] = useState(() => exercise.gifUrl || getSupabaseGifUrl(exercise.name))
  const [fallbackLevel, setFallbackLevel] = useState(0)

  // Reset states when the exercise changes
  useEffect(() => {
    setCurrentGifUrl(exercise.gifUrl || getSupabaseGifUrl(exercise.name))
    setFallbackLevel(0)
    setImageError(false)
    setImageLoaded(false)
  }, [exercise.name, exercise.gifUrl])

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    onClick?.(exercise)
  }, [exercise, onClick])

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.(exercise)
  }, [exercise, onEdit])

  const handleImageError = useCallback(() => {
    if (fallbackLevel === 0) {
      if (currentGifUrl === exercise.gifUrl) {
          // If native API url failed, try Proxied
          setFallbackLevel(1)
          setCurrentGifUrl(`https://corsproxy.io/?${encodeURIComponent(exercise.gifUrl || '')}`)
      } else {
          // If Supabase failed (which happens if API url was blank), and fallback is done
          setImageError(true)
      }
    } else if (fallbackLevel === 1) {
      // If corsproxy failed, try Supabase as ultimate salvation
      setFallbackLevel(2)
      setCurrentGifUrl(getSupabaseGifUrl(exercise.name))
    } else if (fallbackLevel === 2) {
      setImageError(true)
    }
  }, [fallbackLevel, exercise.gifUrl, currentGifUrl, exercise.name])

  return (
    <div className="exercise-card" onClick={handleClick}>
      <div className="exercise-card-badges">
        {exercise.bodyPart && (
          <span className="exercise-badge-main">{exercise.bodyPart}</span>
        )}
      </div>

      <div className="exercise-image-wrapper">
        {(!imageLoaded && !imageError) && (
          <div className="exercise-image-skeleton" />
        )}
        {imageError ? (
          <div className="exercise-image-placeholder">
            <span className="placeholder-icon">💪</span>
            <span className="placeholder-text">Sem imagem</span>
          </div>
        ) : (
          <img
            src={currentGifUrl}
            alt={exercise.name}
            className={`exercise-image ${imageLoaded ? 'loaded' : ''}`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={handleImageError}
            referrerPolicy="no-referrer"
          />
        )}
        <div className="exercise-image-overlay" />
      </div>

      {onEdit && (
        <div className="exercise-hover-actions">
          <button className="exercise-action-btn" title="Adicionar ao treino" onClick={handleClick}>
            <Plus size={18} />
          </button>
          <button className="exercise-action-btn" title="Editar exercício" onClick={handleEdit}>
            <Edit3 size={18} />
          </button>
        </div>
      )}

      <div className="exercise-body">
        <h3 className="exercise-name">{exercise.name}</h3>
        
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
      </div>
    </div>
  )
})

interface ExerciseListProps {
  exercises: Exercise[]
  loading?: boolean
  error?: string | null
  onExerciseClick?: (exercise: Exercise) => void
  onEditClick?: (exercise: Exercise) => void
}

export const ExerciseList = memo(function ExerciseList({ 
  exercises, 
  loading, 
  error, 
  onExerciseClick,
  onEditClick
}: ExerciseListProps) {
  if (loading) {
    return (
      <div className="exercise-list">
        {Array.from({ length: 8 }).map((_, index) => (
          <ExerciseCardSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="exercise-empty text-center py-10">
        <span className="empty-icon text-4xl block mb-2">⚠️</span>
        <p className="text-white font-bold">Erro ao carregar exercícios</p>
        <span className="text-gray-400">{error}</span>
      </div>
    )
  }

  if (exercises.length === 0) {
    return (
      <div className="exercise-empty text-center py-12">
        <span className="empty-icon text-5xl block mb-4">🔍</span>
        <p className="text-white font-bold text-xl mb-2">Nenhum exercício encontrado</p>
        <span className="text-gray-400">Tente buscar por outro termo ou filtro</span>
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
            onEdit={onEditClick}
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
        <div className="exercise-image-overlay" />
      </div>
      <div className="exercise-body">
        <div className="skeleton-line skeleton-title" />
        <div className="skeleton-line skeleton-subtitle" />
        <div className="skeleton-tags">
          <div className="skeleton-tag" />
          <div className="skeleton-tag" style={{ width: '80px' }} />
        </div>
      </div>
    </div>
  )
}

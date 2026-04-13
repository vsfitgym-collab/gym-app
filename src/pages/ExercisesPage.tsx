import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, Filter, X, ChevronDown } from 'lucide-react'
import { ExerciseList } from '../components/exercises/ExerciseCard'
import type { Exercise } from '../lib/exerciseTranslations'
import { fetchExercises, fetchExercisesByBodyPart, searchExercises, getMockExercises, mockExercises } from '../lib/exerciseApi'
import { bodyParts, muscleGroups } from '../lib/exerciseTranslations'
import ProtectedFeature from '../components/ProtectedFeature'
import './Exercises.css'

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBodyPart, setSelectedBodyPart] = useState('all')
  const [selectedMuscle, setSelectedMuscle] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const loaderRef = useRef<HTMLDivElement>(null)

  const LIMIT = 10

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const loadExercises = useCallback(async (reset: boolean = false) => {
    if (reset) {
      setLoading(true)
      setOffset(0)
    } else {
      setLoadingMore(true)
    }
    setError(null)

    try {
      let result: { data: Exercise[], error?: string }

      if (searchQuery) {
        result = await searchExercises(searchQuery, LIMIT)
      } else if (selectedBodyPart !== 'all') {
        result = await fetchExercisesByBodyPart(selectedBodyPart, LIMIT)
      } else if (selectedMuscle !== 'all') {
        const filtered = mockExercises.filter(ex => 
          ex.target.toLowerCase().includes(selectedMuscle.toLowerCase())
        )
        result = { data: filtered }
      } else {
        result = await fetchExercises(LIMIT, reset ? 0 : offset)
      }

      if (result.error) {
        const mockData = await getMockExercises()
        result = { data: mockData }
      }

      const customExercises: Exercise[] = JSON.parse(localStorage.getItem('customExercises') || '[]')
      const mergedData = result.data.map((ex: Exercise) => {
        const custom = customExercises.find((c: Exercise) => c.id === ex.id)
        return custom ? { ...ex, ...custom } : ex
      })

      if (reset) {
        setExercises(mergedData)
      } else {
        setExercises(prev => [...prev, ...mergedData])
      }
      
      setHasMore(result.data.length === LIMIT)
      setOffset(prev => prev + LIMIT)
    } catch (err) {
      console.error('Error:', err)
      const mockData = await getMockExercises()
      const customExercises: Exercise[] = JSON.parse(localStorage.getItem('customExercises') || '[]')
      const mergedData = mockData.map((ex: Exercise) => {
        const custom = customExercises.find((c: Exercise) => c.id === ex.id)
        return custom ? { ...ex, ...custom } : ex
      })
      setExercises(mergedData)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [searchQuery, selectedBodyPart, selectedMuscle, offset])

  useEffect(() => {
    const debounce = setTimeout(() => {
      loadExercises(true)
    }, 500)

    return () => clearTimeout(debounce)
  }, [searchQuery, selectedBodyPart, selectedMuscle])

  useEffect(() => {
    if (!loadingMore && hasMore && !searchQuery && selectedBodyPart === 'all' && isMobile) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            loadExercises(false)
          }
        },
        { threshold: 0.1 }
      )

      if (loaderRef.current) {
        observer.observe(loaderRef.current)
      }

      return () => observer.disconnect()
    }
  }, [loadingMore, hasMore, searchQuery, selectedBodyPart, isMobile, loadExercises])

  const handleExerciseClick = useCallback((exercise: Exercise) => {
    localStorage.setItem('selectedExercise', JSON.stringify(exercise))
    window.location.href = `/exercicios/editar/${exercise.id}`
  }, [])

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadExercises(false)
    }
  }, [loadingMore, hasMore, loadExercises])

  const clearFilters = useCallback(() => {
    setSearchQuery('')
    setSelectedBodyPart('all')
    setSelectedMuscle('all')
  }, [])

  const hasActiveFilters = searchQuery || selectedBodyPart !== 'all' || selectedMuscle !== 'all'

  return (
    <ProtectedFeature feature="Biblioteca de Exercícios">
      <div className="exercises-page">
        <div className="exercises-header">
          <div className="exercises-title">
            <h2>Exercícios</h2>
            <span className="exercises-count">
              {exercises.length > 0 ? `${exercises.length} exercícios` : 'Carregando...'}
            </span>
          </div>
        </div>

        <div className="exercises-search">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar exercício..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button 
                className="search-clear"
                onClick={() => setSearchQuery('')}
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button 
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} />
            <span>Filtros</span>
            {hasActiveFilters && <span className="filter-badge" />}
          </button>
        </div>

        {showFilters && (
          <div className="exercises-filters">
            <div className="filter-group">
              <label>
                <span>Parte do Corpo</span>
                <ChevronDown size={14} />
              </label>
              <select 
                value={selectedBodyPart}
                onChange={(e) => setSelectedBodyPart(e.target.value)}
              >
                {bodyParts.map(part => (
                  <option key={part.value} value={part.value}>
                    {part.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>
                <span>Grupo Muscular</span>
                <ChevronDown size={14} />
              </label>
              <select 
                value={selectedMuscle}
                onChange={(e) => setSelectedMuscle(e.target.value)}
              >
                {muscleGroups.map(muscle => (
                  <option key={muscle.value} value={muscle.value}>
                    {muscle.label}
                  </option>
                ))}
              </select>
            </div>

            {hasActiveFilters && (
              <button className="clear-filters" onClick={clearFilters}>
                <X size={14} />
                Limpar filtros
              </button>
            )}
          </div>
        )}

        <div className="exercises-content">
          <ExerciseList 
            exercises={exercises}
            loading={loading}
            error={error}
            onExerciseClick={handleExerciseClick}
          />

          {!loading && hasMore && (
            <div ref={loaderRef} className={`load-more-container ${isMobile ? 'mobile-infinite' : ''}`}>
              {loadingMore ? (
                <div className="load-more-loading">
                  <div className="spinner" />
                  <span>Carregando mais exercícios...</span>
                </div>
              ) : isMobile ? (
                <span className="load-more-hint">Role para carregar mais</span>
              ) : (
                <button 
                  className="load-more-btn"
                  onClick={handleLoadMore}
                >
                  Carregar mais exercícios
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedFeature>
  )
}

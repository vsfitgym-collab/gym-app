import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, Filter, X, ChevronDown, Plus, Activity, Target, XCircle, LayoutTemplate } from 'lucide-react'
import { ExerciseList } from '../components/exercises/ExerciseCard'
import type { Exercise } from '../lib/exerciseTranslations'
import { fetchExercises, fetchExercisesByBodyPart, searchExercises, getMockExercises, mockExercises } from '../lib/exerciseApi'
import { bodyParts, muscleGroups } from '../lib/exerciseTranslations'
import { getSupabaseGifUrl } from '../lib/exerciseUtils'
import ProtectedFeature from '../components/ProtectedFeature'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Exercises.css'

function SafeDrawerImage({ exercise }: { exercise: Exercise }) {
  const [currentUrl, setCurrentUrl] = useState(() => exercise.gifUrl || getSupabaseGifUrl(exercise.name))
  const [fallbackLevel, setFallbackLevel] = useState(0)

  useEffect(() => {
    setCurrentUrl(exercise.gifUrl || getSupabaseGifUrl(exercise.name))
    setFallbackLevel(0)
  }, [exercise])

  return (
    <img 
      src={currentUrl} 
      alt={exercise.name} 
      referrerPolicy="no-referrer"
      onError={() => {
        if (fallbackLevel === 0) {
          if (currentUrl === exercise.gifUrl) {
            setFallbackLevel(1)
            setCurrentUrl(`https://corsproxy.io/?${encodeURIComponent(exercise.gifUrl || '')}`)
          }
        } else if (fallbackLevel === 1) {
          setFallbackLevel(2)
          setCurrentUrl(getSupabaseGifUrl(exercise.name))
        }
      }}
    />
  )
}

export default function ExercisesPage() {
  const { role } = useAuth()
  const isAdmin = role === 'personal'

  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBodyPart, setSelectedBodyPart] = useState('all')
  const [selectedMuscle, setSelectedMuscle] = useState('all')
  
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  
  const [isMobile, setIsMobile] = useState(false)
  const loaderRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // Drawer state
  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null)

  const LIMIT = 12

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
        // Since it's a mock filter, slice it for pagination if we wanted to, but limiting for now.
        result = { data: filtered.slice(reset ? 0 : offset, (reset ? 0 : offset) + LIMIT) }
      } else {
        result = await fetchExercises(LIMIT, reset ? 0 : offset)
      }

      if (result.error || result.data.length === 0) {
        const mockData = await getMockExercises()
        // If query fails or returns empty unexpectedly, fallback to simulated data
        result = { data: mockData.slice(0, LIMIT) }
      }

      const customExercises: Exercise[] = JSON.parse(localStorage.getItem('customExercises') || '[]')
      const mergedData = result.data.map((ex: Exercise) => {
        const custom = customExercises.find((c: Exercise) => c.id === ex.id)
        return custom ? { ...ex, ...custom } : ex
      })

      if (reset) {
        setExercises(mergedData)
      } else {
        // Prevent dupes locally if api duplicates via offset
        const existingIds = new Set(reset ? [] : exercises.map(e => e.id))
        const newExs = mergedData.filter((e: any) => !existingIds.has(e.id))
        setExercises(prev => [...prev, ...newExs])
      }
      
      setHasMore(result.data.length === LIMIT)
      setOffset(prev => prev + LIMIT)
    } catch (err) {
      console.error('Error:', err)
      const mockData = await getMockExercises()
      setExercises(mockData.slice(0, LIMIT))
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [searchQuery, selectedBodyPart, selectedMuscle, offset, exercises])

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
    // Open in Drawer instead of navigating
    setActiveExercise(exercise)
  }, [])

  const handleEditClick = useCallback((exercise: Exercise) => {
    localStorage.setItem('selectedExercise', JSON.stringify(exercise))
    navigate(`/exercicios/editar/${exercise.id}`)
  }, [navigate])

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
        {/* PREMIUM HEADER */}
        <div className="exercises-header">
          <div className="exercises-title">
            <h2>Exercícios</h2>
            <p className="exercises-subtitle">
              Catálogo visual de execução e configuração
            </p>
          </div>
          {isAdmin && (
            <div className="exercises-header-actions">
              <button className="btn-premium primary" onClick={() => navigate('/exercicios/novo')}>
                <Plus size={18} /> Novo exercício
              </button>
            </div>
          )}
        </div>

        {/* MODERN FILTERS & SEARCH */}
        <div className="exercises-search-bar">
          <div className="search-input-wrapper">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar exercícios por nome..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button 
                className="search-clear"
                onClick={() => setSearchQuery('')}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="exercises-filters">
            <select 
              className="filter-select"
              value={selectedBodyPart}
              onChange={(e) => setSelectedBodyPart(e.target.value)}
            >
              <option value="all">Todas as áreas</option>
              {bodyParts.map(part => (
                <option key={part.value} value={part.value}>{part.label}</option>
              ))}
            </select>

            <select 
              className="filter-select"
              value={selectedMuscle}
              onChange={(e) => setSelectedMuscle(e.target.value)}
            >
              <option value="all">Todos os Músculos</option>
              {muscleGroups.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>

            {hasActiveFilters && (
              <button className="filter-select" style={{background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: 'none'}} onClick={clearFilters}>
                Limpar Seleção
              </button>
            )}
          </div>
        </div>

        <div className="exercises-content">
          <ExerciseList 
            exercises={exercises}
            loading={loading}
            error={error}
            onExerciseClick={handleExerciseClick}
            onEditClick={isAdmin ? handleEditClick : undefined}
          />

          {!loading && hasMore && exercises.length > 0 && (
            <div ref={loaderRef} className={`load-more-container ${isMobile ? 'mobile-infinite' : ''}`}>
              {loadingMore ? (
                <div className="load-more-btn flex gap-2 items-center" style={{cursor: 'default'}}>
                  <div className="spinner" style={{width: 16, height: 16}} />
                  <span>Carregando catálogo...</span>
                </div>
              ) : isMobile ? (
                <span className="text-gray-500 font-semibold">Role a página</span>
              ) : (
                <button className="load-more-btn" onClick={handleLoadMore}>
                  Carregar mais exercícios
                </button>
              )}
            </div>
          )}
        </div>

        {/* SLIDE-OVER DRAWER OVERLAY */}
        {activeExercise && (
          <>
            <div className="ex-drawer-overlay" onClick={() => setActiveExercise(null)} />
            <div className="ex-drawer">
              <button className="ex-drawer-close" onClick={() => setActiveExercise(null)}>
                <X size={20} />
              </button>
              
              <div className="ex-drawer-media">
                <SafeDrawerImage exercise={activeExercise} />
              </div>
              
              <div className="ex-drawer-content">
                <h3 className="ex-drawer-title">{activeExercise.name}</h3>
                
                <div className="ex-drawer-tags">
                  <span className="ex-drawer-tag-main">{activeExercise.bodyPart}</span>
                  <span className="exercise-tag equipment" style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#fff'}}>
                    {activeExercise.equipment}
                  </span>
                </div>

                <div className="ex-drawer-section">
                  <h4>Músculos Ativados</h4>
                  <div className="ex-drawer-muscle-visual">
                    <Activity size={24} className="text-indigo-400" />
                    <div>
                      <div className="text-main">{activeExercise.target}</div>
                      <div className="text-sm text-gray-400">Ativação principal e foco</div>
                    </div>
                  </div>
                </div>

                {activeExercise.instructions && activeExercise.instructions.length > 0 && (
                  <div className="ex-drawer-section">
                    <h4>Passo a Passo de Execução</h4>
                    <ul className="ex-drawer-steps">
                      {activeExercise.instructions.map((step, i) => (
                        <li key={i}>
                          <div className="step-num">{i + 1}</div>
                          <div className="step-text">{step}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {isAdmin ? (
                <div className="ex-drawer-footer">
                  <button 
                    className="btn-premium primary flex-1 justify-center"
                    onClick={() => {
                       handleEditClick(activeExercise) 
                    }}
                  >
                    <Plus size={16} /> Configurar/Editar
                  </button>
                </div>
              ) : (
                <div className="ex-drawer-footer">
                   <button 
                    className="btn-premium primary flex-1 justify-center"
                    onClick={() => setActiveExercise(null)}
                   >
                     Entendido
                   </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </ProtectedFeature>
  )
}

import { useState, useMemo, useEffect } from 'react'
import { Search, X, Plus } from 'lucide-react'
import { ExerciseList } from '../components/exercises/ExerciseCard'
import type { Exercise } from '../lib/exerciseTranslations'
import { exercises as localExercises } from '../data/exercises'
import { bodyParts, muscleGroups, translateBodyPart, translateTarget, translateEquipment } from '../lib/exerciseTranslations'
import { getGifUrl, normalizePath, SUPABASE_URL } from '../lib/exerciseUtils'
import ProtectedFeature from '../components/ProtectedFeature'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Exercises.css'

const mapLocalToExercise = (local: typeof localExercises[0]): Exercise => ({
  id: local.id,
  name: local.name,
  bodyPart: translateBodyPart(local.bodyPart),
  target: translateTarget(local.target),
  equipment: translateEquipment(local.equipment),
  gif: local.gif,
  gifUrl: getGifUrl(local),
  instructions: []
})

function SafeDrawerImage({ exercise }: { exercise: Exercise }) {
  const [currentUrl, setCurrentUrl] = useState(() => exercise.gifUrl || '')
  const [fallbackLevel, setFallbackLevel] = useState(0)

  useEffect(() => {
    setCurrentUrl(exercise.gifUrl || '')
    setFallbackLevel(0)
  }, [exercise])

  return (
    <img
      src={currentUrl}
      alt={exercise.name}
      referrerPolicy="no-referrer"
      onError={() => {
        if (fallbackLevel === 0 && exercise.name) {
          setFallbackLevel(1)
          const slug = normalizePath(exercise.name)
          setCurrentUrl(`${SUPABASE_URL}/storage/v1/object/public/exercicios/${slug}.gif`)
        }
      }}
    />
  )
}

export default function ExercisesPage() {
  const { role } = useAuth()
  const isAdmin = role === 'personal'

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBodyPart, setSelectedBodyPart] = useState('all')
  const [selectedMuscle, setSelectedMuscle] = useState('all')

  const [page, setPage] = useState(1)
  const LIMIT = 12

  const navigate = useNavigate()

  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null)

  const allExercises = useMemo(() => {
    return localExercises.map(mapLocalToExercise)
  }, [])

  const filteredExercises = useMemo(() => {
    return allExercises.filter(ex => {
      const matchesSearch = !searchQuery || 
        ex.name.toLowerCase().includes(searchQuery.toLowerCase())
      
      const bodyPartMatch = selectedBodyPart === 'all' || 
        ex.bodyPart.toLowerCase() === selectedBodyPart.toLowerCase() ||
        (selectedBodyPart === 'back' && ex.bodyPart === 'Costas') ||
        (selectedBodyPart === 'chest' && ex.bodyPart === 'Peito') ||
        (selectedBodyPart === 'shoulders' && ex.bodyPart === 'Ombros') ||
        (selectedBodyPart === 'upper arms' && (ex.bodyPart === 'Braços Superiores' || ex.bodyPart === 'Braços')) ||
        (selectedBodyPart === 'upper legs' && (ex.bodyPart === 'Coxas Superiores' || ex.bodyPart === 'Coxas' || ex.bodyPart === 'Perna')) ||
        (selectedBodyPart === 'lower legs' && (ex.bodyPart === 'Inferiores' || ex.bodyPart === 'Pernas Inferiores')) ||
        (selectedBodyPart === 'waist' && ex.bodyPart === 'Cintura') ||
        (selectedBodyPart === 'cardio' && ex.bodyPart === 'Cardio')
      
      const targetMatch = selectedMuscle === 'all' || 
        ex.target.toLowerCase().includes(selectedMuscle.toLowerCase())
      
      return matchesSearch && bodyPartMatch && targetMatch
    })
  }, [allExercises, searchQuery, selectedBodyPart, selectedMuscle])

  const paginatedExercises = useMemo(() => {
    return filteredExercises.slice(0, page * LIMIT)
  }, [filteredExercises, page])

  const hasMore = paginatedExercises.length < filteredExercises.length

  useEffect(() => {
    setPage(1)
  }, [searchQuery, selectedBodyPart, selectedMuscle])

  const loadMore = () => {
    if (hasMore) {
      setPage(p => p + 1)
    }
  }

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >= 
        document.documentElement.offsetHeight - 200
      ) {
        loadMore()
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [hasMore])

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedBodyPart('all')
    setSelectedMuscle('all')
  }

  return (
    <ProtectedFeature feature="Biblioteca de Exercícios">
      <div className="exercises-page">

        <div className="exercises-header">
          <div>
            <h2>Exercícios</h2>
            <p>Catálogo visual de execução</p>
          </div>

          {isAdmin && (
            <button className="btn-premium primary" onClick={() => navigate('/exercicios/novo')}>
              <Plus size={18} /> Novo
            </button>
          )}
        </div>

        <div className="exercises-search-bar">
          <div className="search-input-wrapper">
            <Search size={20} />
            <input
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')}>
                <X size={14} />
              </button>
            )}
          </div>

          <div className="exercises-filters">
            <select value={selectedBodyPart} onChange={(e) => setSelectedBodyPart(e.target.value)}>
              <option value="all">Todas áreas</option>
              {bodyParts.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>

            <select value={selectedMuscle} onChange={(e) => setSelectedMuscle(e.target.value)}>
              <option value="all">Todos músculos</option>
              {muscleGroups.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>

            <button onClick={clearFilters}>
              Limpar
            </button>
          </div>
        </div>

        <ExerciseList
          exercises={paginatedExercises}
          loading={false}
          error={null}
          onExerciseClick={setActiveExercise}
        />

        {hasMore && (
          <div className="load-more-container">
            Scroll para carregar mais
          </div>
        )}

        {activeExercise && (
          <div className="drawer">
            <SafeDrawerImage exercise={activeExercise} />
            <h3>{activeExercise.name}</h3>
            <p>{activeExercise.target}</p>

            <button onClick={() => setActiveExercise(null)}>
              Fechar
            </button>
          </div>
        )}

      </div>
    </ProtectedFeature>
  )
}
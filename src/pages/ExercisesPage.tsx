import { useState, useMemo, useEffect } from 'react'
import { Search, X, Plus } from 'lucide-react'
import { ExerciseList } from '../components/exercises/ExerciseCard'
import type { Exercise } from '../lib/exerciseTranslations'
import { exercicios } from '../data/exercicios'
import { translateBodyPart, translateTarget } from '../lib/exerciseTranslations'
import { getGruposFromExercicios, normalizeGrupo, normalizeText } from '../lib/grupos'
import ProtectedFeature from '../components/ProtectedFeature'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Exercises.css'

const mapExercicioToExercise = (local: typeof exercicios[0]): Exercise => ({
  id: local.id,
  name: local.nome,
  bodyPart: translateBodyPart(local.grupoMuscular),
  target: translateTarget(local.grupoMuscular),
  equipment: '',
  gif: local.thumbnail,
  gifUrl: local.thumbnail,
  instructions: []
})

function SafeDrawerImage({ exercise }: { exercise: Exercise }) {
  return (
    <img
      src={exercise.gifUrl || ''}
      alt={exercise.name}
      referrerPolicy="no-referrer"
    />
  )
}

export default function ExercisesPage() {
  const { role } = useAuth()
  const isAdmin = role === 'personal'

  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [selectedGrupo, setSelectedGrupo] = useState('todos')
  const [sortBy, setSortBy] = useState<'az' | 'za'>('az')

  const [page, setPage] = useState(1)
  const LIMIT = 12

  const navigate = useNavigate()

  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null)

  const gruposOptions = useMemo(() => getGruposFromExercicios(exercicios), [])

  const allExercises = useMemo(() => {
    return exercicios.map(mapExercicioToExercise)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const filteredExercises = useMemo(() => {
    const bySearch = searchQuery
      ? allExercises.filter(ex =>
          normalizeText(ex.name).includes(normalizeText(searchQuery))
        )
      : allExercises

    const byGrupo = selectedGrupo === 'todos'
      ? bySearch
      : bySearch.filter(ex =>
          normalizeGrupo(ex.bodyPart) === selectedGrupo ||
          normalizeGrupo(ex.target) === selectedGrupo
        )

    const sorted = [...byGrupo].sort((a, b) =>
      sortBy === 'az'
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    )

    return sorted
  }, [allExercises, searchQuery, selectedGrupo, sortBy])

  const paginatedExercises = useMemo(() => {
    return filteredExercises.slice(0, page * LIMIT)
  }, [filteredExercises, page])

  const hasMore = paginatedExercises.length < filteredExercises.length

  useEffect(() => {
    setPage(1)
  }, [searchQuery, selectedGrupo, sortBy])

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
    setSearchInput('')
    setSearchQuery('')
    setSelectedGrupo('todos')
    setSortBy('az')
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
            <Search size={20} className="search-icon" />
            <input
              className="search-input"
              placeholder="Buscar exercício..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button className="search-clear" onClick={() => setSearchInput('')}>
                <X size={14} />
              </button>
            )}
          </div>

          <div className="exercises-filters">
            <select
              className="filter-select"
              value={selectedGrupo}
              onChange={(e) => setSelectedGrupo(e.target.value)}
            >
              {gruposOptions.map(g => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>

            <select
              className="filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'az' | 'za')}
            >
              <option value="az">A → Z</option>
              <option value="za">Z → A</option>
            </select>

            <button onClick={clearFilters}>
              <X size={14} /> Limpar
            </button>
          </div>
        </div>

        <ExerciseList
          exercises={paginatedExercises}
          loading={false}
          error={null}
          searchTerm={searchQuery}
          onExerciseClick={(exercise) => navigate(`/exercicio/${encodeURIComponent(exercise.id)}`)}
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
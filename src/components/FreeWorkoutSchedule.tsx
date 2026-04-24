import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Dumbbell, Calendar, ChevronRight, Play, Lock } from 'lucide-react'
import type { Workout } from '../data/workoutsData'

interface ScheduleEntry {
  day_of_week: number
  workout_id: string
  workout?: Workout
}

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const DAY_NAMES_SHORT = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB']

// Free schedule: Mon(1), Wed(3), Fri(5)
const FREE_DAYS = [1, 3, 5]

export default function FreeWorkoutSchedule() {
  const navigate = useNavigate()
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([])
  const [loading, setLoading] = useState(true)
  const today = new Date().getDay() // 0=Sunday

  useEffect(() => {
    loadSchedule()
  }, [])

  const loadSchedule = async () => {
    try {
      // First fetch the schedule mapping
      const { data: scheduleData } = await supabase
        .from('free_workout_schedule')
        .select('day_of_week, workout_id')
        .in('day_of_week', FREE_DAYS)
        .order('day_of_week')

      if (!scheduleData || scheduleData.length === 0) {
        // Fallback: load all free workouts and assign to days
        const { data: freeWorkouts } = await supabase
          .from('workouts')
          .select('id, name, description, level, duration_minutes, is_custom_duration')
          .eq('workout_type', 'free')
          .order('created_at')
          .limit(3)

        if (freeWorkouts && freeWorkouts.length > 0) {
          const fallbackSchedule = FREE_DAYS.map((day, i) => ({
            day_of_week: day,
            workout_id: freeWorkouts[i % freeWorkouts.length]?.id || '',
            workout: freeWorkouts[i % freeWorkouts.length] ? {
              id: freeWorkouts[i % freeWorkouts.length].id,
              name: freeWorkouts[i % freeWorkouts.length].name,
              description: freeWorkouts[i % freeWorkouts.length].description || '',
              duration_minutes: freeWorkouts[i % freeWorkouts.length].duration_minutes || 45,
              exercises_count: 0,
              level: (freeWorkouts[i % freeWorkouts.length].level || 'iniciante') as any,
              icon: '💪',
            } : undefined,
          }))
          setSchedule(fallbackSchedule)
        } else {
          // No free workouts exist yet
          setSchedule(FREE_DAYS.map(day => ({ day_of_week: day, workout_id: '' })))
        }
        setLoading(false)
        return
      }

      // Fetch workout details
      const workoutIds = scheduleData.map(s => s.workout_id).filter(Boolean)
      const { data: workoutsData } = await supabase
        .from('workouts')
        .select('id, name, description, level, duration_minutes')
        .in('id', workoutIds)

      // Get exercise counts
      const enriched = await Promise.all(
        scheduleData.map(async (entry) => {
          const w = workoutsData?.find(w => w.id === entry.workout_id)
          let exerciseCount = 0
          if (w) {
            const { count } = await supabase
              .from('workout_plans')
              .select('id', { count: 'exact', head: true })
              .eq('workout_id', w.id)
            exerciseCount = count || 0
          }
          return {
            ...entry,
            workout: w ? {
              id: w.id,
              name: w.name,
              description: w.description || '',
              duration_minutes: w.duration_minutes || 45,
              exercises_count: exerciseCount,
              level: (w.level || 'iniciante') as any,
              icon: '💪',
            } : undefined,
          }
        })
      )

      setSchedule(enriched)
    } catch (err) {
      console.error('[FreeWorkoutSchedule] Error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {FREE_DAYS.map(d => (
          <div key={d} className="animate-pulse bg-white/5 border border-white/5 rounded-2xl h-24" />
        ))}
      </div>
    )
  }

  const hasAnyWorkout = schedule.some(s => s.workout)

  if (!hasAnyWorkout) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400 border border-white/10 bg-white/5 rounded-2xl">
        <Calendar size={48} className="mb-4 opacity-50" />
        <p className="text-center text-lg font-medium text-slate-300">Treinos em preparação</p>
        <p className="text-sm mt-2 text-center">O personal ainda está configurando os treinos padrão da semana.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Week header */}
      <div className="flex items-center gap-3 mb-4">
        <Calendar size={18} className="text-purple-400" />
        <h3 className="text-lg font-bold text-white">Sua Semana de Treinos</h3>
      </div>

      {/* Day cards */}
      {schedule.map((entry) => {
        const isToday = entry.day_of_week === today
        const hasWorkout = !!entry.workout
        const isPast = entry.day_of_week < today && !isToday
        const isFuture = entry.day_of_week > today

        return (
          <div
            key={entry.day_of_week}
            onClick={() => hasWorkout && navigate(`/treinos/${entry.workout!.id}`)}
            className={`group relative flex items-center gap-4 p-4 md:p-5 rounded-2xl border transition-all cursor-pointer ${
              isToday
                ? 'bg-gradient-to-r from-purple-500/15 to-indigo-500/15 border-purple-500/30 shadow-lg shadow-purple-500/10'
                : isPast
                ? 'bg-white/[0.02] border-white/5 opacity-60'
                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
            } ${!hasWorkout ? 'opacity-40 pointer-events-none' : ''}`}
          >
            {/* Day indicator */}
            <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 ${
              isToday
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                : 'bg-white/5 text-slate-400 border border-white/10'
            }`}>
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {DAY_NAMES_SHORT[entry.day_of_week]}
              </span>
              {isToday && <span className="text-[8px] font-semibold mt-0.5 uppercase opacity-80">Hoje</span>}
            </div>

            {/* Workout info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-400 font-medium">{DAY_NAMES[entry.day_of_week]}</p>
              <h4 className={`font-bold truncate ${isToday ? 'text-white' : 'text-slate-200'}`}>
                {entry.workout?.name || 'Sem treino'}
              </h4>
              {entry.workout?.description && (
                <p className="text-xs text-slate-400 truncate mt-0.5">{entry.workout.description}</p>
              )}
            </div>

            {/* Right action */}
            {hasWorkout && (
              <div className={`shrink-0 ${isToday ? '' : 'opacity-0 group-hover:opacity-100 transition-opacity'}`}>
                {isToday ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/treinos/executar/${entry.workout!.id}`) }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 hover:scale-105 transition-transform"
                  >
                    <Play size={12} fill="currentColor" /> Iniciar
                  </button>
                ) : (
                  <ChevronRight size={18} className="text-slate-400" />
                )}
              </div>
            )}

            {/* Today glow */}
            {isToday && (
              <div className="absolute inset-0 rounded-2xl pointer-events-none">
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-purple-500 shadow-[0_0_12px_rgba(139,92,246,0.6)]" />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

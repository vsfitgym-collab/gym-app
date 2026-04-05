import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Calendar, Clock, Dumbbell } from 'lucide-react'
import './WorkoutCalendar.css'

interface WorkoutDay {
  date: string
  name: string
  completed: boolean
  time: string
}

interface UpcomingWorkout {
  date: string
  dayName: string
  name: string
  time: string
  muscleGroup: string
}

const mockWorkoutHistory: WorkoutDay[] = [
  { date: '2026-04-01', name: 'Treino A - Peito', completed: true, time: '08:00' },
  { date: '2026-04-02', name: 'Treino B - Costas', completed: true, time: '18:30' },
  { date: '2026-04-04', name: 'Treino C - Pernas', completed: false, time: '07:00' },
]

const mockUpcoming: UpcomingWorkout[] = [
  { date: '2026-04-06', dayName: 'Seg', name: 'Treino A - Peito', time: '08:00', muscleGroup: 'Peito' },
  { date: '2026-04-07', dayName: 'Ter', name: 'Treino B - Costas', time: '18:00', muscleGroup: 'Costas' },
  { date: '2026-04-08', dayName: 'Qua', name: 'Treino C - Pernas', time: '07:30', muscleGroup: 'Perna' },
]

export default function WorkoutCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const today = new Date()

  const { daysInMonth, firstDayOfMonth, monthName, year } = useMemo(() => {
    const y = currentDate.getFullYear()
    const m = currentDate.getMonth()
    return {
      daysInMonth: new Date(y, m + 1, 0).getDate(),
      firstDayOfMonth: new Date(y, m, 1).getDay(),
      monthName: currentDate.toLocaleDateString('pt-BR', { month: 'long' }),
      year: y,
    }
  }, [currentDate])

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))

  const getDayStatus = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const workout = mockWorkoutHistory.find(w => w.date === dateStr)
    const isToday = today.getDate() === day && today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear()
    return { workout, isToday, dateStr }
  }

  const renderCalendarDays = () => {
    const days = []
    const blankDays = Array.from({ length: firstDayOfMonth }, (_, i) => i)
    
    blankDays.forEach(i => days.push(<div key={`blank-${i}`} className="cal-day blank" />))

    for (let day = 1; day <= daysInMonth; day++) {
      const { workout, isToday } = getDayStatus(day)
      days.push(
        <div key={day} className={`cal-day ${workout ? 'has-workout' : ''} ${workout?.completed ? 'completed' : ''} ${isToday ? 'today' : ''}`}>
          <span className="day-number">{day}</span>
          {workout && (
            <div className="day-dot">
              {workout.completed ? '✓' : '●'}
            </div>
          )}
        </div>
      )
    }
    return days
  }

  return (
    <div className="workout-calendar-widget">
      {/* Calendar Header */}
      <div className="cal-header">
        <div className="cal-title">
          <Calendar size={18} />
          <span>{monthName.charAt(0).toUpperCase() + monthName.slice(1)} {year}</span>
        </div>
        <div className="cal-nav">
          <button onClick={prevMonth}><ChevronLeft size={16} /></button>
          <button onClick={nextMonth}><ChevronRight size={16} /></button>
        </div>
      </div>

      {/* Weekdays */}
      <div className="cal-weekdays">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
          <span key={d} className="weekday">{d}</span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="cal-grid">
        {renderCalendarDays()}
      </div>

      {/* Upcoming Workouts */}
      <div className="cal-upcoming">
        <h4>Próximos Treinos</h4>
        <div className="upcoming-list">
          {mockUpcoming.map((w, i) => (
            <div key={i} className="upcoming-item">
              <div className="upcoming-date">
                <span className="upcoming-day-name">{w.dayName}</span>
                <span className="upcoming-day-num">{new Date(w.date).getDate()}</span>
              </div>
              <div className="upcoming-info">
                <span className="upcoming-name">{w.name}</span>
                <div className="upcoming-meta">
                  <Clock size={12} />
                  <span>{w.time}</span>
                  <Dumbbell size={12} />
                  <span>{w.muscleGroup}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

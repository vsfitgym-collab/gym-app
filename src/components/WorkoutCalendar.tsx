import { useState, useMemo, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getWeeklyPresence } from '../lib/presenceManager'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import './WorkoutCalendar.css'

export default function WorkoutCalendar() {
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [presenceData, setPresenceData] = useState<{ date: string; present: boolean }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadPresenceData()
    }
  }, [user])

  const loadPresenceData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const weekly = await getWeeklyPresence(user.id)
      setPresenceData(weekly)
    } catch (error) {
      console.error('Error loading presence data:', error)
    } finally {
      setLoading(false)
    }
  }

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
    const presence = presenceData.find(p => p.date === dateStr)
    const isToday = today.getDate() === day && today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear()
    return { presence, isToday, dateStr }
  }

  const renderCalendarDays = () => {
    const days = []
    const blankDays = Array.from({ length: firstDayOfMonth }, (_, i) => i)
    
    blankDays.forEach(i => days.push(<div key={`blank-${i}`} className="cal-day blank" />))

    for (let day = 1; day <= daysInMonth; day++) {
      const { presence, isToday } = getDayStatus(day)
      days.push(
        <div key={day} className={`cal-day ${presence?.present ? 'has-workout' : ''} ${presence?.present ? 'completed' : ''} ${isToday ? 'today' : ''}`}>
          <span className="day-number">{day}</span>
          {presence?.present && (
            <div className="day-dot">
              ✓
            </div>
          )}
        </div>
      )
    }
    return days
  }

  const last7Days = presenceData.slice(-7)

  if (loading) {
    return (
      <div className="workout-calendar-widget">
        <div className="calendar-loading">
          <div className="spinner" />
          <span>Carregando...</span>
        </div>
      </div>
    )
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

      {/* Last 7 Days Summary */}
      <div className="cal-upcoming">
        <h4>Últimos 7 Dias</h4>
        <div className="upcoming-list">
          {last7Days.map((day, i) => {
            const dayName = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][new Date(day.date).getDay()]
            return (
              <div key={i} className={`upcoming-item ${day.present ? 'completed' : ''}`}>
                <div className="upcoming-date">
                  <span className="upcoming-day-name">{dayName}</span>
                  <span className="upcoming-day-num">{new Date(day.date).getDate()}</span>
                </div>
                <div className="upcoming-info">
                  <span className="upcoming-name">{day.present ? 'Treino realizado' : 'Sem treino'}</span>
                  <div className="upcoming-meta">
                    {day.present ? <CheckCircleIcon size={12} /> : <XCircleIcon size={12} />}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function CheckCircleIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

function XCircleIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  )
}

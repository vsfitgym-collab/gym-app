import { useState, useMemo, useEffect, memo } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { Clock, BarChart3, Activity, Target } from 'lucide-react'
import './GraficoEvolucao.css'

interface DataPoint {
  dia: string
  minutos: number
  series: number
  exercicios: number
  calorias: number
}

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b']

const GraficoEvolucao = memo(function GraficoEvolucao() {
  const { user } = useAuth()
  const [tipoGrafico, setTipoGrafico] = useState<'area' | 'bar' | 'line'>('area')
  const [periodo, setPeriodo] = useState<'semana' | 'mes'>('semana')
  const [semana, setSemana] = useState<'atual' | 'passada'>('atual')
  const [metrica, setMetrica] = useState<'minutos' | 'series' | 'exercicios'>('minutos')
  const [loading, setLoading] = useState(true)
  const [workoutData, setWorkoutData] = useState<DataPoint[]>([])

  useEffect(() => {
    if (user) {
      loadWorkoutData()
    }
  }, [user, semana, periodo])

  const loadWorkoutData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const now = new Date()
      const daysToFetch = periodo === 'mes' ? 28 : 7
      const daysBack = semana === 'passada' ? (periodo === 'mes' ? 35 : 14) : 0
      
      const startDate = new Date(now)
      startDate.setDate(startDate.getDate() - daysToFetch - daysBack)
      const endDate = new Date(now)
      endDate.setDate(endDate.getDate() - daysBack)
      
      const { data: presences } = await supabase
        .from('workout_presence')
        .select('date')
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date')

      const dataByDay: Record<string, { count: number }> = {}
      
      const days = periodo === 'mes' ? 28 : 7
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(endDate)
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        dataByDay[dateStr] = { count: 0 }
      }

      if (presences) {
        presences.forEach(p => {
          if (dataByDay[p.date]) {
            dataByDay[p.date].count += 1
          }
        })
      }

      const formattedData: DataPoint[] = Object.entries(dataByDay).map(([dateStr, data]) => {
        const date = new Date(dateStr)
        const dayName = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][date.getDay()]
        const multiplier = data.count > 0 ? 1 : 0
        
        return {
          dia: dayName,
          minutos: 45 * multiplier,
          series: 15 * multiplier,
          exercicios: 4 * multiplier,
          calorias: 300 * multiplier,
        }
      })

      setWorkoutData(formattedData)
    } catch (error) {
      console.error('Error loading workout data:', error)
    } finally {
      setLoading(false)
    }
  }

  const dadosDiarios = useMemo(() => {
    if (workoutData.length > 0) return workoutData
    
    const emptyData: DataPoint[] = []
    const days = periodo === 'mes' ? 28 : 7
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dayName = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][date.getDay()]
      emptyData.push({
        dia: dayName,
        minutos: 0,
        series: 0,
        exercicios: 0,
        calorias: 0,
      })
    }
    return emptyData
  }, [workoutData, periodo])

  const stats = useMemo(() => {
    const totalMinutos = dadosDiarios.reduce((acc, d) => acc + d.minutos, 0)
    const totalSeries = dadosDiarios.reduce((acc, d) => acc + d.series, 0)
    const totalExercicios = dadosDiarios.reduce((acc, d) => acc + d.exercicios, 0)
    const totalCalorias = dadosDiarios.reduce((acc, d) => acc + d.calorias, 0)
    const diasTreinados = dadosDiarios.filter(d => d.minutos > 0).length

    return { totalMinutos, totalSeries, totalExercicios, totalCalorias, diasTreinados, variacao: 0 }
  }, [dadosDiarios])

  const pieData = useMemo(() => [
    { name: 'Treinado', value: stats.diasTreinados },
    { name: 'Descanso', value: (periodo === 'mes' ? 28 : 7) - stats.diasTreinados },
  ], [stats.diasTreinados, periodo])

  if (loading) {
    return (
      <div className="grafico-loading">
        <div className="spinner" />
        <span>Carregando dados...</span>
      </div>
    )
  }

  return (
    <div className="grafico-evolucao">
      <div className="grafico-header">
        <div className="grafico-title">
          <h3>Evolução de Treinos</h3>
        </div>

        <div className="grafico-filtros">
          <div className="filtro-grupo">
            <button 
              className={`filtro-btn ${periodo === 'semana' ? 'active' : ''}`}
              onClick={() => setPeriodo('semana')}
            >
              <BarChart3 size={14} />
              <span>Semana</span>
            </button>
            <button 
              className={`filtro-btn ${periodo === 'mes' ? 'active' : ''}`}
              onClick={() => setPeriodo('mes')}
            >
              <span>Mês</span>
            </button>
          </div>

          {periodo === 'semana' && (
            <div className="filtro-grupo">
              <button 
                className={`filtro-btn ${semana === 'atual' ? 'active' : ''}`}
                onClick={() => setSemana('atual')}
              >
                Atual
              </button>
              <button 
                className={`filtro-btn ${semana === 'passada' ? 'active' : ''}`}
                onClick={() => setSemana('passada')}
              >
                Passada
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grafico-stats">
        <div className="stat-card">
          <div className="stat-icon minutos">
            <Clock size={18} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalMinutos}</span>
            <span className="stat-label">minutos</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon series">
            <Activity size={18} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalSeries}</span>
            <span className="stat-label">séries</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon exercicios">
            <Target size={18} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalExercicios}</span>
            <span className="stat-label">exercícios</span>
          </div>
        </div>
      </div>

      <div className="grafico-metricas">
        {periodo === 'semana' && (
          <div className="metrica-tabs">
            <button 
              className={`metrica-btn ${metrica === 'minutos' ? 'active' : ''}`}
              onClick={() => setMetrica('minutos')}
            >
              Tempo
            </button>
            <button 
              className={`metrica-btn ${metrica === 'series' ? 'active' : ''}`}
              onClick={() => setMetrica('series')}
            >
              Séries
            </button>
            <button 
              className={`metrica-btn ${metrica === 'exercicios' ? 'active' : ''}`}
              onClick={() => setMetrica('exercicios')}
            >
              Exercícios
            </button>
          </div>
        )}
      </div>

      <div className="grafico-content">
        <div className="grafico-main">
          <div className="grafico-tipo-btns">
            <button 
              className={`tipo-btn ${tipoGrafico === 'area' ? 'active' : ''}`}
              onClick={() => setTipoGrafico('area')}
              title="Gráfico de Área"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M1 13L5 5L8 9L12 3L15 7V13H1Z" fill="currentColor" opacity="0.3"/>
                <path d="M1 13L5 5L8 9L12 3L15 7" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            </button>
            <button 
              className={`tipo-btn ${tipoGrafico === 'bar' ? 'active' : ''}`}
              onClick={() => setTipoGrafico('bar')}
              title="Gráfico de Barras"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="8" width="3" height="6" rx="0.5" fill="currentColor"/>
                <rect x="6.5" y="5" width="3" height="9" rx="0.5" fill="currentColor"/>
                <rect x="11" y="2" width="3" height="12" rx="0.5" fill="currentColor"/>
              </svg>
            </button>
            <button 
              className={`tipo-btn ${tipoGrafico === 'line' ? 'active' : ''}`}
              onClick={() => setTipoGrafico('line')}
              title="Gráfico de Linha"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M1 12L5 6L8 9L12 3L15 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <div className="grafico-container">
            <ResponsiveContainer width="100%" height={220}>
              {tipoGrafico === 'area' ? (
                <AreaChart data={dadosDiarios} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradientPrimary" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="dia" 
                    tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }} 
                    axisLine={false}
                    tickLine={false}
                    dy={5}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }} 
                    axisLine={false}
                    tickLine={false}
                    width={30}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'rgba(21, 21, 31, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey={metrica} 
                    stroke="#8b5cf6" 
                    fill="url(#gradientPrimary)" 
                    strokeWidth={2.5}
                  />
                </AreaChart>
              ) : tipoGrafico === 'bar' ? (
                <BarChart data={dadosDiarios} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6"/>
                      <stop offset="100%" stopColor="#06b6d4"/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="dia" 
                    tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }} 
                    axisLine={false}
                    tickLine={false}
                    dy={5}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }} 
                    axisLine={false}
                    tickLine={false}
                    width={30}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'rgba(21, 21, 31, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                    }}
                  />
                  <Bar 
                    dataKey={metrica} 
                    fill="url(#barGradient)" 
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              ) : (
                <LineChart data={dadosDiarios} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="dia" 
                    tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }} 
                    axisLine={false}
                    tickLine={false}
                    dy={5}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.5)' }} 
                    axisLine={false}
                    tickLine={false}
                    width={30}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'rgba(21, 21, 31, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey={metrica} 
                    stroke="#8b5cf6" 
                    strokeWidth={2.5}
                    dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grafico-side">
          <div className="grafico-pie">
            <h4>Consistência</h4>
            <ResponsiveContainer width="100%" height={100}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={45}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(21, 21, 31, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pie-center">
              <span className="pie-value">{stats.diasTreinados}</span>
              <span className="pie-label">/{periodo === 'mes' ? '28' : '7'} dias</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

export default GraficoEvolucao

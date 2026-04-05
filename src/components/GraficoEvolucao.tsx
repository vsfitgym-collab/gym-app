import { useState, useMemo, memo } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { Calendar, TrendingUp, Clock, BarChart3, Activity, Target } from 'lucide-react'
import './GraficoEvolucao.css'

interface DataPoint {
  dia: string
  minutos: number
  series: number
  exercicios: number
  calorias: number
}

interface MonthlyData {
  semana: string
  minutos: number
  series: number
  exercicios: number
}

const dadosSemanaAtual: DataPoint[] = [
  { dia: 'Seg', minutos: 45, series: 16, exercicios: 4, calorias: 320 },
  { dia: 'Ter', minutos: 0, series: 0, exercicios: 0, calorias: 0 },
  { dia: 'Qua', minutos: 50, series: 18, exercicios: 5, calorias: 380 },
  { dia: 'Qui', minutos: 40, series: 14, exercicios: 4, calorias: 280 },
  { dia: 'Sex', minutos: 0, series: 0, exercicios: 0, calorias: 0 },
  { dia: 'Sáb', minutos: 55, series: 20, exercicios: 6, calorias: 420 },
  { dia: 'Dom', minutos: 0, series: 0, exercicios: 0, calorias: 0 },
]

const dadosSemanaPassada: DataPoint[] = [
  { dia: 'Seg', minutos: 40, series: 14, exercicios: 3, calorias: 280 },
  { dia: 'Ter', minutos: 35, series: 12, exercicios: 3, calorias: 240 },
  { dia: 'Qua', minutos: 45, series: 16, exercicios: 4, calorias: 320 },
  { dia: 'Qui', minutos: 30, series: 10, exercicios: 3, calorias: 200 },
  { dia: 'Sex', minutos: 50, series: 18, exercicios: 5, calorias: 360 },
  { dia: 'Sáb', minutos: 0, series: 0, exercicios: 0, calorias: 0 },
  { dia: 'Dom', minutos: 45, series: 16, exercicios: 4, calorias: 320 },
]

const dadosMensal: MonthlyData[] = [
  { semana: 'Sem 1', minutos: 180, series: 64, exercicios: 16 },
  { semana: 'Sem 2', minutos: 220, series: 78, exercicios: 20 },
  { semana: 'Sem 3', minutos: 195, series: 70, exercicios: 18 },
  { semana: 'Sem 4', minutos: 240, series: 86, exercicios: 22 },
]

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b']

const GraficoEvolucao = memo(function GraficoEvolucao() {
  const [tipoGrafico, setTipoGrafico] = useState<'area' | 'bar' | 'line'>('area')
  const [periodo, setPeriodo] = useState<'semana' | 'mes'>('semana')
  const [semana, setSemana] = useState<'atual' | 'passada'>('atual')
  const [metrica, setMetrica] = useState<'minutos' | 'series' | 'exercicios'>('minutos')

  const dadosDiarios = useMemo(() => {
    return semana === 'atual' ? dadosSemanaAtual : dadosSemanaPassada
  }, [semana])

  const stats = useMemo(() => {
    const totalMinutos = dadosDiarios.reduce((acc, d) => acc + d.minutos, 0)
    const totalSeries = dadosDiarios.reduce((acc, d) => acc + d.series, 0)
    const totalExercicios = dadosDiarios.reduce((acc, d) => acc + d.exercicios, 0)
    const totalCalorias = dadosDiarios.reduce((acc, d) => acc + d.calorias, 0)
    const diasTreinados = dadosDiarios.filter(d => d.minutos > 0).length

    const dadosAnteriores = semana === 'atual' ? dadosSemanaPassada : dadosSemanaAtual
    const minAnteriores = dadosAnteriores.reduce((acc, d) => acc + d.minutos, 0)
    const variacao = minAnteriores > 0 ? Math.round(((totalMinutos - minAnteriores) / minAnteriores) * 100) : 0

    return { totalMinutos, totalSeries, totalExercicios, totalCalorias, diasTreinados, variacao }
  }, [dadosDiarios, semana])

  const pieData = useMemo(() => [
    { name: 'Treinado', value: stats.diasTreinados },
    { name: 'Descanso', value: 7 - stats.diasTreinados },
  ], [stats.diasTreinados])

  return (
    <div className="grafico-evolucao">
      <div className="grafico-header">
        <div className="grafico-title">
          <h3>Evolução de Treinos</h3>
          <div className="grafico-variacao">
            <TrendingUp size={14} className={stats.variacao >= 0 ? 'positive' : 'negative'} />
            <span className={stats.variacao >= 0 ? 'positive' : 'negative'}>
              {stats.variacao >= 0 ? '+' : ''}{stats.variacao}%
            </span>
          </div>
        </div>

        <div className="grafico-filtros">
          <div className="filtro-grupo">
            <button 
              className={`filtro-btn ${periodo === 'semana' ? 'active' : ''}`}
              onClick={() => setPeriodo('semana')}
            >
              <Calendar size={14} />
              <span>Semana</span>
            </button>
            <button 
              className={`filtro-btn ${periodo === 'mes' ? 'active' : ''}`}
              onClick={() => setPeriodo('mes')}
            >
              <BarChart3 size={14} />
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
        <div className="stat-card">
          <div className="stat-icon calorias">
            <TrendingUp size={18} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalCalorias}</span>
            <span className="stat-label">kcal</span>
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
              ⏱ Tempo
            </button>
            <button 
              className={`metrica-btn ${metrica === 'series' ? 'active' : ''}`}
              onClick={() => setMetrica('series')}
            >
              🔄 Séries
            </button>
            <button 
              className={`metrica-btn ${metrica === 'exercicios' ? 'active' : ''}`}
              onClick={() => setMetrica('exercicios')}
            >
              💪 Exercícios
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
            {periodo === 'semana' ? (
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
                        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                        backdropFilter: 'blur(10px)',
                      }}
                      labelStyle={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                      itemStyle={{ color: '#fff', fontSize: 12 }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey={metrica} 
                      stroke="#8b5cf6" 
                      fill="url(#gradientPrimary)" 
                      strokeWidth={2.5}
                      animationDuration={1000}
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
                        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                      }}
                      labelStyle={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                      itemStyle={{ color: '#fff', fontSize: 12 }}
                      cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
                    />
                    <Bar 
                      dataKey={metrica} 
                      fill="url(#barGradient)" 
                      radius={[6, 6, 0, 0]}
                      animationDuration={800}
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
                        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                      }}
                      labelStyle={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                      itemStyle={{ color: '#fff', fontSize: 12 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey={metrica} 
                      stroke="#8b5cf6" 
                      strokeWidth={2.5}
                      dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4, stroke: '#15151f' }}
                      activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
                      animationDuration={1000}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dadosMensal} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGradientMonth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981"/>
                      <stop offset="100%" stopColor="#059669"/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="semana" 
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
                      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    }}
                    labelStyle={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                    itemStyle={{ color: '#fff', fontSize: 12 }}
                    cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }}
                  />
                  <Bar 
                    dataKey="minutos" 
                    fill="url(#barGradientMonth)" 
                    name="Minutos"
                    radius={[6, 6, 0, 0]}
                    animationDuration={800}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
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
                  animationDuration={800}
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
              <span className="pie-label">/7 dias</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

export default GraficoEvolucao
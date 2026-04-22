import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'

interface EvolucaoData {
  mes: string
  peso: number
  gordura?: number
  massa_muscular?: number
}

interface EvolucaoChartProps {
  data: EvolucaoData[]
}

export function EvolucaoChart({ data }: EvolucaoChartProps) {
  const hasData = data && data.length > 0 && data.some(d => d.peso > 0)

  if (!hasData) {
    return (
      <div style={{
        padding: '1.5rem',
        background: 'rgba(18, 18, 30, 0.95)',
        borderRadius: '1rem',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        minHeight: '280px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
          <p style={{ margin: 0, fontSize: '1rem' }}>Sem dados de evolução</p>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem' }}>
            Registre o progresso do aluno para ver o gráfico
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      padding: '1.5rem',
      background: 'rgba(18, 18, 30, 0.95)',
      borderRadius: '1rem',
      border: '1px solid rgba(255, 255, 255, 0.08)'
    }}>
      <h3 style={{
        margin: '0 0 1rem',
        fontSize: '1rem',
        fontWeight: 600,
        color: '#fff'
      }}>
        Evolução
      </h3>
      
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey="mes" 
            stroke="rgba(255,255,255,0.5)"
            fontSize={12}
            tickLine={false}
          />
          <YAxis 
            stroke="rgba(255,255,255,0.5)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              background: '#1a1a2e',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#fff'
            }}
            formatter={(value: number) => [`${value} kg`, '']}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '10px' }}
            formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>{value}</span>}
          />
          <Line 
            type="monotone" 
            dataKey="peso" 
            name="Peso (kg)"
            stroke="#8b5cf6" 
            strokeWidth={3}
            dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
          {data.some(d => d.gordura && d.gordura > 0) && (
            <Line 
              type="monotone" 
              dataKey="gordura" 
              name="Gordura (%)"
              stroke="#06b6d4" 
              strokeWidth={2}
              dot={{ fill: '#06b6d4', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
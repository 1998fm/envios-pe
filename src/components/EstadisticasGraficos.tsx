import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line,
  PieChart, Pie, Cell,
} from 'recharts'

const COLORS = ['#0284c7', '#6366f1', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
const ESTADO_COLORS: Record<string, string> = {
  PENDIENTE: '#f59e0b',
  EMPACADO: '#6366f1',
  ENVIADO: '#0284c7',
  ENTREGADO: '#14b8a6',
}

type Props = {
  tendenciaDiaria: { fecha: string; count: number }[]
  distribucionMetodo: { metodo: string; count: number }[]
  distribucionEstado: { estado: string; count: number }[]
}

export default function EstadisticasGraficos({ tendenciaDiaria, distribucionMetodo, distribucionEstado }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-3 lg:col-span-2">
        <div className="h-28">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={tendenciaDiaria}>
              <XAxis
                dataKey="fecha"
                tick={{ fontSize: 9, fill: '#94a3b8' }}
                tickFormatter={(v: string) => {
                  const d = new Date(v + 'T00:00:00')
                  return d.toLocaleDateString('es', { day: 'numeric', month: 'short' })
                }}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 9, fill: '#94a3b8' }} width={20} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 11 }}
                labelFormatter={(v: any) => typeof v === 'string' ? new Date(v + 'T00:00:00').toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' }) : ''}
              />
              <Line type="monotone" dataKey="count" stroke="#0284c7" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-3">
        <div className="h-28">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distribucionMetodo} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 9, fill: '#94a3b8' }} />
              <YAxis dataKey="metodo" type="category" tick={{ fontSize: 9, fill: '#94a3b8' }} width={60} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 11 }} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {distribucionMetodo.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-3">
        <div className="h-28 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={distribucionEstado}
                dataKey="count"
                nameKey="estado"
                cx="50%"
                cy="50%"
                outerRadius={38}
                innerRadius={20}
                label={({ estado, percent }: any) =>
                  `${estado} ${(percent * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {distribucionEstado.map((entry) => (
                  <Cell key={entry.estado} fill={ESTADO_COLORS[entry.estado] || '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

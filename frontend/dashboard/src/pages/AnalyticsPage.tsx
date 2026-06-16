import { useQuery } from '@tanstack/react-query'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { analyticsService } from '@/services/api'

const monthlyData = [
  { month: 'Jan', shipments: 420, sla: 95 },
  { month: 'Feb', shipments: 380, sla: 96 },
  { month: 'Mar', shipments: 510, sla: 94 },
  { month: 'Apr', shipments: 470, sla: 97 },
  { month: 'May', shipments: 540, sla: 93 },
  { month: 'Jun', shipments: 620, sla: 95 },
]

const statusDist = [
  { name: 'Delivered', value: 1240, color: '#16a34a' },
  { name: 'In Transit', value: 380, color: '#d97706' },
  { name: 'Pending', value: 210, color: '#6b7280' },
  { name: 'Failed', value: 45, color: '#dc2626' },
]

export default function AnalyticsPage() {
  const { data: stats } = useQuery({
    queryKey: ['analytics-stats'],
    queryFn: () => analyticsService.stats().then((r) => r.data),
  })

  const handleExport = async () => {
    try {
      const res = await analyticsService.exportExcel('2024-01-01', '2024-12-31')
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'waybill-report.xlsx'
      a.click()
    } catch {
      console.error('Export failed')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Analytics</h2>
        <button
          onClick={handleExport}
          style={{
            padding: '0.5rem 1rem',
            background: '#16a34a',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Export Report
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: 10 }}>
          <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>SLA Compliance</h3>
          <p style={{ fontSize: '2rem', fontWeight: 700, color: '#16a34a' }}>
            {stats?.slaCompliance ?? '—'}%
          </p>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Last 30 days</p>
        </div>
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: 10 }}>
          <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Avg Transit Time</h3>
          <p style={{ fontSize: '2rem', fontWeight: 700, color: '#2563eb' }}>
            {stats?.avgTransitTime ?? '—'}h
          </p>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Last 30 days</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: 10 }}>
          <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Monthly Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="shipments" stroke="#2563eb" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: 10 }}>
          <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={statusDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {statusDist.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { analyticsService } from '@/services/api'

const statsCards = [
  { label: 'Active Waybills', key: 'totalActive', color: '#2563eb' },
  { label: 'Delivered Today', key: 'deliveredToday', color: '#16a34a' },
  { label: 'In Transit', key: 'inTransit', color: '#d97706' },
  { label: 'Pending Pickup', key: 'pendingPickup', color: '#dc2626' },
]

export default function DashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => analyticsService.stats().then((r) => r.data),
    refetchInterval: 30000,
  })

  const slaData = [
    { name: 'Mon', sla: 95 },
    { name: 'Tue', sla: 97 },
    { name: 'Wed', sla: 93 },
    { name: 'Thu', sla: 98 },
    { name: 'Fri', sla: 96 },
    { name: 'Sat', sla: 91 },
    { name: 'Sun', sla: 88 },
  ]

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>
        Dashboard
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        {statsCards.map((card) => (
          <div
            key={card.key}
            style={{
              background: '#fff',
              padding: '1.25rem',
              borderRadius: 10,
              borderLeft: `4px solid ${card.color}`,
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            <p style={{ fontSize: '0.875rem', color: '#64748b' }}>{card.label}</p>
            <p style={{ fontSize: '1.75rem', fontWeight: 700 }}>
              {stats?.[card.key as keyof typeof stats] ?? '—'}
            </p>
          </div>
        ))}
      </div>

      <div
        style={{
          background: '#fff',
          padding: '1.5rem',
          borderRadius: 10,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        <h3 style={{ marginBottom: '1rem', fontWeight: 600 }}>SLA Compliance (%)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={slaData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[80, 100]} />
            <Tooltip />
            <Bar dataKey="sla" fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

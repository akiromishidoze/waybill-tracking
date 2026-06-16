import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { analyticsService } from '@/services/api'
import s from '@/styles/components.module.css'

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

  const slaData: Array<{ name: string; sla: number }> = []

  return (
    <div>
      <h2 className={s.pageTitle}>Dashboard</h2>

      <div className={s.gridAuto} style={{ marginBottom: '2rem' }}>
        {statsCards.map((card) => (
          <div key={card.key} className={s.cardStat} style={{ borderLeft: `4px solid ${card.color}` }}>
            <p style={{ fontSize: '0.875rem', color: '#64748b' }}>{card.label}</p>
            <p style={{ fontSize: '1.75rem', fontWeight: 700 }}>
              {stats?.[card.key as keyof typeof stats] ?? '—'}
            </p>
          </div>
        ))}
      </div>

      <div className={s.cardPadded}>
        <h3 style={{ marginBottom: '1rem', fontWeight: 600 }}>SLA Compliance (%)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={slaData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[80, 100]} />
            <Tooltip cursor={false} />
            <Bar dataKey="sla" fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

import { useQuery } from '@tanstack/react-query'
import { analyticsService, escalationService } from '@/services/api'
import { AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const statsCards = [
  { label: 'Active Waybills', key: 'totalActive', color: '#2563eb' },
  { label: 'Delivered Today', key: 'deliveredToday', color: '#16a34a' },
  { label: 'In Transit', key: 'inTransit', color: '#d97706' },
  { label: 'Pending Pickup', key: 'pendingPickup', color: '#dc2626' },
]

export default function DashboardPage() {
  const navigate = useNavigate()
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => analyticsService.stats().then((r) => r.data),
    refetchInterval: 30000,
  })

  const { data: escalations } = useQuery({
    queryKey: ['escalations'],
    queryFn: () => escalationService.list().then(r => r.data),
    refetchInterval: 30000,
  })

  const openEscalations = escalations?.filter((e: any) => e?.status === 'OPEN').length || 0

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

      {openEscalations > 0 && (
        <div onClick={() => navigate('/escalations')} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.5rem', padding: '1rem 1.25rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, cursor: 'pointer' }}>
          <AlertTriangle size={20} color="#dc2626" />
          <div>
            <p style={{ fontWeight: 600, color: '#dc2626', fontSize: '0.9375rem' }}>{openEscalations} Open Escalation{openEscalations > 1 ? 's' : ''}</p>
            <p style={{ fontSize: '0.8125rem', color: '#b91c1c' }}>Click to view and resolve.</p>
          </div>
        </div>
      )}
    </div>
  )
}

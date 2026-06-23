import { useQuery } from '@tanstack/react-query'
import { analyticsService, escalationService } from '@/services/api'
import { AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { SkeletonBlock } from '@/components/Skeleton'

const statsCards = [
  { label: 'Active Waybills', key: 'totalActive', color: 'var(--badge-blue-text)' },
  { label: 'Delivered Today', key: 'deliveredToday', color: 'var(--badge-green-text)' },
  { label: 'In Transit', key: 'inTransit', color: 'var(--badge-amber-text)' },
  { label: 'Pending Pickup', key: 'pendingPickup', color: 'var(--badge-red-text)' },
]

export default function DashboardPage() {
  const navigate = useNavigate()
  const { data: stats, isLoading: statsLoading } = useQuery({
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
              background: 'var(--color-surface)',
              padding: '1.25rem',
              borderRadius: 10,
              borderLeft: `4px solid ${card.color}`,
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{card.label}</p>
            {statsLoading ? (
              <SkeletonBlock width={80} height={32} style={{ marginTop: 4 }} />
            ) : (
              <p style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                {stats?.[card.key as keyof typeof stats] ?? '—'}
              </p>
            )}
          </div>
        ))}
      </div>

      {openEscalations > 0 && (
        <div onClick={() => navigate('/escalations')} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.5rem', padding: '1rem 1.25rem', background: 'var(--badge-red-bg)', border: '1px solid var(--badge-red-border)', borderRadius: 10, cursor: 'pointer' }}>
          <AlertTriangle size={20} color="#dc2626" />
          <div>
            <p style={{ fontWeight: 600, color: 'var(--badge-red-text)', fontSize: '0.9375rem' }}>{openEscalations} Open Escalation{openEscalations > 1 ? 's' : ''}</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--badge-red-text)' }}>Click to view and resolve.</p>
          </div>
        </div>
      )}
    </div>
  )
}

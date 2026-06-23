import { useQuery } from '@tanstack/react-query'
import { regionService } from '@/services/api'
import type { RegionPerformance } from '@/types/waybill'
import { Globe, TrendingUp } from 'lucide-react'
import PageContainer from '@/components/PageContainer'
import { SkeletonBlock } from '@/components/Skeleton'
import BackButton from '@/components/BackButton'

export default function RegionPerformancePage() {
  const { data: regions, isLoading } = useQuery({
    queryKey: ['region-performance'],
    queryFn: () => regionService.performance().then(r => r.data),
  })

  return (
    <><BackButton fallback="/analytics" /><PageContainer title="Region Performance">
      {isLoading ? (
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          <SkeletonBlock height={180} /><SkeletonBlock height={180} /><SkeletonBlock height={180} />
        </div>
      ) : !regions?.length ? (
        <div style={{ background: 'var(--color-surface)', padding: '2rem', borderRadius: 10, textAlign: 'center', color: 'var(--color-text-muted-lighter)' }}>
          <Globe size={40} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
          <p style={{ fontWeight: 500 }}>No region data</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {regions.map((r: RegionPerformance) => (
            <div key={r.region} style={{ background: 'var(--color-surface)', padding: '1.25rem', borderRadius: 10, border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <TrendingUp size={18} color="#2563eb" />
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{r.region}</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.875rem' }}>
                <div style={{ color: 'var(--color-text-muted)' }}>Total Shipments</div><div style={{ fontWeight: 500, textAlign: 'right' }}>{r.totalShipments}</div>
                <div style={{ color: 'var(--color-text-muted)' }}>Delivered</div><div style={{ fontWeight: 500, textAlign: 'right' }}>{r.deliveredCount}</div>
                <div style={{ color: 'var(--color-text-muted)' }}>On-Time</div><div style={{ fontWeight: 500, textAlign: 'right', color: 'var(--badge-green-text)' }}>{r.onTimeCount}</div>
                <div style={{ color: 'var(--color-text-muted)' }}>Exceptions</div><div style={{ fontWeight: 500, textAlign: 'right', color: 'var(--badge-red-text)' }}>{r.exceptionCount}</div>
                <div style={{ color: 'var(--color-text-muted)' }}>Avg Transit</div><div style={{ fontWeight: 500, textAlign: 'right' }}>{r.avgTransitHours.toFixed(1)}h</div>
                <div style={{ color: 'var(--color-text-muted)' }}>SLA Compliance</div><div style={{ fontWeight: 500, textAlign: 'right', color: 'var(--color-primary)' }}>{(r.slaCompliance * 100).toFixed(1)}%</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageContainer></>
  )
}

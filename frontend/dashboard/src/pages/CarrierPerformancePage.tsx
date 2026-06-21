import { useQuery } from '@tanstack/react-query'
import { analyticsService } from '@/services/api'
import { Truck, CheckCircle, XCircle, Clock, AlertTriangle, TrendingUp, BarChart3, Percent } from 'lucide-react'
import { SkeletonBlock } from '@/components/Skeleton'

export default function CarrierPerformancePage() {
  const { data: carriers, isLoading } = useQuery({
    queryKey: ['carrier-performance'],
    queryFn: () => analyticsService.carrierPerformance().then((r) => r.data),
    refetchInterval: 30000,
  })

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Carrier Performance Scoreboard</h2>

      {isLoading ? (
        <div style={{ display: 'grid', gap: '1rem' }}><SkeletonBlock height={120} /><SkeletonBlock height={120} /><SkeletonBlock height={120} /></div>
      ) : !carriers?.length ? (
        <p style={{ color: 'var(--color-text-muted)' }}>No carrier data available.</p>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {carriers?.map((c: any) => (
            <div key={c.carrierId} style={{ background: 'var(--color-surface)', borderRadius: 10, boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
              <div style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--color-border-subtle)' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: c.isActive ? 'var(--badge-green-bg)' : 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Truck size={24} color={c.isActive ? 'var(--badge-green-text)' : 'var(--color-text-muted-lighter)'} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>{c.carrierName}</span>
                    <span style={{ fontSize: '0.7rem', padding: '0.125rem 0.5rem', borderRadius: 999, fontWeight: 600, background: c.isActive ? 'var(--badge-green-bg)' : 'var(--color-bg)', color: c.isActive ? 'var(--badge-green-text)' : 'var(--color-text-muted-lighter)' }}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{c.totalShipments} total shipments</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', padding: '1.25rem' }}>
                <MetricCard icon={Percent} label="On-Time Rate" value={`${c.onTimeRate}%`} color={c.onTimeRate >= 80 ? 'var(--badge-green-text)' : c.onTimeRate >= 50 ? 'var(--badge-amber-text)' : 'var(--badge-red-text)'} />
                <MetricCard icon={AlertTriangle} label="Exception Rate" value={`${c.exceptionRate}%`} color={c.exceptionRate <= 10 ? 'var(--badge-green-text)' : c.exceptionRate <= 30 ? 'var(--badge-amber-text)' : 'var(--badge-red-text)'} />
                <MetricCard icon={BarChart3} label="Delivered" value={String(c.deliveredCount)} color="#2563eb" />
                <MetricCard icon={CheckCircle} label="On Time" value={String(c.totalShipments - c.slaBreaches)} color="#16a34a" />
                <MetricCard icon={XCircle} label="SLA Breaches" value={String(c.slaBreaches)} color={c.slaBreaches === 0 ? 'var(--badge-green-text)' : 'var(--badge-red-text)'} />
                <MetricCard icon={Clock} label="Avg Transit" value={`${c.avgTransitHours}h`} color="#7c3aed" />
              </div>
            </div>
          ))}

          <div style={{ background: 'var(--color-surface)', borderRadius: 10, padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={18} color="#2563eb" /> Carrier Comparison
            </h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {carriers?.map((c: any) => {
                const maxRate = Math.max(...carriers.map((x: any) => x.onTimeRate), 1)
                return (
                  <div key={c.carrierId}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem', fontSize: '0.8125rem' }}>
                      <span style={{ fontWeight: 500 }}>{c.carrierName}</span>
                      <span style={{ fontWeight: 600, color: c.onTimeRate >= 80 ? 'var(--badge-green-text)' : c.onTimeRate >= 50 ? 'var(--badge-amber-text)' : 'var(--badge-red-text)' }}>{c.onTimeRate}% on-time</span>
                    </div>
                    <div style={{ width: '100%', height: 10, background: 'var(--color-bg)', borderRadius: 5, overflow: 'hidden' }}>
                      <div style={{ width: `${(c.onTimeRate / maxRate) * 100}%`, height: '100%', borderRadius: 5, background: c.onTimeRate >= 80 ? 'var(--badge-green-text)' : c.onTimeRate >= 50 ? 'var(--badge-amber-text)' : 'var(--badge-red-text)', transition: 'width 0.5s' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div style={{ padding: '1rem', background: 'var(--color-surface-hover)', borderRadius: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
        <Icon size={14} color={color} /> {label}
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color }}>{value}</div>
    </div>
  )
}

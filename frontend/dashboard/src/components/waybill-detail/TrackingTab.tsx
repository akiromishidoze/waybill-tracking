import { useQuery } from '@tanstack/react-query'
import { Clock, MapPin, AlertTriangle, LogIn, LogOut } from 'lucide-react'
import { dwellTimeService, geofenceService } from '@/services/api'
import type { DwellSegment, GeofenceEvent } from '@/types/waybill'

export default function TrackingTab({ waybillId }: { waybillId: string }) {
  const { data: dwellSegments } = useQuery({
    queryKey: ['dwell', waybillId],
    queryFn: () => dwellTimeService.getDwell(waybillId).then(r => r.data),
  })

  const activeDwell = dwellSegments?.find(s => s.isActive)

  const { data: geofenceEvents } = useQuery({
    queryKey: ['geofence', waybillId],
    queryFn: () => geofenceService.getForWaybill(waybillId).then(r => r.data),
  })

  return (
    <div>
      {dwellSegments && dwellSegments.length > 0 && (
        <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 10, marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Clock size={18} color={activeDwell ? 'var(--badge-red-text)' : 'var(--color-text-muted)'} />
            <h3 style={{ fontWeight: 600 }}>Dwell Time at Facilities</h3>
            {activeDwell && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.625rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600, background: 'var(--badge-red-bg)', color: 'var(--badge-red-text)', border: '1px solid var(--badge-red-border)' }}>
                <AlertTriangle size={10} /> Active Dwell
              </span>
            )}
          </div>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {dwellSegments.map((seg: DwellSegment) => {
              const duration = seg.durationMinutes || 0
              const hours = duration / 60
              const isExcessive = seg.isActive && hours >= 24
              return (
                <div key={seg.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', background: isExcessive ? 'var(--badge-red-bg)' : 'var(--color-surface-hover)', borderRadius: 8, border: isExcessive ? '1px solid var(--badge-red-border)' : '1px solid var(--color-border-subtle)' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: seg.isActive ? 'var(--badge-red-text)' : 'var(--badge-green-text)', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{seg.facility}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span>Arrived: {new Date(seg.arrivedAt).toLocaleString()}</span>
                      {seg.departedAt ? (
                        <span>Departed: {new Date(seg.departedAt).toLocaleString()}</span>
                      ) : (
                        <span style={{ color: 'var(--badge-red-text)', fontWeight: 500 }}>Still here</span>
                      )}
                      <span>·</span>
                      <span>Duration: <strong>{hours >= 24 ? `${(hours / 24).toFixed(1)}d` : `${hours.toFixed(1)}h`}</strong></span>
                    </div>
                  </div>
                  {isExcessive && <AlertTriangle size={16} color="#dc2626" />}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {geofenceEvents && geofenceEvents.length > 0 && (
        <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <MapPin size={18} color="#0891b2" />
            <h3 style={{ fontWeight: 600 }}>Geofence Events</h3>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted-lighter)' }}>({geofenceEvents.length})</span>
          </div>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {geofenceEvents.map((evt: GeofenceEvent) => (
              <div key={evt.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.75rem', background: 'var(--color-surface-hover)', borderRadius: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: evt.eventType === 'ENTRY' ? '#16a34a20' : '#dc262620', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {evt.eventType === 'ENTRY' ? <LogIn size={12} color="#16a34a" /> : <LogOut size={12} color="#dc2626" />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{evt.eventType === 'ENTRY' ? 'Entered' : 'Exited'} {evt.zone}</span>
                    <span style={{ display: 'inline-flex', padding: '0.125rem 0.5rem', borderRadius: 4, fontSize: '0.6875rem', fontWeight: 500, background: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                      {evt.zoneType.replace(/_/g, ' ')}
                    </span>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted-lighter)' }}>
                      {new Date(evt.timestamp).toLocaleString()}
                    </span>
                  </div>
                  {evt.metadata && <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted-lighter)', margin: '0.125rem 0 0 0' }}>{evt.metadata}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(!dwellSegments || dwellSegments.length === 0) && (!geofenceEvents || geofenceEvents.length === 0) && (
        <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 10 }}>
          <p style={{ color: 'var(--color-text-muted-lighter)', fontSize: '0.875rem' }}>No tracking data available.</p>
        </div>
      )}
    </div>
  )
}

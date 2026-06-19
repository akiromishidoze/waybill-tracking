import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { geofenceService } from '@/services/api'
import type { GeofenceEvent } from '@/types/waybill'
import { MapPin, LogIn, LogOut } from 'lucide-react'
import PageContainer from '@/components/PageContainer'
import { SkeletonBlock } from '@/components/Skeleton'

export default function GeofenceEventsPage() {
  const [zoneFilter, setZoneFilter] = useState('')
  const { data: events, isLoading } = useQuery({
    queryKey: ['geofence-events'],
    queryFn: () => geofenceService.list().then(r => r.data),
  })

  const filtered = events?.filter((e: GeofenceEvent) =>
    !zoneFilter || e.zone === zoneFilter
  )

  const zones = events ? [...new Set(events.map((e: GeofenceEvent) => e.zone))] : []

  return (
    <PageContainer
      title="Geofence Events"
      actions={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
          <label style={{ color: '#64748b' }}>Zone:</label>
          <select
            value={zoneFilter}
            onChange={e => setZoneFilter(e.target.value)}
            style={{ padding: '0.375rem 0.5rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.8125rem' }}
          >
            <option value="">All Zones</option>
            {zones.map(z => <option key={z} value={z}>{z}</option>)}
          </select>
        </div>
      }
    >
      {isLoading ? (
        <div style={{ display: 'grid', gap: '0.5rem' }}><SkeletonBlock height={80} /><SkeletonBlock height={80} /><SkeletonBlock height={80} /></div>
      ) : !filtered?.length ? (
        <div style={{ background: '#fff', padding: '2rem', borderRadius: 10, textAlign: 'center', color: '#94a3b8' }}>
          <MapPin size={40} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
          <p style={{ fontWeight: 500 }}>No geofence events</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {filtered.map((event: GeofenceEvent) => (
            <div key={event.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0' }}>
              {event.eventType === 'ENTRY' ? <LogIn size={20} color="#16a34a" /> : <LogOut size={20} color="#dc2626" />}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: '0.9375rem' }}>#{event.trackingNumber}</strong>
                  <span style={{ color: '#64748b', fontSize: '0.875rem' }}>—</span>
                  <span style={{ color: '#2563eb', fontWeight: 500, fontSize: '0.875rem' }}>{event.zone}</span>
                  <span style={{ color: '#64748b', fontSize: '0.875rem' }}>({event.zoneType})</span>
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem' }}>
                  {new Date(event.timestamp).toLocaleString()} · {event.latitude.toFixed(4)}, {event.longitude.toFixed(4)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  )
}

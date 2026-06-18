import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { geofenceService } from '@/services/api'
import type { GeofenceEvent } from '@/types/waybill'
import { MapPin, LogIn, LogOut, Eye } from 'lucide-react'
import PageContainer from '@/components/PageContainer'

const ZONE_COLORS: Record<string, string> = {
  WAREHOUSE: '#2563eb',
  SORTING_CENTER: '#7c3aed',
  DELIVERY_ZONE: '#16a34a',
  CUSTOMER_LOCATION: '#d97706',
  SERVICE_CENTER: '#0891b2',
}

export default function GeofenceEventsPage() {
  const [zoneFilter, setZoneFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'ENTRY' | 'EXIT'>('all')

  const { data: events, isLoading } = useQuery({
    queryKey: ['geofence-events'],
    queryFn: () => geofenceService.list().then(r => r.data),
    refetchInterval: 30000,
  })

  const filtered = (events || []).filter(e => {
    if (zoneFilter && e.zoneType !== zoneFilter) return false
    if (typeFilter !== 'all' && e.eventType !== typeFilter) return false
    return true
  })

  const zoneTypes = [...new Set((events || []).map(e => e.zoneType))]

  return (
    <PageContainer
      title="Geofence Events"
      actions={
        <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
          Total: <strong>{filtered.length}</strong> events
        </span>
      }
    >
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <select value={zoneFilter} onChange={e => setZoneFilter(e.target.value)}
          style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.875rem', background: '#fff', minWidth: 160 }}>
          <option value="">All Zones</option>
          {zoneTypes.map(z => <option key={z} value={z}>{z.replace(/_/g, ' ')}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)}
          style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.875rem', background: '#fff', minWidth: 130 }}>
          <option value="all">All Events</option>
          <option value="ENTRY">Entry</option>
          <option value="EXIT">Exit</option>
        </select>
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : filtered.length === 0 ? (
        <div style={{ background: '#fff', padding: '2rem', borderRadius: 10, textAlign: 'center', color: '#94a3b8' }}>
          <MapPin size={40} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
          <p style={{ fontWeight: 500 }}>No geofence events</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {filtered.map((evt: GeofenceEvent) => (
            <div key={evt.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: '#fff', borderRadius: 8, border: '1px solid #f1f5f9' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: (ZONE_COLORS[evt.zoneType] || '#6b7280') + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {evt.eventType === 'ENTRY' ? <LogIn size={14} color={ZONE_COLORS[evt.zoneType] || '#6b7280'} /> : <LogOut size={14} color={ZONE_COLORS[evt.zoneType] || '#6b7280'} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <Link to={`/waybills/${evt.waybillId}`} style={{ fontWeight: 600, color: '#2563eb', textDecoration: 'none', fontSize: '0.875rem' }}>
                    #{evt.trackingNumber}
                  </Link>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.125rem 0.5rem', borderRadius: 999, fontSize: '0.6875rem', fontWeight: 600, background: evt.eventType === 'ENTRY' ? '#16a34a20' : '#dc262620', color: evt.eventType === 'ENTRY' ? '#16a34a' : '#dc2626' }}>
                    {evt.eventType === 'ENTRY' ? 'ENTRY' : 'EXIT'}
                  </span>
                  <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>{evt.zone}</span>
                  <span style={{ display: 'inline-flex', padding: '0.125rem 0.5rem', borderRadius: 4, fontSize: '0.6875rem', fontWeight: 500, background: (ZONE_COLORS[evt.zoneType] || '#6b7280') + '20', color: ZONE_COLORS[evt.zoneType] || '#6b7280' }}>
                    {evt.zoneType.replace(/_/g, ' ')}
                  </span>
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#94a3b8', marginTop: '0.125rem' }}>
                  {new Date(evt.timestamp).toLocaleString()}
                  {evt.metadata && <span> · {evt.metadata}</span>}
                </div>
              </div>
              <Link to={`/waybills/${evt.waybillId}`} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.75rem', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.75rem', textDecoration: 'none', color: '#475569' }}>
                <Eye size={12} /> View
              </Link>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  )
}
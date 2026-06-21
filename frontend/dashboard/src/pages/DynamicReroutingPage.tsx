import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { waybillService } from '@/services/api'
import { Navigation, MapPin, Truck, Clock, AlertTriangle, Check, X, RefreshCw } from 'lucide-react'
import { SkeletonBlock } from '@/components/Skeleton'
import type { Waybill } from '@/types/waybill'

const ROUTE_STATUSES = ['PICKED_UP', 'IN_TRANSIT', 'AT_SORTING_CENTER', 'OUT_FOR_DELIVERY']

export default function DynamicReroutingPage() {
  const queryClient = useQueryClient()
  const [reroutingId, setReroutingId] = useState<string | null>(null)
  const [form, setForm] = useState({ destination: '', carrierName: '', notes: '', estimatedDelivery: '' })

  const { data: waybills, isLoading } = useQuery({
    queryKey: ['waybills'],
    queryFn: () => waybillService.list().then(r => r.data),
  })

  const rerouteCandidates = waybills?.filter(
    (w: Waybill) => ROUTE_STATUSES.includes(w.status)
  ) || []

  const rerouteMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => waybillService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waybills'] })
      setReroutingId(null)
      setForm({ destination: '', carrierName: '', notes: '', estimatedDelivery: '' })
    },
  })

  const openReroute = (wb: Waybill) => {
    setReroutingId(wb.id)
    setForm({
      destination: wb.destination,
      carrierName: wb.carrierName || '',
      notes: '',
      estimatedDelivery: wb.estimatedDelivery || '',
    })
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Dynamic Re-routing</h2>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            {rerouteCandidates.length} shipments eligible for re-routing
          </p>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gap: '1rem' }}><SkeletonBlock height={100} /><SkeletonBlock height={100} /><SkeletonBlock height={100} /></div>
      ) : !rerouteCandidates.length ? (
        <div style={{ background: 'var(--color-surface)', borderRadius: 10, padding: '2rem', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
          <Navigation size={40} color='var(--color-text-muted-lighter)' style={{ marginBottom: '0.75rem' }} />
          <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>No shipments currently in transit. Re-routing is only available for active shipments.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {rerouteCandidates.map((wb: Waybill) => (
            <div key={wb.id} style={{ background: 'var(--color-surface)', borderRadius: 10, padding: '1.25rem', boxShadow: 'var(--shadow-sm)', border: reroutingId === wb.id ? '2px solid #2563eb' : '1px solid transparent' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {wb.trackingNumber}
                    <span style={{ display: 'inline-block', padding: '0.125rem 0.5rem', borderRadius: 999, fontSize: '0.6875rem', fontWeight: 600, background: 'var(--badge-amber-bg)', color: 'var(--badge-amber-text)' }}>
                      {wb.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                    {wb.shipperName} &middot; {wb.origin}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.375rem' }}>
                  {reroutingId === wb.id ? (
                    <button onClick={() => setReroutingId(null)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.75rem', background: 'transparent', color: 'var(--color-text-muted)', border: '1px solid var(--color-border-input)', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem' }}>
                      <X size={12} /> Cancel
                    </button>
                  ) : (
                    <button onClick={() => openReroute(wb)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.75rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500 }}>
                      <Navigation size={12} /> Re-route
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <MapPin size={14} color='var(--color-text-muted-lighter)' /> Destination: <strong>{wb.destination}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Truck size={14} color='var(--color-text-muted-lighter)' /> Carrier: <strong>{wb.carrierName || '—'}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Clock size={14} color='var(--color-text-muted-lighter)' /> ETA: <strong>{wb.estimatedDelivery ? new Date(wb.estimatedDelivery).toLocaleDateString() : '—'}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <AlertTriangle size={14} color='var(--color-text-muted-lighter)' /> SLA: {wb.slaBreached ? <span style={{ color: 'var(--badge-red-text)', fontWeight: 600 }}>Breached</span> : <span style={{ color: 'var(--badge-green-text)' }}>On Time</span>}
                </div>
              </div>

              {reroutingId === wb.id && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--color-surface-hover)', borderRadius: 8, display: 'grid', gap: '0.75rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>New Destination *</label>
                      <input value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.875rem' }} placeholder="City, Province" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>New Carrier</label>
                      <input value={form.carrierName} onChange={e => setForm({ ...form, carrierName: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.875rem' }} placeholder="Optional" />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Revised ETA</label>
                      <input type="date" value={form.estimatedDelivery?.slice(0, 10)} onChange={e => setForm({ ...form, estimatedDelivery: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.875rem' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Re-routing Notes</label>
                      <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.875rem' }} placeholder="Reason for re-route" />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                    <button
                      onClick={() => rerouteMutation.mutate({
                        id: reroutingId!,
                        data: {
                          destination: form.destination,
                          carrierName: form.carrierName || undefined,
                          estimatedDelivery: form.estimatedDelivery || undefined,
                        },
                      })}
                      disabled={!form.destination || rerouteMutation.isPending}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}
                    >
                      {rerouteMutation.isPending ? <RefreshCw size={14} /> : <Check size={14} />} Confirm Re-route
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

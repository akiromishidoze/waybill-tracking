import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { waybillService } from '@/services/api'
import { Navigation, MapPin, Truck, Clock, AlertTriangle, Check, X, RefreshCw, History } from 'lucide-react'
import { SkeletonBlock } from '@/components/Skeleton'
import type { Waybill } from '@/types/waybill'
import BackButton from '@/components/BackButton'

type RerouteHistoryEntry = {
  id: string
  trackingNumber: string
  fromDestination: string
  toDestination: string
  fromCarrier: string
  toCarrier: string
  revisedEta: string
  notes: string
  reroutedAt: string
}

const ROUTE_STATUSES = ['PICKED_UP', 'IN_TRANSIT', 'AT_SORTING_CENTER', 'OUT_FOR_DELIVERY']

export default function DynamicReroutingPage() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<'active' | 'history'>('active')
  const [reroutingId, setReroutingId] = useState<string | null>(null)
  const [confirmPending, setConfirmPending] = useState(false)
  const [form, setForm] = useState({ destination: '', carrierName: '', notes: '', estimatedDelivery: '' })
  const [history, setHistory] = useState<RerouteHistoryEntry[]>([])
  const originalRef = useRef<{ destination: string; carrierName: string; estimatedDelivery: string } | null>(null)

  const { data: waybills, isLoading } = useQuery({
    queryKey: ['waybills'],
    queryFn: () => waybillService.list().then(r => r.data),
  })

  const rerouteCandidates = waybills?.filter(
    (w: Waybill) => ROUTE_STATUSES.includes(w.status)
  ) || []

  const rerouteMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => waybillService.update(id, data),
    onSuccess: (_, vars) => {
      const wb = rerouteCandidates.find((w: Waybill) => w.id === vars.id)
      if (wb && originalRef.current) {
        setHistory(prev => [{
          id: String(Date.now()),
          trackingNumber: wb.trackingNumber,
          fromDestination: originalRef.current!.destination,
          toDestination: form.destination,
          fromCarrier: originalRef.current!.carrierName,
          toCarrier: form.carrierName,
          revisedEta: form.estimatedDelivery,
          notes: form.notes,
          reroutedAt: new Date().toISOString(),
        }, ...prev])
      }
      queryClient.invalidateQueries({ queryKey: ['waybills'] })
      setReroutingId(null)
      setConfirmPending(false)
      setForm({ destination: '', carrierName: '', notes: '', estimatedDelivery: '' })
      originalRef.current = null
    },
  })

  const openReroute = (wb: Waybill) => {
    setReroutingId(wb.id)
    originalRef.current = { destination: wb.destination, carrierName: wb.carrierName || '', estimatedDelivery: wb.estimatedDelivery || '' }
    setForm({
      destination: wb.destination,
      carrierName: wb.carrierName || '',
      notes: '',
      estimatedDelivery: wb.estimatedDelivery || '',
    })
  }

  return (
    <div>
      <BackButton fallback="/dashboard" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Dynamic Re-routing</h2>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            {rerouteCandidates.length} shipments eligible for re-routing
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {(['active', 'history'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', background: tab === t ? '#2563eb' : 'var(--color-bg)', color: tab === t ? '#fff' : 'var(--color-text-secondary)' }}>
              {t === 'active' ? <><Navigation size={13} style={{ marginRight: '0.375rem' }} />Active</> : <><History size={13} style={{ marginRight: '0.375rem' }} />History ({history.length})</>}
            </button>
          ))}
        </div>
      </div>

      {tab === 'history' && (
        <div>
          {history.length === 0 ? (
            <div style={{ background: 'var(--color-surface)', borderRadius: 10, padding: '2rem', textAlign: 'center' }}>
              <History size={36} color='var(--color-text-muted-lighter)' style={{ marginBottom: '0.75rem' }} />
              <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>No re-routes have been performed this session.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {history.map(h => (
                <div key={h.id} style={{ background: 'var(--color-surface)', borderRadius: 10, padding: '1rem 1.25rem', border: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.25rem' }}>{h.trackingNumber}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <span><MapPin size={12} style={{ marginRight: '0.25rem' }} />{h.fromDestination} &rarr; <strong>{h.toDestination}</strong></span>
                        {h.fromCarrier !== h.toCarrier && <span><Truck size={12} style={{ marginRight: '0.25rem' }} />{h.fromCarrier || '—'} &rarr; <strong>{h.toCarrier || '—'}</strong></span>}
                        {h.revisedEta && <span><Clock size={12} style={{ marginRight: '0.25rem' }} />ETA: {new Date(h.revisedEta).toLocaleDateString()}</span>}
                        {h.notes && <span style={{ fontStyle: 'italic' }}>&ldquo;{h.notes}&rdquo;</span>}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted-lighter)', whiteSpace: 'nowrap' }}>{new Date(h.reroutedAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'active' && isLoading ? (
        <div style={{ display: 'grid', gap: '1rem' }}><SkeletonBlock height={100} /><SkeletonBlock height={100} /><SkeletonBlock height={100} /></div>
      ) : tab === 'active' && !rerouteCandidates.length ? (
        <div style={{ background: 'var(--color-surface)', borderRadius: 10, padding: '2rem', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
          <Navigation size={40} color='var(--color-text-muted-lighter)' style={{ marginBottom: '0.75rem' }} />
          <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>No shipments currently in transit. Re-routing is only available for active shipments.</p>
        </div>
      ) : tab === 'active' ? (
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
                    <button onClick={() => { setReroutingId(null); setConfirmPending(false) }}
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
                      onClick={() => setConfirmPending(true)}
                      disabled={!form.destination || rerouteMutation.isPending}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}
                    >
                      <Check size={14} /> Review & Confirm
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : null}

      {confirmPending && reroutingId && (() => {
        const wb = rerouteCandidates.find((w: Waybill) => w.id === reroutingId)
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
            <div style={{ background: 'var(--color-surface)', borderRadius: 12, padding: '1.5rem', maxWidth: 460, width: '100%', boxShadow: 'var(--shadow-lg)' }}>
              <h3 style={{ fontWeight: 600, margin: '0 0 0.5rem' }}>Confirm Re-route</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>You are about to re-route <strong>{wb?.trackingNumber}</strong>. Please review the changes:</p>
              <div style={{ background: 'var(--color-bg)', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.875rem', display: 'grid', gap: '0.375rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}><span style={{ color: 'var(--color-text-muted)', minWidth: 100 }}>Destination:</span><span>{originalRef.current?.destination} &rarr; <strong>{form.destination}</strong></span></div>
                {form.carrierName && <div style={{ display: 'flex', gap: '0.5rem' }}><span style={{ color: 'var(--color-text-muted)', minWidth: 100 }}>Carrier:</span><span>{originalRef.current?.carrierName || '—'} &rarr; <strong>{form.carrierName}</strong></span></div>}
                {form.estimatedDelivery && <div style={{ display: 'flex', gap: '0.5rem' }}><span style={{ color: 'var(--color-text-muted)', minWidth: 100 }}>Revised ETA:</span><strong>{new Date(form.estimatedDelivery).toLocaleDateString()}</strong></div>}
                {form.notes && <div style={{ display: 'flex', gap: '0.5rem' }}><span style={{ color: 'var(--color-text-muted)', minWidth: 100 }}>Notes:</span><span style={{ fontStyle: 'italic' }}>{form.notes}</span></div>}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setConfirmPending(false)} style={{ padding: '0.625rem 1.25rem', border: '1px solid var(--color-border)', borderRadius: 8, background: 'var(--color-surface)', cursor: 'pointer', fontSize: '0.875rem' }}>Back</button>
                <button
                  onClick={() => rerouteMutation.mutate({ id: reroutingId!, data: { destination: form.destination, carrierName: form.carrierName || undefined, estimatedDelivery: form.estimatedDelivery || undefined } })}
                  disabled={rerouteMutation.isPending}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.625rem 1.25rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>
                  {rerouteMutation.isPending ? <RefreshCw size={14} /> : <Check size={14} />} Confirm Re-route
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

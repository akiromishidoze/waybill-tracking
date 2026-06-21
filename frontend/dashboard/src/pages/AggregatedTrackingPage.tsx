import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { aggregatedTrackingService, carrierService, waybillService } from '@/services/api'
import { Truck, ChevronRight, Plus, X, Trash2, Check } from 'lucide-react'
import { SkeletonBlock } from '@/components/Skeleton'

const CARRIER_COLORS: Record<string, string> = {
  c1: '#2563eb', c2: '#7c3aed', c3: '#d97706',
}

export default function AggregatedTrackingPage() {
  const queryClient = useQueryClient()
  const [showAssign, setShowAssign] = useState(false)
  const [assignForm, setAssignForm] = useState({ waybillId: '', carrierId: '', carrierTrackingNumber: '' })

  const { data: items, isLoading } = useQuery({
    queryKey: ['aggregated-tracking'],
    queryFn: () => aggregatedTrackingService.list().then((r) => r.data),
    refetchInterval: 15000,
  })

  const { data: carriers } = useQuery({
    queryKey: ['carriers'],
    queryFn: () => carrierService.list().then((r) => r.data),
  })

  const { data: waybills } = useQuery({
    queryKey: ['waybills'],
    queryFn: () => waybillService.list().then((r) => r.data),
  })

  const assignCarrier = useMutation({
    mutationFn: () => aggregatedTrackingService.assign(assignForm.waybillId, { carrierId: assignForm.carrierId, carrierTrackingNumber: assignForm.carrierTrackingNumber }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['aggregated-tracking'] }); queryClient.invalidateQueries({ queryKey: ['waybills'] }); setShowAssign(false); setAssignForm({ waybillId: '', carrierId: '', carrierTrackingNumber: '' }) },
  })

  const removeCarrier = useMutation({
    mutationFn: (waybillId: string) => aggregatedTrackingService.remove(waybillId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['aggregated-tracking'] }); queryClient.invalidateQueries({ queryKey: ['waybills'] }) },
  })

  const unassignedWbs = (waybills || []).filter((w: any) => !w.carrierId)

  const grouped = (items || []).reduce((acc: Record<string, any>, item: any) => {
    if (!acc[item.carrierId]) acc[item.carrierId] = { name: item.carrierName, items: [] }
    acc[item.carrierId].items.push(item)
    return acc
  }, {} as Record<string, any>)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Multi-Carrier Aggregated Tracking</h2>
        <button onClick={() => setShowAssign(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 500, cursor: 'pointer' }}>
          <Plus size={16} /> Assign Carrier
        </button>
      </div>

      {showAssign && (
        <div style={{ background: 'var(--color-surface)', padding: '1.25rem', borderRadius: 10, marginBottom: '1rem', boxShadow: 'var(--shadow-sm)', display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Waybill</label>
            <select value={assignForm.waybillId} onChange={e => setAssignForm({ ...assignForm, waybillId: e.target.value })} style={{ padding: '0.5rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.875rem', minWidth: 200 }}>
              <option value="">Select waybill...</option>
              {unassignedWbs.map((wb: any) => (
                <option key={wb.id} value={wb.id}>{wb.trackingNumber} — {wb.recipientName}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Carrier</label>
            <select value={assignForm.carrierId} onChange={e => setAssignForm({ ...assignForm, carrierId: e.target.value })} style={{ padding: '0.5rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.875rem', minWidth: 180 }}>
              <option value="">Select carrier...</option>
              {(carriers || []).filter((c: any) => c.isActive).map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Carrier Tracking #</label>
            <input value={assignForm.carrierTrackingNumber} onChange={e => setAssignForm({ ...assignForm, carrierTrackingNumber: e.target.value })} placeholder="e.g. FD-123456" style={{ padding: '0.5rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.875rem', width: 160 }} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => assignCarrier.mutate()} disabled={!assignForm.waybillId || !assignForm.carrierId || !assignForm.carrierTrackingNumber || assignCarrier.isPending} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.875rem' }}>
              <Check size={14} /> Assign
            </button>
            <button onClick={() => setShowAssign(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem', background: 'transparent', color: 'var(--color-text-muted)', border: '1px solid var(--color-border-input)', borderRadius: 6, cursor: 'pointer', fontSize: '0.875rem' }}>
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div style={{ display: 'grid', gap: '1rem' }}><SkeletonBlock height={160} /><SkeletonBlock height={160} /></div>
      ) : !items?.length ? (
        <p style={{ color: 'var(--color-text-muted)' }}>No carrier-tracked waybills yet. Assign a carrier to get started.</p>
      ) : (
        Object.entries(grouped).map(([carrierId, group]: [string, any]) => (
          <div key={carrierId} style={{ background: 'var(--color-surface)', borderRadius: 10, boxShadow: 'var(--shadow-sm)', marginBottom: '1.5rem', overflow: 'hidden' }}>
            <div style={{ padding: '0.75rem 1rem', background: (CARRIER_COLORS[carrierId] || 'var(--color-text-muted)') + '10', borderBottom: `2px solid ${CARRIER_COLORS[carrierId] || 'var(--color-text-muted)'}`, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Truck size={18} color={CARRIER_COLORS[carrierId] || 'var(--color-text-muted)'} />
              <span style={{ fontWeight: 600 }}>{group.name}</span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>({group.items.length} shipments)</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--color-surface-hover)', textAlign: 'left' }}>
                  <th style={{ padding: '0.625rem 1rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Waybill</th>
                  <th style={{ padding: '0.625rem 1rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Carrier Tracking</th>
                  <th style={{ padding: '0.625rem 1rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Recipient</th>
                  <th style={{ padding: '0.625rem 1rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Destination</th>
                  <th style={{ padding: '0.625rem 1rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Last Event</th>
                  <th style={{ padding: '0.625rem 1rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600 }} />
                </tr>
              </thead>
              <tbody>
                {group.items.map((item: any) => (
                  <tr key={item.waybillId} style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
                    <td style={{ padding: '0.625rem 1rem' }}>
                      <Link to={`/waybills/${item.waybillId}`} style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500, fontSize: '0.875rem' }}>{item.trackingNumber}</Link>
                    </td>
                    <td style={{ padding: '0.625rem 1rem', fontSize: '0.875rem', fontFamily: 'monospace', color: 'var(--color-text-primary)' }}>{item.carrierTrackingNumber}</td>
                    <td style={{ padding: '0.625rem 1rem', fontSize: '0.875rem' }}>{item.recipientName}</td>
                    <td style={{ padding: '0.625rem 1rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{item.destination}</td>
                    <td style={{ padding: '0.625rem 1rem', fontSize: '0.8125rem' }}>
                      {item.lastCarrierEvent ? (
                        <div><span style={{ fontWeight: 500 }}>{item.lastCarrierEvent.status}</span><span style={{ color: 'var(--color-text-muted-lighter)' }}> — {item.lastCarrierEvent.location}</span></div>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted-lighter)' }}>No events yet</span>
                      )}
                    </td>
                    <td style={{ padding: '0.625rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                        <Link to={`/waybills/${item.waybillId}`} style={{ display: 'flex', color: 'var(--color-primary)' }}><ChevronRight size={16} /></Link>
                        <button onClick={() => { if (confirm('Remove carrier from this waybill?')) removeCarrier.mutate(item.waybillId) }} style={{ display: 'flex', padding: '0.25rem', background: 'transparent', color: 'var(--badge-red-text)', border: 'none', borderRadius: 4, cursor: 'pointer' }} title="Remove carrier">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  )
}

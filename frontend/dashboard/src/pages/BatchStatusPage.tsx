import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { waybillService } from '@/services/api'
import type { Waybill } from '@/types/waybill'
import { CheckSquare, Clock, Truck, Shield, RotateCcw } from 'lucide-react'
import { SkeletonTableRow } from '@/components/Skeleton'
import BackButton from '@/components/BackButton'

const statusColors: Record<string, string> = {
  CREATED: 'var(--status-gray)',
  PICKED_UP: 'var(--status-blue)',
  IN_TRANSIT: 'var(--status-amber)',
  AT_SORTING_CENTER: 'var(--status-purple)',
  OUT_FOR_DELIVERY: 'var(--status-cyan)',
  DELIVERED: 'var(--status-green)',
  FAILED_DELIVERY: 'var(--status-red)',
  RETURNED: 'var(--status-purple)',
  CANCELLED: 'var(--status-gray)',
}

const STATUS_OPTIONS = ['CREATED', 'PICKED_UP', 'IN_TRANSIT', 'AT_SORTING_CENTER', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED_DELIVERY', 'CANCELLED']

export default function BatchStatusPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [batchStatus, setBatchStatus] = useState('')
  const [batchLocation, setBatchLocation] = useState('')

  const { data: waybills, isLoading } = useQuery({
    queryKey: ['waybills', search],
    queryFn: () => waybillService.list({ search }).then((r) => r.data),
  })

  const filtered = waybills?.filter((wb) => {
    if (!search) return true
    const q = search.toLowerCase()
    return wb.trackingNumber.toLowerCase().includes(q) || wb.shipperName?.toLowerCase().includes(q) || wb.recipientName?.toLowerCase().includes(q) || wb.destination?.toLowerCase().includes(q)
  })

  const toggleAll = () => {
    if (selected.size === filtered?.length) setSelected(new Set())
    else setSelected(new Set(filtered?.map((w) => w.id) || []))
  }

  const toggleOne = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const batchUpdate = useMutation({
    mutationFn: () => waybillService.batchStatusUpdate([...selected], batchStatus, batchLocation),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['waybills'] }); setSelected(new Set()); setBatchStatus(''); setBatchLocation('') },
  })

  return (
    <div>
      <BackButton fallback="/dashboard" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Batch Shipment Status</h2>
        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <CheckSquare size={16} /> {selected.size} of {filtered?.length || 0} selected
        </span>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <input type="text" placeholder="Filter by tracking number, shipper, recipient..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: '0.75rem 1rem', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: '1rem' }} />
        {selected.size > 0 && (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>New Status</label>
              <select value={batchStatus} onChange={(e) => setBatchStatus(e.target.value)} style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: '0.875rem', background: 'var(--color-surface)', minWidth: 160 }}>
                <option value="">Select status...</option>
                {STATUS_OPTIONS.map((s) => (<option key={s} value={s}>{s.replace(/_/g, ' ')}</option>))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Location</label>
              <input type="text" value={batchLocation} onChange={(e) => setBatchLocation(e.target.value)} placeholder="e.g. Manila Hub" style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: '0.875rem', width: 160 }} />
            </div>
            <button onClick={() => batchUpdate.mutate()} disabled={!batchStatus || batchUpdate.isPending} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.6rem 1.25rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem' }}>
              <RotateCcw size={16} /> Update {selected.size} Shipments
            </button>
          </>
        )}
      </div>

      <div style={{ background: 'var(--color-surface)', borderRadius: 10, boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--color-surface-hover)', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem 1rem', width: 40 }}>
                <input type="checkbox" checked={selected.size > 0 && selected.size === filtered?.length} onChange={toggleAll} style={{ cursor: 'pointer' }} />
              </th>
              <th style={{ padding: '0.75rem 1rem' }}>Tracking #</th>
              <th style={{ padding: '0.75rem 1rem' }}>Shipper</th>
              <th style={{ padding: '0.75rem 1rem' }}>Recipient</th>
              <th style={{ padding: '0.75rem 1rem' }}>Destination</th>
              <th style={{ padding: '0.75rem 1rem' }}>Status</th>
              <th style={{ padding: '0.75rem 1rem' }}>Team</th>
              <th style={{ padding: '0.75rem 1rem' }}>Carrier</th>
              <th style={{ padding: '0.75rem 1rem' }}>Est. Delivery</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} cols={9} />)
            ) : !filtered?.length ? (
              <tr><td colSpan={9} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted-lighter)' }}>No waybills found.</td></tr>
            ) : (
              filtered?.map((wb: Waybill) => (
                <tr key={wb.id} style={{ borderTop: '1px solid var(--color-border-subtle)', background: selected.has(wb.id) ? 'var(--color-primary-soft)' : undefined }}>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <input type="checkbox" checked={selected.has(wb.id)} onChange={() => toggleOne(wb.id)} style={{ cursor: 'pointer' }} />
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 500, fontSize: '0.875rem' }}>{wb.trackingNumber}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>{wb.shipperName}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>{wb.recipientName}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{wb.destination}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: 999, fontSize: '0.7rem', fontWeight: 600, background: statusColors[wb.status] + '20', color: statusColors[wb.status] }}>
                      {wb.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {wb.teamName ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.7rem', fontWeight: 500, background: 'var(--badge-warm-bg)', color: 'var(--status-amber)' }}>
                        <Shield size={10} /> {wb.teamName}
                      </span>
                    ) : <span style={{ color: 'var(--color-text-muted-lighter)', fontSize: '0.8125rem' }}>—</span>}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {wb.carrierName ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--color-primary)' }}>
                        <Truck size={12} /> {wb.carrierName}
                      </span>
                    ) : <span style={{ color: 'var(--color-text-muted-lighter)', fontSize: '0.8125rem' }}>—</span>}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={12} /> {wb.estimatedDelivery ? new Date(wb.estimatedDelivery).toLocaleDateString() : '—'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

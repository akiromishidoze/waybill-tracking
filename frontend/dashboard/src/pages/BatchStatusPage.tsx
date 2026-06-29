import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { waybillService } from '@/services/api'
import type { Waybill } from '@/types/waybill'
import { RotateCcw, PackageOpen } from 'lucide-react'
import { SkeletonTableRow } from '@/components/Skeleton'
import EmptyState from '@/components/EmptyState'
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
  const [rowStatus, setRowStatus] = useState<Record<string, string>>({})
  const [rowLocation, setRowLocation] = useState<Record<string, string>>({})

  const { data: waybills, isLoading } = useQuery({
    queryKey: ['waybills', search],
    queryFn: () => waybillService.list({ search }).then((r) => r.data),
  })

  const filtered = waybills?.filter((wb: Waybill) => {
    if (!search) return true
    const q = search.toLowerCase()
    return wb.trackingNumber.toLowerCase().includes(q) || wb.shipperName?.toLowerCase().includes(q) || wb.recipientName?.toLowerCase().includes(q) || wb.destination?.toLowerCase().includes(q)
  })

  const updateRow = useMutation({
    mutationFn: ({ id, status, location }: { id: string; status: string; location: string }) =>
      waybillService.batchStatusUpdate([id], status, location),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['waybills'] }),
  })

  return (
    <div>
      <BackButton fallback="/dashboard" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Batch Shipment Status</h2>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <input type="text" placeholder="Filter by tracking number, shipper, recipient..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: '0.75rem 1rem', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: '1rem' }} />
      </div>

      <div style={{ background: 'var(--color-surface)', borderRadius: 10, boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--color-surface-hover)', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem 1rem' }}>Tracking #</th>
              <th style={{ padding: '0.75rem 1rem' }}>Shipper</th>
              <th style={{ padding: '0.75rem 1rem' }}>Recipient</th>
              <th style={{ padding: '0.75rem 1rem' }}>Destination</th>
              <th style={{ padding: '0.75rem 1rem' }}>Current Status</th>
              <th style={{ padding: '0.75rem 1rem' }}>New Status</th>
              <th style={{ padding: '0.75rem 1rem' }}>Location</th>
              <th style={{ padding: '0.75rem 1rem' }}>Update</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} cols={8} />)
            ) : !filtered?.length ? (
              <tr><td colSpan={8}><EmptyState icon={PackageOpen} title="No waybills found" message={search ? 'No waybills match your search.' : 'Create shipments to update their status in bulk.'} /></td></tr>
            ) : (
              filtered?.map((wb: Waybill) => (
                <tr key={wb.id} style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
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
                    <select
                      value={rowStatus[wb.id] || ''}
                      onChange={(e) => setRowStatus((prev) => ({ ...prev, [wb.id]: e.target.value }))}
                      style={{ padding: '0.4rem 0.5rem', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: '0.8125rem', background: 'var(--color-surface)', minWidth: 130 }}
                    >
                      <option value="">Select status...</option>
                      {STATUS_OPTIONS.map((s) => (<option key={s} value={s}>{s.replace(/_/g, ' ')}</option>))}
                    </select>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <input
                      type="text"
                      value={rowLocation[wb.id] || ''}
                      onChange={(e) => setRowLocation((prev) => ({ ...prev, [wb.id]: e.target.value }))}
                      placeholder="e.g. Manila Hub"
                      style={{ padding: '0.4rem 0.5rem', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: '0.8125rem', width: 130 }}
                    />
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <button
                      onClick={() => updateRow.mutate({ id: wb.id, status: rowStatus[wb.id] || wb.status, location: rowLocation[wb.id] || '' })}
                      disabled={updateRow.isPending && (updateRow.variables?.id === wb.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.75rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500, fontSize: '0.8125rem' }}
                    >
                      <RotateCcw size={14} /> Update
                    </button>
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

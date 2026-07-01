import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeftRight, RefreshCw } from 'lucide-react'
import { waybillService, returnService } from '@/services/api'
import type { ReturnStatus } from '@/types/waybill'
import { RETURN_LABELS, RETURN_COLORS } from '@/types/waybill'

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', marginBottom: '0.5rem' }}>
      <span style={{ width: 140, color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  )
}

export default function ReturnTab({ waybillId }: { waybillId: string }) {
  const queryClient = useQueryClient()
  const [initiatingReturn, setInitiatingReturn] = useState(false)
  const [returnReason, setReturnReason] = useState('')
  const [returnCarrier, setReturnCarrier] = useState('')

  const { data: wb } = useQuery({
    queryKey: ['waybill', waybillId],
    queryFn: () => waybillService.get(waybillId).then((r) => r.data),
  })

  const initiateReturn = useMutation({
    mutationFn: () => returnService.initiateReturn(waybillId, { reason: returnReason, carrier: returnCarrier }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waybill', waybillId] })
      setInitiatingReturn(false)
      setReturnReason('')
      setReturnCarrier('')
    },
  })

  const advanceReturn = useMutation({
    mutationFn: (status: string) => returnService.updateReturnStatus(waybillId, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['waybill', waybillId] }),
  })

  if (!wb) return null

  if (wb.returnInfo) {
    return (
      <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeftRight size={18} color="#7c3aed" />
            <h3 style={{ fontWeight: 600 }}>Reverse Logistics</h3>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.75rem', borderRadius: 999, fontSize: '0.8125rem', fontWeight: 600, background: RETURN_COLORS[wb.returnInfo.status as ReturnStatus] + '20', color: RETURN_COLORS[wb.returnInfo.status as ReturnStatus] }}>
            {RETURN_LABELS[wb.returnInfo.status as ReturnStatus]}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.875rem' }}>
          <DetailRow label="Reason" value={wb.returnInfo.reason} />
          <DetailRow label="Requested" value={new Date(wb.returnInfo.requestedAt).toLocaleDateString()} />
          {wb.returnInfo.trackingNumber && <DetailRow label="RMA #" value={wb.returnInfo.trackingNumber} />}
          {wb.returnInfo.carrier && <DetailRow label="Return Carrier" value={wb.returnInfo.carrier} />}
          {wb.returnInfo.completedAt && <DetailRow label="Completed" value={new Date(wb.returnInfo.completedAt).toLocaleDateString()} />}
          {wb.returnInfo.notes && <DetailRow label="Notes" value={wb.returnInfo.notes} />}
        </div>
        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
          {wb.returnInfo.status === 'RETURN_REQUESTED' && (
            <button onClick={() => advanceReturn.mutate('RETURN_IN_TRANSIT')} disabled={advanceReturn.isPending} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.8125rem', cursor: 'pointer' }}>
              <RefreshCw size={14} /> Mark In Transit
            </button>
          )}
          {wb.returnInfo.status === 'RETURN_IN_TRANSIT' && (
            <button onClick={() => advanceReturn.mutate('RETURN_RECEIVED')} disabled={advanceReturn.isPending} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', background: '#0891b2', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.8125rem', cursor: 'pointer' }}>
              <RefreshCw size={14} /> Mark Received
            </button>
          )}
          {wb.returnInfo.status === 'RETURN_RECEIVED' && (
            <button onClick={() => advanceReturn.mutate('RETURN_COMPLETED')} disabled={advanceReturn.isPending} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.8125rem', cursor: 'pointer' }}>
              <RefreshCw size={14} /> Complete Return
            </button>
          )}
        </div>
      </div>
    )
  }

  if (['DELIVERED', 'FAILED_DELIVERY'].includes(wb.status)) {
    return (
      <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeftRight size={18} color="#d97706" />
            <h3 style={{ fontWeight: 600 }}>Reverse Logistics</h3>
          </div>
          {!initiatingReturn ? (
            <button onClick={() => setInitiatingReturn(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', background: '#d97706', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.8125rem', cursor: 'pointer' }}>
              <ArrowLeftRight size={14} /> Initiate Return
            </button>
          ) : null}
        </div>
        {initiatingReturn && (
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: 400 }}>
            <input placeholder="Return reason (e.g. Damaged, Wrong item)" value={returnReason} onChange={e => setReturnReason(e.target.value)} style={{ padding: '0.5rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.875rem' }} />
            <input placeholder="Return carrier (optional)" value={returnCarrier} onChange={e => setReturnCarrier(e.target.value)} style={{ padding: '0.5rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.875rem' }} />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => initiateReturn.mutate()} disabled={!returnReason || initiateReturn.isPending} style={{ padding: '0.5rem 1rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.875rem', cursor: 'pointer' }}>
                {initiateReturn.isPending ? 'Initiating...' : 'Confirm Return'}
              </button>
              <button onClick={() => setInitiatingReturn(false)} style={{ padding: '0.5rem 1rem', background: 'var(--color-surface)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.875rem', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 10 }}>
      <p style={{ color: 'var(--color-text-muted-lighter)', fontSize: '0.875rem' }}>Returns are available for delivered or failed delivery waybills.</p>
    </div>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { returnService } from '@/services/api'
import type { ReturnStatus } from '@/types/waybill'
import { RETURN_LABELS, RETURN_COLORS } from '@/types/waybill'
import { ArrowLeftRight, RefreshCw, Truck, MapPin } from 'lucide-react'
import PageContainer from '@/components/PageContainer'

const NEXT_STATUS: Record<string, string> = {
  RETURN_REQUESTED: 'RETURN_IN_TRANSIT',
  RETURN_IN_TRANSIT: 'RETURN_RECEIVED',
  RETURN_RECEIVED: 'RETURN_COMPLETED',
}

export default function ReturnsPage() {
  const queryClient = useQueryClient()
  const [reason, setReason] = useState('')
  const [carrier, setCarrier] = useState('')
  const [notes, setNotes] = useState('')
  const [initiatingId, setInitiatingId] = useState<string | null>(null)

  const { data: returns, isLoading } = useQuery({
    queryKey: ['returns'],
    queryFn: () => returnService.listReturns().then(r => r.data),
  })

  const initiateReturn = useMutation({
    mutationFn: (waybillId: string) =>
      returnService.initiateReturn(waybillId, { reason, carrier, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] })
      setInitiatingId(null)
      setReason('')
      setCarrier('')
      setNotes('')
    },
  })

  const advanceReturn = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      returnService.updateReturnStatus(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['returns'] }),
  })

  const eligibleWaybills = returns?.filter((r: any) => !r.returnInfo)

  const eligible = !returns ? [] : [
    { id: 'wb2', trackingNumber: 'WBT-2024-00002', recipientName: 'Bob Smith', destination: 'Cebu City', status: 'IN_TRANSIT' },
    { id: 'wb3', trackingNumber: 'WBT-2024-00003', recipientName: 'Carol Santos', destination: 'Davao City', status: 'PICKED_UP' },
  ].filter(e => !returns.find((r: any) => r.id === e.id) || false)

  return (
    <PageContainer title="Returns & Reverse Logistics" icon={<ArrowLeftRight size={22} />}>
      {initiatingId && (
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: 10, marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
          <h4 style={{ fontWeight: 600, marginBottom: '1rem' }}>Initiate Return for {initiatingId}</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: 400 }}>
            <input placeholder="Reason (e.g. Damaged, Wrong item)" value={reason} onChange={e => setReason(e.target.value)} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.875rem' }} />
            <input placeholder="Return Carrier (optional)" value={carrier} onChange={e => setCarrier(e.target.value)} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.875rem' }} />
            <input placeholder="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.875rem' }} />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => initiateReturn.mutate(initiatingId)} disabled={!reason || initiateReturn.isPending} style={{ padding: '0.5rem 1rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.875rem', cursor: 'pointer' }}>
                {initiateReturn.isPending ? 'Initiating...' : 'Confirm Return'}
              </button>
              <button onClick={() => setInitiatingId(null)} style={{ padding: '0.5rem 1rem', background: '#fff', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.875rem', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', fontSize: '0.875rem', textAlign: 'left' }}>
          <thead style={{ background: '#f8fafc', color: '#64748b' }}>
            <tr>
              <th style={{ padding: '0.75rem 1rem' }}>Tracking #</th>
              <th style={{ padding: '0.75rem 1rem' }}>Recipient</th>
              <th style={{ padding: '0.75px 1rem' }}>Origin → Destination</th>
              <th style={{ padding: '0.75rem 1rem' }}>Return Status</th>
              <th style={{ padding: '0.75rem 1rem' }}>Reason</th>
              <th style={{ padding: '0.75rem 1rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody style={{ borderTop: '1px solid #f1f5f9' }}>
            {isLoading ? (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading...</td></tr>
            ) : !returns?.length ? (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No returns yet.</td></tr>
            ) : (
              returns.map((r: any) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <Link to={`/waybills/${r.id}`} style={{ color: '#2563eb', fontWeight: 500, textDecoration: 'none' }}>{r.trackingNumber}</Link>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>{r.recipientName}</td>
                  <td style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <MapPin size={12} /> {r.origin} → {r.destination}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ display: 'inline-block', padding: '0.25rem 0.625rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600, background: RETURN_COLORS[r.returnInfo.status as ReturnStatus] + '20', color: RETURN_COLORS[r.returnInfo.status as ReturnStatus] }}>
                      {RETURN_LABELS[r.returnInfo.status as ReturnStatus] || r.returnInfo.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#475569', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.returnInfo.reason}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {NEXT_STATUS[r.returnInfo.status] && (
                      <button onClick={() => advanceReturn.mutate({ id: r.id, status: NEXT_STATUS[r.returnInfo.status] })} disabled={advanceReturn.isPending} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.75rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer' }}>
                        <RefreshCw size={12} /> {RETURN_LABELS[NEXT_STATUS[r.returnInfo.status] as ReturnStatus]}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </PageContainer>
  )
}
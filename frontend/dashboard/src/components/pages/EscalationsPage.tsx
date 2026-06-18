import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { escalationService } from '@/services/api'
import { CheckCircle, Eye } from 'lucide-react'
import PageContainer from '@/components/PageContainer'

const STATUS_COLORS: Record<string, string> = {
  OPEN: '#dc2626',
  ACKNOWLEDGED: '#d97706',
  RESOLVED: '#16a34a',
}

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open',
  ACKNOWLEDGED: 'Acknowledged',
  RESOLVED: 'Resolved',
}

export default function EscalationsPage() {
  const queryClient = useQueryClient()

  const { data: escalations, isLoading } = useQuery({
    queryKey: ['escalations'],
    queryFn: () => escalationService.list().then(r => r.data),
    refetchInterval: 15000,
  })

  const acknowledge = useMutation({
    mutationFn: (id: string) => escalationService.acknowledge(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['escalations'] }),
  })

  const resolve = useMutation({
    mutationFn: (id: string) => escalationService.resolve(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['escalations'] }),
  })

  const openCount = escalations?.filter((e: any) => e.status === 'OPEN').length || 0
  const ackCount = escalations?.filter((e: any) => e.status === 'ACKNOWLEDGED').length || 0

  return (
    <PageContainer
      title="Escalations"
      actions={
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
          <span style={{ color: '#dc2626' }}>Open: <strong>{openCount}</strong></span>
          <span style={{ color: '#d97706' }}>Acknowledged: <strong>{ackCount}</strong></span>
        </div>
      }
    >
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', fontSize: '0.875rem', textAlign: 'left' }}>
          <thead style={{ background: '#f8fafc', color: '#64748b' }}>
            <tr>
              <th style={{ padding: '0.75rem 1rem' }}>Tracking #</th>
              <th style={{ padding: '0.75rem 1rem' }}>Rule</th>
              <th style={{ padding: '0.75rem 1rem' }}>Reason</th>
              <th style={{ padding: '0.75rem 1rem' }}>Status</th>
              <th style={{ padding: '0.75rem 1rem' }}>Escalated To</th>
              <th style={{ padding: '0.75rem 1rem' }}>Created</th>
              <th style={{ padding: '0.75rem 1rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading...</td></tr>
            ) : !escalations?.length ? (
              <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No escalations.</td></tr>
            ) : (
              escalations.map((esc: any) => (
                <tr key={esc.id} style={{ borderBottom: '1px solid #f1f5f9', background: esc.status === 'OPEN' ? '#fef2f2' : undefined }}>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <Link to={`/waybills/${esc.waybillId}`} style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>
                      {esc.trackingNumber}
                    </Link>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>{esc.ruleName}</td>
                  <td style={{ padding: '0.75rem 1rem', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{esc.reason}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ display: 'inline-block', padding: '0.25rem 0.625rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600, background: STATUS_COLORS[esc.status] + '20', color: STATUS_COLORS[esc.status] }}>
                      {STATUS_LABELS[esc.status]}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>{esc.escalatedTo}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#64748b', fontSize: '0.8125rem' }}>{new Date(esc.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                      {esc.status === 'OPEN' && (
                        <button onClick={() => acknowledge.mutate(esc.id)} disabled={acknowledge.isPending} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.75rem', background: '#d97706', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer' }}>
                          <Eye size={12} /> Acknowledge
                        </button>
                      )}
                      {esc.status !== 'RESOLVED' && (
                        <button onClick={() => resolve.mutate(esc.id)} disabled={resolve.isPending} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.75rem', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer' }}>
                          <CheckCircle size={12} /> Resolve
                        </button>
                      )}
                    </div>
                    {esc.acknowledgedBy && <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.25rem' }}>by {esc.acknowledgedBy}</div>}
                    {esc.resolvedBy && <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.25rem' }}>by {esc.resolvedBy}</div>}
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
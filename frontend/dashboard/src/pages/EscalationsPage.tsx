import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { escalationService } from '@/services/api'
import { CheckCircle, Eye, AlertTriangle } from 'lucide-react'
import PageContainer from '@/components/PageContainer'
import { SkeletonTableRow } from '@/components/Skeleton'
import EmptyState from '@/components/EmptyState'
import BackButton from '@/components/BackButton'

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'var(--status-red)',
  ACKNOWLEDGED: 'var(--status-amber)',
  RESOLVED: 'var(--status-green)',
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

  const openCount = escalations?.filter((e: any) => e?.status === 'OPEN').length || 0
  const ackCount = escalations?.filter((e: any) => e?.status === 'ACKNOWLEDGED').length || 0

  return (
    <PageContainer
      title="Escalations"
      actions={
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
          <span style={{ color: 'var(--status-red)' }}>Open: <strong>{openCount}</strong></span>
          <span style={{ color: 'var(--status-amber)' }}>Acknowledged: <strong>{ackCount}</strong></span>
        </div>
      }
    >
      <BackButton fallback="/dashboard" />
      <div style={{ background: 'var(--color-surface)', borderRadius: 10, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', fontSize: '0.875rem', textAlign: 'left' }}>
          <thead style={{ background: 'var(--color-surface-hover)', color: 'var(--color-text-muted)' }}>
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
              Array.from({ length: 4 }).map((_, i) => <SkeletonTableRow key={i} cols={7} />)
            ) : !escalations?.length ? (
              <tr><td colSpan={7}><EmptyState icon={AlertTriangle} title="No escalations" message="No shipment issues have been escalated yet." /></td></tr>
            ) : (
              escalations.map((esc: any) => (
                <tr key={esc.id} style={{ borderBottom: '1px solid var(--color-border-subtle)', background: esc.status === 'OPEN' ? 'var(--badge-red-bg)' : undefined }}>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <Link to={`/waybills/${esc.waybillId}`} style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>
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
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>{new Date(esc.createdAt).toLocaleDateString()}</td>
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
                    {esc.acknowledgedBy && <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted-lighter)', marginTop: '0.25rem' }}>by {esc.acknowledgedBy}</div>}
                    {esc.resolvedBy && <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted-lighter)', marginTop: '0.25rem' }}>by {esc.resolvedBy}</div>}
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
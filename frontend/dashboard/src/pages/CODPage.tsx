import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { codService } from '@/services/api'
import type { CodPayment } from '@/types/waybill'
import { DollarSign, CheckCircle, AlertTriangle, RotateCcw, Search, Wallet, TrendingUp } from 'lucide-react'
import { SkeletonBlock } from '@/components/Skeleton'

const STATUS_STYLE: Record<string, { label: string; bg: string; color: string }> = {
  COLLECTED: { label: 'Collected', bg: '#dbeafe', color: 'var(--badge-blue-text)' },
  PENDING_SETTLEMENT: { label: 'Pending Settlement', bg: '#fef3c7', color: 'var(--badge-amber-text)' },
  SETTLED: { label: 'Settled', bg: '#dcfce7', color: 'var(--badge-green-text)' },
  DISPUTED: { label: 'Disputed', bg: '#fecaca', color: 'var(--badge-red-text)' },
  REFUNDED: { label: 'Refunded', bg: 'var(--color-bg)', color: '#64748b' },
}

const fmt = (n: number) => '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2 })

export default function CODPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data: payments, isLoading } = useQuery({
    queryKey: ['cod-payments'],
    queryFn: () => codService.list().then(r => r.data),
  })

  const settle = useMutation({
    mutationFn: (id: string) => codService.settle(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cod-payments'] }),
  })
  const dispute = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => codService.dispute(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cod-payments'] }),
  })
  const refund = useMutation({
    mutationFn: (id: string) => codService.refund(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cod-payments'] }),
  })

  const data = useMemo(() => (payments || []).filter((p: CodPayment) => {
    if (search && !p.trackingNumber.toLowerCase().includes(search.toLowerCase()) && !p.shipperName.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter && p.status !== statusFilter) return false
    return true
  }), [payments, search, statusFilter])

  const totalCollected = useMemo(() => (payments || []).reduce((s: number, p: CodPayment) => s + p.amount, 0), [payments])
  const totalPending = useMemo(() => (payments || []).filter((p: CodPayment) => p.status === 'PENDING_SETTLEMENT').reduce((s: number, p: CodPayment) => s + p.netAmount, 0), [payments])
  const totalSettled = useMemo(() => (payments || []).filter((p: CodPayment) => p.status === 'SETTLED').reduce((s: number, p: CodPayment) => s + p.netAmount, 0), [payments])
  const totalDisputed = useMemo(() => (payments || []).filter((p: CodPayment) => p.status === 'DISPUTED').reduce((s: number, p: CodPayment) => s + p.amount, 0), [payments])

  const [disputeModal, setDisputeModal] = useState<{ id: string; reason: string } | null>(null)

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>COD Reconciliation</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { icon: DollarSign, label: 'Total Collected', value: fmt(totalCollected), bg: '#eff6ff', color: 'var(--color-primary)' },
          { icon: Wallet, label: 'Pending Settlement', value: fmt(totalPending), bg: '#fef3c7', color: 'var(--badge-amber-text)' },
          { icon: CheckCircle, label: 'Settled', value: fmt(totalSettled), bg: '#dcfce7', color: 'var(--badge-green-text)' },
          { icon: AlertTriangle, label: 'Disputed', value: fmt(totalDisputed), bg: '#fecaca', color: 'var(--badge-red-text)' },
        ].map(card => (
          <div key={card.label} style={{ background: 'var(--color-surface)', borderRadius: 10, padding: '1.25rem', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <card.icon size={18} color={card.color} />
              </div>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>{card.label}</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted-lighter)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tracking # or shipper..."
            style={{ width: '100%', padding: '0.625rem 0.75rem 0.625rem 2.25rem', border: '1px solid var(--color-border-input)', borderRadius: 8, fontSize: '0.875rem', background: 'var(--color-input-bg)', color: 'var(--color-text-primary)' }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '0.625rem 1rem', border: '1px solid var(--color-border-input)', borderRadius: 8, fontSize: '0.875rem', background: 'var(--color-input-bg)', color: 'var(--color-text-primary)', minWidth: 180 }}>
          <option value="">All Statuses</option>
          {Object.entries(STATUS_STYLE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
          {data.length} of {(payments || []).length} payments
        </span>
      </div>

      {isLoading ? (
        <SkeletonBlock height={300} />
      ) : !data.length ? (
        <div style={{ background: 'var(--color-surface)', borderRadius: 12, padding: '2rem', textAlign: 'center', border: '1px solid var(--color-border)' }}>
          <DollarSign size={40} color="var(--color-text-muted-lighter)" style={{ marginBottom: '0.75rem' }} />
          <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>No COD payments found.</p>
        </div>
      ) : (
        <div style={{ background: 'var(--color-surface)', borderRadius: 12, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'var(--color-table-header-bg)', color: 'var(--color-text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Tracking #</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Shipper</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Recipient</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Fee</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Net</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Carrier</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((p: CodPayment) => {
                  const sc = STATUS_STYLE[p.status] || STATUS_STYLE.COLLECTED
                  return (
                    <tr key={p.id} style={{ borderTop: '1px solid var(--color-border-subtle)', transition: 'background 0.12s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: 500, color: 'var(--color-text-primary)' }}>{p.trackingNumber}</td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)' }}>{p.shipperName}</td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)' }}>{p.recipientName}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: 'var(--color-text-primary)' }}>{fmt(p.amount)}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'var(--color-text-muted)' }}>{fmt(p.fee)}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: 'var(--color-text-primary)' }}>{fmt(p.netAmount)}</td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-secondary)' }}>{p.carrierName}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.625rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600, background: sc.bg, color: sc.color }}>
                          {p.status === 'SETTLED' ? <CheckCircle size={12} /> : p.status === 'DISPUTED' ? <AlertTriangle size={12} /> : p.status === 'REFUNDED' ? <RotateCcw size={12} /> : null}
                          {sc.label}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', gap: '0.375rem' }}>
                          {p.status === 'COLLECTED' && (
                            <button onClick={() => settle.mutate(p.id)} disabled={settle.isPending}
                              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.3rem 0.625rem', borderRadius: 6, fontSize: '0.6875rem', fontWeight: 500, cursor: 'pointer', border: 'none', background: '#16a34a', color: '#fff' }}>
                              <CheckCircle size={12} /> Settle
                            </button>
                          )}
                          {p.status === 'PENDING_SETTLEMENT' && (
                            <button onClick={() => settle.mutate(p.id)} disabled={settle.isPending}
                              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.3rem 0.625rem', borderRadius: 6, fontSize: '0.6875rem', fontWeight: 500, cursor: 'pointer', border: 'none', background: '#2563eb', color: '#fff' }}>
                              <TrendingUp size={12} /> Mark Settled
                            </button>
                          )}
                          {['COLLECTED', 'PENDING_SETTLEMENT'].includes(p.status) && (
                            <button onClick={() => setDisputeModal({ id: p.id, reason: '' })}
                              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.3rem 0.625rem', borderRadius: 6, fontSize: '0.6875rem', fontWeight: 500, cursor: 'pointer', border: 'none', background: '#dc2626', color: '#fff' }}>
                              <AlertTriangle size={12} /> Dispute
                            </button>
                          )}
                          {p.status === 'DISPUTED' && (
                            <button onClick={() => refund.mutate(p.id)} disabled={refund.isPending}
                              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.3rem 0.625rem', borderRadius: 6, fontSize: '0.6875rem', fontWeight: 500, cursor: 'pointer', border: 'none', background: '#7c3aed', color: '#fff' }}>
                              <RotateCcw size={12} /> Refund
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {disputeModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--color-overlay)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: 12, padding: '1.5rem', width: 400, maxWidth: '90vw', border: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--color-text-primary)' }}>Flag Dispute</h3>
            <textarea value={disputeModal.reason} onChange={e => setDisputeModal({ ...disputeModal, reason: e.target.value })}
              placeholder="Describe the reason for dispute..."
              rows={3}
              style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--color-border-input)', borderRadius: 8, fontSize: '0.875rem', resize: 'vertical', background: 'var(--color-input-bg)', color: 'var(--color-text-primary)', marginBottom: '1rem' }} />
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setDisputeModal(null)}
                style={{ padding: '0.5rem 1rem', borderRadius: 6, cursor: 'pointer', border: '1px solid var(--color-border-input)', background: 'transparent', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Cancel</button>
              <button onClick={() => { dispute.mutate({ id: disputeModal.id, reason: disputeModal.reason }); setDisputeModal(null) }} disabled={!disputeModal.reason || dispute.isPending}
                style={{ padding: '0.5rem 1rem', borderRadius: 6, cursor: 'pointer', border: 'none', background: '#dc2626', color: '#fff', fontSize: '0.875rem', fontWeight: 500 }}>Flag Dispute</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

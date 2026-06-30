import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { escalationService, escalationRuleService } from '@/services/api'
import type { EscalationRule } from '@/types/waybill'
import { CheckCircle, Eye, AlertTriangle, Plus, Pencil, Trash2, X, Settings } from 'lucide-react'
import PageContainer from '@/components/PageContainer'
import { SkeletonTableRow, SkeletonBlock } from '@/components/Skeleton'
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

const BLANK_RULE: Partial<EscalationRule> = { name: '', condition: 'STATUS_STUCK', threshold: 24, targetRole: '', isActive: true }

function RuleModal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
      <div style={{ background: 'var(--color-surface)', borderRadius: 12, padding: '1.5rem', width: '100%', maxWidth: 480, boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

function RuleForm({ value, onChange }: { value: Partial<EscalationRule>; onChange: (v: Partial<EscalationRule>) => void }) {
  const f = (k: keyof EscalationRule, v: any) => onChange({ ...value, [k]: v })
  return (
    <>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>Rule Name</label>
        <input value={value.name || ''} onChange={e => f('name', e.target.value)} placeholder="e.g. 24h Stuck Shipment"
          style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: '0.875rem', background: 'var(--color-surface)' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>Condition</label>
          <select value={value.condition || 'STATUS_STUCK'} onChange={e => f('condition', e.target.value)}
            style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: '0.875rem', background: 'var(--color-surface)' }}>
            {['SLA_BREACHED', 'EXCEPTION_AGE', 'STATUS_STUCK', 'HIGH_VALUE'].map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>Threshold (hours)</label>
          <input type="number" min={1} value={value.threshold || 24} onChange={e => f('threshold', Number(e.target.value))}
            style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: '0.875rem', background: 'var(--color-surface)' }} />
        </div>
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>Target Role / Email</label>
        <input value={value.targetRole || ''} onChange={e => f('targetRole', e.target.value)} placeholder="ops-manager@example.com or MANAGER"
          style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: '0.875rem', background: 'var(--color-surface)' }} />
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', marginBottom: '1rem' }}>
        <input type="checkbox" checked={!!value.isActive} onChange={e => f('isActive', e.target.checked)} /> Active
      </label>
    </>
  )
}

export default function EscalationsPage() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<'events' | 'rules'>('events')
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<EscalationRule | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [ruleForm, setRuleForm] = useState<Partial<EscalationRule>>(BLANK_RULE)
  const [ruleError, setRuleError] = useState('')

  const { data: escalations, isLoading } = useQuery({
    queryKey: ['escalations'],
    queryFn: () => escalationService.list().then(r => r.data),
    refetchInterval: 15000,
  })

  const { data: rules, isLoading: loadingRules } = useQuery({
    queryKey: ['escalation-rules'],
    queryFn: () => escalationRuleService.list().then(r => r.data),
  })

  const acknowledge = useMutation({
    mutationFn: (id: string) => escalationService.acknowledge(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['escalations'] }),
  })
  const resolve = useMutation({
    mutationFn: (id: string) => escalationService.resolve(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['escalations'] }),
  })
  const createRule = useMutation({
    mutationFn: (d: Partial<EscalationRule>) => escalationRuleService.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['escalation-rules'] }); setShowCreate(false); setRuleForm(BLANK_RULE); setRuleError('') },
    onError: (e: any) => setRuleError(e?.response?.data?.error || 'Create failed'),
  })
  const updateRule = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EscalationRule> }) => escalationRuleService.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['escalation-rules'] }); setEditing(null); setRuleError('') },
    onError: (e: any) => setRuleError(e?.response?.data?.error || 'Update failed'),
  })
  const deleteRule = useMutation({
    mutationFn: (id: string) => escalationRuleService.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['escalation-rules'] }); setDeleteId(null) },
  })

  const openCount = escalations?.filter((e: any) => e?.status === 'OPEN').length || 0
  const ackCount = escalations?.filter((e: any) => e?.status === 'ACKNOWLEDGED').length || 0

  const tabBtn = (t: typeof tab) => ({
    padding: '0.5rem 1.25rem', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
    borderRadius: 8, background: tab === t ? '#2563eb' : 'var(--color-bg)',
    color: tab === t ? '#fff' : 'var(--color-text-secondary)',
  })

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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button style={tabBtn('events')} onClick={() => setTab('events')}><AlertTriangle size={14} style={{ marginRight: '0.375rem' }} />Events</button>
          <button style={tabBtn('rules')} onClick={() => setTab('rules')}><Settings size={14} style={{ marginRight: '0.375rem' }} />Rules</button>
        </div>
        {tab === 'rules' && (
          <button onClick={() => { setRuleForm(BLANK_RULE); setRuleError(''); setShowCreate(true) }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem' }}>
            <Plus size={15} /> New Rule
          </button>
        )}
      </div>

      {tab === 'events' && (
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
      )}

      {tab === 'rules' && (
        <div>
          {loadingRules ? (
            <div style={{ display: 'grid', gap: '0.75rem' }}><SkeletonBlock height={80} /><SkeletonBlock height={80} /></div>
          ) : !rules?.length ? (
            <div style={{ background: 'var(--color-surface)', padding: '2rem', borderRadius: 10, textAlign: 'center', color: 'var(--color-text-muted-lighter)' }}>
              <AlertTriangle size={36} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
              <p style={{ fontWeight: 500 }}>No escalation rules. Click "New Rule" to add one.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {rules.map((rule: EscalationRule) => (
                <div key={rule.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', background: 'var(--color-surface)', borderRadius: 10, border: '1px solid var(--color-border)', opacity: rule.isActive ? 1 : 0.6 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {rule.name}
                      <span style={{ padding: '0.125rem 0.5rem', borderRadius: 999, fontSize: '0.6875rem', fontWeight: 600, background: rule.isActive ? 'var(--badge-green-bg)' : 'var(--color-bg)', color: rule.isActive ? 'var(--badge-green-text)' : 'var(--color-text-muted)' }}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <span>Condition: {rule.condition?.replace(/_/g, ' ')}</span>
                      <span>Threshold: {rule.threshold}h</span>
                      <span>Target: {rule.targetRole}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
                    <button onClick={() => { setEditing(rule); setRuleError('') }}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.75rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer', background: 'transparent', color: 'var(--color-text-muted)' }}>
                      <Pencil size={12} /> Edit
                    </button>
                    <button onClick={() => setDeleteId(rule.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.75rem', border: 'none', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer', background: '#dc2626', color: '#fff' }}>
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showCreate && (
        <RuleModal title="New Escalation Rule" onClose={() => setShowCreate(false)}>
          <RuleForm value={ruleForm} onChange={setRuleForm} />
          {ruleError && <p style={{ color: 'var(--badge-red-text)', fontSize: '0.8125rem', marginBottom: '1rem' }}>{ruleError}</p>}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowCreate(false)} style={{ padding: '0.625rem 1.25rem', border: '1px solid var(--color-border)', borderRadius: 8, background: 'var(--color-surface)', cursor: 'pointer', fontSize: '0.875rem' }}>Cancel</button>
            <button onClick={() => createRule.mutate(ruleForm)} disabled={createRule.isPending || !ruleForm.name}
              style={{ padding: '0.625rem 1.25rem', border: 'none', borderRadius: 8, background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>
              {createRule.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </RuleModal>
      )}

      {editing && (
        <RuleModal title="Edit Escalation Rule" onClose={() => setEditing(null)}>
          <RuleForm value={editing} onChange={v => setEditing(v as EscalationRule)} />
          {ruleError && <p style={{ color: 'var(--badge-red-text)', fontSize: '0.8125rem', marginBottom: '1rem' }}>{ruleError}</p>}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button onClick={() => setEditing(null)} style={{ padding: '0.625rem 1.25rem', border: '1px solid var(--color-border)', borderRadius: 8, background: 'var(--color-surface)', cursor: 'pointer', fontSize: '0.875rem' }}>Cancel</button>
            <button onClick={() => updateRule.mutate({ id: editing.id, data: editing })} disabled={updateRule.isPending}
              style={{ padding: '0.625rem 1.25rem', border: 'none', borderRadius: 8, background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>
              {updateRule.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </RuleModal>
      )}

      {deleteId && (
        <RuleModal title="Delete Rule?" onClose={() => setDeleteId(null)}>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>This escalation rule will be permanently deleted. Existing escalation events are not affected.</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button onClick={() => setDeleteId(null)} style={{ padding: '0.625rem 1.25rem', border: '1px solid var(--color-border)', borderRadius: 8, background: 'var(--color-surface)', cursor: 'pointer', fontSize: '0.875rem' }}>Cancel</button>
            <button onClick={() => deleteRule.mutate(deleteId)} disabled={deleteRule.isPending}
              style={{ padding: '0.625rem 1.25rem', border: 'none', borderRadius: 8, background: '#dc2626', color: '#fff', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>
              {deleteRule.isPending ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </RuleModal>
      )}
    </PageContainer>
  )
}
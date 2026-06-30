import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { autoCommunicationService } from '@/services/api'
import type { AutoCommunicationRule } from '@/types/waybill'
import { Bell, Mail, MessageSquare, Plus, Check, X, Clock, Truck, AlertTriangle, Package, Trash2 } from 'lucide-react'
import BackButton from '@/components/BackButton'

const TRIGGER_LABELS: Record<string, string> = {
  STATUS_CHANGE: 'Status Change',
  SLA_BREACHED: 'SLA Breached',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  EXCEPTION_RAISED: 'Exception Raised',
  RETURN_INITIATED: 'Return Initiated',
}

const CHANNEL_ICONS = { EMAIL: Mail, SMS: MessageSquare }
const BLANK_FORM = { trigger: 'STATUS_CHANGE', channel: 'EMAIL' as 'EMAIL' | 'SMS', subject: '', template: '', sendToShipper: true, sendToRecipient: true }

export default function AutoCommunicationsPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'rules' | 'log'>('rules')
  const [showForm, setShowForm] = useState(false)
  const [editingRule, setEditingRule] = useState<AutoCommunicationRule | null>(null)
  const [form, setForm] = useState(BLANK_FORM)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: rules = [] } = useQuery({
    queryKey: ['auto-comm-rules'],
    queryFn: () => autoCommunicationService.listRules().then(r => {
      const d = r.data
      return Array.isArray(d) ? d : (d as any)?.items ?? (d as any)?.data ?? []
    }),
  })

  const { data: logs = [] } = useQuery({
    queryKey: ['auto-comm-logs'],
    queryFn: () => autoCommunicationService.listLogs().then(r => {
      const d = r.data
      return Array.isArray(d) ? d : (d as any)?.items ?? (d as any)?.data ?? []
    }),
  })

  const createRule = useMutation({
    mutationFn: (d: Partial<AutoCommunicationRule>) => autoCommunicationService.createRule(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['auto-comm-rules'] }); setShowForm(false); setForm(BLANK_FORM) },
  })

  const updateRule = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AutoCommunicationRule> }) => autoCommunicationService.updateRule(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['auto-comm-rules'] }); setEditingRule(null); setShowForm(false); setForm(BLANK_FORM) },
  })

  const deleteRule = useMutation({
    mutationFn: (id: string) => autoCommunicationService.deleteRule(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['auto-comm-rules'] }); setDeleteId(null) },
  })

  const toggleActive = (rule: AutoCommunicationRule) => {
    updateRule.mutate({ id: rule.id, data: { isActive: !rule.isActive } })
  }

  const resetForm = () => setForm(BLANK_FORM)

  const saveRule = () => {
    if (editingRule) {
      updateRule.mutate({ id: editingRule.id, data: form })
    } else {
      createRule.mutate({ ...form, isActive: true })
    }
  }

  const tabStyle = (tab: typeof activeTab) => ({
    padding: '0.625rem 1.25rem', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
    borderRadius: 8, background: activeTab === tab ? '#2563eb' : 'var(--color-bg)',
    color: activeTab === tab ? '#fff' : 'var(--color-text-secondary)', transition: 'all 0.15s',
  })

  return (
    <div>
      <BackButton fallback="/dashboard" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Automated Customer Communications</h2>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            {(rules as AutoCommunicationRule[]).filter(r => r.isActive).length} active notification rules
          </p>
        </div>
        <button onClick={() => { setEditingRule(null); resetForm(); setShowForm(true) }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
          <Plus size={16} /> New Rule
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button onClick={() => setActiveTab('rules')} style={tabStyle('rules')}><Bell size={14} style={{ marginRight: '0.375rem' }} /> Notification Rules</button>
        <button onClick={() => setActiveTab('log')} style={tabStyle('log')}><Clock size={14} style={{ marginRight: '0.375rem' }} /> Communication Log</button>
      </div>

      {showForm && (
        <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 12, marginBottom: '1.5rem', border: '1px solid var(--color-border)' }}>
          <h4 style={{ fontWeight: 600, margin: '0 0 1rem' }}>{editingRule ? 'Edit Rule' : 'New Notification Rule'}</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>Trigger Event</label>
              <select value={form.trigger} onChange={e => setForm({ ...form, trigger: e.target.value })}
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.875rem' }}>
                {Object.entries(TRIGGER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>Channel</label>
              <select value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value as any })}
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.875rem' }}>
                <option value="EMAIL">Email</option>
                <option value="SMS">SMS</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>Subject Line</label>
            <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
              style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.875rem' }} placeholder="e.g. Your package {tracking} is out for delivery" />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>Message Template</label>
            <textarea value={form.template} onChange={e => setForm({ ...form, template: e.target.value })}
              style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.875rem', minHeight: 80, resize: 'vertical', fontFamily: 'inherit' }}
              placeholder='Available variables: {tracking}, {recipient}, {shipper}, {origin}, {destination}, {eta}, {carrier}, {exception}, {reason}' />
            <p style={{ margin: '0.375rem 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted-lighter)' }}>Use {'{variable}'} placeholders: tracking, recipient, shipper, origin, destination, eta, carrier, exception, reason</p>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.sendToShipper} onChange={e => setForm({ ...form, sendToShipper: e.target.checked })} /> Notify Shipper
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.sendToRecipient} onChange={e => setForm({ ...form, sendToRecipient: e.target.checked })} /> Notify Recipient
            </label>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={saveRule} disabled={!form.subject || !form.template || createRule.isPending || updateRule.isPending}
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}>
              <Check size={14} /> {editingRule ? 'Update' : 'Create'} Rule
            </button>
            <button onClick={() => { setShowForm(false); setEditingRule(null); resetForm() }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', background: 'transparent', color: 'var(--color-text-muted)', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.875rem', cursor: 'pointer' }}>
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      )}

      {activeTab === 'rules' && (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {(rules as AutoCommunicationRule[]).map((rule: AutoCommunicationRule) => {
            const ChanIcon = CHANNEL_ICONS[rule.channel as keyof typeof CHANNEL_ICONS]
            const TriggerIcon = rule.trigger === 'DELIVERED' ? Package : rule.trigger === 'SLA_BREACHED' ? AlertTriangle : rule.trigger === 'OUT_FOR_DELIVERY' ? Truck : Bell
            return (
              <div key={rule.id} style={{ background: 'var(--color-surface)', borderRadius: 12, padding: '1.25rem', border: '1px solid var(--color-border)', opacity: rule.isActive ? 1 : 0.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', flex: 1 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: rule.isActive ? 'var(--color-primary-soft)' : 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ChanIcon size={20} color={rule.isActive ? 'var(--badge-blue-text)' : 'var(--color-text-muted-lighter)'} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '1rem' }}>{rule.subject}</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.5rem', borderRadius: 999, fontSize: '0.6875rem', fontWeight: 600, background: 'var(--color-primary-soft)', color: 'var(--color-primary)' }}>
                          <TriggerIcon size={10} /> {TRIGGER_LABELS[rule.trigger] || rule.trigger}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.5rem', borderRadius: 999, fontSize: '0.6875rem', fontWeight: 600, background: rule.channel === 'EMAIL' ? 'var(--badge-green-bg)' : 'var(--badge-red-bg)', color: rule.channel === 'EMAIL' ? 'var(--badge-green-text)' : 'var(--badge-red-text)' }}>
                          <ChanIcon size={10} /> {rule.channel}
                        </span>
                      </div>
                      <p style={{ margin: '0.375rem 0 0', fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{rule.template}</p>
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted-lighter)' }}>
                        <span>To: {rule.sendToShipper ? 'Shipper' : ''}{rule.sendToShipper && rule.sendToRecipient ? ' + ' : ''}{rule.sendToRecipient ? 'Recipient' : ''}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.375rem', marginLeft: '1rem' }}>
                    <button onClick={() => toggleActive(rule)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.75rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer', border: '1px solid var(--color-border-input)', background: 'transparent', color: 'var(--color-text-muted)' }}>
                      {rule.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => { setForm({ trigger: rule.trigger, channel: rule.channel, subject: rule.subject, template: rule.template, sendToShipper: rule.sendToShipper, sendToRecipient: rule.sendToRecipient }); setEditingRule(rule); setShowForm(true) }}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.75rem', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer', border: '1px solid var(--color-primary)', background: 'transparent', color: 'var(--color-primary)' }}>
                      Edit
                    </button>
                    <button onClick={() => setDeleteId(rule.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.75rem', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer', border: 'none', background: '#dc2626', color: '#fff' }}>
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {activeTab === 'log' && (
        <div style={{ background: 'var(--color-surface)', borderRadius: 12, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', fontSize: '0.875rem', textAlign: 'left', borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr>
                <th style={{ padding: '0.875rem 1.25rem', background: 'var(--color-surface-hover)', color: 'var(--color-text-muted)', fontWeight: 600, borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>Tracking #</th>
                <th style={{ padding: '0.875rem 1.25rem', background: 'var(--color-surface-hover)', color: 'var(--color-text-muted)', fontWeight: 600, borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>Channel</th>
                <th style={{ padding: '0.875rem 1.25rem', background: 'var(--color-surface-hover)', color: 'var(--color-text-muted)', fontWeight: 600, borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>Recipient</th>
                <th style={{ padding: '0.875rem 1.25rem', background: 'var(--color-surface-hover)', color: 'var(--color-text-muted)', fontWeight: 600, borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>Subject</th>
                <th style={{ padding: '0.875rem 1.25rem', background: 'var(--color-surface-hover)', color: 'var(--color-text-muted)', fontWeight: 600, borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>Sent At</th>
                <th style={{ padding: '0.875rem 1.25rem', background: 'var(--color-surface-hover)', color: 'var(--color-text-muted)', fontWeight: 600, borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {(logs as any[]).map((log: any) => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <td style={{ padding: '0.875rem 1.25rem', fontWeight: 500, color: 'var(--color-primary)' }}>{log.trackingNumber}</td>
                  <td style={{ padding: '0.875rem 1.25rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0.5rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 500, background: log.channel === 'EMAIL' ? 'var(--badge-green-bg)' : 'var(--badge-red-bg)', color: log.channel === 'EMAIL' ? 'var(--badge-green-text)' : 'var(--badge-red-text)' }}>
                      {log.channel === 'EMAIL' ? <Mail size={12} /> : <MessageSquare size={12} />} {log.channel}
                    </span>
                  </td>
                  <td style={{ padding: '0.875rem 1.25rem', color: 'var(--color-text-primary)' }}>{log.recipient}</td>
                  <td style={{ padding: '0.875rem 1.25rem', color: 'var(--color-text-secondary)', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.subject}</td>
                  <td style={{ padding: '0.875rem 1.25rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{new Date(log.sentAt).toLocaleString()}</td>
                  <td style={{ padding: '0.875rem 1.25rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.5rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600, background: log.status === 'SENT' ? 'var(--badge-green-bg)' : 'var(--badge-red-bg)', color: log.status === 'SENT' ? 'var(--badge-green-text)' : 'var(--badge-red-text)' }}>
                      {log.status === 'SENT' ? <Check size={10} /> : <X size={10} />} {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: 12, padding: '1.5rem', maxWidth: 400, width: '100%' }}>
            <h3 style={{ fontWeight: 600, margin: '0 0 0.75rem' }}>Delete Rule?</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>This notification rule will be permanently deleted.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteId(null)} style={{ padding: '0.5rem 1rem', border: '1px solid var(--color-border)', borderRadius: 8, background: 'var(--color-surface)', cursor: 'pointer', fontSize: '0.875rem' }}>Cancel</button>
              <button onClick={() => deleteRule.mutate(deleteId)} disabled={deleteRule.isPending}
                style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: 8, background: '#dc2626', color: '#fff', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>
                {deleteRule.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

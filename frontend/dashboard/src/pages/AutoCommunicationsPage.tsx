import { useState } from 'react'
import { Bell, Mail, MessageSquare, Plus, Check, X, Clock, Truck, AlertTriangle, Package } from 'lucide-react'
import BackButton from '@/components/BackButton'

interface CommsRule {
  id: string
  trigger: string
  channel: 'EMAIL' | 'SMS'
  subject: string
  template: string
  sendToShipper: boolean
  sendToRecipient: boolean
  isActive: boolean
  createdAt: string
}

type CommsLog = {
  id: string
  ruleId: string
  trackingNumber: string
  channel: string
  recipient: string
  subject: string
  sentAt: string
  status: 'SENT' | 'FAILED'
}

const TRIGGER_LABELS: Record<string, string> = {
  STATUS_CHANGE: 'Status Change',
  SLA_BREACHED: 'SLA Breached',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  EXCEPTION_RAISED: 'Exception Raised',
  RETURN_INITIATED: 'Return Initiated',
}

const initialRules: CommsRule[] = [
  { id: 'comms-001', trigger: 'OUT_FOR_DELIVERY', channel: 'SMS', subject: 'Your package is out for delivery', template: 'Hi {recipient}, your package {tracking} is out for delivery today. ETA: {eta}', sendToShipper: false, sendToRecipient: true, isActive: true, createdAt: new Date().toISOString() },
  { id: 'comms-002', trigger: 'DELIVERED', channel: 'SMS', subject: 'Package delivered', template: 'Hi {recipient}, your package {tracking} has been delivered. Thank you!', sendToShipper: true, sendToRecipient: true, isActive: true, createdAt: new Date().toISOString() },
  { id: 'comms-003', trigger: 'SLA_BREACHED', channel: 'EMAIL', subject: 'SLA Breach Notice: {tracking}', template: 'The shipment {tracking} from {origin} to {destination} has exceeded its estimated delivery time.', sendToShipper: true, sendToRecipient: false, isActive: true, createdAt: new Date().toISOString() },
  { id: 'comms-004', trigger: 'EXCEPTION_RAISED', channel: 'EMAIL', subject: 'Delivery Exception: {tracking}', template: 'An exception has been raised for shipment {tracking}. Details: {exception}. Our team is working on it.', sendToShipper: true, sendToRecipient: true, isActive: false, createdAt: new Date().toISOString() },
  { id: 'comms-005', trigger: 'RETURN_INITIATED', channel: 'EMAIL', subject: 'Return initiated for {tracking}', template: 'A return has been initiated for {tracking}. Carrier: {carrier}. Reason: {reason}', sendToShipper: true, sendToRecipient: false, isActive: true, createdAt: new Date().toISOString() },
]

const seedLogs: CommsLog[] = [
  { id: 'log-001', ruleId: 'comms-001', trackingNumber: 'LBC-2024-1001', channel: 'SMS', recipient: '+63 917 555 1212', subject: 'Your package is out for delivery', sentAt: new Date(Date.now() - 28800000).toISOString(), status: 'SENT' },
  { id: 'log-002', ruleId: 'comms-002', trackingNumber: 'LBC-2024-1001', channel: 'SMS', recipient: '+63 917 555 1212', subject: 'Package delivered', sentAt: new Date(Date.now() - 14400000).toISOString(), status: 'SENT' },
  { id: 'log-003', ruleId: 'comms-003', trackingNumber: 'LBC-2024-1002', channel: 'EMAIL', recipient: 'shipper@example.com', subject: 'SLA Breach Notice: LBC-2024-1002', sentAt: new Date(Date.now() - 7200000).toISOString(), status: 'SENT' },
  { id: 'log-004', ruleId: 'comms-002', trackingNumber: 'GOGO-2024-5009', channel: 'SMS', recipient: '+63 918 111 2233', subject: 'Package delivered', sentAt: new Date(Date.now() - 86400000).toISOString(), status: 'SENT' },
  { id: 'log-005', ruleId: 'comms-001', trackingNumber: 'DHL-PH-45127', channel: 'SMS', recipient: '+63 921 777 8899', subject: 'Your package is out for delivery', sentAt: new Date(Date.now() - 3600000).toISOString(), status: 'FAILED' },
]

const CHANNEL_ICONS = { EMAIL: Mail, SMS: MessageSquare }

export default function AutoCommunicationsPage() {
  const [rules, setRules] = useState<CommsRule[]>(initialRules)
  const [logs] = useState<CommsLog[]>(seedLogs)
  const [activeTab, setActiveTab] = useState<'rules' | 'log'>('rules')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ trigger: 'STATUS_CHANGE', channel: 'EMAIL' as 'EMAIL' | 'SMS', subject: '', template: '', sendToShipper: true, sendToRecipient: true })

  const resetForm = () => setForm({ trigger: 'STATUS_CHANGE', channel: 'EMAIL', subject: '', template: '', sendToShipper: true, sendToRecipient: true })

  const saveRule = () => {
    if (editingId) {
      setRules(prev => prev.map(r => r.id === editingId ? { ...r, ...form } : r))
      setEditingId(null)
    } else {
      setRules(prev => [...prev, { id: 'comms-' + Date.now(), ...form, isActive: true, createdAt: new Date().toISOString() }])
    }
    setShowForm(false)
    resetForm()
  }

  const toggleActive = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r))
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
            {rules.filter(r => r.isActive).length} active notification rules
          </p>
        </div>
        <button onClick={() => { setEditingId(null); resetForm(); setShowForm(true) }}
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
          <h4 style={{ fontWeight: 600, margin: '0 0 1rem' }}>{editingId ? 'Edit Rule' : 'New Notification Rule'}</h4>
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
            <button onClick={saveRule} disabled={!form.subject || !form.template}
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}>
              <Check size={14} /> {editingId ? 'Update' : 'Create'} Rule
            </button>
            <button onClick={() => { setShowForm(false); setEditingId(null); resetForm() }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', background: 'transparent', color: 'var(--color-text-muted)', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.875rem', cursor: 'pointer' }}>
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      )}

      {activeTab === 'rules' && (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {rules.map(rule => {
            const ChanIcon = CHANNEL_ICONS[rule.channel]
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
                    <button onClick={() => toggleActive(rule.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.75rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer', border: '1px solid var(--color-border-input)', background: 'transparent', color: 'var(--color-text-muted)' }}>
                      {rule.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => { setForm({ trigger: rule.trigger, channel: rule.channel, subject: rule.subject, template: rule.template, sendToShipper: rule.sendToShipper, sendToRecipient: rule.sendToRecipient }); setEditingId(rule.id); setShowForm(true) }}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.75rem', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer', border: '1px solid var(--color-primary)', background: 'transparent', color: 'var(--color-primary)' }}>
                      Edit
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
              {logs.map(log => (
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
    </div>
  )
}

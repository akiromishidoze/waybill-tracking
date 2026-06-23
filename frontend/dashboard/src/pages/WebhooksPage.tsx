import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { webhookService } from '@/services/api'
import { Webhook, Plus, Pencil, Trash2, Check, X, Send, Activity } from 'lucide-react'
import { SkeletonBlock } from '@/components/Skeleton'
import BackButton from '@/components/BackButton'
import ConfirmModal from '@/components/ConfirmModal'

const EVENT_COLORS: Record<string, string> = {
  'status.updated': 'var(--status-blue)',
  'waybill.created': 'var(--status-green)',
  'waybill.delivered': 'var(--status-cyan)',
  'exception.raised': 'var(--status-red)',
  'test.ping': '#6b7280',
}

export default function WebhooksPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', url: '', events: [] as string[], isActive: true })
  const [testMsg, setTestMsg] = useState('')
  const [deleteWebhookId, setDeleteWebhookId] = useState<string | null>(null)

  const { data: webhooks, isLoading: webhooksLoading } = useQuery({ queryKey: ['webhooks'], queryFn: () => webhookService.list().then(r => r.data) })
  const { data: events } = useQuery({ queryKey: ['webhook-events'], queryFn: () => webhookService.getEvents().then(r => r.data) })

  const createWebhook = useMutation({
    mutationFn: () => webhookService.create(form),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['webhooks'] }); setShowForm(false); resetForm() },
  })
  const updateWebhook = useMutation({
    mutationFn: () => webhookService.update(editingId!, form),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['webhooks'] }); setEditingId(null); setShowForm(false); resetForm() },
  })
  const deleteWebhook = useMutation({
    mutationFn: (id: string) => webhookService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['webhooks'] }),
  })
  const testWebhook = useMutation({
    mutationFn: (id: string) => webhookService.test(id),
    onSuccess: (r) => setTestMsg(`Test ping sent to ${r.data.url} — status: ${r.data.status}`),
    onError: () => setTestMsg('Test failed'),
  })

  const resetForm = () => setForm({ name: '', url: '', events: [], isActive: true })
  const openEdit = (w: any) => { setEditingId(w.id); setForm({ name: w.name, url: w.url, events: [...w.events], isActive: w.isActive }); setShowForm(true) }
  const openAdd = () => { resetForm(); setEditingId(null); setShowForm(true) }

  const toggleEvent = (evt: string) => {
    setForm((f) => ({ ...f, events: f.events.includes(evt) ? f.events.filter((e) => e !== evt) : [...f.events, evt] }))
  }

  return (
    <div>
      <BackButton fallback="/dashboard" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Webhook Event Publishing</h2>
        <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 500, cursor: 'pointer' }}>
          <Plus size={16} /> Add Webhook
        </button>
      </div>

      <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
        Configure webhooks to notify external systems when shipment events occur. Events are sent as HTTP POST requests with a JSON payload.
      </p>

      {(showForm) && (
        <div style={{ background: 'var(--color-surface)', padding: '1.25rem', borderRadius: 10, marginBottom: '1rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Name *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Slack Notifier" style={{ padding: '0.5rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.875rem', width: 200 }} />
            </div>
            <div style={{ flex: 1, minWidth: 300 }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Webhook URL *</label>
              <input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://hooks.example.com/events" style={{ padding: '0.5rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.875rem', width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Active</label>
              <select value={form.isActive ? 'true' : 'false'} onChange={e => setForm({ ...form, isActive: e.target.value === 'true' })} style={{ padding: '0.5rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.875rem', width: 100 }}>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Subscribe to Events</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {(events || WEBHOOK_EVENTS).map((evt: string) => (
                <label key={evt} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.75rem', borderRadius: 6, border: `1px solid ${form.events.includes(evt) ? EVENT_COLORS[evt] || 'var(--status-blue)' : 'var(--color-border-input)'}`, background: form.events.includes(evt) ? 'var(--color-primary-soft)' : 'var(--color-input-bg)', cursor: 'pointer', fontSize: '0.8125rem' }}>
                  <input type="checkbox" checked={form.events.includes(evt)} onChange={() => toggleEvent(evt)} style={{ cursor: 'pointer' }} />
                  {evt}
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => editingId ? updateWebhook.mutate() : createWebhook.mutate()} disabled={!form.name || !form.url || !form.events.length || createWebhook.isPending || updateWebhook.isPending} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.875rem' }}>
              <Check size={14} /> {editingId ? 'Update' : 'Create'}
            </button>
            <button onClick={() => { setShowForm(false); setEditingId(null); resetForm() }} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem', background: 'transparent', color: 'var(--color-text-muted)', border: '1px solid var(--color-border-input)', borderRadius: 6, cursor: 'pointer', fontSize: '0.875rem' }}>
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      )}

      {testMsg && (
        <div style={{ padding: '0.75rem 1rem', background: 'var(--badge-green-bg)', border: '1px solid #bbf7d0', borderRadius: 8, marginBottom: '1rem', fontSize: '0.8125rem', color: 'var(--status-green)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Send size={14} /> {testMsg}
        </div>
      )}

      {webhooksLoading ? (
        <div style={{ display: 'grid', gap: '1rem' }}><SkeletonBlock height={100} /><SkeletonBlock height={100} /><SkeletonBlock height={100} /></div>
      ) : !webhooks?.length ? (
        <p style={{ color: 'var(--color-text-muted)' }}>No webhooks configured yet.</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {webhooks?.map((w: any) => (
            <div key={w.id} style={{ background: 'var(--color-surface)', borderRadius: 10, padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: w.isActive ? 'var(--badge-green-bg)' : 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Webhook size={20} color={w.isActive ? 'var(--status-green)' : 'var(--color-text-muted-lighter)'} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 600 }}>{w.name}</span>
                    <span style={{ fontSize: '0.7rem', padding: '0.125rem 0.5rem', borderRadius: 999, fontWeight: 600, background: w.isActive ? 'var(--badge-green-bg)' : 'var(--color-bg)', color: w.isActive ? 'var(--status-green)' : 'var(--color-text-muted)' }}>
                      {w.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <code style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', wordBreak: 'break-all' }}>{w.url}</code>
                </div>
                <div style={{ display: 'flex', gap: '0.375rem' }}>
                  <button onClick={() => testWebhook.mutate(w.id)} title="Send test ping" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 0.75rem', background: 'transparent', border: '1px solid var(--color-border-input)', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem' }}>
                    <Send size={12} /> Test
                  </button>
                  <button onClick={() => openEdit(w)} style={{ display: 'flex', padding: '0.5rem', background: 'transparent', border: '1px solid var(--color-border-input)', borderRadius: 6, cursor: 'pointer' }}>
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setDeleteWebhookId(w.id)} style={{ display: 'flex', padding: '0.5rem', background: 'transparent', border: '1px solid #dc2626', borderRadius: 6, cursor: 'pointer', color: 'var(--status-red)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                {w.events.map((evt: string) => (
                  <span key={evt} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.6rem', borderRadius: 999, fontSize: '0.7rem', fontWeight: 600, background: (EVENT_COLORS[evt] || 'var(--color-text-muted)') + '15', color: EVENT_COLORS[evt] || 'var(--color-text-muted)' }}>
                    <Activity size={10} /> {evt}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <ConfirmModal
        open={deleteWebhookId !== null}
        title="Delete Webhook"
        message="Are you sure you want to delete this webhook? This action cannot be undone."
        onConfirm={() => { if (deleteWebhookId) deleteWebhook.mutate(deleteWebhookId); setDeleteWebhookId(null) }}
        onCancel={() => setDeleteWebhookId(null)}
      />
    </div>
  )
}

const WEBHOOK_EVENTS = ['status.updated', 'waybill.created', 'waybill.delivered', 'exception.raised']

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reportScheduleService } from '@/services/api'
import type { ReportSchedule } from '@/types/waybill'
import { FileText, Plus, Trash2, Play, Check, X, Mail } from 'lucide-react'
import PageContainer from '@/components/PageContainer'

const FORMAT_COLORS: Record<string, string> = {
  PDF: '#dc2626',
  CSV: '#16a34a',
  EXCEL: '#2563eb',
}

const FREQ_LABELS: Record<string, string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
}

export default function ScheduledReportsPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', format: 'PDF' as string, frequency: 'DAILY' as string, recipients: '', filters: '{}', isActive: true })

  const { data: schedules, isLoading } = useQuery({
    queryKey: ['report-schedules'],
    queryFn: () => reportScheduleService.list().then(r => r.data),
  })

  const createSchedule = useMutation({
    mutationFn: () => reportScheduleService.create({ ...form, recipients: form.recipients.split(',').map(r => r.trim()).filter(Boolean) } as any),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['report-schedules'] }); setShowForm(false); resetForm() },
  })

  const updateSchedule = useMutation({
    mutationFn: () => reportScheduleService.update(editingId!, { ...form, recipients: form.recipients.split(',').map(r => r.trim()).filter(Boolean) } as any),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['report-schedules'] }); setEditingId(null); setShowForm(false); resetForm() },
  })

  const deleteSchedule = useMutation({
    mutationFn: (id: string) => reportScheduleService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['report-schedules'] }),
  })

  const triggerSchedule = useMutation({
    mutationFn: (id: string) => reportScheduleService.trigger(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['report-schedules'] }),
  })

  function resetForm() { setForm({ name: '', format: 'PDF', frequency: 'DAILY', recipients: '', filters: '{}', isActive: true }) }

  const openEdit = (s: ReportSchedule) => {
    setEditingId(s.id); setForm({ name: s.name, format: s.format, frequency: s.frequency, recipients: s.recipients.join(', '), filters: JSON.stringify(s.filters), isActive: s.isActive }); setShowForm(true)
  }

  return (
    <PageContainer
      title="Scheduled Reports"
      actions={
        !showForm ? (
          <button onClick={() => { setShowForm(true); setEditingId(null); resetForm() }} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer' }}>
            <Plus size={14} /> New Schedule
          </button>
        ) : null
      }
    >
      {showForm && (
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: 10, marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
          <h4 style={{ fontWeight: 600, marginBottom: '1rem' }}>{editingId ? 'Edit' : 'New'} Report Schedule</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: 500 }}>
            <input placeholder="Report name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.875rem' }} />
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <select value={form.format} onChange={e => setForm({ ...form, format: e.target.value })} style={{ flex: 1, padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.875rem', background: '#fff' }}>
                <option value="PDF">PDF</option>
                <option value="CSV">CSV</option>
                <option value="EXCEL">Excel</option>
              </select>
              <select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })} style={{ flex: 1, padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.875rem', background: '#fff' }}>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </div>
            <input placeholder="Recipient emails (comma separated)" value={form.recipients} onChange={e => setForm({ ...form, recipients: e.target.value })} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.875rem' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" id="schActive" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
              <label htmlFor="schActive" style={{ fontSize: '0.875rem' }}>Active</label>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => (editingId ? updateSchedule : createSchedule).mutate()} disabled={!form.name || createSchedule.isPending || updateSchedule.isPending} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.875rem', cursor: 'pointer' }}>
                <Check size={14} /> {editingId ? 'Update' : 'Create'}
              </button>
              <button onClick={() => { setShowForm(false); setEditingId(null) }} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem', background: 'transparent', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.875rem', cursor: 'pointer' }}>
                <X size={14} /> Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <p>Loading...</p>
      ) : !schedules || schedules.length === 0 ? (
        <div style={{ background: '#fff', padding: '2rem', borderRadius: 10, textAlign: 'center', color: '#94a3b8' }}>
          <FileText size={40} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
          <p style={{ fontWeight: 500 }}>No scheduled reports</p>
          <p style={{ fontSize: '0.875rem' }}>Create a schedule to automatically deliver reports via email.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {schedules.map((s: ReportSchedule) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: '#fff', borderRadius: 8, border: '1px solid #f1f5f9' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: (FORMAT_COLORS[s.format] || '#6b7280') + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FileText size={18} color={FORMAT_COLORS[s.format] || '#6b7280'} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{s.name}</span>
                  <span style={{ display: 'inline-flex', padding: '0.125rem 0.5rem', borderRadius: 4, fontSize: '0.6875rem', fontWeight: 600, background: (FORMAT_COLORS[s.format] || '#6b7280') + '20', color: FORMAT_COLORS[s.format] || '#6b7280' }}>
                    {s.format}
                  </span>
                  <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>{FREQ_LABELS[s.frequency]}</span>
                  {!s.isActive && <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>(paused)</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.125rem', fontSize: '0.8125rem', color: '#64748b' }}>
                  <Mail size={12} />
                  <span>{s.recipients.join(', ')}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.125rem' }}>
                  {s.lastSentAt ? `Last sent: ${new Date(s.lastSentAt).toLocaleDateString()}` : 'Never sent'}
                  {s.nextScheduledAt && ` · Next: ${new Date(s.nextScheduledAt).toLocaleDateString()}`}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.375rem' }}>
                <button onClick={() => triggerSchedule.mutate(s.id)} disabled={triggerSchedule.isPending} title="Send now" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.625rem', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer', color: '#475569' }}>
                  <Play size={12} /> Send
                </button>
                <button onClick={() => openEdit(s)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.625rem', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer', color: '#475569' }}>
                  Edit
                </button>
                <button onClick={() => { if (confirm(`Delete "${s.name}"?`)) deleteSchedule.mutate(s.id) }} disabled={deleteSchedule.isPending} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.625rem', background: '#fff', border: '1px solid #fecaca', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer', color: '#dc2626' }}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  )
}
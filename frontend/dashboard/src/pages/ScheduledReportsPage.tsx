import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reportScheduleService } from '@/services/api'
import type { ReportSchedule } from '@/types/waybill'
import { Calendar, FileText, Trash2, Plus, Pencil, X, Play, ToggleLeft, ToggleRight } from 'lucide-react'
import PageContainer from '@/components/PageContainer'
import { SkeletonBlock } from '@/components/Skeleton'
import BackButton from '@/components/BackButton'

const FREQ_LABELS: Record<string, string> = { DAILY: 'Daily', WEEKLY: 'Weekly', MONTHLY: 'Monthly' }
const FORMAT_LABELS: Record<string, string> = { PDF: 'PDF', CSV: 'CSV', EXCEL: 'Excel' }
const BLANK: Partial<ReportSchedule> = { name: '', format: 'PDF', frequency: 'DAILY', recipients: [], isActive: true, filters: {} }

function ReportModal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
      <div style={{ background: 'var(--color-surface)', borderRadius: 12, padding: '1.5rem', width: '100%', maxWidth: 500, boxShadow: 'var(--shadow-lg)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

function ReportForm({ value, onChange }: { value: Partial<ReportSchedule>; onChange: (v: Partial<ReportSchedule>) => void }) {
  const f = (k: keyof ReportSchedule, v: any) => onChange({ ...value, [k]: v })
  return (
    <>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>Report Name</label>
        <input value={value.name || ''} onChange={e => f('name', e.target.value)} placeholder="e.g. Weekly Delivery Summary"
          style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: '0.875rem', background: 'var(--color-surface)' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>Format</label>
          <select value={value.format || 'PDF'} onChange={e => f('format', e.target.value)}
            style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: '0.875rem', background: 'var(--color-surface)' }}>
            {Object.keys(FORMAT_LABELS).map(k => <option key={k} value={k}>{FORMAT_LABELS[k]}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>Frequency</label>
          <select value={value.frequency || 'DAILY'} onChange={e => f('frequency', e.target.value)}
            style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: '0.875rem', background: 'var(--color-surface)' }}>
            {Object.keys(FREQ_LABELS).map(k => <option key={k} value={k}>{FREQ_LABELS[k]}</option>)}
          </select>
        </div>
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>Recipients (comma-separated emails)</label>
        <input value={(value.recipients || []).join(', ')} onChange={e => f('recipients', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
          placeholder="ops@example.com, manager@example.com"
          style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: '0.875rem', background: 'var(--color-surface)' }} />
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', marginBottom: '1rem' }}>
        <input type="checkbox" checked={!!value.isActive} onChange={e => f('isActive', e.target.checked)} /> Active
      </label>
    </>
  )
}

export default function ScheduledReportsPage() {
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<ReportSchedule | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<ReportSchedule>>(BLANK)
  const [error, setError] = useState('')

  const { data: schedules, isLoading } = useQuery({
    queryKey: ['report-schedules'],
    queryFn: () => reportScheduleService.list().then(r => r.data),
  })

  const create = useMutation({
    mutationFn: (d: Partial<ReportSchedule>) => reportScheduleService.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['report-schedules'] }); setShowCreate(false); setForm(BLANK); setError('') },
    onError: (e: any) => setError(e?.response?.data?.error || 'Create failed'),
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ReportSchedule> }) => reportScheduleService.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['report-schedules'] }); setEditing(null); setError('') },
    onError: (e: any) => setError(e?.response?.data?.error || 'Update failed'),
  })

  const del = useMutation({
    mutationFn: (id: string) => reportScheduleService.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['report-schedules'] }); setDeleteId(null) },
  })

  const trigger = useMutation({
    mutationFn: (id: string) => reportScheduleService.trigger(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['report-schedules'] }),
  })

  const toggle = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => reportScheduleService.update(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['report-schedules'] }),
  })

  return (
    <>
      <BackButton fallback="/analytics" />
      <PageContainer title="Scheduled Reports">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <button onClick={() => { setForm(BLANK); setError(''); setShowCreate(true) }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.625rem 1.25rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem' }}>
            <Plus size={16} /> New Schedule
          </button>
        </div>

        {isLoading ? (
          <div style={{ display: 'grid', gap: '0.75rem' }}><SkeletonBlock height={80} /><SkeletonBlock height={80} /></div>
        ) : !schedules?.length ? (
          <div style={{ background: 'var(--color-surface)', padding: '2rem', borderRadius: 10, textAlign: 'center', color: 'var(--color-text-muted-lighter)' }}>
            <Calendar size={40} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
            <p style={{ fontWeight: 500 }}>No scheduled reports. Click "New Schedule" to create one.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {schedules.map((s: ReportSchedule) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', background: 'var(--color-surface)', borderRadius: 10, border: '1px solid var(--color-border)', opacity: s.isActive ? 1 : 0.6 }}>
                <FileText size={20} color={s.isActive ? '#2563eb' : 'var(--color-text-muted-lighter)'} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {s.name}
                    <span style={{ padding: '0.125rem 0.5rem', borderRadius: 999, fontSize: '0.6875rem', fontWeight: 600, background: s.isActive ? 'var(--badge-green-bg)' : 'var(--color-bg)', color: s.isActive ? 'var(--badge-green-text)' : 'var(--color-text-muted)' }}>
                      {s.isActive ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span>{FREQ_LABELS[s.frequency] || s.frequency}</span>
                    <span>{FORMAT_LABELS[s.format] || s.format}</span>
                    <span>To: {s.recipients.join(', ')}</span>
                    {s.nextScheduledAt && <span>Next: {new Date(s.nextScheduledAt).toLocaleDateString()}</span>}
                    {s.lastSentAt && <span>Last: {new Date(s.lastSentAt).toLocaleDateString()}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0, flexWrap: 'wrap' }}>
                  <button onClick={() => trigger.mutate(s.id)} disabled={trigger.isPending} title="Run Now"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.75rem', border: 'none', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer', background: '#0891b2', color: '#fff' }}>
                    <Play size={12} /> Run
                  </button>
                  <button onClick={() => toggle.mutate({ id: s.id, isActive: !s.isActive })} disabled={toggle.isPending}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.75rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer', background: 'transparent', color: 'var(--color-text-muted)' }}>
                    {s.isActive ? <ToggleRight size={12} /> : <ToggleLeft size={12} />} {s.isActive ? 'Pause' : 'Activate'}
                  </button>
                  <button onClick={() => { setEditing(s); setError('') }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.75rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer', background: 'transparent', color: 'var(--color-text-muted)' }}>
                    <Pencil size={12} /> Edit
                  </button>
                  <button onClick={() => setDeleteId(s.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.75rem', background: 'var(--badge-red-bg)', color: 'var(--badge-red-text)', border: '1px solid var(--badge-red-border,#fca5a5)', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer' }}>
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showCreate && (
          <ReportModal title="New Report Schedule" onClose={() => setShowCreate(false)}>
            <ReportForm value={form} onChange={setForm} />
            {error && <p style={{ color: 'var(--badge-red-text)', fontSize: '0.8125rem', marginBottom: '1rem' }}>{error}</p>}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCreate(false)} style={{ padding: '0.625rem 1.25rem', border: '1px solid var(--color-border)', borderRadius: 8, background: 'var(--color-surface)', cursor: 'pointer', fontSize: '0.875rem' }}>Cancel</button>
              <button onClick={() => create.mutate(form)} disabled={create.isPending || !form.name}
                style={{ padding: '0.625rem 1.25rem', border: 'none', borderRadius: 8, background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>
                {create.isPending ? 'Creating...' : 'Create'}
              </button>
            </div>
          </ReportModal>
        )}

        {editing && (
          <ReportModal title="Edit Report Schedule" onClose={() => setEditing(null)}>
            <ReportForm value={editing} onChange={v => setEditing(v as ReportSchedule)} />
            {error && <p style={{ color: 'var(--badge-red-text)', fontSize: '0.8125rem', marginBottom: '1rem' }}>{error}</p>}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setEditing(null)} style={{ padding: '0.625rem 1.25rem', border: '1px solid var(--color-border)', borderRadius: 8, background: 'var(--color-surface)', cursor: 'pointer', fontSize: '0.875rem' }}>Cancel</button>
              <button onClick={() => update.mutate({ id: editing.id, data: editing })} disabled={update.isPending}
                style={{ padding: '0.625rem 1.25rem', border: 'none', borderRadius: 8, background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>
                {update.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </ReportModal>
        )}

        {deleteId && (
          <ReportModal title="Delete Schedule?" onClose={() => setDeleteId(null)}>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>This will permanently remove this report schedule. Any in-flight runs will complete.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteId(null)} style={{ padding: '0.625rem 1.25rem', border: '1px solid var(--color-border)', borderRadius: 8, background: 'var(--color-surface)', cursor: 'pointer', fontSize: '0.875rem' }}>Cancel</button>
              <button onClick={() => del.mutate(deleteId)} disabled={del.isPending}
                style={{ padding: '0.625rem 1.25rem', border: 'none', borderRadius: 8, background: '#dc2626', color: '#fff', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>
                {del.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </ReportModal>
        )}
      </PageContainer>
    </>
  )
}

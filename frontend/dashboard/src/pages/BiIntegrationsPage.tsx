import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/services/api'
import type { BiIntegration } from '@/types/waybill'
import { BarChart3, Database, RefreshCw, Unlink, ExternalLink, WifiOff, AlertTriangle, Search, Plus, Pencil, Trash2, X } from 'lucide-react'
import { SkeletonBlock } from '@/components/Skeleton'
import BackButton from '@/components/BackButton'

const PLATFORMS = ['POWER_BI', 'LOOKER', 'TABLEAU', 'SUPERSET', 'GRAFANA', 'OTHER']
const DATASET_OPTIONS = ['waybills', 'scan_events', 'carriers', 'users', 'cod_payments', 'escalations', 'customs_shipments']
const BLANK: Partial<BiIntegration> = { name: '', platform: 'POWER_BI', endpoint: '', datasets: [], refreshInterval: 60 }

function BiModal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
      <div style={{ background: 'var(--color-surface)', borderRadius: 12, padding: '1.5rem', width: '100%', maxWidth: 520, boxShadow: 'var(--shadow-lg)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

function BiForm({ value, onChange }: { value: Partial<BiIntegration>; onChange: (v: Partial<BiIntegration>) => void }) {
  const f = (k: keyof BiIntegration, v: any) => onChange({ ...value, [k]: v })
  const toggleDataset = (ds: string) => {
    const cur = value.datasets || []
    f('datasets', cur.includes(ds) ? cur.filter(d => d !== ds) : [...cur, ds])
  }
  return (
    <>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>Name</label>
        <input value={value.name || ''} onChange={e => f('name', e.target.value)} placeholder="e.g. Power BI Production"
          style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: '0.875rem', background: 'var(--color-surface)' }} />
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>Platform</label>
        <select value={value.platform || 'POWER_BI'} onChange={e => f('platform', e.target.value)}
          style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: '0.875rem', background: 'var(--color-surface)' }}>
          {PLATFORMS.map(p => <option key={p} value={p}>{p.replace('_', ' ')}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>Endpoint URL</label>
        <input value={value.endpoint || ''} onChange={e => f('endpoint', e.target.value)} placeholder="https://bi.example.com/embed"
          style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: '0.875rem', background: 'var(--color-surface)' }} />
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>Refresh Interval (minutes)</label>
        <input type="number" min={5} value={value.refreshInterval || 60} onChange={e => f('refreshInterval', Number(e.target.value))}
          style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: '0.875rem', background: 'var(--color-surface)' }} />
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Datasets</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {DATASET_OPTIONS.map(ds => {
            const selected = (value.datasets || []).includes(ds)
            return (
              <button key={ds} type="button" onClick={() => toggleDataset(ds)}
                style={{ padding: '0.25rem 0.625rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer', border: '1px solid', borderColor: selected ? 'var(--color-primary)' : 'var(--color-border)', background: selected ? 'var(--color-primary-soft)' : 'transparent', color: selected ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                {ds}
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}

const PLATFORM_NAMES: Record<string, string> = {
  POWER_BI: 'Power BI', LOOKER: 'Looker', TABLEAU: 'Tableau', SUPERSET: 'Apache Superset', GRAFANA: 'Grafana', OTHER: 'Other',
}
const PLATFORM_COLORS: Record<string, string> = {
  POWER_BI: 'var(--status-orange)', LOOKER: 'var(--status-blue)', TABLEAU: 'var(--status-orange)', SUPERSET: 'var(--status-cyan)', GRAFANA: 'var(--status-orange)', OTHER: 'var(--status-gray)',
}
const STATUS_STYLE: Record<string, { label: string; bg: string; color: string }> = {
  CONNECTED: { label: 'Connected', bg: 'var(--badge-green-bg)', color: 'var(--badge-green-text)' },
  DISCONNECTED: { label: 'Disconnected', bg: 'var(--badge-amber-bg)', color: 'var(--status-orange)' },
  ERROR: { label: 'Error', bg: 'var(--badge-red-bg)', color: 'var(--badge-red-text)' },
}

export default function BiIntegrationsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<BiIntegration | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<BiIntegration>>(BLANK)
  const [formError, setFormError] = useState('')

  const { data: integrations, isLoading } = useQuery({
    queryKey: ['bi-integrations'],
    queryFn: () => api.get<BiIntegration[]>('/bi-integrations').then((r: { data: BiIntegration[] }) => r.data),
  })

  const syncMutation = useMutation({
    mutationFn: (id: string) => api.post(`/bi-integrations/${id}/sync`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bi-integrations'] }),
  })

  const createMutation = useMutation({
    mutationFn: (d: Partial<BiIntegration>) => api.post<BiIntegration>('/bi-integrations', d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bi-integrations'] }); setShowCreate(false); setForm(BLANK); setFormError('') },
    onError: (e: any) => setFormError(e?.response?.data?.error || 'Create failed'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BiIntegration> }) => api.patch<BiIntegration>(`/bi-integrations/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bi-integrations'] }); setEditing(null); setFormError('') },
    onError: (e: any) => setFormError(e?.response?.data?.error || 'Update failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/bi-integrations/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bi-integrations'] }); setDeleteId(null) },
  })

  const filtered = useMemo(() => (integrations || []).filter((b: BiIntegration) => {
    if (search && !b.name.toLowerCase().includes(search.toLowerCase()) && !PLATFORM_NAMES[b.platform].toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter && b.status !== statusFilter) return false
    return true
  }), [integrations, search, statusFilter])

  return (
    <div>
      <BackButton fallback="/analytics" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>BI Tool Integration</h2>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Connect Power BI, Looker, Tableau, and other analytics platforms
          </p>
        </div>
        <button onClick={() => { setForm(BLANK); setFormError(''); setShowCreate(true) }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.625rem 1.25rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem' }}>
          <Plus size={16} /> Add Integration
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted-lighter)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search integrations..."
            style={{ width: '100%', padding: '0.625rem 0.75rem 0.625rem 2.25rem', border: '1px solid var(--color-border-input)', borderRadius: 8, fontSize: '0.875rem', background: 'var(--color-input-bg)', color: 'var(--color-text-primary)' }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '0.625rem 1rem', border: '1px solid var(--color-border-input)', borderRadius: 8, fontSize: '0.875rem', background: 'var(--color-input-bg)', color: 'var(--color-text-primary)', minWidth: 160 }}>
          <option value="">All Statuses</option>
          {Object.entries(STATUS_STYLE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {isLoading ? (
        <SkeletonBlock height={300} />
      ) : !filtered.length ? (
        <div style={{ background: 'var(--color-surface)', borderRadius: 12, padding: '2rem', textAlign: 'center', border: '1px solid var(--color-border)' }}>
          <BarChart3 size={40} color="var(--color-text-muted-lighter)" style={{ marginBottom: '0.75rem' }} />
          <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>No BI integrations configured.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {filtered.map((bi: BiIntegration) => {
            const sc = STATUS_STYLE[bi.status] || STATUS_STYLE.DISCONNECTED
            return (
              <div key={bi.id} style={{ background: 'var(--color-surface)', borderRadius: 12, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                <div style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', flex: 1 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: (PLATFORM_COLORS[bi.platform] || 'var(--status-gray)') + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Database size={20} color={PLATFORM_COLORS[bi.platform] || 'var(--status-gray)'} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--color-text-primary)' }}>{bi.name}</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.625rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600, background: sc.bg, color: sc.color }}>
                            {bi.status === 'CONNECTED' ? <WifiOff size={10} /> : bi.status === 'ERROR' ? <AlertTriangle size={10} /> : <Unlink size={10} />}
                            {sc.label}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.375rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                          <span>{PLATFORM_NAMES[bi.platform] || bi.platform}</span>
                          {bi.endpoint && <span style={{ color: 'var(--color-text-muted)' }}>{bi.endpoint}</span>}
                          <span>Refresh: every {bi.refreshInterval}m</span>
                          {bi.lastSyncAt && <span>Last sync: {new Date(bi.lastSyncAt).toLocaleDateString()}</span>}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center', marginLeft: '1rem', flexWrap: 'wrap' }}>
                      {bi.endpoint && (
                        <a href={bi.endpoint} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.75rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer', border: '1px solid var(--color-border-input)', background: 'transparent', color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
                          <ExternalLink size={12} /> Open
                        </a>
                      )}
                      <button onClick={() => syncMutation.mutate(bi.id)} disabled={syncMutation.isPending}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.75rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer', border: 'none', background: 'var(--color-primary)', color: '#fff' }}>
                        <RefreshCw size={12} /> Sync
                      </button>
                      <button onClick={() => { setEditing(bi); setFormError('') }}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.75rem', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer', border: '1px solid var(--color-border-input)', background: 'transparent', color: 'var(--color-text-muted)' }}>
                        <Pencil size={12} /> Edit
                      </button>
                      <button onClick={() => setDeleteId(bi.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.75rem', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer', border: 'none', background: '#dc2626', color: '#fff' }}>
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </div>

                  <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginRight: '0.25rem' }}>Datasets:</span>
                    {bi.datasets.map(ds => (
                      <span key={ds} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.15rem 0.5rem', borderRadius: 6, fontSize: '0.6875rem', fontWeight: 500, background: 'var(--color-primary-soft)', color: 'var(--color-primary)' }}>
                        <Database size={10} /> {ds}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showCreate && (
        <BiModal title="Add BI Integration" onClose={() => setShowCreate(false)}>
          <BiForm value={form} onChange={setForm} />
          {formError && <p style={{ color: 'var(--badge-red-text)', fontSize: '0.8125rem', marginBottom: '1rem' }}>{formError}</p>}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowCreate(false)} style={{ padding: '0.625rem 1.25rem', border: '1px solid var(--color-border)', borderRadius: 8, background: 'var(--color-surface)', cursor: 'pointer', fontSize: '0.875rem' }}>Cancel</button>
            <button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending || !form.name}
              style={{ padding: '0.625rem 1.25rem', border: 'none', borderRadius: 8, background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </BiModal>
      )}

      {editing && (
        <BiModal title="Edit BI Integration" onClose={() => setEditing(null)}>
          <BiForm value={editing} onChange={v => setEditing(v as BiIntegration)} />
          {formError && <p style={{ color: 'var(--badge-red-text)', fontSize: '0.8125rem', marginBottom: '1rem' }}>{formError}</p>}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button onClick={() => setEditing(null)} style={{ padding: '0.625rem 1.25rem', border: '1px solid var(--color-border)', borderRadius: 8, background: 'var(--color-surface)', cursor: 'pointer', fontSize: '0.875rem' }}>Cancel</button>
            <button onClick={() => updateMutation.mutate({ id: editing.id, data: editing })} disabled={updateMutation.isPending}
              style={{ padding: '0.625rem 1.25rem', border: 'none', borderRadius: 8, background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </BiModal>
      )}

      {deleteId && (
        <BiModal title="Delete Integration?" onClose={() => setDeleteId(null)}>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>This will permanently remove this BI integration and disconnect all dataset streams.</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button onClick={() => setDeleteId(null)} style={{ padding: '0.625rem 1.25rem', border: '1px solid var(--color-border)', borderRadius: 8, background: 'var(--color-surface)', cursor: 'pointer', fontSize: '0.875rem' }}>Cancel</button>
            <button onClick={() => deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}
              style={{ padding: '0.625rem 1.25rem', border: 'none', borderRadius: 8, background: '#dc2626', color: '#fff', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </BiModal>
      )}
    </div>
  )
}

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { erpIntegrationService } from '@/services/api'
import type { ErpIntegration } from '@/types/waybill'
import { Database, RefreshCw, CheckCircle, XCircle, Plus, Pencil, Trash2, X, TestTube } from 'lucide-react'
import PageContainer from '@/components/PageContainer'
import { SkeletonBlock } from '@/components/Skeleton'
import BackButton from '@/components/BackButton'

const SYSTEM_COLORS: Record<string, string> = { SAP: 'var(--status-blue)', ORACLE: 'var(--status-red)', NETSUITE: 'var(--status-blue)', OTHER: 'var(--status-gray)' }
const SYSTEMS = ['SAP', 'ORACLE', 'NETSUITE', 'OTHER']
const AUTH_TYPES = ['API_KEY', 'BASIC', 'OAUTH2', 'NONE']
const SYNC_DIRECTIONS = ['IMPORT', 'EXPORT', 'BOTH']

const BLANK: Partial<ErpIntegration> = { name: '', system: 'SAP', endpoint: '', authType: 'API_KEY', syncDirection: 'BOTH', isActive: true }

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
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

function ErpForm({ value, onChange }: { value: Partial<ErpIntegration>; onChange: (v: Partial<ErpIntegration>) => void }) {
  const f = (k: keyof ErpIntegration, v: any) => onChange({ ...value, [k]: v })
  const inp = (k: keyof ErpIntegration, label: string, placeholder = '') => (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>{label}</label>
      <input value={(value as any)[k] || ''} onChange={e => f(k, e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: '0.875rem', background: 'var(--color-surface)' }} />
    </div>
  )
  const sel = (k: keyof ErpIntegration, label: string, opts: string[]) => (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>{label}</label>
      <select value={(value as any)[k] || ''} onChange={e => f(k, e.target.value)}
        style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: '0.875rem', background: 'var(--color-surface)' }}>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
  return (
    <>
      {inp('name', 'Integration Name', 'e.g. SAP Production')}
      {sel('system', 'ERP System', SYSTEMS)}
      {inp('endpoint', 'API Endpoint', 'https://erp.example.com/api')}
      {sel('authType', 'Auth Type', AUTH_TYPES)}
      {sel('syncDirection', 'Sync Direction', SYNC_DIRECTIONS)}
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', marginBottom: '1rem' }}>
        <input type="checkbox" checked={!!value.isActive} onChange={e => f('isActive', e.target.checked)} /> Active
      </label>
    </>
  )
}

export default function ErpIntegrationsPage() {
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<ErpIntegration | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<ErpIntegration>>(BLANK)
  const [testResult, setTestResult] = useState<Record<string, { ok: boolean; msg: string }>>({})
  const [error, setError] = useState('')

  const { data: integrations, isLoading } = useQuery({
    queryKey: ['erp-integrations'],
    queryFn: () => erpIntegrationService.list().then(r => r.data),
  })

  const create = useMutation({
    mutationFn: (d: Partial<ErpIntegration>) => erpIntegrationService.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['erp-integrations'] }); setShowCreate(false); setForm(BLANK); setError('') },
    onError: (e: any) => setError(e?.response?.data?.error || 'Create failed'),
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ErpIntegration> }) => erpIntegrationService.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['erp-integrations'] }); setEditing(null); setError('') },
    onError: (e: any) => setError(e?.response?.data?.error || 'Update failed'),
  })

  const del = useMutation({
    mutationFn: (id: string) => erpIntegrationService.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['erp-integrations'] }); setDeleteId(null) },
  })

  const sync = useMutation({
    mutationFn: (id: string) => erpIntegrationService.sync(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['erp-integrations'] }),
  })

  const test = useMutation({
    mutationFn: (id: string) => erpIntegrationService.test(id).then(r => r.data),
    onSuccess: (data, id) => setTestResult(prev => ({ ...prev, [id]: { ok: data.success, msg: data.message } })),
  })

  const btnStyle = (color: string) => ({ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.75rem', border: 'none', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer', background: color, color: '#fff', fontWeight: 500 as const })

  return (
    <PageContainer title="ERP Integrations">
      <BackButton fallback="/dashboard" />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button onClick={() => { setForm(BLANK); setError(''); setShowCreate(true) }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.625rem 1.25rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem' }}>
          <Plus size={16} /> Add Integration
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gap: '0.75rem' }}><SkeletonBlock height={80} /><SkeletonBlock height={80} /></div>
      ) : !integrations?.length ? (
        <div style={{ background: 'var(--color-surface)', padding: '2rem', borderRadius: 10, textAlign: 'center', color: 'var(--color-text-muted-lighter)' }}>
          <Database size={40} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
          <p style={{ fontWeight: 500 }}>No ERP integrations configured</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {integrations.map((i: ErpIntegration) => (
            <div key={i.id} style={{ padding: '1rem 1.25rem', background: 'var(--color-surface)', borderRadius: 10, border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: (SYSTEM_COLORS[i.system] || 'var(--status-gray)') + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Database size={20} color={SYSTEM_COLORS[i.system] || 'var(--status-gray)'} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {i.name}
                    {i.lastSyncStatus === 'SUCCESS' ? <CheckCircle size={14} color="#16a34a" /> : i.lastSyncStatus === 'FAILED' ? <XCircle size={14} color="#dc2626" /> : null}
                    <span style={{ padding: '0.125rem 0.5rem', borderRadius: 999, fontSize: '0.6875rem', fontWeight: 600, background: i.isActive ? 'var(--badge-green-bg)' : 'var(--color-bg)', color: i.isActive ? 'var(--badge-green-text)' : 'var(--color-text-muted)' }}>
                      {i.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span>{i.system}</span><span>{i.authType}</span><span>{i.syncDirection}</span>
                    {i.endpoint && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{i.endpoint}</span>}
                    {i.lastSyncAt && <span>Last sync: {new Date(i.lastSyncAt).toLocaleString()}</span>}
                  </div>
                  {testResult[i.id] && (
                    <div style={{ marginTop: '0.375rem', fontSize: '0.75rem', color: testResult[i.id].ok ? 'var(--badge-green-text)' : 'var(--badge-red-text)' }}>
                      {testResult[i.id].ok ? '✓' : '✗'} {testResult[i.id].msg}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0, flexWrap: 'wrap' }}>
                  <button onClick={() => test.mutate(i.id)} disabled={test.isPending} style={btnStyle('#6366f1')}><TestTube size={12} /> Test</button>
                  <button onClick={() => sync.mutate(i.id)} disabled={sync.isPending} style={btnStyle('#0891b2')}><RefreshCw size={12} /> Sync</button>
                  <button onClick={() => { setEditing(i); setError('') }} style={btnStyle('#64748b')}><Pencil size={12} /> Edit</button>
                  <button onClick={() => setDeleteId(i.id)} style={btnStyle('#dc2626')}><Trash2 size={12} /> Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <Modal title="Add ERP Integration" onClose={() => setShowCreate(false)}>
          <ErpForm value={form} onChange={setForm} />
          {error && <p style={{ color: 'var(--badge-red-text)', fontSize: '0.8125rem', marginBottom: '1rem' }}>{error}</p>}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowCreate(false)} style={{ padding: '0.625rem 1.25rem', border: '1px solid var(--color-border)', borderRadius: 8, background: 'var(--color-surface)', cursor: 'pointer', fontSize: '0.875rem' }}>Cancel</button>
            <button onClick={() => create.mutate(form)} disabled={create.isPending || !form.name}
              style={{ padding: '0.625rem 1.25rem', border: 'none', borderRadius: 8, background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>
              {create.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </Modal>
      )}

      {editing && (
        <Modal title="Edit ERP Integration" onClose={() => setEditing(null)}>
          <ErpForm value={editing} onChange={v => setEditing(v as ErpIntegration)} />
          {error && <p style={{ color: 'var(--badge-red-text)', fontSize: '0.8125rem', marginBottom: '1rem' }}>{error}</p>}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button onClick={() => setEditing(null)} style={{ padding: '0.625rem 1.25rem', border: '1px solid var(--color-border)', borderRadius: 8, background: 'var(--color-surface)', cursor: 'pointer', fontSize: '0.875rem' }}>Cancel</button>
            <button onClick={() => update.mutate({ id: editing.id, data: editing })} disabled={update.isPending}
              style={{ padding: '0.625rem 1.25rem', border: 'none', borderRadius: 8, background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>
              {update.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </Modal>
      )}

      {deleteId && (
        <Modal title="Delete Integration?" onClose={() => setDeleteId(null)}>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>This will permanently remove the ERP integration and all associated sync history.</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button onClick={() => setDeleteId(null)} style={{ padding: '0.625rem 1.25rem', border: '1px solid var(--color-border)', borderRadius: 8, background: 'var(--color-surface)', cursor: 'pointer', fontSize: '0.875rem' }}>Cancel</button>
            <button onClick={() => del.mutate(deleteId)} disabled={del.isPending}
              style={{ padding: '0.625rem 1.25rem', border: 'none', borderRadius: 8, background: '#dc2626', color: '#fff', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>
              {del.isPending ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </Modal>
      )}
    </PageContainer>
  )
}

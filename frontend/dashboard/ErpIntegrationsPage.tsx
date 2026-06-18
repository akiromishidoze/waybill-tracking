import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { erpIntegrationService } from '@/services/api'
import type { ErpIntegration } from '@/types/waybill'
import { Database, Plus, Trash2, Play, Check, X, RefreshCw, Wifi } from 'lucide-react'
import PageContainer from '@/components/PageContainer'

const SYSTEM_COLORS: Record<string, string> = { SAP: '#2563eb', ORACLE: '#dc2626', NETSUITE: '#16a34a', OTHER: '#6b7280' }

export default function ErpIntegrationsPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', system: 'SAP' as string, endpoint: '', authType: 'API_KEY' as string, syncDirection: 'IMPORT' as string, isActive: true })
  const [testResult, setTestResult] = useState<string | null>(null)
  const [syncResult, setSyncResult] = useState<string | null>(null)

  const { data: integrations, isLoading } = useQuery({
    queryKey: ['erp-integrations'],
    queryFn: () => erpIntegrationService.list().then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: () => erpIntegrationService.create(form as any),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['erp-integrations'] }); setShowForm(false); resetForm() },
  })

  const updateMutation = useMutation({
    mutationFn: () => erpIntegrationService.update(editingId!, form as any),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['erp-integrations'] }); setEditingId(null); setShowForm(false); resetForm() },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => erpIntegrationService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['erp-integrations'] }),
  })

  const testMutation = useMutation({
    mutationFn: (id: string) => erpIntegrationService.test(id),
    onSuccess: (r) => setTestResult(r.data.message),
    onError: (e: any) => setTestResult(e.response?.data?.error || 'Connection failed'),
  })

  const syncMutation = useMutation({
    mutationFn: (id: string) => erpIntegrationService.sync(id),
    onSuccess: (r) => { setSyncResult(r.data.message); queryClient.invalidateQueries({ queryKey: ['erp-integrations'] }) },
    onError: (e: any) => setSyncResult(e.response?.data?.error || 'Sync failed'),
  })

  function resetForm() { setForm({ name: '', system: 'SAP', endpoint: '', authType: 'API_KEY', syncDirection: 'IMPORT', isActive: true }) }

  return (
    <PageContainer
      title="ERP / WMS Integrations"
      actions={
        !showForm ? (
          <button onClick={() => { setShowForm(true); setEditingId(null); resetForm(); setTestResult(null); setSyncResult(null) }} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer' }}>
            <Plus size={14} /> Add Integration
          </button>
        ) : null
      }
    >
      {showForm && (
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: 10, marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
          <h4 style={{ fontWeight: 600, marginBottom: '1rem' }}>{editingId ? 'Edit' : 'New'} Integration</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: 500 }}>
            <input placeholder="Integration name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.875rem' }} />
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <select value={form.system} onChange={e => setForm({ ...form, system: e.target.value })} style={{ flex: 1, padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.875rem', background: '#fff' }}>
                <option value="SAP">SAP</option>
                <option value="ORACLE">Oracle</option>
                <option value="NETSUITE">NetSuite</option>
                <option value="OTHER">Other</option>
              </select>
              <select value={form.authType} onChange={e => setForm({ ...form, authType: e.target.value })} style={{ flex: 1, padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.875rem', background: '#fff' }}>
                <option value="API_KEY">API Key</option>
                <option value="BASIC">Basic Auth</option>
                <option value="OAUTH2">OAuth 2.0</option>
                <option value="NONE">None</option>
              </select>
            </div>
            <input placeholder="API Endpoint URL" value={form.endpoint} onChange={e => setForm({ ...form, endpoint: e.target.value })} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.875rem' }} />
            <select value={form.syncDirection} onChange={e => setForm({ ...form, syncDirection: e.target.value })} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.875rem', background: '#fff' }}>
              <option value="IMPORT">Import (ERP → WaybillTrack)</option>
              <option value="EXPORT">Export (WaybillTrack → ERP)</option>
              <option value="BOTH">Bidirectional</option>
            </select>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" id="erpActive" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
              <label htmlFor="erpActive" style={{ fontSize: '0.875rem' }}>Active</label>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => (editingId ? updateMutation : createMutation).mutate()} disabled={!form.name || !form.endpoint || createMutation.isPending || updateMutation.isPending} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.875rem', cursor: 'pointer' }}>
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
      ) : !integrations || integrations.length === 0 ? (
        <div style={{ background: '#fff', padding: '2rem', borderRadius: 10, textAlign: 'center', color: '#94a3b8' }}>
          <Database size={40} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
          <p style={{ fontWeight: 500 }}>No ERP integrations configured</p>
          <p style={{ fontSize: '0.875rem' }}>Connect to SAP, Oracle, NetSuite, or other enterprise systems.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {integrations.map((int: ErpIntegration) => {
            const systemColor = SYSTEM_COLORS[int.system] || '#6b7280'
            return (
              <div key={int.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: '#fff', borderRadius: 8, border: '1px solid #f1f5f9' }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: systemColor + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Database size={18} color={systemColor} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{int.name}</span>
                    <span style={{ display: 'inline-flex', padding: '0.125rem 0.5rem', borderRadius: 4, fontSize: '0.6875rem', fontWeight: 600, background: systemColor + '20', color: systemColor }}>
                      {int.system}
                    </span>
                    <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>{int.syncDirection === 'BOTH' ? 'Bi-directional' : int.syncDirection === 'IMPORT' ? 'Import' : 'Export'}</span>
                    {int.lastSyncStatus === 'FAILED' && <span style={{ fontSize: '0.75rem', color: '#dc2626' }}>(last sync failed)</span>}
                    {!int.isActive && <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>(disabled)</span>}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#94a3b8', marginTop: '0.125rem' }}>
                    <Wifi size={11} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
                    {int.endpoint}
                    {int.lastSyncAt && <span> · Last sync: {new Date(int.lastSyncAt).toLocaleString()}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.375rem' }}>
                  <button onClick={() => { testMutation.mutate(int.id); setTestResult(null); setSyncResult(null) }} disabled={testMutation.isPending} title="Test connection" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.625rem', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer', color: '#475569' }}>
                    <RefreshCw size={12} /> Test
                  </button>
                  <button onClick={() => { syncMutation.mutate(int.id); setTestResult(null); setSyncResult(null) }} disabled={syncMutation.isPending} title="Sync now" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.625rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer' }}>
                    <Play size={12} /> Sync
                  </button>
                  <button onClick={() => { setEditingId(int.id); setForm({ name: int.name, system: int.system, endpoint: int.endpoint, authType: int.authType, syncDirection: int.syncDirection, isActive: int.isActive }); setShowForm(true); setTestResult(null); setSyncResult(null) }} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.625rem', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer', color: '#475569' }}>
                    Edit
                  </button>
                  <button onClick={() => { if (confirm(`Delete "${int.name}"?`)) deleteMutation.mutate(int.id) }} disabled={deleteMutation.isPending} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.625rem', background: '#fff', border: '1px solid #fecaca', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer', color: '#dc2626' }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {testResult && (
        <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', borderRadius: 8, background: testResult.includes('failed') || testResult.includes('Failed') ? '#fef2f2' : '#f0fdf4', border: `1px solid ${testResult.includes('failed') || testResult.includes('Failed') ? '#fecaca' : '#bbf7d0'}`, color: testResult.includes('failed') || testResult.includes('Failed') ? '#dc2626' : '#16a34a', fontSize: '0.875rem' }}>
          {testResult}
        </div>
      )}
      {syncResult && (
        <div style={{ marginTop: '0.5rem', padding: '0.75rem 1rem', borderRadius: 8, background: syncResult.includes('failed') || syncResult.includes('Failed') ? '#fef2f2' : '#f0fdf4', border: `1px solid ${syncResult.includes('failed') || syncResult.includes('Failed') ? '#fecaca' : '#bbf7d0'}`, color: syncResult.includes('failed') || syncResult.includes('Failed') ? '#dc2626' : '#16a34a', fontSize: '0.875rem' }}>
          {syncResult}
        </div>
      )}
    </PageContainer>
  )
}
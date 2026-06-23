import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { carrierService } from '@/services/api'
import type { Carrier } from '@/types/waybill'
import { Truck, ExternalLink, CheckCircle, XCircle, Plus, Pencil, Trash2, X, Check, Inbox } from 'lucide-react'
import { SkeletonBlock } from '@/components/Skeleton'
import EmptyState from '@/components/EmptyState'
import ConfirmModal from '@/components/ConfirmModal'

export default function CarriersPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteCarrierId, setDeleteCarrierId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', apiEndpoint: '', apiKey: '', isActive: true, trackingUrlTemplate: '' })

  const { data: carriers, isLoading } = useQuery({
    queryKey: ['carriers'],
    queryFn: () => carrierService.list().then((r) => r.data),
  })

  const createCarrier = useMutation({
    mutationFn: () => carrierService.create(form),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['carriers'] }); setShowForm(false); resetForm() },
  })
  const updateCarrier = useMutation({
    mutationFn: () => carrierService.update(editingId!, form),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['carriers'] }); setEditingId(null); resetForm() },
  })
  const deleteCarrier = useMutation({
    mutationFn: (id: string) => carrierService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['carriers'] }),
  })

  const resetForm = () => setForm({ name: '', apiEndpoint: '', apiKey: '', isActive: true, trackingUrlTemplate: '' })
  const openEdit = (c: Carrier) => { setEditingId(c.id); setForm({ name: c.name, apiEndpoint: c.apiEndpoint, apiKey: c.apiKey, isActive: c.isActive, trackingUrlTemplate: c.trackingUrlTemplate }); setShowForm(true) }
  const openAdd = () => { resetForm(); setEditingId(null); setShowForm(true) }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Carrier Integrations</h2>
        <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 500, cursor: 'pointer' }}>
          <Plus size={16} /> Add Carrier
        </button>
      </div>

      {(showForm) && (
        <div style={{ background: 'var(--color-surface)', padding: '1.25rem', borderRadius: 10, marginBottom: '1rem', boxShadow: 'var(--shadow-sm)', display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ padding: '0.5rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.875rem', width: 180 }} /></div>
          <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>API Endpoint</label><input value={form.apiEndpoint} onChange={e => setForm({ ...form, apiEndpoint: e.target.value })} style={{ padding: '0.5rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.875rem', width: 240 }} /></div>
          <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>API Key</label><input value={form.apiKey} onChange={e => setForm({ ...form, apiKey: e.target.value })} style={{ padding: '0.5rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.875rem', width: 140 }} /></div>
          <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Tracking URL</label><input value={form.trackingUrlTemplate} onChange={e => setForm({ ...form, trackingUrlTemplate: e.target.value })} style={{ padding: '0.5rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.875rem', width: 200 }} /></div>
          <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Active</label>
            <select value={form.isActive ? 'true' : 'false'} onChange={e => setForm({ ...form, isActive: e.target.value === 'true' })} style={{ padding: '0.5rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.875rem', width: 100 }}>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => editingId ? updateCarrier.mutate() : createCarrier.mutate()} disabled={!form.name || createCarrier.isPending || updateCarrier.isPending} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.875rem' }}>
              <Check size={14} /> {editingId ? 'Update' : 'Create'}
            </button>
            <button onClick={() => { setShowForm(false); setEditingId(null); resetForm() }} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem', background: 'transparent', color: 'var(--color-text-muted)', border: '1px solid var(--color-border-input)', borderRadius: 6, cursor: 'pointer', fontSize: '0.875rem' }}>
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div style={{ display: 'grid', gap: '1rem' }}><SkeletonBlock height={80} /><SkeletonBlock height={80} /><SkeletonBlock height={80} /></div>
      ) : !carriers?.length ? (
        <EmptyState icon={Inbox} title="No carriers configured" message="Add a carrier integration to start tracking shipments." />
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {carriers?.map((c) => (
            <div key={c.id} style={{ background: 'var(--color-surface)', borderRadius: 10, padding: '1.25rem', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: c.isActive ? 'var(--badge-green-bg)' : 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Truck size={22} color={c.isActive ? 'var(--badge-green-text)' : 'var(--color-text-muted-lighter)'} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '1rem' }}>{c.name}</span>
                  {c.isActive ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--badge-green-text)', fontWeight: 500 }}>
                      <CheckCircle size={12} /> Active
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--color-text-muted-lighter)', fontWeight: 500 }}>
                      <XCircle size={12} /> Inactive
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.375rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                  <span>API: <code style={{ background: 'var(--color-bg)', padding: '0.125rem 0.375rem', borderRadius: 3 }}>{c.apiEndpoint || '—'}</code></span>
                  <span>Key: <code style={{ background: 'var(--color-bg)', padding: '0.125rem 0.375rem', borderRadius: 3 }}>{c.apiKey ? c.apiKey.slice(0, 8) + '****' : '—'}</code></span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <a href={c.trackingUrlTemplate?.replace('{{number}}', 'DEMO') || '#'} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 0.75rem', border: '1px solid var(--color-border-input)', borderRadius: 6, color: 'var(--color-primary)', textDecoration: 'none', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                  Tracking <ExternalLink size={14} />
                </a>
                <button onClick={() => openEdit(c)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 0.75rem', background: 'transparent', color: 'var(--color-primary)', border: '1px solid var(--color-primary)', borderRadius: 6, cursor: 'pointer', fontSize: '0.8125rem' }}>
                  <Pencil size={14} /> Edit
                </button>
                <button onClick={() => setDeleteCarrierId(c.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 0.75rem', background: 'transparent', color: 'var(--badge-red-text)', border: '1px solid #dc2626', borderRadius: 6, cursor: 'pointer', fontSize: '0.8125rem' }}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <ConfirmModal
        open={deleteCarrierId !== null}
        title="Delete Carrier"
        message="Are you sure you want to delete this carrier? This action cannot be undone."
        onConfirm={() => { if (deleteCarrierId) deleteCarrier.mutate(deleteCarrierId); setDeleteCarrierId(null) }}
        onCancel={() => setDeleteCarrierId(null)}
      />
    </div>
  )
}

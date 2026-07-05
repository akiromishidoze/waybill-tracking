import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { carrierService, carrierRateService } from '@/services/api'
import type { Carrier, CarrierRate } from '@/types/waybill'
import { Truck, ExternalLink, CheckCircle, XCircle, Plus, Pencil, Trash2, X, Check, Inbox, DollarSign, ChevronDown, ChevronUp } from 'lucide-react'
import { SkeletonBlock } from '@/components/Skeleton'
import EmptyState from '@/components/EmptyState'
import ConfirmModal from '@/components/ConfirmModal'

const BLANK_RATE = { serviceType: 'STANDARD', originZone: '', destinationZone: '', weightMinKg: 0, weightMaxKg: 999, baseRate: 0, perKgRate: 0, currency: 'PHP', transitDaysMin: 1, transitDaysMax: 7, isActive: true, notes: '' }

function RateCards({ carrier }: { carrier: Carrier }) {
  const queryClient = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [editRateId, setEditRateId] = useState<string | null>(null)
  const [rateForm, setRateForm] = useState(BLANK_RATE)
  const [deleteRateId, setDeleteRateId] = useState<string | null>(null)

  const { data: rates, isLoading } = useQuery({
    queryKey: ['carrier-rates', carrier.id],
    queryFn: () => carrierRateService.listByCarrier(carrier.id).then(r => r.data),
  })

  const createRate = useMutation({
    mutationFn: () => carrierRateService.create(carrier.id, rateForm),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['carrier-rates', carrier.id] }); setShowAdd(false); setRateForm(BLANK_RATE) },
  })
  const updateRate = useMutation({
    mutationFn: () => carrierRateService.update(editRateId!, rateForm),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['carrier-rates', carrier.id] }); setEditRateId(null); setRateForm(BLANK_RATE) },
  })
  const deleteRate = useMutation({
    mutationFn: (id: string) => carrierRateService.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['carrier-rates', carrier.id] }); setDeleteRateId(null) },
  })

  const openEditRate = (r: CarrierRate) => {
    setEditRateId(r.id)
    setRateForm({ serviceType: r.serviceType, originZone: r.originZone, destinationZone: r.destinationZone, weightMinKg: r.weightMinKg, weightMaxKg: r.weightMaxKg, baseRate: r.baseRate, perKgRate: r.perKgRate, currency: r.currency, transitDaysMin: r.transitDaysMin, transitDaysMax: r.transitDaysMax, isActive: r.isActive, notes: r.notes })
    setShowAdd(true)
  }

  const lbl = (t: string) => <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>{t}</label>
  const inp = (val: any, onChange: (v: any) => void, type = 'text', step?: string) => (
    <input type={type} step={step} value={val} onChange={e => onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
      style={{ width: '100%', padding: '0.4rem 0.5rem', border: '1px solid var(--color-border-input)', borderRadius: 5, fontSize: '0.8rem', background: 'var(--color-surface)' }} />
  )

  return (
    <div style={{ borderTop: '1px solid var(--color-border)', marginTop: '0.75rem', paddingTop: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <DollarSign size={13} /> Rate Cards
        </span>
        {!showAdd && (
          <button onClick={() => { setEditRateId(null); setRateForm(BLANK_RATE); setShowAdd(true) }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.625rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer', fontSize: '0.75rem' }}>
            <Plus size={12} /> Add Rate
          </button>
        )}
      </div>

      {showAdd && (
        <div style={{ background: 'var(--color-bg)', borderRadius: 8, padding: '0.875rem', marginBottom: '0.75rem', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <div>{lbl('Service Type')}<select value={rateForm.serviceType} onChange={e => setRateForm(f => ({ ...f, serviceType: e.target.value }))} style={{ width: '100%', padding: '0.4rem', border: '1px solid var(--color-border-input)', borderRadius: 5, fontSize: '0.8rem', background: 'var(--color-surface)' }}>
              {['STANDARD','EXPRESS','OVERNIGHT','FREIGHT'].map(s => <option key={s} value={s}>{s}</option>)}
            </select></div>
            <div>{lbl('Origin Zone')}{inp(rateForm.originZone, v => setRateForm(f => ({ ...f, originZone: v })))}</div>
            <div>{lbl('Dest Zone')}{inp(rateForm.destinationZone, v => setRateForm(f => ({ ...f, destinationZone: v })))}</div>
            <div>{lbl('Min Wt (kg)')}{inp(rateForm.weightMinKg, v => setRateForm(f => ({ ...f, weightMinKg: v })), 'number', '0.001')}</div>
            <div>{lbl('Max Wt (kg)')}{inp(rateForm.weightMaxKg, v => setRateForm(f => ({ ...f, weightMaxKg: v })), 'number', '0.001')}</div>
            <div>{lbl('Base Rate')}{inp(rateForm.baseRate, v => setRateForm(f => ({ ...f, baseRate: v })), 'number', '0.01')}</div>
            <div>{lbl('Per kg Rate')}{inp(rateForm.perKgRate, v => setRateForm(f => ({ ...f, perKgRate: v })), 'number', '0.01')}</div>
            <div>{lbl('Currency')}{inp(rateForm.currency, v => setRateForm(f => ({ ...f, currency: v })))}</div>
            <div>{lbl('Transit Min')}{inp(rateForm.transitDaysMin, v => setRateForm(f => ({ ...f, transitDaysMin: v })), 'number', '1')}</div>
            <div>{lbl('Transit Max')}{inp(rateForm.transitDaysMax, v => setRateForm(f => ({ ...f, transitDaysMax: v })), 'number', '1')}</div>
            <div>{lbl('Active')}<select value={rateForm.isActive ? 'true' : 'false'} onChange={e => setRateForm(f => ({ ...f, isActive: e.target.value === 'true' }))} style={{ width: '100%', padding: '0.4rem', border: '1px solid var(--color-border-input)', borderRadius: 5, fontSize: '0.8rem', background: 'var(--color-surface)' }}>
              <option value="true">Yes</option><option value="false">No</option>
            </select></div>
          </div>
          <div style={{ marginBottom: '0.5rem' }}>{lbl('Notes')}{inp(rateForm.notes, v => setRateForm(f => ({ ...f, notes: v })))}</div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => editRateId ? updateRate.mutate() : createRate.mutate()} disabled={createRate.isPending || updateRate.isPending}
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.875rem', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer', fontSize: '0.8rem' }}>
              <Check size={12} /> {editRateId ? 'Update' : 'Save'}
            </button>
            <button onClick={() => { setShowAdd(false); setEditRateId(null); setRateForm(BLANK_RATE) }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.875rem', background: 'transparent', border: '1px solid var(--color-border-input)', borderRadius: 5, cursor: 'pointer', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              <X size={12} /> Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading ? <SkeletonBlock height={40} /> : !rates?.length ? (
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', margin: '0.5rem 0' }}>No rate cards yet. Click "Add Rate" to define pricing.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ background: 'var(--color-bg)' }}>
                {['Service','Origin','Dest','Wt Min','Wt Max','Base','/ kg','Currency','Transit','Active',''].map(h => (
                  <th key={h} style={{ padding: '0.375rem 0.5rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', whiteSpace: 'nowrap', fontSize: '0.75rem' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rates.map(r => (
                <tr key={r.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '0.375rem 0.5rem' }}>{r.serviceType}</td>
                  <td style={{ padding: '0.375rem 0.5rem' }}>{r.originZone || '—'}</td>
                  <td style={{ padding: '0.375rem 0.5rem' }}>{r.destinationZone || '—'}</td>
                  <td style={{ padding: '0.375rem 0.5rem' }}>{r.weightMinKg}</td>
                  <td style={{ padding: '0.375rem 0.5rem' }}>{r.weightMaxKg}</td>
                  <td style={{ padding: '0.375rem 0.5rem', fontWeight: 600 }}>{r.baseRate.toFixed(2)}</td>
                  <td style={{ padding: '0.375rem 0.5rem' }}>{r.perKgRate.toFixed(2)}</td>
                  <td style={{ padding: '0.375rem 0.5rem' }}>{r.currency}</td>
                  <td style={{ padding: '0.375rem 0.5rem' }}>{r.transitDaysMin}–{r.transitDaysMax}d</td>
                  <td style={{ padding: '0.375rem 0.5rem' }}>
                    {r.isActive ? <CheckCircle size={13} color="var(--badge-green-text)" /> : <XCircle size={13} color="var(--color-text-muted-lighter)" />}
                  </td>
                  <td style={{ padding: '0.375rem 0.5rem', display: 'flex', gap: '0.375rem' }}>
                    <button onClick={() => openEditRate(r)} style={{ padding: '0.2rem 0.5rem', border: '1px solid var(--color-primary)', borderRadius: 4, background: 'transparent', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.75rem' }}>Edit</button>
                    <button onClick={() => setDeleteRateId(r.id)} style={{ padding: '0.2rem 0.5rem', border: '1px solid #dc2626', borderRadius: 4, background: 'transparent', color: '#dc2626', cursor: 'pointer', fontSize: '0.75rem' }}>Del</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal open={deleteRateId !== null} title="Delete Rate Card"
        message="Remove this rate card? This cannot be undone."
        onConfirm={() => deleteRateId && deleteRate.mutate(deleteRateId)}
        onCancel={() => setDeleteRateId(null)} />
    </div>
  )
}

export default function CarriersPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteCarrierId, setDeleteCarrierId] = useState<string | null>(null)
  const [expandedRates, setExpandedRates] = useState<Set<string>>(new Set())
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
  const toggleRates = (id: string) => setExpandedRates(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Carrier Integrations</h2>
        <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 500, cursor: 'pointer' }}>
          <Plus size={16} /> Add Carrier
        </button>
      </div>

      {showForm && (
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
            <div key={c.id} style={{ background: 'var(--color-surface)', borderRadius: 10, padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: c.isActive ? 'var(--badge-green-bg)' : 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Truck size={22} color={c.isActive ? 'var(--badge-green-text)' : 'var(--color-text-muted-lighter)'} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '1rem' }}>{c.name}</span>
                    {c.isActive
                      ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--badge-green-text)', fontWeight: 500 }}><CheckCircle size={12} /> Active</span>
                      : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--color-text-muted-lighter)', fontWeight: 500 }}><XCircle size={12} /> Inactive</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.375rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                    <span>API: <code style={{ background: 'var(--color-bg)', padding: '0.125rem 0.375rem', borderRadius: 3 }}>{c.apiEndpoint || '—'}</code></span>
                    <span>Key: <code style={{ background: 'var(--color-bg)', padding: '0.125rem 0.375rem', borderRadius: 3 }}>{c.apiKey ? c.apiKey.slice(0, 8) + '****' : '—'}</code></span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button onClick={() => toggleRates(c.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 0.75rem', background: 'var(--color-bg)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)', borderRadius: 6, cursor: 'pointer', fontSize: '0.8125rem' }}>
                    <DollarSign size={13} /> Rates {expandedRates.has(c.id) ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
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

              {expandedRates.has(c.id) && <RateCards carrier={c} />}
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

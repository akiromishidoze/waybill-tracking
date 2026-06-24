import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { eCommerceService } from '@/services/api'
import type { ECommercePlatform } from '@/types/waybill'
import {
  ShoppingCart, RefreshCw, CheckCircle, XCircle, Link2,
  Globe, Package, AlertTriangle, Plus, X,
} from 'lucide-react'
import BackButton from '@/components/BackButton'

const PLATFORM_COLORS: Record<string, string> = {
  Shopify: 'var(--status-green)',
  Lazada: 'var(--status-blue)',
  Shopee: 'var(--status-amber)',
  Amazon: 'var(--status-orange)',
  WooCommerce: 'var(--status-purple)',
}

function ago(iso: string | null) {
  if (!iso) return 'Never'
  const diff = Date.now() - new Date(iso).getTime()
  const hrs = Math.floor(diff / 3600000)
  if (hrs < 1) return `${Math.floor(diff / 60000)}m ago`
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const PLATFORM_OPTIONS = ['Shopify', 'Lazada', 'Shopee', 'Amazon', 'WooCommerce', 'Other']

export default function ECommerceIntegrationsPage() {
  const queryClient = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState<Partial<ECommercePlatform>>({
    platform: '',
    storeName: '',
    storeUrl: '',
    webhookUrl: '',
  })
  const [formError, setFormError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['ecommerce'],
    queryFn: () => eCommerceService.getDashboard().then(r => r.data),
  })

  const createPlatform = useMutation({
    mutationFn: (data: Partial<ECommercePlatform>) => eCommerceService.createPlatform(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ecommerce'] })
      setShowAdd(false)
      setForm({ platform: '', storeName: '', storeUrl: '', webhookUrl: '' })
      setFormError('')
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.error || 'Failed to add platform. Please try again.')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!form.platform || !form.storeName) {
      setFormError('Platform and store name are required.')
      return
    }
    createPlatform.mutate(form)
  }

  if (isLoading) {
    return (
      <div style={{ padding: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>E-Commerce Integrations</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ height: 160, borderRadius: 10, background: 'var(--color-surface)', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      </div>
    )
  }

  if (!data) return null

  const { platforms, recentSyncs, summary } = data

  return (
    <div style={{ padding: '2rem', maxWidth: 1400 }}>
      <BackButton fallback="/dashboard" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>E-Commerce Platform Connectors</h1>
        <button
          onClick={() => setShowAdd(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.625rem 1.25rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem' }}
        >
          <Plus size={16} /> Add Platform
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { icon: Link2, label: 'Connected Stores', value: `${summary.totalConnected} / ${platforms.length}`, color: 'var(--status-green)' },
          { icon: Package, label: 'Orders Synced', value: summary.totalOrdersSynced.toLocaleString(), color: 'var(--status-blue)' },
          { icon: RefreshCw, label: 'Last Sync', value: ago(summary.lastSyncAt), color: 'var(--status-amber)' },
        ].map((card, i) => (
          <div key={i} style={{ background: 'var(--color-surface)', borderRadius: 10, padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: card.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <card.icon size={20} color={card.color} />
              </div>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{card.label}</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Platform Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {platforms.map(p => {
          const color = PLATFORM_COLORS[p.platform] || 'var(--status-gray)'
          return (
            <div key={p.id} style={{ background: 'var(--color-surface)', borderRadius: 10, padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShoppingCart size={18} color={color} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{p.storeName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{p.platform}</div>
                  </div>
                </div>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', borderRadius: 6, fontSize: '0.6875rem', fontWeight: 600,
                  background: p.connected ? 'var(--status-green)20' : 'var(--color-bg)',
                  color: p.connected ? 'var(--status-green)' : 'var(--color-text-muted)',
                }}>
                  {p.connected ? <><CheckCircle size={12} /> Connected</> : <><XCircle size={12} /> Disconnected</>}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8125rem', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.6875rem' }}>Total Orders</div>
                  <div style={{ fontWeight: 600 }}>{p.totalOrders.toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.6875rem' }}>Synced</div>
                  <div style={{ fontWeight: 600 }}>{p.syncedOrders.toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.6875rem' }}>Last Sync</div>
                  <div style={{ fontWeight: 600 }}>{ago(p.lastSync)}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.6875rem' }}>Sync Rate</div>
                  <div style={{ fontWeight: 600 }}>{p.totalOrders > 0 ? ((p.syncedOrders / p.totalOrders) * 100).toFixed(1) : '0'}%</div>
                </div>
              </div>
              {p.storeUrl && (
                <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Globe size={12} /> {p.storeUrl}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Recent Syncs */}
      <div style={{ background: 'var(--color-surface)', borderRadius: 10, padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
        <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <RefreshCw size={18} color="var(--color-primary)" /> Recent Sync Activity
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem' }}>Store</th>
                <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem' }}>Platform</th>
                <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem' }}>Status</th>
                <th style={{ textAlign: 'right', padding: '0.5rem 0.75rem' }}>Orders</th>
                <th style={{ textAlign: 'right', padding: '0.5rem 0.75rem' }}>Errors</th>
                <th style={{ textAlign: 'right', padding: '0.5rem 0.75rem' }}>Synced At</th>
              </tr>
            </thead>
            <tbody>
              {recentSyncs.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '0.625rem 0.75rem', fontWeight: 500 }}>{s.storeName}</td>
                  <td style={{ padding: '0.625rem 0.75rem' }}>{s.platform}</td>
                  <td style={{ padding: '0.625rem 0.75rem' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.125rem 0.5rem', borderRadius: 4, fontSize: '0.6875rem', fontWeight: 600,
                      background: s.status === 'success' ? 'var(--status-green)20' : s.status === 'failed' ? 'var(--status-red)20' : 'var(--status-blue)20',
                      color: s.status === 'success' ? 'var(--status-green)' : s.status === 'failed' ? 'var(--status-red)' : 'var(--status-blue)',
                    }}>
                      {s.status === 'success' ? <CheckCircle size={10} /> : s.status === 'failed' ? <AlertTriangle size={10} /> : <RefreshCw size={10} />}
                      {s.status === 'in_progress' ? 'In Progress' : s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                    </span>
                  </td>
                  <td style={{ padding: '0.625rem 0.75rem', textAlign: 'right' }}>{s.ordersSynced}</td>
                  <td style={{ padding: '0.625rem 0.75rem', textAlign: 'right', color: s.errorsCount > 0 ? 'var(--status-red)' : 'var(--status-green)' }}>{s.errorsCount}</td>
                  <td style={{ padding: '0.625rem 0.75rem', textAlign: 'right', color: 'var(--color-text-muted)' }}>{ago(s.syncedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: 12, padding: '1.5rem', width: '100%', maxWidth: 480, boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Add E-Commerce Platform</h2>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>Platform</label>
                <select
                  value={form.platform || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, platform: e.target.value }))}
                  style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: '0.875rem', background: 'var(--color-surface)' }}
                >
                  <option value="">Select platform...</option>
                  {PLATFORM_OPTIONS.map((p) => (<option key={p} value={p}>{p}</option>))}
                </select>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>Store Name</label>
                <input
                  type="text"
                  value={form.storeName || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, storeName: e.target.value }))}
                  placeholder="My Store"
                  style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: '0.875rem' }}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>Store URL</label>
                <input
                  type="text"
                  value={form.storeUrl || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, storeUrl: e.target.value }))}
                  placeholder="https://store.example.com"
                  style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: '0.875rem' }}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>Webhook URL</label>
                <input
                  type="text"
                  value={form.webhookUrl || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, webhookUrl: e.target.value }))}
                  placeholder="https://store.example.com/webhooks/waybill"
                  style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: '0.875rem' }}
                />
              </div>
              {formError && <p style={{ color: 'var(--badge-red-text)', fontSize: '0.8125rem', marginBottom: '1rem' }}>{formError}</p>}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowAdd(false)} style={{ padding: '0.625rem 1.25rem', border: '1px solid var(--color-border)', borderRadius: 8, background: 'var(--color-surface)', cursor: 'pointer', fontSize: '0.875rem' }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createPlatform.isPending}
                  style={{ padding: '0.625rem 1.25rem', border: 'none', borderRadius: 8, background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}
                >
                  {createPlatform.isPending ? 'Adding...' : 'Add Platform'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
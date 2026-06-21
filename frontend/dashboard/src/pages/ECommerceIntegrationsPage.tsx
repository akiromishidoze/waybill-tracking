import { useQuery } from '@tanstack/react-query'
import { eCommerceService } from '@/services/api'
import {
  ShoppingCart, RefreshCw, CheckCircle, XCircle, Link2,
  Globe, Package, AlertTriangle,
} from 'lucide-react'

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

export default function ECommerceIntegrationsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['ecommerce'],
    queryFn: () => eCommerceService.getDashboard().then(r => r.data),
  })

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
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>E-Commerce Platform Connectors</h1>

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
    </div>
  )
}
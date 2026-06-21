import { useQuery } from '@tanstack/react-query'
import { costAnalyticsService } from '@/services/api'
import {
  DollarSign, TrendingUp, TrendingDown, PieChart, Truck, MapPin, Package, BarChart3
} from 'lucide-react'

function fmt(n: number) { return '₱' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

const CARD_COLORS = ['var(--status-blue)', 'var(--status-green)', 'var(--status-amber)', 'var(--status-purple)']

export default function CostAnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['cost-analytics'],
    queryFn: () => costAnalyticsService.get().then(r => r.data),
  })

  if (isLoading) {
    return (
      <div style={{ padding: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Cost-per-Shipment Analytics</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ height: 120, borderRadius: 10, background: 'var(--color-surface)', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      </div>
    )
  }

  if (!data) return null

  const { summary, byCarrier, byRegion, byStatus, monthlyTrend } = data
  const maxCarrierCost = Math.max(...byCarrier.map(c => c.totalCost))
  const maxRegionCost = Math.max(...byRegion.map(r => r.totalCost))
  const maxMonthlyRevenue = Math.max(...monthlyTrend.map(m => m.revenue || 1))

  return (
    <div style={{ padding: '2rem', maxWidth: 1400 }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Cost-per-Shipment Analytics</h1>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { icon: DollarSign, label: 'Total Cost', value: fmt(summary.totalCost), color: CARD_COLORS[0] },
          { icon: TrendingUp, label: 'Total Revenue', value: fmt(summary.totalRevenue), color: CARD_COLORS[1] },
          { icon: Package, label: 'Avg Cost / Shipment', value: fmt(summary.avgCostPerShipment), color: CARD_COLORS[2] },
          { icon: summary.profitMargin >= 30 ? TrendingUp : TrendingDown, label: 'Profit Margin', value: `${summary.profitMargin}%`, color: summary.profitMargin >= 30 ? CARD_COLORS[1] : CARD_COLORS[3] },
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Cost by Carrier */}
        <div style={{ background: 'var(--color-surface)', borderRadius: 10, padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Truck size={18} color="var(--color-primary)" /> Cost by Carrier
          </h3>
          {byCarrier.map((c, i) => (
            <div key={c.carrierId} style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 500 }}>{c.carrierName}</span>
                <span style={{ color: 'var(--color-text-muted)' }}>{fmt(c.totalCost)} ({c.shipmentCount} shipments)</span>
              </div>
              <div style={{ height: 8, background: 'var(--color-bg)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(c.totalCost / maxCarrierCost) * 100}%`, background: CARD_COLORS[i % CARD_COLORS.length], borderRadius: 4, transition: 'width 0.5s' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Cost by Region */}
        <div style={{ background: 'var(--color-surface)', borderRadius: 10, padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={18} color="var(--color-primary)" /> Cost by Region
          </h3>
          {byRegion.map((r, i) => (
            <div key={r.region} style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 500 }}>{r.region}</span>
                <span style={{ color: 'var(--color-text-muted)' }}>{fmt(r.totalCost)} ({r.shipmentCount} shipments)</span>
              </div>
              <div style={{ height: 8, background: 'var(--color-bg)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(r.totalCost / maxRegionCost) * 100}%`, background: CARD_COLORS[(i + 2) % CARD_COLORS.length], borderRadius: 4, transition: 'width 0.5s' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Trend */}
      <div style={{ background: 'var(--color-surface)', borderRadius: 10, padding: '1.25rem', boxShadow: 'var(--shadow-sm)', marginBottom: '2rem' }}>
        <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart3 size={18} color="var(--color-primary)" /> Monthly Trend
        </h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', height: 180, padding: '0 0.5rem' }}>
          {monthlyTrend.filter(m => m.count > 0).map(m => (
            <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
              <div style={{ display: 'flex', gap: '2px', width: '100%', height: `${(m.revenue / maxMonthlyRevenue) * 100}%`, alignItems: 'flex-end' }}>
                <div style={{ flex: 1, background: CARD_COLORS[0], borderRadius: '3px 3px 0 0', minHeight: 4, height: `${(m.cost / m.revenue) * 100}%` }} title={`Cost: ${fmt(m.cost)}`} />
                <div style={{ flex: 1, background: CARD_COLORS[1], borderRadius: '3px 3px 0 0', minHeight: 4, height: '100%' }} title={`Revenue: ${fmt(m.revenue)}`} />
              </div>
              <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '0.375rem' }}>{m.month}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><span style={{ width: 10, height: 10, borderRadius: 2, background: CARD_COLORS[0], display: 'inline-block' }} /> Cost</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><span style={{ width: 10, height: 10, borderRadius: 2, background: CARD_COLORS[1], display: 'inline-block' }} /> Revenue</span>
        </div>
      </div>

      {/* Status Breakdown */}
      <div style={{ background: 'var(--color-surface)', borderRadius: 10, padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
        <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PieChart size={18} color="var(--color-primary)" /> Cost by Status
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: '0.625rem 0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Status</th>
              <th style={{ padding: '0.625rem 0.75rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Shipments</th>
              <th style={{ padding: '0.625rem 0.75rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Total Cost</th>
              <th style={{ padding: '0.625rem 0.75rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>% of Total</th>
            </tr>
          </thead>
          <tbody>
            {byStatus.map(s => (
              <tr key={s.status} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                <td style={{ padding: '0.625rem 0.75rem', fontSize: '0.875rem' }}>{s.status.replace(/_/g, ' ')}</td>
                <td style={{ padding: '0.625rem 0.75rem', textAlign: 'right', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{s.shipmentCount}</td>
                <td style={{ padding: '0.625rem 0.75rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: 600 }}>{fmt(s.totalCost)}</td>
                <td style={{ padding: '0.625rem 0.75rem', textAlign: 'right', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{((s.totalCost / summary.totalCost) * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
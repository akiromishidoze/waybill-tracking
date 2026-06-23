import { useQuery } from '@tanstack/react-query'
import { carbonFootprintService } from '@/services/api'
import {
  Leaf, TrendingDown, TrendingUp, Truck, MapPin, BarChart3, ShieldCheck,
} from 'lucide-react'
import BackButton from '@/components/BackButton'

function fmt(n: number) { return n.toLocaleString(undefined, { maximumFractionDigits: 1 }) }
function pct(n: number) { return (n >= 0 ? '+' : '') + n.toFixed(1) + '%' }

const COLORS = ['var(--status-green)', 'var(--status-blue)', 'var(--status-amber)', 'var(--status-purple)', 'var(--status-red)']

export default function CarbonFootprintPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['carbon-footprint'],
    queryFn: () => carbonFootprintService.get().then(r => r.data),
  })

  if (isLoading) {
    return (
      <div style={{ padding: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Carbon Footprint</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ height: 120, borderRadius: 10, background: 'var(--color-surface)', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      </div>
    )
  }

  if (!data) return null

  const { summary, byCarrier, byRegion, monthlyTrend } = data
  const maxCarrierEmissions = Math.max(...byCarrier.map(c => c.totalEmissions))
  const maxMonthlyEmissions = Math.max(...monthlyTrend.map(m => m.emissions))

  return (
    <div style={{ padding: '2rem', maxWidth: 1400 }}>
      <BackButton fallback="/analytics" />
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Carbon Footprint Tracking</h1>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { icon: Leaf, label: 'Total Emissions', value: fmt(summary.totalEmissions) + ' kg', color: COLORS[0] },
          { icon: Truck, label: 'Avg per Shipment', value: fmt(summary.avgPerShipment) + ' kg', color: COLORS[1] },
          { icon: ShieldCheck, label: 'Offset Credits', value: fmt(summary.offsetCredits) + ' kg', color: COLORS[2] },
          { icon: summary.vsLastMonth < 0 ? TrendingDown : TrendingUp, label: 'vs Last Month', value: pct(summary.vsLastMonth), color: summary.vsLastMonth <= 0 ? COLORS[0] : COLORS[4] },
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

      <div style={{ background: 'var(--color-surface)', borderRadius: 10, padding: '1.25rem', boxShadow: 'var(--shadow-sm)', marginBottom: '2rem' }}>
        <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Leaf size={18} color="var(--color-primary)" /> Net Emissions
        </h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 160, padding: '1rem', background: 'var(--color-bg)', borderRadius: 8 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Gross Emissions</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--status-red)' }}>{fmt(summary.totalEmissions)} kg</div>
          </div>
          <div style={{ flex: 1, minWidth: 160, padding: '1rem', background: 'var(--color-bg)', borderRadius: 8 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Offset Credits</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--status-green)' }}>-{fmt(summary.offsetCredits)} kg</div>
          </div>
          <div style={{ flex: 1, minWidth: 160, padding: '1rem', background: 'var(--color-bg)', borderRadius: 8 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Net Emissions</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: summary.netEmissions < summary.totalEmissions / 2 ? 'var(--status-green)' : 'var(--status-amber)' }}>{fmt(summary.netEmissions)} kg</div>
          </div>
          <div style={{ flex: 1, minWidth: 160, padding: '1rem', background: 'var(--color-bg)', borderRadius: 8 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Shipments Tracked</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{fmt(summary.totalShipments)}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* By Carrier */}
        <div style={{ background: 'var(--color-surface)', borderRadius: 10, padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Truck size={18} color="var(--color-primary)" /> Emissions by Carrier
          </h3>
          {byCarrier.map(c => (
            <div key={c.carrierId} style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.125rem' }}>
                <span style={{ fontWeight: 500 }}>{c.carrierName}</span>
                <span style={{ color: 'var(--color-text-muted)' }}>{fmt(c.totalEmissions)} kg ({fmt(c.avgPerShipment)}/ship)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <div style={{ flex: 1, height: 8, background: 'var(--color-bg)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(c.totalEmissions / maxCarrierEmissions) * 100}%`, background: c.efficiency === 'good' ? COLORS[0] : c.efficiency === 'average' ? COLORS[2] : COLORS[4], borderRadius: 4 }} />
                </div>
                <span style={{
                  fontSize: '0.6875rem', fontWeight: 600, padding: '0.125rem 0.375rem', borderRadius: 4,
                  background: c.efficiency === 'good' ? COLORS[0] + '20' : c.efficiency === 'average' ? COLORS[2] + '20' : COLORS[4] + '20',
                  color: c.efficiency === 'good' ? COLORS[0] : c.efficiency === 'average' ? COLORS[2] : COLORS[4],
                }}>{c.efficiency}</span>
              </div>
            </div>
          ))}
        </div>

        {/* By Region */}
        <div style={{ background: 'var(--color-surface)', borderRadius: 10, padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={18} color="var(--color-primary)" /> Emissions by Region
          </h3>
          {byRegion.map((r, i) => (
            <div key={r.region} style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 500 }}>{r.region}</span>
                <span style={{ color: 'var(--color-text-muted)' }}>{fmt(r.totalEmissions)} kg ({fmt(r.avgPerShipment)}/ship)</span>
              </div>
              <div style={{ height: 8, background: 'var(--color-bg)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(r.totalEmissions / Math.max(...byRegion.map(x => x.totalEmissions))) * 100}%`, background: COLORS[(i + 1) % COLORS.length], borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Trend */}
      <div style={{ background: 'var(--color-surface)', borderRadius: 10, padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
        <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart3 size={18} color="var(--color-primary)" /> Monthly CO₂ Emissions
        </h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', height: 200, padding: '0 0.5rem' }}>
          {monthlyTrend.map(m => (
            <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
              <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '2px' }}>
                <div style={{ width: '100%', background: 'var(--color-bg)', borderRadius: '3px 3px 0 0', height: `${(m.emissions / maxMonthlyEmissions) * 100}%`, overflow: 'hidden' }}>
                  <div style={{ width: '100%', height: '100%', background: 'linear-gradient(to top, var(--status-green), var(--status-blue))', opacity: 0.8 }} />
                </div>
              </div>
              <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '0.375rem' }}>{m.month}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><span style={{ width: 10, height: 10, borderRadius: 2, background: 'linear-gradient(to top, var(--status-green), var(--status-blue))', display: 'inline-block' }} /> CO₂ Emissions</span>
        </div>
      </div>
    </div>
  )
}
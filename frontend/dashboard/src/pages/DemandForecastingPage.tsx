import { useQuery } from '@tanstack/react-query'
import { demandForecastService } from '@/services/api'
import {
  TrendingUp, TrendingDown, BarChart3, MapPin, ArrowLeftRight, Package,
} from 'lucide-react'
import BackButton from '@/components/BackButton'

function pct(n: number) { return n + '%' }
function fmt(n: number) { return n.toLocaleString() }

const COLORS = ['var(--status-blue)', 'var(--status-amber)', 'var(--status-green)', 'var(--status-purple)', 'var(--status-red)']

export default function DemandForecastingPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['demand-forecast'],
    queryFn: () => demandForecastService.get().then(r => r.data),
  })

  if (isLoading) {
    return (
      <div style={{ padding: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Demand Forecasting</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ height: 120, borderRadius: 10, background: 'var(--color-surface)', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      </div>
    )
  }

  if (!data) return null

  const { summary, byLane, byRegion, monthlyForecast } = data
  const maxLaneVolume = Math.max(...byLane.map(l => l.forecastedVolume))
  const maxMonthlyVolume = Math.max(...monthlyForecast.map(m => m.capacity || 1))

  return (
    <div style={{ padding: '2rem', maxWidth: 1400 }}>
      <BackButton fallback="/analytics" />
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Demand Forecasting</h1>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { icon: Package, label: 'Forecast Volume (Dec)', value: fmt(summary.totalForecast), color: COLORS[0] },
          { icon: BarChart3, label: 'Total Capacity', value: fmt(summary.totalCapacity), color: COLORS[1] },
          { icon: TrendingUp, label: 'Utilization Rate', value: pct(summary.utilizationRate), color: summary.utilizationRate >= 80 ? COLORS[2] : COLORS[3] },
          { icon: summary.nextMonthGrowth >= 10 ? TrendingUp : TrendingDown, label: 'Next Month Growth', value: pct(summary.nextMonthGrowth), color: summary.nextMonthGrowth >= 10 ? COLORS[2] : COLORS[4] },
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
        {/* Forecast by Lane */}
        <div style={{ background: 'var(--color-surface)', borderRadius: 10, padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeftRight size={18} color="var(--color-primary)" /> Forecast by Lane
          </h3>
          {byLane.map((l) => (
            <div key={l.lane} style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.125rem' }}>
                <span style={{ fontWeight: 500 }}>{l.origin} &rarr; {l.destination}</span>
                <span style={{ color: 'var(--color-text-muted)' }}>{fmt(l.forecastedVolume)} ({pct(l.growth)})</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--color-text-muted-lighter)', marginBottom: '0.25rem' }}>
                <span>Confidence: {pct(l.confidence)}</span>
                <span>Current: {fmt(l.currentVolume)}</span>
              </div>
              <div style={{ height: 8, background: 'var(--color-bg)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(l.forecastedVolume / maxLaneVolume) * 100}%`, background: l.growth >= 14 ? COLORS[2] : l.growth >= 10 ? COLORS[0] : COLORS[1], borderRadius: 4, transition: 'width 0.5s' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Forecast by Region */}
        <div style={{ background: 'var(--color-surface)', borderRadius: 10, padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={18} color="var(--color-primary)" /> Forecast by Region
          </h3>
          {byRegion.map((r, i) => (
            <div key={r.region} style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 500 }}>{r.region}</span>
                <span style={{ color: 'var(--color-text-muted)' }}>{fmt(r.forecastedVolume)} ({pct(r.growth)})</span>
              </div>
              <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', height: 8 }}>
                <div style={{ flex: r.currentVolume, height: '100%', background: 'var(--color-bg)', borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: '100%', background: COLORS[(i + 2) % COLORS.length], borderRadius: 4, opacity: 0.5 }} />
                </div>
                <div style={{ flex: r.forecastedVolume - r.currentVolume, height: '100%', background: COLORS[(i + 2) % COLORS.length], borderRadius: 4 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--color-text-muted-lighter)', marginTop: '0.125rem' }}>
                <span>Current: {fmt(r.currentVolume)}</span>
                <span>Forecast: {fmt(r.forecastedVolume)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Forecast */}
      <div style={{ background: 'var(--color-surface)', borderRadius: 10, padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
        <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart3 size={18} color="var(--color-primary)" /> Monthly Forecast vs Capacity
        </h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', height: 200, padding: '0 0.5rem' }}>
          {monthlyForecast.map(m => (
            <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
              <div style={{ position: 'relative', width: '100%', height: `${(m.capacity / maxMonthlyVolume) * 100}%`, display: 'flex', alignItems: 'flex-end', gap: '2px' }}>
                <div style={{ width: '100%', background: 'var(--color-bg)', borderRadius: '3px 3px 0 0', height: '100%', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: `${(m.volume / m.capacity) * 100}%`, background: COLORS[0], borderRadius: '3px 3px 0 0', transition: 'height 0.5s' }} />
                </div>
              </div>
              <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '0.375rem' }}>{m.month}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><span style={{ width: 10, height: 10, borderRadius: 2, background: COLORS[0], display: 'inline-block' }} /> Demand</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--color-bg)', border: '1px solid var(--color-border)', display: 'inline-block' }} /> Capacity</span>
        </div>
      </div>
    </div>
  )
}
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { analyticsService, escalationService } from '@/services/api'
import { AlertTriangle, RefreshCw, Radio, PauseCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { SkeletonBlock } from '@/components/Skeleton'
import { useLiveDashboard } from '@/hooks/useLiveDashboard'
import { useState, useEffect, useCallback, useRef } from 'react'

const STORAGE_KEY_INTERVAL = 'dashboard_refresh_interval_ms'
const STORAGE_KEY_AUTO = 'dashboard_auto_refresh'

const INTERVAL_OPTIONS: { label: string; ms: number }[] = [
  { label: '5 min',  ms: 5 * 60_000 },
  { label: '10 min', ms: 10 * 60_000 },
  { label: '15 min', ms: 15 * 60_000 },
  { label: '30 min', ms: 30 * 60_000 },
  { label: '1 hr',   ms: 60 * 60_000 },
  { label: '2 hr',   ms: 2 * 60 * 60_000 },
  { label: '3 hr',   ms: 3 * 60 * 60_000 },
  { label: '6 hr',   ms: 6 * 60 * 60_000 },
  { label: '8 hr',   ms: 8 * 60 * 60_000 },
]

const DEFAULT_INTERVAL_MS = 30 * 60_000

function readStoredInterval(): number {
  const v = localStorage.getItem(STORAGE_KEY_INTERVAL)
  if (v) {
    const n = parseInt(v, 10)
    if (INTERVAL_OPTIONS.some(o => o.ms === n)) return n
  }
  return DEFAULT_INTERVAL_MS
}

function readStoredAuto(): boolean {
  return localStorage.getItem(STORAGE_KEY_AUTO) !== 'false'
}

function formatCountdown(ms: number): string {
  const totalSec = Math.ceil(ms / 1000)
  if (totalSec < 60) return `${totalSec}s`
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

function formatLastUpdated(d: Date): string {
  const diff = Math.floor((Date.now() - d.getTime()) / 1000)
  if (diff < 5) return 'just now'
  if (diff < 60) return `${diff}s ago`
  const m = Math.floor(diff / 60)
  if (m < 60) return `${m}m ago`
  return d.toLocaleTimeString()
}

const statsCards = [
  { label: 'Active Waybills', key: 'totalActive', color: 'var(--badge-blue-text)' },
  { label: 'Delivered Today', key: 'deliveredToday', color: 'var(--badge-green-text)' },
  { label: 'In Transit', key: 'inTransit', color: 'var(--badge-amber-text)' },
  { label: 'Pending Pickup', key: 'pendingPickup', color: 'var(--badge-red-text)' },
]

export default function DashboardPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [intervalMs, setIntervalMs] = useState<number>(readStoredInterval)
  const [autoRefresh, setAutoRefresh] = useState<boolean>(readStoredAuto)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [remainingMs, setRemainingMs] = useState<number>(intervalMs)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const nextRefreshAt = useRef<number>(Date.now() + intervalMs)

  useLiveDashboard()

  const { data: stats, isLoading: statsLoading, dataUpdatedAt } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => analyticsService.stats().then((r) => r.data),
    refetchInterval: autoRefresh ? intervalMs : false,
  })

  const { data: escalations } = useQuery({
    queryKey: ['escalations'],
    queryFn: () => escalationService.list().then(r => r.data),
    refetchInterval: autoRefresh ? intervalMs : false,
  })

  useEffect(() => {
    if (dataUpdatedAt) {
      setLastUpdated(new Date(dataUpdatedAt))
      nextRefreshAt.current = Date.now() + intervalMs
      setRemainingMs(intervalMs)
    }
  }, [dataUpdatedAt, intervalMs])

  useEffect(() => {
    if (!autoRefresh) { setRemainingMs(intervalMs); return }
    const tick = setInterval(() => {
      const left = nextRefreshAt.current - Date.now()
      setRemainingMs(Math.max(0, left))
    }, 1000)
    return () => clearInterval(tick)
  }, [autoRefresh, intervalMs])

  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] }),
      queryClient.invalidateQueries({ queryKey: ['escalations'] }),
    ])
    nextRefreshAt.current = Date.now() + intervalMs
    setIsRefreshing(false)
  }, [queryClient, intervalMs])

  const handleIntervalChange = (ms: number) => {
    setIntervalMs(ms)
    localStorage.setItem(STORAGE_KEY_INTERVAL, String(ms))
    nextRefreshAt.current = Date.now() + ms
    setRemainingMs(ms)
  }

  const handleAutoToggle = () => {
    const next = !autoRefresh
    setAutoRefresh(next)
    localStorage.setItem(STORAGE_KEY_AUTO, String(next))
    if (next) {
      nextRefreshAt.current = Date.now() + intervalMs
      setRemainingMs(intervalMs)
    }
  }

  const openEscalations = escalations?.filter((e: any) => e?.status === 'OPEN').length || 0

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Dashboard</h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem' }}>
            {autoRefresh
              ? <Radio size={13} color="#16a34a" />
              : <PauseCircle size={13} color="#94a3b8" />}
            <span style={{ fontWeight: 600, color: autoRefresh ? '#16a34a' : '#94a3b8' }}>
              {autoRefresh ? 'Auto' : 'Paused'}
            </span>
            {lastUpdated && (
              <span style={{ color: 'var(--color-text-muted)' }}>
                · updated {formatLastUpdated(lastUpdated)}
                {autoRefresh && ` · next in ${formatCountdown(remainingMs)}`}
              </span>
            )}
          </div>

          <select
            value={intervalMs}
            onChange={e => handleIntervalChange(Number(e.target.value))}
            title="Auto-refresh interval"
            style={{
              padding: '0.3rem 0.5rem',
              border: '1px solid var(--color-border-input)',
              borderRadius: 6,
              fontSize: '0.8125rem',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              cursor: 'pointer',
            }}
          >
            {INTERVAL_OPTIONS.map(o => (
              <option key={o.ms} value={o.ms}>{o.label}</option>
            ))}
          </select>

          <button
            onClick={handleAutoToggle}
            title={autoRefresh ? 'Pause auto-refresh' : 'Enable auto-refresh'}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.375rem',
              padding: '0.375rem 0.75rem',
              border: `1px solid ${autoRefresh ? '#16a34a' : 'var(--color-border)'}`,
              borderRadius: 6,
              background: autoRefresh ? '#dcfce7' : 'var(--color-surface)',
              color: autoRefresh ? '#16a34a' : 'var(--color-text-muted)',
              cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 500,
            }}
          >
            {autoRefresh ? <Radio size={13} /> : <PauseCircle size={13} />}
            {autoRefresh ? 'Auto On' : 'Auto Off'}
          </button>

          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            title="Refresh now"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.375rem',
              padding: '0.375rem 0.75rem', border: '1px solid var(--color-border)',
              borderRadius: 6, background: 'var(--color-surface)', cursor: 'pointer',
              fontSize: '0.8125rem', color: 'var(--color-text-muted)',
              opacity: isRefreshing ? 0.6 : 1,
            }}
          >
            <RefreshCw size={13} style={{ animation: isRefreshing ? 'spin 0.7s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
        }}
      >
        {statsCards.map((card) => (
          <div
            key={card.key}
            style={{
              background: 'var(--color-surface)',
              padding: '1.25rem',
              borderRadius: 10,
              borderLeft: `4px solid ${card.color}`,
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{card.label}</p>
            {statsLoading ? (
              <SkeletonBlock width={80} height={32} style={{ marginTop: 4 }} />
            ) : (
              <p style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                {stats?.[card.key as keyof typeof stats] ?? '—'}
              </p>
            )}
          </div>
        ))}
      </div>

      {openEscalations > 0 && (
        <div onClick={() => navigate('/escalations')} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.5rem', padding: '1rem 1.25rem', background: 'var(--badge-red-bg)', border: '1px solid var(--badge-red-border)', borderRadius: 10, cursor: 'pointer' }}>
          <AlertTriangle size={20} color="#dc2626" />
          <div>
            <p style={{ fontWeight: 600, color: 'var(--badge-red-text)', fontSize: '0.9375rem' }}>{openEscalations} Open Escalation{openEscalations > 1 ? 's' : ''}</p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--badge-red-text)' }}>Click to view and resolve.</p>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

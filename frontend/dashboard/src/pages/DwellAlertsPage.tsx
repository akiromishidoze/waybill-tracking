import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dwellTimeService } from '@/services/api'
import type { DwellAlert } from '@/types/waybill'
import { Clock, CheckCircle, Eye, AlertTriangle } from 'lucide-react'
import PageContainer from '@/components/PageContainer'

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours >= 24) {
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24
    return `${days}d ${remainingHours}h`
  }
  return `${hours}h ${mins}m`
}

export default function DwellAlertsPage() {
  const queryClient = useQueryClient()
  const [threshold, setThreshold] = useState<number>(1440)


  const { data: alerts, isLoading } = useQuery({
    queryKey: ['dwell-alerts'],
    queryFn: () => dwellTimeService.listAlerts().then(r => r.data),
  })

  const updateThreshold = useMutation({
    mutationFn: () => dwellTimeService.setThreshold(threshold),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dwell-threshold'] }),
  })

  const acknowledgeAlert = useMutation({
    mutationFn: (id: string) => dwellTimeService.acknowledge(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dwell-alerts'] }),
  })

  const activeAlerts = (alerts || []).filter(a => !a.acknowledged)
  const acknowledgedAlerts = (alerts || []).filter(a => a.acknowledged)

  return (
    <PageContainer
      title="Dwell Time Alerts"
      actions={
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <label style={{ color: 'var(--color-text-muted)' }}>Threshold (min):</label>
            <input
              type="number"
              value={threshold}
              onChange={e => setThreshold(+e.target.value)}
              style={{ width: 80, padding: '0.375rem 0.5rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.8125rem' }}
            />
            <button
              onClick={() => updateThreshold.mutate()}
              disabled={updateThreshold.isPending}
              style={{ padding: '0.375rem 0.75rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.8125rem', cursor: 'pointer' }}
            >
              {updateThreshold.isPending ? 'Saving...' : 'Update'}
            </button>
          </div>
          <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Active: <strong style={{ color: '#dc2626' }}>{activeAlerts.length}</strong>
            {' · '}Acknowledged: <strong>{acknowledgedAlerts.length}</strong>
          </span>
        </div>
      }
    >
      {isLoading ? (
        <p>Loading...</p>
      ) : alerts && alerts.length === 0 ? (
        <div style={{ background: 'var(--color-surface)', padding: '2rem', borderRadius: 10, textAlign: 'center', color: 'var(--color-text-muted-lighter)' }}>
          <Clock size={40} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
          <p style={{ fontWeight: 500 }}>No dwell time alerts</p>
          <p style={{ fontSize: '0.875rem' }}>All shipments are moving through hubs within the threshold.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {activeAlerts.length > 0 && (
            <section>
              <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.75rem', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={18} /> Active Alerts
              </h3>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {activeAlerts.map((alert: DwellAlert) => (
                  <div key={alert.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--badge-red-bg)', borderRadius: 10, border: '1px solid var(--badge-red-border)' }}>
                    <Clock size={20} color="#dc2626" />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <Link to={`/waybills/${alert.waybillId}`} style={{ fontWeight: 600, color: 'var(--color-text-primary)', textDecoration: 'none', fontSize: '0.9375rem' }}>
                          #{alert.trackingNumber}
                        </Link>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>at</span>
                        <strong style={{ fontSize: '0.875rem' }}>{alert.facility}</strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                        <span>Dwelling: <strong style={{ color: '#dc2626' }}>{formatDuration(alert.durationMinutes)}</strong></span>
                        <span style={{ color: 'var(--color-border-input)' }}>·</span>
                        <span>Threshold: {formatDuration(alert.thresholdMinutes)}</span>
                        <span style={{ color: 'var(--color-border-input)' }}>·</span>
                        <span>Since: {new Date(alert.arrivedAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                      <Link to={`/waybills/${alert.waybillId}`} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.75rem', background: 'var(--color-surface)', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.75rem', textDecoration: 'none', color: 'var(--color-text-secondary)' }}>
                        <Eye size={12} /> View
                      </Link>
                      <button
                        onClick={() => acknowledgeAlert.mutate(alert.id)}
                        disabled={acknowledgeAlert.isPending}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.75rem', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer' }}
                      >
                        <CheckCircle size={12} /> Acknowledge
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {acknowledgedAlerts.length > 0 && (
            <section>
              <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={16} /> Acknowledged
              </h3>
              <div style={{ display: 'grid', gap: '0.375rem' }}>
                {acknowledgedAlerts.map((alert: DwellAlert) => (
                  <div key={alert.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'var(--color-surface-hover)', borderRadius: 8 }}>
                    <Clock size={16} color="#94a3b8" />
                    <div style={{ flex: 1, fontSize: '0.875rem' }}>
                      <Link to={`/waybills/${alert.waybillId}`} style={{ fontWeight: 500, color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
                        #{alert.trackingNumber}
                      </Link>
                      <span style={{ color: 'var(--color-text-muted-lighter)' }}> at {alert.facility} — {formatDuration(alert.durationMinutes)}</span>
                    </div>
                    {alert.acknowledgedBy && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted-lighter)' }}>
                        by {alert.acknowledgedBy} {alert.acknowledgedAt && new Date(alert.acknowledgedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </PageContainer>
  )
}
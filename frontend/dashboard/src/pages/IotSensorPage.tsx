import { useQuery } from '@tanstack/react-query'
import { iotSensorService } from '@/services/api'
import {
  Activity, Thermometer, Droplets, Zap, Sun, AlertTriangle,
  Battery, Radio, Wifi,
} from 'lucide-react'
import { SkeletonBlock } from '@/components/Skeleton'
import BackButton from '@/components/BackButton'

function ago(iso: string | null) {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const hrs = Math.floor(diff / 3600000)
  if (hrs < 1) return `${Math.floor(diff / 60000)}m ago`
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const SENSOR_ICONS: Record<string, typeof Thermometer> = {
  TEMPERATURE: Thermometer,
  HUMIDITY: Droplets,
  SHOCK: Zap,
  VIBRATION: Activity,
  LIGHT: Sun,
}

const TYPE_COLORS: Record<string, string> = {
  TEMPERATURE: 'var(--status-red)',
  HUMIDITY: 'var(--status-blue)',
  SHOCK: 'var(--status-amber)',
  VIBRATION: 'var(--status-purple)',
  LIGHT: 'var(--status-orange)',
}

export default function IotSensorPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['iot-sensors'],
    queryFn: () => iotSensorService.getDashboard().then(r => r.data),
  })

  if (isLoading) {
    return (
      <div style={{ padding: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>IoT Sensor Data</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {[1,2,3,4,5].map(i => (
            <SkeletonBlock key={i} height={120} />
          ))}
        </div>
      </div>
    )
  }

  if (!data) return null

  const { summary, devices, recentReadings } = data

  return (
    <div style={{ padding: '2rem', maxWidth: 1400 }}>
      <BackButton fallback="/dashboard" />
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>IoT Sensor Data Ingestion</h1>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { icon: Radio, label: 'Total Devices', value: String(summary.totalDevices), color: 'var(--status-blue)' },
          { icon: Wifi, label: 'Active Devices', value: String(summary.activeDevices), color: 'var(--status-green)' },
          { icon: AlertTriangle, label: "Today's Alerts", value: String(summary.alertsToday), color: summary.alertsToday > 5 ? 'var(--status-red)' : 'var(--status-amber)' },
          { icon: Battery, label: 'Avg Battery', value: summary.avgBatteryLevel + '%', color: summary.avgBatteryLevel > 50 ? 'var(--status-green)' : 'var(--status-red)' },
          { icon: Activity, label: "Today's Readings", value: summary.readingsToday.toLocaleString(), color: 'var(--status-purple)' },
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
        {/* Devices */}
        <div style={{ background: 'var(--color-surface)', borderRadius: 10, padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Radio size={18} color="var(--color-primary)" /> Sensor Devices
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {devices.map(d => (
              <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0.75rem', background: 'var(--color-bg)', borderRadius: 8, fontSize: '0.8125rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.active ? 'var(--status-green)' : 'var(--status-red)' }} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{d.deviceId}</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>{d.model}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Battery size={12} color={d.batteryLevel > 50 ? 'var(--status-green)' : d.batteryLevel > 20 ? 'var(--status-amber)' : 'var(--status-red)'} />
                    {d.batteryLevel}%
                  </span>
                  {d.assignedTracking && <span style={{ fontSize: '0.6875rem' }}>{d.assignedTracking}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Readings */}
        <div style={{ background: 'var(--color-surface)', borderRadius: 10, padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} color="var(--color-primary)" /> Recent Sensor Readings
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {recentReadings.slice(0, 8).map(r => {
              const Icon = SENSOR_ICONS[r.type] || Activity
              const color = TYPE_COLORS[r.type] || 'var(--status-gray)'
              return (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', background: 'var(--color-bg)', borderRadius: 8, fontSize: '0.8125rem' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={16} color={color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 600 }}>{r.deviceId}</span>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>{r.trackingNumber}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {r.value}{r.unit} &middot; {ago(r.recordedAt)}
                    </div>
                  </div>
                  <span style={{
                    padding: '0.125rem 0.5rem', borderRadius: 4, fontSize: '0.6875rem', fontWeight: 600,
                    background: r.status === 'NORMAL' ? 'var(--status-green)20' : r.status === 'WARNING' ? 'var(--status-amber)20' : 'var(--status-red)20',
                    color: r.status === 'NORMAL' ? 'var(--status-green)' : r.status === 'WARNING' ? 'var(--status-amber)' : 'var(--status-red)',
                  }}>{r.status}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
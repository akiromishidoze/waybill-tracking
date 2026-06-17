import { useQuery } from '@tanstack/react-query'
import { analyticsService } from '@/services/api'
import { Package, Clock, AlertTriangle, TrendingUp, CheckCircle, Truck } from 'lucide-react'

function KpiCard({
  label,
  value,
  icon: Icon,
  color,
  sublabel,
  progress,
}: {
  label: string
  value: string | number
  icon: any
  color: string
  sublabel?: string
  progress?: number
}) {
  return (
    <div
      style={{
        background: '#fff',
        padding: '1.25rem',
        borderRadius: 10,
        borderLeft: `4px solid ${color}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '0.25rem' }}>{label}</p>
          <p style={{ fontSize: '1.75rem', fontWeight: 700 }}>{value}</p>
          {sublabel && (
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.125rem' }}>{sublabel}</p>
          )}
        </div>
        <Icon size={24} color={color} />
      </div>
      {progress !== undefined && (
        <div style={{ marginTop: '0.75rem' }}>
          <div
            style={{
              height: 6,
              background: '#e2e8f0',
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.min(progress, 100)}%`,
                height: '100%',
                background: color,
                borderRadius: 3,
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default function AnalyticsPage() {
  const { data: stats } = useQuery({
    queryKey: ['analytics-stats'],
    queryFn: () => analyticsService.stats().then((r) => r.data),
    refetchInterval: 30000,
  })

  const handleExport = async () => {
    try {
      const res = await analyticsService.exportExcel('2024-01-01', '2024-12-31')
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'waybill-report.xlsx'
      a.click()
    } catch {
      console.error('Export failed')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>KPI Dashboard</h2>
        <button
          onClick={handleExport}
          style={{
            padding: '0.5rem 1rem',
            background: '#16a34a',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Export Report
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <KpiCard
          label="On-Time Delivery Rate"
          value={stats ? `${stats.slaCompliance}%` : '—'}
          icon={CheckCircle}
          color="#16a34a"
          sublabel="Last 30 days"
          progress={stats?.slaCompliance}
        />
        <KpiCard
          label="Exception Rate"
          value={stats ? `${stats.exceptionRate}%` : '—'}
          icon={AlertTriangle}
          color={stats && stats.exceptionRate > 10 ? '#dc2626' : '#d97706'}
          sublabel="Of total shipments"
          progress={stats?.exceptionRate}
        />
        <KpiCard
          label="Active Waybills"
          value={stats?.totalActive ?? '—'}
          icon={Package}
          color="#2563eb"
          sublabel={`${stats?.inTransit ?? 0} in transit, ${stats?.pendingPickup ?? 0} pending pickup`}
        />
        <KpiCard
          label="Delivered Today"
          value={stats?.deliveredToday ?? '—'}
          icon={Truck}
          color="#7c3aed"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <KpiCard
          label="Total Volume"
          value={stats?.totalVolume ?? '—'}
          icon={TrendingUp}
          color="#0891b2"
          sublabel="All time"
        />
        <KpiCard
          label="Avg Transit Time"
          value={stats?.avgTransitTime ? `${stats.avgTransitTime}h` : '—'}
          icon={Clock}
          color="#4f46e5"
          sublabel="For delivered shipments"
        />
      </div>
    </div>
  )
}

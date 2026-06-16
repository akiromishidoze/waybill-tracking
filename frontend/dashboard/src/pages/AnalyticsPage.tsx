import { useQuery } from '@tanstack/react-query'
import { analyticsService } from '@/services/api'

export default function AnalyticsPage() {
  const { data: stats } = useQuery({
    queryKey: ['analytics-stats'],
    queryFn: () => analyticsService.stats().then((r) => r.data),
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
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Analytics</h2>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: 10 }}>
          <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>SLA Compliance</h3>
          <p style={{ fontSize: '2rem', fontWeight: 700, color: '#16a34a' }}>
            {stats?.slaCompliance ?? '—'}%
          </p>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Last 30 days</p>
        </div>
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: 10 }}>
          <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Avg Transit Time</h3>
          <p style={{ fontSize: '2rem', fontWeight: 700, color: '#2563eb' }}>
            {stats?.avgTransitTime ?? '—'}h
          </p>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Last 30 days</p>
        </div>
      </div>
    </div>
  )
}

import { useQuery } from '@tanstack/react-query'
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { analyticsService } from '@/services/api'
import s from '@/styles/components.module.css'

const monthlyData: Array<{ month: string; shipments: number; sla: number }> = []

const statusDist: Array<{ name: string; value: number; color: string }> = []

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
      <div className={s.analyticsHeader}>
        <h2 className={s.pageTitle} style={{ marginBottom: 0 }}>Analytics</h2>

        <button onClick={handleExport} className={s.btnSuccess}>
          Export Report
        </button>
      </div>

      <div className={s.grid2} style={{ marginBottom: '1.5rem' }}>
        <div className={s.statCard}>
          <h3 className={s.chartTitle}>SLA Compliance</h3>
          <p className={s.statValue} style={{ color: '#16a34a' }}>
            {stats?.slaCompliance ?? '—'}%
          </p>
          <p className={s.statLabel}>Last 30 days</p>
        </div>
        <div className={s.statCard}>
          <h3 className={s.chartTitle}>Avg Transit Time</h3>
          <p className={s.statValue} style={{ color: '#2563eb' }}>
            {stats?.avgTransitTime ?? '—'}h
          </p>
          <p className={s.statLabel}>Last 30 days</p>
        </div>
      </div>

      <div className={s.grid2}>
        <div className={s.chartContainer}>
          <h3 className={s.chartTitle}>Monthly Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="shipments" stroke="#2563eb" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className={s.chartContainer}>
          <h3 className={s.chartTitle}>Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusDist}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {statusDist.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
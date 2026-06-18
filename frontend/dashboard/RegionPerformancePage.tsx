import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { regionService } from '@/services/api'
import type { RegionPerformance } from '@/types/waybill'
import { Globe, Package, Clock, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react'
import PageContainer from '@/components/PageContainer'

export default function RegionPerformancePage() {
  const { data: regions, isLoading } = useQuery({
    queryKey: ['region-performance'],
    queryFn: () => regionService.performance().then(r => r.data),
  })

  const totals = useMemo(() => {
    if (!regions?.length) return null
    return regions.reduce((acc, r) => ({
      totalShipments: acc.totalShipments + r.totalShipments,
      deliveredCount: acc.deliveredCount + r.deliveredCount,
      onTimeCount: acc.onTimeCount + r.onTimeCount,
      exceptionCount: acc.exceptionCount + r.exceptionCount,
    }), { totalShipments: 0, deliveredCount: 0, onTimeCount: 0, exceptionCount: 0 })
  }, [regions])

  if (isLoading) return <p>Loading...</p>

  return (
    <PageContainer title="Region / Zone Performance" actions={
        totals && <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Total: <strong>{totals.totalShipments}</strong> shipments</span>
    }>
      {(!regions || regions.length === 0) ? (
        <div style={{ background: '#fff', padding: '2rem', borderRadius: 10, textAlign: 'center', color: '#94a3b8' }}>
          <Globe size={40} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
          <p style={{ fontWeight: 500 }}>No region data available</p>
        </div>
      ) : (
        <>
          {totals && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: '#fff', padding: '1rem', borderRadius: 10, borderLeft: '4px solid #2563eb' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.8125rem' }}>
                  <Package size={16} /> Total Shipments
                </div>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.25rem 0 0' }}>{totals.totalShipments}</p>
              </div>
              <div style={{ background: '#fff', padding: '1rem', borderRadius: 10, borderLeft: '4px solid #16a34a' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.8125rem' }}>
                  <CheckCircle size={16} /> Delivered
                </div>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.25rem 0 0' }}>{totals.deliveredCount}</p>
              </div>
              <div style={{ background: '#fff', padding: '1rem', borderRadius: 10, borderLeft: '4px solid #0891b2' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.8125rem' }}>
                  <Clock size={16} /> On-Time
                </div>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.25rem 0 0' }}>{totals.onTimeCount}</p>
              </div>
              <div style={{ background: '#fff', padding: '1rem', borderRadius: 10, borderLeft: '4px solid #dc2626' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.8125rem' }}>
                  <AlertTriangle size={16} /> Exceptions
                </div>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.25rem 0 0' }}>{totals.exceptionCount}</p>
              </div>
            </div>
          )}

          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #f1f5f9', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Region</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Shipments</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Delivered</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#475569' }}>On-Time</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Exceptions</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#475569' }}>SLA%</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Avg Transit</th>
                  <th style={{ padding: '0.75rem 1rem', minWidth: 140 }}>SLA Bar</th>
                </tr>
              </thead>
              <tbody style={{ borderTop: '1px solid #f1f5f9' }}>
                {regions.map((r: RegionPerformance, i: number) => (
                  <tr key={r.region} style={{ borderBottom: '1px solid #f8fafc', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Globe size={14} color="#64748b" /> {r.region}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{r.totalShipments}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{r.deliveredCount}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{r.onTimeCount}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: r.exceptionCount > 0 ? '#dc2626' : 'inherit' }}>{r.exceptionCount}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: r.slaCompliance >= 90 ? '#16a34a' : r.slaCompliance >= 75 ? '#d97706' : '#dc2626' }}>
                      {r.slaCompliance.toFixed(1)}%
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>{r.avgTransitHours.toFixed(1)}h</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ width: '100%', height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${r.slaCompliance}%`, height: '100%', background: r.slaCompliance >= 90 ? '#16a34a' : r.slaCompliance >= 75 ? '#d97706' : '#dc2626', borderRadius: 4, transition: 'width 0.5s' }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: '#94a3b8', alignItems: 'center' }}>
            <TrendingUp size={12} />
            <span>Best region: <strong>{[...regions].sort((a, b) => b.slaCompliance - a.slaCompliance)[0]?.region}</strong> ({[...regions].sort((a, b) => b.slaCompliance - a.slaCompliance)[0]?.slaCompliance.toFixed(1)}% SLA)</span>
            <span style={{ color: '#cbd5e1' }}>·</span>
            <span>Needs attention: <strong>{[...regions].sort((a, b) => a.slaCompliance - b.slaCompliance)[0]?.region}</strong> ({[...regions].sort((a, b) => a.slaCompliance - b.slaCompliance)[0]?.slaCompliance.toFixed(1)}% SLA)</span>
          </div>
        </>
      )}
    </PageContainer>
  )
}
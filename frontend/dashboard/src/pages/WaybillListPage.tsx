import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { waybillService, dwellTimeService } from '@/services/api'
import type { Waybill } from '@/types/waybill'
import { Truck, AlertTriangle, Clock, Shield, ArrowLeftRight } from 'lucide-react'
import PageContainer from '@/components/PageContainer'
import { SkeletonTableRow } from '@/components/Skeleton'

const statusColors: Record<string, string> = {
  CREATED: '#6b7280',
  PICKED_UP: '#2563eb',
  IN_TRANSIT: '#d97706',
  AT_SORTING_CENTER: '#7c3aed',
  OUT_FOR_DELIVERY: '#0891b2',
  DELIVERED: '#16a34a',
  FAILED_DELIVERY: '#dc2626',
  RETURNED: '#9333ea',
  CANCELLED: '#4b5563',
}

export default function WaybillListPage() {
  const [search, setSearch] = useState('')
  const [carrierFilter, setCarrierFilter] = useState('')
  const [breachFilter, setBreachFilter] = useState<'all' | 'breached' | 'ontime'>('all')
  const [returnFilter, setReturnFilter] = useState<'all' | 'hasReturn' | 'noReturn'>('all')
  const [teamFilter, setTeamFilter] = useState('')
  const { data: waybills, isLoading } = useQuery({
    queryKey: ['waybills', search],
    queryFn: () => waybillService.list({ search }).then((r) => r.data),
  })

  const { data: dwellAlerts } = useQuery({
    queryKey: ['dwell-alerts'],
    queryFn: () => dwellTimeService.listAlerts().then(r => r.data),
  })

  const carriers = waybills
    ? [...new Set(waybills.filter((w) => w.carrierName).map((w) => w.carrierName!))]
    : []
  const teams = waybills
    ? [...new Set(waybills.filter((w) => w.teamName).map((w) => w.teamName!))]
    : []

  const filtered = waybills?.filter((wb) => {
    if (carrierFilter && wb.carrierName !== carrierFilter) return false
    if (breachFilter === 'breached' && !wb.slaBreached) return false
    if (breachFilter === 'ontime' && wb.slaBreached) return false
    if (teamFilter && wb.teamName !== teamFilter) return false
    if (returnFilter === 'hasReturn' && !wb.returnInfo) return false
    if (returnFilter === 'noReturn' && wb.returnInfo) return false
    return true
  })

  const dweltWaybills = new Set(
    (dwellAlerts || []).filter(a => !a.acknowledged).map(a => a.waybillId)
  )

  return (
    <PageContainer
      title="Waybills"
      actions={
        <Link to="/waybills/new" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', background: '#2563eb', color: '#fff', borderRadius: 8, fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}>
          + New Waybill
        </Link>
      }
    >
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input type="text" placeholder="Search tracking number..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 220, padding: '0.625rem 1rem', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: '0.875rem' }} />
        {carriers.length > 0 && (
          <select value={carrierFilter} onChange={(e) => setCarrierFilter(e.target.value)}
            style={{ padding: '0.625rem 1rem', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: '0.875rem', background: '#fff', minWidth: 170 }}>
            <option value="">All Carriers</option>
            {carriers.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
        )}
        <select value={breachFilter} onChange={(e) => setBreachFilter(e.target.value as any)}
          style={{ padding: '0.625rem 1rem', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: '0.875rem', background: '#fff', minWidth: 140 }}>
          <option value="all">All SLA</option>
          <option value="breached">SLA Breached</option>
          <option value="ontime">On Time</option>
        </select>
        <select value={returnFilter} onChange={(e) => setReturnFilter(e.target.value as any)}
          style={{ padding: '0.625rem 1rem', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: '0.875rem', background: '#fff', minWidth: 140 }}>
          <option value="all">All Returns</option>
          <option value="hasReturn">With Return</option>
          <option value="noReturn">Without Return</option>
        </select>
        {teams.length > 0 && (
          <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}
            style={{ padding: '0.625rem 1rem', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: '0.875rem', background: '#fff', minWidth: 170 }}>
            <option value="">All Teams</option>
            {teams.map((t) => (<option key={t} value={t}>{t}</option>))}
          </select>
        )}
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'auto' }}>
        <table style={{ width: '100%', fontSize: '0.875rem', textAlign: 'left', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr>
              <th style={{ padding: '1rem 1.25rem', background: '#f8fafc', color: '#64748b', fontWeight: 600, borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>Tracking #</th>
              <th style={{ padding: '1rem 1.25rem', background: '#f8fafc', color: '#64748b', fontWeight: 600, borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>Shipper</th>
              <th style={{ padding: '1rem 1.25rem', background: '#f8fafc', color: '#64748b', fontWeight: 600, borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>Destination</th>
              <th style={{ padding: '1rem 1.25rem', background: '#f8fafc', color: '#64748b', fontWeight: 600, borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>Status</th>
              <th style={{ padding: '1rem 1.25rem', background: '#f8fafc', color: '#64748b', fontWeight: 600, borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>Team</th>
              <th style={{ padding: '1rem 1.25rem', background: '#f8fafc', color: '#64748b', fontWeight: 600, borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>Carrier</th>
              <th style={{ padding: '1rem 1.25rem', background: '#f8fafc', color: '#64748b', fontWeight: 600, borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>Est. Delivery</th>
              <th style={{ padding: '1rem 1.25rem', background: '#f8fafc', color: '#64748b', fontWeight: 600, borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>SLA</th>
              <th style={{ padding: '1rem 1.25rem', background: '#f8fafc', color: '#64748b', fontWeight: 600, borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>Dwell</th>
              <th style={{ padding: '1rem 1.25rem', background: '#f8fafc', color: '#64748b', fontWeight: 600, borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>Return</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonTableRow key={i} cols={10} />)
            ) : !filtered?.length ? (
              <tr><td colSpan={10} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.9375rem' }}>No waybills found.</td></tr>
            ) : (
              filtered?.map((wb: Waybill) => (
                <tr key={wb.id} style={{ borderBottom: '1px solid #f1f5f9', background: wb.slaBreached ? '#fef2f2' : undefined, transition: 'background 0.15s' }}
                    onMouseEnter={e => !wb.slaBreached && (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={e => !wb.slaBreached && (e.currentTarget.style.background = '')}>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <Link to={`/waybills/${wb.id}`} style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none', fontSize: '0.9375rem' }}>
                      {wb.trackingNumber}
                    </Link>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: '#334155' }}>{wb.shipperName}</td>
                  <td style={{ padding: '1rem 1.25rem', color: '#334155' }}>{wb.destination}</td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span style={{ display: 'inline-block', padding: '0.3rem 0.75rem', borderRadius: 999, fontSize: '0.8125rem', fontWeight: 600, background: statusColors[wb.status] + '20', color: statusColors[wb.status] }}>
                      {wb.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    {wb.teamName ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.3rem 0.625rem', borderRadius: 6, background: '#fffbeb', color: '#b45309', fontSize: '0.8125rem', fontWeight: 500 }}>
                        <Shield size={14} /> {wb.teamName}
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>&mdash;</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    {wb.carrierName ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.3rem 0.625rem', borderRadius: 6, background: '#eff6ff', color: '#1d4ed8', fontSize: '0.8125rem', fontWeight: 500 }}>
                        <Truck size={14} /> {wb.carrierName}
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>&mdash;</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#64748b', fontSize: '0.875rem' }}>
                      <Clock size={14} />
                      {wb.estimatedDelivery ? new Date(wb.estimatedDelivery).toLocaleDateString() : '—'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    {wb.slaBreached ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0.625rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700, background: '#fecaca', color: '#b91c1c', border: '1px solid #fca5a5' }}>
                        <AlertTriangle size={12} /> BREACHED
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.625rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600, background: '#dcfce7', color: '#15803d' }}>
                        On Time
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    {dweltWaybills.has(wb.id) ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0.625rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700, background: '#fed7aa', color: '#9a3412', border: '1px solid #fdba74' }}>
                        <Clock size={12} /> DWELL
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>&mdash;</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    {wb.returnInfo ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0.625rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700, background: '#7c3aed20', color: '#7c3aed' }}>
                        <ArrowLeftRight size={12} /> {wb.returnInfo.status.replace(/_/g, ' ')}
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>&mdash;</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </PageContainer>
  )
}

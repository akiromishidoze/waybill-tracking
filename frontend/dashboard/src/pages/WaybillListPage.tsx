import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { waybillService, dwellTimeService } from '@/services/api'
import type { Waybill } from '@/types/waybill'
import { Truck, AlertTriangle, Clock, Shield, ArrowLeftRight, PackageOpen } from 'lucide-react'
import PageContainer from '@/components/PageContainer'
import { SkeletonTableRow } from '@/components/Skeleton'
import EmptyState from '@/components/EmptyState'
import Pagination from '@/components/Pagination'

const statusColors: Record<string, string> = {
  CREATED: 'var(--status-gray)',
  PICKED_UP: 'var(--status-blue)',
  IN_TRANSIT: 'var(--status-amber)',
  AT_SORTING_CENTER: 'var(--status-purple)',
  OUT_FOR_DELIVERY: 'var(--status-cyan)',
  DELIVERED: 'var(--status-green)',
  FAILED_DELIVERY: 'var(--status-red)',
  RETURNED: 'var(--status-purple)',
  CANCELLED: 'var(--status-gray)',
}

const PAGE_SIZE = 25

export default function WaybillListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('search') || ''
  const page = parseInt(searchParams.get('page') || '1', 10)
  const carrierFilter = searchParams.get('carrier') || ''
  const breachFilter = (searchParams.get('sla') as 'all' | 'breached' | 'ontime') || 'all'
  const returnFilter = (searchParams.get('return') as 'all' | 'hasReturn' | 'noReturn') || 'all'
  const teamFilter = searchParams.get('team') || ''
  const { data: rawData, isLoading } = useQuery({
    queryKey: ['waybills', search, page],
    queryFn: () => waybillService.list({ search, page, limit: PAGE_SIZE }).then((r) => r.data),
  })

  const { data: dwellAlerts } = useQuery({
    queryKey: ['dwell-alerts'],
    queryFn: () => dwellTimeService.listAlerts().then(r => r.data),
  })

  const waybills = useMemo(() => {
    if (!rawData) return undefined
    const list: Waybill[] = Array.isArray(rawData) ? rawData as Waybill[] : (rawData as any).data as Waybill[] ?? []
    return list
  }, [rawData])

  const total = useMemo(() => {
    if (!rawData) return 0
    if (Array.isArray(rawData)) return rawData.length
    return (rawData as any).meta?.total ?? (rawData as any).data?.length ?? 0
  }, [rawData])

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

  const totalPages = Math.max(1, Math.ceil((filtered?.length ?? total) / PAGE_SIZE))
  const displayed = filtered?.slice(0, PAGE_SIZE) ?? []

  const dweltWaybills = new Set(
    (dwellAlerts || []).filter(a => !a.acknowledged).map(a => a.waybillId)
  )

  function handleSearch(v: string) { setSearchParams(prev => { prev.set('search', v); prev.set('page', '1'); return prev }) }
  function handleCarrier(v: string) { setSearchParams(prev => { prev.set('carrier', v); prev.set('page', '1'); return prev }) }
  function handleBreach(v: string) { setSearchParams(prev => { prev.set('sla', v); prev.set('page', '1'); return prev }) }
  function handleReturn(v: string) { setSearchParams(prev => { prev.set('return', v); prev.set('page', '1'); return prev }) }
  function handleTeam(v: string) { setSearchParams(prev => { prev.set('team', v); prev.set('page', '1'); return prev }) }
  function handlePageChange(newPage: number) { setSearchParams(prev => { prev.set('page', newPage.toString()); return prev }) }

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
        <input type="text" placeholder="Search tracking number..." value={search} onChange={(e) => handleSearch(e.target.value)}
          style={{ flex: 1, minWidth: 220, padding: '0.625rem 1rem', border: '1px solid var(--color-border-input)', borderRadius: 8, fontSize: '0.875rem' }} />
        {carriers.length > 0 && (
          <select value={carrierFilter} onChange={(e) => handleCarrier(e.target.value)}
            style={{ padding: '0.625rem 1rem', border: '1px solid var(--color-border-input)', borderRadius: 8, fontSize: '0.875rem', background: 'var(--color-surface)', minWidth: 170 }}>
            <option value="">All Carriers</option>
            {carriers.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
        )}
        <select value={breachFilter} onChange={(e) => handleBreach(e.target.value)}
          style={{ padding: '0.625rem 1rem', border: '1px solid var(--color-border-input)', borderRadius: 8, fontSize: '0.875rem', background: 'var(--color-surface)', minWidth: 140 }}>
          <option value="all">All SLA</option>
          <option value="breached">SLA Breached</option>
          <option value="ontime">On Time</option>
        </select>
        <select value={returnFilter} onChange={(e) => handleReturn(e.target.value)}
          style={{ padding: '0.625rem 1rem', border: '1px solid var(--color-border-input)', borderRadius: 8, fontSize: '0.875rem', background: 'var(--color-surface)', minWidth: 140 }}>
          <option value="all">All Returns</option>
          <option value="hasReturn">With Return</option>
          <option value="noReturn">Without Return</option>
        </select>
        {teams.length > 0 && (
          <select value={teamFilter} onChange={(e) => handleTeam(e.target.value)}
            style={{ padding: '0.625rem 1rem', border: '1px solid var(--color-border-input)', borderRadius: 8, fontSize: '0.875rem', background: 'var(--color-surface)', minWidth: 170 }}>
            <option value="">All Teams</option>
            {teams.map((t) => (<option key={t} value={t}>{t}</option>))}
          </select>
        )}
      </div>

      <div style={{ background: 'var(--color-surface)', borderRadius: 12, border: '1px solid var(--color-border)', overflow: 'auto' }}>
        <table style={{ width: '100%', fontSize: '0.875rem', textAlign: 'left', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr>
              <th style={{ padding: '1rem 1.25rem', background: 'var(--color-surface-hover)', color: 'var(--status-gray)', fontWeight: 600, borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>Tracking #</th>
              <th style={{ padding: '1rem 1.25rem', background: 'var(--color-surface-hover)', color: 'var(--status-gray)', fontWeight: 600, borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>Shipper</th>
              <th style={{ padding: '1rem 1.25rem', background: 'var(--color-surface-hover)', color: 'var(--status-gray)', fontWeight: 600, borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>Destination</th>
              <th style={{ padding: '1rem 1.25rem', background: 'var(--color-surface-hover)', color: 'var(--status-gray)', fontWeight: 600, borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>Status</th>
              <th style={{ padding: '1rem 1.25rem', background: 'var(--color-surface-hover)', color: 'var(--status-gray)', fontWeight: 600, borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>Team</th>
              <th style={{ padding: '1rem 1.25rem', background: 'var(--color-surface-hover)', color: 'var(--status-gray)', fontWeight: 600, borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>Carrier</th>
              <th style={{ padding: '1rem 1.25rem', background: 'var(--color-surface-hover)', color: 'var(--status-gray)', fontWeight: 600, borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>Est. Delivery</th>
              <th style={{ padding: '1rem 1.25rem', background: 'var(--color-surface-hover)', color: 'var(--status-gray)', fontWeight: 600, borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>SLA</th>
              <th style={{ padding: '1rem 1.25rem', background: 'var(--color-surface-hover)', color: 'var(--status-gray)', fontWeight: 600, borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>Dwell</th>
              <th style={{ padding: '1rem 1.25rem', background: 'var(--color-surface-hover)', color: 'var(--status-gray)', fontWeight: 600, borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>Return</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonTableRow key={i} cols={10} />)
            ) : !displayed.length ? (
              <tr><td colSpan={10}><EmptyState icon={PackageOpen} title="No waybills found" message={search ? 'No waybills match your search.' : 'Create a shipment to see it here.'} /></td></tr>
            ) : (
              displayed.map((wb: Waybill) => (
                <tr key={wb.id} style={{ borderBottom: '1px solid var(--color-border-subtle)', background: wb.slaBreached ? 'var(--badge-red-bg)' : undefined, transition: 'background 0.15s' }}
                    onMouseEnter={e => !wb.slaBreached && (e.currentTarget.style.background = 'var(--color-surface-hover)')}
                    onMouseLeave={e => !wb.slaBreached && (e.currentTarget.style.background = '')}>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <Link to={`/waybills/${wb.id}`} style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none', fontSize: '0.9375rem' }}>
                      {wb.trackingNumber}
                    </Link>
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: 'var(--color-text-primary)' }}>{wb.shipperName}</td>
                  <td style={{ padding: '1rem 1.25rem', color: 'var(--color-text-primary)' }}>{wb.destination}</td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span style={{ display: 'inline-block', padding: '0.3rem 0.75rem', borderRadius: 999, fontSize: '0.8125rem', fontWeight: 600, background: statusColors[wb.status] + '20', color: statusColors[wb.status] }}>
                      {wb.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    {wb.teamName ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.3rem 0.625rem', borderRadius: 6, background: 'var(--badge-warm-bg)', color: 'var(--status-amber)', fontSize: '0.8125rem', fontWeight: 500 }}>
                        <Shield size={14} /> {wb.teamName}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted-lighter)', fontSize: '0.875rem' }}>&mdash;</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    {wb.carrierName ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.3rem 0.625rem', borderRadius: 6, background: 'var(--color-primary-soft)', color: 'var(--color-primary-dark)', fontSize: '0.8125rem', fontWeight: 500 }}>
                        <Truck size={14} /> {wb.carrierName}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted-lighter)', fontSize: '0.875rem' }}>&mdash;</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--status-gray)', fontSize: '0.875rem' }}>
                      <Clock size={14} />
                      {wb.estimatedDelivery ? new Date(wb.estimatedDelivery).toLocaleDateString() : '—'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    {wb.slaBreached ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0.625rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700, background: 'var(--badge-red-bg)', color: 'var(--status-red)', border: '1px solid var(--badge-red-border)' }}>
                        <AlertTriangle size={12} /> BREACHED
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.625rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600, background: 'var(--badge-green-bg)', color: 'var(--status-green)' }}>
                        On Time
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    {dweltWaybills.has(wb.id) ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0.625rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700, background: 'var(--badge-orange-bg)', color: 'var(--badge-orange-text)', border: '1px solid var(--badge-orange-border)' }}>
                        <Clock size={12} /> DWELL
                      </span>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted-lighter)', fontSize: '0.875rem' }}>&mdash;</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem 1.25rem' }}>
                    {wb.returnInfo ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0.625rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700, background: 'var(--badge-purple-bg)', color: 'var(--status-purple)' }}>
                        <ArrowLeftRight size={12} /> {wb.returnInfo.status.replace(/_/g, ' ')}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted-lighter)', fontSize: '0.875rem' }}>&mdash;</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} total={filtered?.length ?? total} pageSize={PAGE_SIZE} onPageChange={handlePageChange} />
    </PageContainer>
  )
}

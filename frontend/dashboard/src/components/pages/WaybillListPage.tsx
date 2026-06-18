import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { waybillService, dwellTimeService } from '@/services/api'
import type { Waybill } from '@/types/waybill'
import { Truck, AlertTriangle, Clock, Shield, ArrowLeftRight } from 'lucide-react'
import PageContainer from '@/components/PageContainer'

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
        <Link to="/waybills/new" className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
          + New Waybill
        </Link>
      }
    >
      <div className="flex gap-3 mb-6 flex-wrap">
        <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 border border-slate-200 rounded-lg text-sm" />
        {carriers.length > 0 && (
          <select value={carrierFilter} onChange={(e) => setCarrierFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white min-w-[160px]">
            <option value="">All Carriers</option>
            {carriers.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
        )}
        <select value={breachFilter} onChange={(e) => setBreachFilter(e.target.value as any)}
          className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white min-w-[130px]">
          <option value="all">All SLA</option>
          <option value="breached">SLA Breached</option>
          <option value="ontime">On Time</option>
        </select>
        <select value={returnFilter} onChange={(e) => setReturnFilter(e.target.value as any)}
          className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white min-w-[130px]">
          <option value="all">All Returns</option>
          <option value="hasReturn">With Return</option>
          <option value="noReturn">Without Return</option>
        </select>
        {teams.length > 0 && (
          <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white min-w-[160px]">
            <option value="">All Teams</option>
            {teams.map((t) => (<option key={t} value={t}>{t}</option>))}
          </select>
        )}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">Tracking #</th>
              <th className="px-4 py-3">Shipper</th>
              <th className="px-4 py-3">Destination</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Team</th>
              <th className="px-4 py-3">Carrier</th>
              <th className="px-4 py-3">Est. Delivery</th>
              <th className="px-4 py-3">SLA</th>
              <th className="px-4 py-3">Dwell</th>
              <th className="px-4 py-3">Return</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={10} className="p-8 text-center">Loading...</td></tr>
            ) : (
              filtered?.map((wb: Waybill) => (
                <tr key={wb.id} className={wb.slaBreached ? 'bg-red-50' : ''}>
                  <td className="px-4 py-3">
                    <Link to={`/waybills/${wb.id}`} className="text-blue-600 font-medium">
                      {wb.trackingNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{wb.shipperName}</td>
                  <td className="px-4 py-3">{wb.destination}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ background: statusColors[wb.status] + '20', color: statusColors[wb.status] }}>
                      {wb.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {wb.teamName ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-50 text-amber-700 text-xs font-medium">
                        <Shield size={12} /> {wb.teamName}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {wb.carrierName ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-medium">
                        <Truck size={12} /> {wb.carrierName}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-slate-500">
                      <Clock size={12} />
                      {wb.estimatedDelivery ? new Date(wb.estimatedDelivery).toLocaleDateString() : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {wb.slaBreached ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                        <AlertTriangle size={10} /> BREACHED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">
                        On Time
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {dweltWaybills.has(wb.id) ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200">
                        <Clock size={10} /> DWELL
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {wb.returnInfo ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold" style={{ background: '#7c3aed20', color: '#7c3aed' }}>
                        <ArrowLeftRight size={10} /> {wb.returnInfo.status.replace(/_/g, ' ')}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
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

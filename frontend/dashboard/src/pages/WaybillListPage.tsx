import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { waybillService } from '@/services/api'
import type { Waybill } from '@/types/waybill'
import { Truck } from 'lucide-react'

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
  const { data: waybills, isLoading } = useQuery({
    queryKey: ['waybills', search],
    queryFn: () => waybillService.list({ search }).then((r) => r.data),
  })

  const carriers = waybills
    ? [...new Set(waybills.filter((w) => w.carrierName).map((w) => w.carrierName!))]
    : []

  const filtered = waybills?.filter((wb) => {
    if (!carrierFilter) return true
    return wb.carrierName === carrierFilter
  })

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Waybills</h2>
        <Link
          to="/waybills/new"
          style={{
            padding: '0.5rem 1rem',
            background: '#2563eb',
            color: '#fff',
            borderRadius: 6,
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          + New Waybill
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Search by tracking number, shipper, recipient..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            fontSize: '1rem',
          }}
        />
        {carriers.length > 0 && (
          <select
            value={carrierFilter}
            onChange={(e) => setCarrierFilter(e.target.value)}
            style={{
              padding: '0.75rem 1rem',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              fontSize: '0.875rem',
              background: '#fff',
              minWidth: 180,
            }}
          >
            <option value="">All Carriers</option>
            {carriers.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
      </div>

      <div
        style={{
          background: '#fff',
          borderRadius: 10,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem 1rem' }}>Tracking #</th>
              <th style={{ padding: '0.75rem 1rem' }}>Shipper</th>
              <th style={{ padding: '0.75rem 1rem' }}>Destination</th>
              <th style={{ padding: '0.75rem 1rem' }}>Status</th>
              <th style={{ padding: '0.75rem 1rem' }}>Carrier</th>
              <th style={{ padding: '0.75rem 1rem' }}>Est. Delivery</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center' }}>
                  Loading...
                </td>
              </tr>
            ) : (
              filtered?.map((wb: Waybill) => (
                <tr key={wb.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <Link
                      to={`/waybills/${wb.id}`}
                      style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}
                    >
                      {wb.trackingNumber}
                    </Link>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>{wb.shipperName}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{wb.destination}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.75rem',
                        borderRadius: 999,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: statusColors[wb.status] + '20',
                        color: statusColors[wb.status],
                      }}
                    >
                      {wb.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {wb.carrierName ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.25rem 0.5rem',
                          borderRadius: 4,
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          background: '#eff6ff',
                          color: '#2563eb',
                        }}
                      >
                        <Truck size={12} />
                        {wb.carrierName}
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '0.8125rem' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {wb.estimatedDelivery
                      ? new Date(wb.estimatedDelivery).toLocaleDateString()
                      : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

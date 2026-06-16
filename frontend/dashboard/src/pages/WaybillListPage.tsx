import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { waybillService } from '@/services/api'
import { SkeletonTableRow } from '@/components/Skeleton'
import s from '@/styles/components.module.css'
import type { Waybill } from '@/types/waybill'

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
  const [page, setPage] = useState(1)
  const { data, isLoading } = useQuery({
    queryKey: ['waybills', search, page],
    queryFn: () =>
      waybillService
        .list({ search, page: String(page), limit: '50' })
        .then((r) => r.data),
  })

  const waybills = data?.data
  const meta = data?.meta

  return (
    <div>
      <div className={s.headerActions}>
        <h2 className={s.pageTitle} style={{ marginBottom: 0 }}>Waybills</h2>
        <Link to="/waybills/new" className={s.btnPrimary}>
          + New Waybill
        </Link>
      </div>

      <input
        type="text"
        placeholder="Search by tracking number, shipper, recipient..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={s.searchInput}
      />

      <div className={s.card} style={{ overflow: 'hidden' }}>
        <table className={s.table}>
          <thead className={s.tableHeader}>
            <tr>
              <th>Tracking #</th>
              <th>Shipper</th>
              <th>Destination</th>
              <th>Status</th>
              <th>Est. Delivery</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <>
                <SkeletonTableRow />
                <SkeletonTableRow />
                <SkeletonTableRow />
                <SkeletonTableRow />
                <SkeletonTableRow />
              </>
            ) : (
              waybills?.map((wb: Waybill) => (
                <tr key={wb.id} className={s.tableRow}>
                  <td className={s.tableBody}>
                    <Link
                      to={`/waybills/${wb.id}`}
                      className={s.btnLink}
                    >
                      {wb.trackingNumber}
                    </Link>
                  </td>
                  <td className={s.tableBody}>{wb.shipperName}</td>
                  <td className={s.tableBody}>{wb.destination}</td>
                  <td className={s.tableBody}>
                    <span
                      className={s.badge}
                      style={{
                        background: statusColors[wb.status] + '20',
                        color: statusColors[wb.status],
                      }}
                    >
                      {wb.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className={s.tableBody}>
                    {wb.estimatedDelivery
                      ? new Date(wb.estimatedDelivery).toLocaleDateString()
                      : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {meta && (
          <div className={s.paginationBar}>
            <span className={s.paginationTotal}>{meta.total} total</span>
            <div className={s.paginationBtns}>
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className={s.paginationBtn}
              >
                Previous
              </button>
              <span className={s.paginationPage}>Page {meta.page}</span>
              <button
                disabled={page * meta.limit >= meta.total}
                onClick={() => setPage((p) => p + 1)}
                className={s.paginationBtn}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
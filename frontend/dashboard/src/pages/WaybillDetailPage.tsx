import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { waybillService } from '@/services/api'
import { SkeletonBlock, SkeletonLine } from '@/components/Skeleton'
import s from '@/styles/components.module.css'

export default function WaybillDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: wb, isLoading } = useQuery({
    queryKey: ['waybill', id],
    queryFn: () => waybillService.get(id!).then((r) => r.data),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div>
        <SkeletonLine width={280} height={28} style={{ marginBottom: '1.5rem' }} />
        <div className={s.grid2}>
          <SkeletonBlock height={220} />
          <SkeletonBlock height={220} />
        </div>
      </div>
    )
  }

  if (!wb) return <p>Waybill not found</p>

  return (
    <div>
      <h2 className={s.pageTitle}>Waybill #{wb.trackingNumber}</h2>

      <div className={s.grid2} style={{ marginBottom: '2rem' }}>
        <div className={s.detailSection}>
          <h3 className={s.detailSectionTitle}>Shipment Info</h3>
          <DetailRow label="Status" value={wb.status} />
          <DetailRow label="Service Type" value={wb.serviceType} />
          <DetailRow label="Weight" value={`${wb.weight} kg`} />
          <DetailRow label="Dimensions" value={wb.dimensions} />
          <DetailRow label="Origin" value={wb.origin} />
          <DetailRow label="Destination" value={wb.destination} />
        </div>

        <div className={s.detailSection}>
          <h3 className={s.detailSectionTitle}>Recipient</h3>
          <DetailRow label="Name" value={wb.recipientName} />
          <DetailRow label="Phone" value={wb.recipientPhone} />
          <DetailRow label="Address" value={wb.recipientAddress} />
        </div>
      </div>

      <div className={s.detailSection}>
        <h3 className={s.detailSectionTitle}>Tracking Timeline</h3>
        {wb.events?.length ? (
          <div className={s.timeline}>
            {wb.events.map((evt: any) => (
              <div key={evt.id} className={s.timelineItem}>
                <div className={s.timelineDot} />
                <p className={s.timelineStatus}>{evt.status.replace(/_/g, ' ')}</p>
                <p className={s.timelineMeta}>
                  {evt.location} — {new Date(evt.timestamp).toLocaleString()}
                </p>
                {evt.remark && <p className={s.timelineRemark}>{evt.remark}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className={s.timelineEmpty}>No scan events yet.</p>
        )}
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={s.detailRow}>
      <span className={s.detailLabel}>{label}</span>
      <span className={s.detailValue}>{value}</span>
    </div>
  )
}
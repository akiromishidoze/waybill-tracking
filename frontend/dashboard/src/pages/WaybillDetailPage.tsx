import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Package, Truck, MapPin, CheckCircle, XCircle, RotateCcw, Ban, ScanLine, AlertTriangle, FileText, User } from 'lucide-react'
import { waybillService } from '@/services/api'
import { SkeletonBlock, SkeletonLine } from '@/components/Skeleton'
import type { ExceptionCode, EventType, WaybillStatus } from '@/types/waybill'
import { EXCEPTION_LABELS, MILESTONE_LABELS, EVENT_TYPE_COLORS } from '@/types/waybill'
import s from '@/styles/components.module.css'

const STATUS_ICONS: Record<WaybillStatus, typeof Package> = {
  CREATED: Package,
  PICKED_UP: Truck,
  IN_TRANSIT: Truck,
  AT_SORTING_CENTER: MapPin,
  OUT_FOR_DELIVERY: Truck,
  DELIVERED: CheckCircle,
  FAILED_DELIVERY: XCircle,
  RETURNED: RotateCcw,
  CANCELLED: Ban,
}

const EVENT_ICONS: Record<EventType, typeof ScanLine> = {
  MILESTONE: Package,
  SCAN: ScanLine,
  EXCEPTION: AlertTriangle,
  NOTE: FileText,
}

function formatDateGroup(dateStr: string): string {
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
}

export default function WaybillDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: wb, isLoading } = useQuery({
    queryKey: ['waybill', id],
    queryFn: () => waybillService.get(id!).then((r) => r.data),
    enabled: !!id,
  })

  const groupedEvents = useMemo(() => {
    if (!wb?.events?.length) return []
    const groups: { dateLabel: string; events: typeof wb.events }[] = []
    for (const evt of wb.events) {
      const label = formatDateGroup(evt.timestamp)
      const existing = groups.find((g) => g.dateLabel === label)
      if (existing) existing.events.push(evt)
      else groups.push({ dateLabel: label, events: [evt] })
    }
    return groups
  }, [wb])

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
        <h3 className={s.detailSectionTitle}>Milestone Event Log</h3>
        {groupedEvents.length ? (
          <div className={s.timeline}>
            {groupedEvents.map((group) => (
              <div key={group.dateLabel} style={{ marginBottom: '1.5rem' }}>
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#94a3b8',
                  marginBottom: '0.75rem',
                  marginLeft: '-2rem',
                  paddingLeft: '2rem',
                }}>
                  {group.dateLabel}
                </div>
                {group.events.map((evt: any) => {
                  const isException = !!evt.exceptionCode
                  const color = isException
                    ? EVENT_TYPE_COLORS.EXCEPTION
                    : EVENT_TYPE_COLORS[evt.eventType as EventType] || EVENT_TYPE_COLORS.SCAN
                  const StatusIcon = STATUS_ICONS[evt.status as WaybillStatus] || EVENT_ICONS[evt.eventType as EventType] || ScanLine

                  return (
                    <div
                      key={evt.id}
                      className={isException ? s.timelineItemException : s.timelineItem}
                    >
                      <div
                        className={isException ? s.timelineDotException : s.timelineDot}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: color,
                          width: 20,
                          height: 20,
                          left: -11,
                          top: 2,
                        }}
                      >
                        <StatusIcon size={12} color="#fff" strokeWidth={2.5} />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.125rem' }}>
                        <p className={s.timelineStatus} style={{ margin: 0 }}>
                          {MILESTONE_LABELS[evt.status as WaybillStatus] || evt.status.replace(/_/g, ' ')}
                        </p>
                        {isException && (
                          <span
                            className={s.exceptionBadge}
                            style={{ background: color }}
                          >
                            {EXCEPTION_LABELS[evt.exceptionCode as ExceptionCode] || evt.exceptionCode}
                          </span>
                        )}
                        <span style={{
                          fontSize: '0.65rem',
                          color: '#94a3b8',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          fontWeight: 500,
                        }}>
                          {evt.eventType}
                        </span>
                      </div>

                      <p className={s.timelineMeta}>
                        <MapPin size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.25rem' }} />
                        {evt.location}
                        <span style={{ color: '#cbd5e1', margin: '0 0.375rem' }}>·</span>
                        {new Date(evt.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>

                      {evt.courierName && (
                        <p className={s.timelineMeta} style={{ color: '#475569', marginTop: '0.125rem' }}>
                          <User size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.25rem' }} />
                          {evt.courierName}
                        </p>
                      )}

                      {evt.exceptionDetail && <p className={s.exceptionDetail}>{evt.exceptionDetail}</p>}
                      {evt.remark && !evt.exceptionDetail && (
                        <p className={s.timelineRemark} style={{ fontStyle: 'italic' }}>"{evt.remark}"</p>
                      )}
                    </div>
                  )
                })}
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

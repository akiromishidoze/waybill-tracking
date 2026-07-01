import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Package, Truck, MapPin, ScanLine, AlertTriangle, FileText, User } from 'lucide-react'
import { waybillService } from '@/services/api'
import AddScanForm from '@/components/AddScanForm'
import type { ExceptionCode, EventType, WaybillStatus } from '@/types/waybill'
import { EXCEPTION_LABELS, MILESTONE_LABELS, EVENT_TYPE_COLORS } from '@/types/waybill'
import { formatDateGroup } from '@/utils/format'

const STATUS_ICONS: Record<WaybillStatus, typeof Package> = {
  CREATED: Package,
  PICKED_UP: Truck,
  IN_TRANSIT: Truck,
  AT_SORTING_CENTER: MapPin,
  OUT_FOR_DELIVERY: Truck,
  DELIVERED: Package,
  FAILED_DELIVERY: AlertTriangle,
  RETURNED: Package,
  CANCELLED: AlertTriangle,
}

const EVENT_ICONS: Record<EventType, typeof ScanLine> = {
  MILESTONE: Package,
  SCAN: ScanLine,
  EXCEPTION: AlertTriangle,
  NOTE: FileText,
}

export default function ScanTimeline({ waybillId }: { waybillId: string }) {
  const queryClient = useQueryClient()

  const { data: wb } = useQuery({
    queryKey: ['waybill', waybillId],
    queryFn: () => waybillService.get(waybillId).then((r) => r.data),
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

  return (
    <div>
      <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 10, marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ fontWeight: 600 }}>Milestone Event Log</h3>
          <AddScanForm waybillId={waybillId} onAdded={() => queryClient.invalidateQueries({ queryKey: ['waybill', waybillId] })} />
        </div>
        {groupedEvents.length ? (
          <div style={{ position: 'relative', paddingLeft: '2rem' }}>
            {groupedEvents.map((group) => (
              <div key={group.dateLabel} style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted-lighter)', marginBottom: '0.75rem', marginLeft: '-2rem', paddingLeft: '2rem' }}>
                  {group.dateLabel}
                </div>
                {group.events.map((evt) => {
                  const isException = !!evt.exceptionCode
                  const color = isException ? EVENT_TYPE_COLORS.EXCEPTION : EVENT_TYPE_COLORS[evt.eventType] || EVENT_TYPE_COLORS.SCAN
                  const StatusIcon = STATUS_ICONS[evt.status] || EVENT_ICONS[evt.eventType] || ScanLine
                  return (
                    <div key={evt.id} style={{ position: 'relative', paddingBottom: '1.25rem', borderLeft: `2px solid ${color}40`, paddingLeft: '1.75rem', marginLeft: '-1rem' }}>
                      <div style={{ position: 'absolute', left: -11, top: 2, width: 20, height: 20, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <StatusIcon size={12} color="#fff" strokeWidth={2.5} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.125rem' }}>
                        <p style={{ fontWeight: 600, fontSize: '0.9375rem', margin: 0 }}>
                          {MILESTONE_LABELS[evt.status] || evt.status.replace(/_/g, ' ')}
                        </p>
                        {isException && (
                          <span style={{ display: 'inline-block', padding: '0.125rem 0.5rem', borderRadius: 999, fontSize: '0.7rem', fontWeight: 600, background: color, color: '#fff' }}>
                            {EXCEPTION_LABELS[evt.exceptionCode as ExceptionCode] || evt.exceptionCode}
                          </span>
                        )}
                        <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted-lighter)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500 }}>
                          {evt.eventType}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <MapPin size={12} /> {evt.location}
                        <span style={{ color: 'var(--color-border-input)' }}>·</span>
                        {new Date(evt.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {evt.courierName && (
                        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.125rem' }}>
                          <User size={12} /> {evt.courierName}
                        </div>
                      )}
                      {evt.exceptionDetail && <p style={{ fontSize: '0.8125rem', color: 'var(--badge-red-text)', margin: '0.125rem 0 0 0' }}>{evt.exceptionDetail}</p>}
                      {evt.remark && !evt.exceptionDetail && <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', margin: '0.125rem 0 0 0', fontStyle: 'italic' }}>"{evt.remark}"</p>}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--color-text-muted)' }}>No scan events yet.</p>
        )}
      </div>

      {wb?.carrierEvents && wb.carrierEvents.length > 0 && (
        <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Truck size={18} color="#2563eb" />
            <h3 style={{ fontWeight: 600, fontSize: '1rem' }}>{wb.carrierName} Tracking</h3>
            {wb.carrierTrackingNumber && <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>({wb.carrierTrackingNumber})</span>}
          </div>
          <div style={{ position: 'relative', paddingLeft: '2rem' }}>
            {(wb.carrierEvents || []).map((evt, i, arr) => (
              <div key={evt.id} style={{ position: 'relative', paddingBottom: i < arr.length - 1 ? '1.25rem' : 0, borderLeft: `2px solid ${i < arr.length - 1 ? '#2563eb40' : 'transparent'}`, paddingLeft: '1.75rem', marginLeft: '-1rem' }}>
                <div style={{ position: 'absolute', left: -9, top: 2, width: 16, height: 16, borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Truck size={9} color="#fff" strokeWidth={3} />
                </div>
                <p style={{ fontWeight: 600, fontSize: '0.875rem', margin: 0 }}>{evt.status}</p>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.125rem' }}>
                  <MapPin size={12} /> {evt.location}
                  <span style={{ color: 'var(--color-border-input)' }}>·</span>
                  {new Date(evt.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </div>
                {evt.remark && <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', margin: '0.125rem 0 0 0', fontStyle: 'italic' }}>"{evt.remark}"</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

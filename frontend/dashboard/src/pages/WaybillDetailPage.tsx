import { useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Package, Truck, MapPin, CheckCircle, XCircle, RotateCcw, Ban, ScanLine, AlertTriangle, FileText, User, Shield, Paperclip, Download, Trash2, Upload } from 'lucide-react'
import { waybillService, teamService, attachmentService, analyticsService } from '@/services/api'
import type { ExceptionCode, EventType, WaybillStatus, Attachment, ETAPrediction } from '@/types/waybill'
import { EXCEPTION_LABELS, MILESTONE_LABELS, EVENT_TYPE_COLORS } from '@/types/waybill'

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
  const queryClient = useQueryClient()

  const { data: wb, isLoading } = useQuery({
    queryKey: ['waybill', id],
    queryFn: () => waybillService.get(id!).then((r) => r.data),
    enabled: !!id,
  })

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamService.list().then((r) => r.data),
  })

  const assignTeam = useMutation({
    mutationFn: (teamId: string | null) => teamService.assignToWaybill(id!, teamId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['waybill', id] }),
  })

  const { data: eta } = useQuery({
    queryKey: ['predict-eta', id],
    queryFn: () => analyticsService.predictEta(id!).then(r => r.data),
    enabled: !!id,
    refetchInterval: 60000,
  })

  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: attachments, refetch: refetchAttachments } = useQuery({
    queryKey: ['attachments', id],
    queryFn: () => attachmentService.list(id!).then(r => r.data),
    enabled: !!id,
  })

  const deleteAttachment = useMutation({
    mutationFn: (attachmentId: string) => attachmentService.delete(attachmentId),
    onSuccess: () => refetchAttachments(),
  })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1]
      try {
        await attachmentService.upload(id!, {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          data: base64,
        })
        refetchAttachments()
      } catch { }
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
    reader.readAsDataURL(file)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

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

  if (isLoading) return <p>Loading...</p>
  if (!wb) return <p>Waybill not found</p>

  return (
    <div>
      {wb.slaBreached && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, marginBottom: '1rem', color: '#dc2626', fontSize: '0.875rem', fontWeight: 500 }}>
          <AlertTriangle size={18} />
          SLA Breached — Estimated delivery was {new Date(wb.estimatedDelivery).toLocaleDateString()}
        </div>
      )}
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>
        Waybill #{wb.trackingNumber}
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: 10 }}>
          <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Shipment Info</h3>
          <DetailRow label="Status" value={wb.status} />
          <DetailRow label="Service Type" value={wb.serviceType} />
          <DetailRow label="Weight" value={`${wb.weight} kg`} />
          <DetailRow label="Dimensions" value={wb.dimensions} />
          <DetailRow label="Origin" value={wb.origin} />
          <DetailRow label="Destination" value={wb.destination} />
          <DetailRow label="Est. Delivery" value={wb.estimatedDelivery ? new Date(wb.estimatedDelivery).toLocaleDateString() : '—'} />
          <DetailRow label="SLA Status" value={wb.slaBreached ? 'Breached' : 'On Time'} />
          {eta && (
            <>
              <DetailRow label="Predictive ETA" value={eta.predictedDelivery ? new Date(eta.predictedDelivery).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'} />
              <DetailRow label="Confidence" value={`${eta.confidence}%`} />
              {eta.estimatedHours !== null && <DetailRow label="Est. Transit" value={`${eta.estimatedHours} hrs`} />}
              <DetailRow label="Based On" value={eta.basedOn} />
            </>
          )}
          {wb.carrierName && (
            <>
              <DetailRow label="Carrier" value={wb.carrierName} />
              <DetailRow label="Carrier Tracking" value={wb.carrierTrackingNumber || '—'} />
            </>
          )}
        </div>

        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: 10 }}>
          <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Recipient</h3>
          <DetailRow label="Name" value={wb.recipientName} />
          <DetailRow label="Phone" value={wb.recipientPhone} />
          <DetailRow label="Address" value={wb.recipientAddress} />
          <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '0.75rem', paddingTop: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Shield size={16} color="#d97706" />
              <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Team Assignment</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <select
                value={wb.teamId || ''}
                onChange={(e) => assignTeam.mutate(e.target.value || null)}
                style={{ flex: 1, padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.875rem', background: '#fff' }}
                disabled={assignTeam.isPending}
              >
                <option value="">Unassigned</option>
                {(teams || []).map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              {assignTeam.isPending && <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Saving...</span>}
            </div>
            {wb.teamName && (
              <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: '#d97706' }}>
                <Shield size={12} />
                Currently assigned to <strong>{wb.teamName}</strong>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', padding: '1.5rem', borderRadius: 10, marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Paperclip size={18} color="#6b7280" />
            <h3 style={{ fontWeight: 600 }}>Proof of Delivery Attachments</h3>
            <span style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>({attachments?.length || 0})</span>
          </div>
          <div>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer' }}>
              <Upload size={14} /> {uploading ? 'Uploading...' : 'Upload File'}
            </button>
          </div>
        </div>
        {(!attachments || attachments.length === 0) ? (
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No attachments yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {attachments.map((att: Attachment) => (
              <div key={att.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0.75rem', background: '#f8fafc', borderRadius: 8, border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                  <FileText size={16} color="#64748b" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 500, fontSize: '0.875rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.fileName}</p>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>{formatFileSize(att.fileSize)} · {new Date(att.uploadedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.375rem' }}>
                  <button onClick={() => { const a = document.createElement('a'); a.href = `data:${att.fileType};base64,${att.data}`; a.download = att.fileName; a.click() }} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.625rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer', color: '#475569' }}>
                    <Download size={12} /> Download
                  </button>
                  <button onClick={() => { if (confirm('Delete this attachment?')) deleteAttachment.mutate(att.id) }} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.625rem', background: '#fff', border: '1px solid #fecaca', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer', color: '#dc2626' }}>
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ background: '#fff', padding: '1.5rem', borderRadius: 10, marginBottom: '1.5rem' }}>
        <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Milestone Event Log</h3>
        {groupedEvents.length ? (
          <div style={{ position: 'relative', paddingLeft: '2rem' }}>
            {groupedEvents.map((group) => (
              <div key={group.dateLabel} style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: '0.75rem', marginLeft: '-2rem', paddingLeft: '2rem' }}>
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
                        <span style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500 }}>
                          {evt.eventType}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <MapPin size={12} /> {evt.location}
                        <span style={{ color: '#cbd5e1' }}>·</span>
                        {new Date(evt.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {evt.courierName && (
                        <div style={{ fontSize: '0.8125rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.125rem' }}>
                          <User size={12} /> {evt.courierName}
                        </div>
                      )}
                      {evt.exceptionDetail && <p style={{ fontSize: '0.8125rem', color: '#dc2626', margin: '0.125rem 0 0 0' }}>{evt.exceptionDetail}</p>}
                      {evt.remark && !evt.exceptionDetail && <p style={{ fontSize: '0.8125rem', color: '#475569', margin: '0.125rem 0 0 0', fontStyle: 'italic' }}>"{evt.remark}"</p>}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#64748b' }}>No scan events yet.</p>
        )}
      </div>

      {wb.carrierEvents && wb.carrierEvents.length > 0 && (
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Truck size={18} color="#2563eb" />
            <h3 style={{ fontWeight: 600, fontSize: '1rem' }}>{wb.carrierName} Tracking</h3>
            {wb.carrierTrackingNumber && <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>({wb.carrierTrackingNumber})</span>}
          </div>
          <div style={{ position: 'relative', paddingLeft: '2rem' }}>
            {wb.carrierEvents.map((evt, i) => (
              <div key={evt.id} style={{ position: 'relative', paddingBottom: i < wb.carrierEvents.length - 1 ? '1.25rem' : 0, borderLeft: `2px solid ${i < wb.carrierEvents.length - 1 ? '#2563eb40' : 'transparent'}`, paddingLeft: '1.75rem', marginLeft: '-1rem' }}>
                <div style={{ position: 'absolute', left: -9, top: 2, width: 16, height: 16, borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Truck size={9} color="#fff" strokeWidth={3} />
                </div>
                <p style={{ fontWeight: 600, fontSize: '0.875rem', margin: 0 }}>{evt.status}</p>
                <div style={{ fontSize: '0.8125rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.125rem' }}>
                  <MapPin size={12} /> {evt.location}
                  <span style={{ color: '#cbd5e1' }}>·</span>
                  {new Date(evt.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </div>
                {evt.remark && <p style={{ fontSize: '0.8125rem', color: '#475569', margin: '0.125rem 0 0 0', fontStyle: 'italic' }}>"{evt.remark}"</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', marginBottom: '0.5rem' }}>
      <span style={{ width: 140, color: '#64748b', fontSize: '0.875rem' }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  )
}

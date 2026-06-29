import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Package, Truck, MapPin, CheckCircle, XCircle, RotateCcw, Ban, ScanLine, AlertTriangle, FileText, User, Shield, Paperclip, Download, Trash2, Upload, ArrowLeftRight, RefreshCw, Clock, LogIn, LogOut } from 'lucide-react'
import { waybillService, teamService, attachmentService, analyticsService, returnService, dwellTimeService, geofenceService } from '@/services/api'
import AddScanForm from '@/components/AddScanForm'
import ConfirmModal from '@/components/ConfirmModal'
import type { Waybill, ExceptionCode, EventType, WaybillStatus, Attachment, ReturnStatus, DwellSegment, GeofenceEvent } from '@/types/waybill'
import { EXCEPTION_LABELS, MILESTONE_LABELS, EVENT_TYPE_COLORS, RETURN_LABELS, RETURN_COLORS } from '@/types/waybill'
import { SkeletonBlock, SkeletonLine } from '@/components/Skeleton'
import BackButton from '@/components/BackButton'
import { formatDateGroup, formatFileSize } from '@/utils/format'

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

export default function WaybillDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [deleteWaybillId, setDeleteWaybillId] = useState<string | null>(null)
  const deleteWaybill = useMutation({
    mutationFn: (wid: string) => waybillService.delete(wid),
    onSuccess: () => navigate('/waybills'),
  })

  const { data: wb, isLoading } = useQuery({
    queryKey: ['waybill', id],
    queryFn: () => waybillService.get(id!).then((r) => r.data),
    enabled: !!id,
  })

  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Waybill>>({})
  const [editError, setEditError] = useState('')

  const updateWaybill = useMutation({
    mutationFn: () => waybillService.update(id!, editForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waybill', id] })
      setIsEditing(false)
      setEditError('')
    },
    onError: (err: any) => {
      setEditError(err?.response?.data?.error || 'Failed to update waybill. Please try again.')
    },
  })

  const startEditing = () => {
    if (!wb) return
    setEditForm({
      serviceType: wb.serviceType,
      weight: wb.weight,
      dimensions: wb.dimensions,
      origin: wb.origin,
      destination: wb.destination,
      estimatedDelivery: wb.estimatedDelivery,
      recipientName: wb.recipientName,
      recipientPhone: wb.recipientPhone,
      recipientAddress: wb.recipientAddress,
      carrierName: wb.carrierName,
      carrierTrackingNumber: wb.carrierTrackingNumber,
    })
    setIsEditing(true)
    setEditError('')
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setEditForm({})
    setEditError('')
  }

  const handleFieldChange = (field: keyof Waybill, value: string | number) => {
    setEditForm((prev) => ({ ...prev, [field]: value }))
  }

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamService.list().then((r) => r.data),
  })

  const { data: eta } = useQuery({
    queryKey: ['predict-eta', id],
    queryFn: () => analyticsService.predictEta(id!).then(r => r.data),
    enabled: !!id,
    refetchInterval: 60000,
  })

  const [initiatingReturn, setInitiatingReturn] = useState(false)
  const [returnReason, setReturnReason] = useState('')
  const [returnCarrier, setReturnCarrier] = useState('')

  const initiateReturn = useMutation({
    mutationFn: () => returnService.initiateReturn(id!, { reason: returnReason, carrier: returnCarrier }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waybill', id] })
      setInitiatingReturn(false)
      setReturnReason('')
      setReturnCarrier('')
    },
  })

  const advanceReturn = useMutation({
    mutationFn: (status: string) => returnService.updateReturnStatus(id!, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['waybill', id] }),
  })

  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [deleteAttachId, setDeleteAttachId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: dwellSegments } = useQuery({
    queryKey: ['dwell', id],
    queryFn: () => dwellTimeService.getDwell(id!).then(r => r.data),
    enabled: !!id,
  })

  const activeDwell = dwellSegments?.find(s => s.isActive)

  const { data: geofenceEvents } = useQuery({
    queryKey: ['geofence', id],
    queryFn: () => geofenceService.getForWaybill(id!).then(r => r.data),
    enabled: !!id,
  })

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
      } catch { setUploadError('Upload failed. Please try again.') }
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
    reader.readAsDataURL(file)
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

  if (isLoading) return <div style={{ display: 'grid', gap: '1rem', padding: '1rem' }}><SkeletonBlock height={60} /><SkeletonLine width="60%" /><SkeletonLine width="80%" /><SkeletonLine width="40%" /><SkeletonBlock height={200} /></div>
  if (!wb) return <p>Waybill not found</p>

  return (
    <div>
      {wb.slaBreached && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: 'var(--badge-red-bg)', border: '1px solid var(--badge-red-border)', borderRadius: 8, marginBottom: '1rem', color: 'var(--badge-red-text)', fontSize: '0.875rem', fontWeight: 500 }}>
          <AlertTriangle size={18} />
          SLA Breached — Estimated delivery was {new Date(wb.estimatedDelivery).toLocaleDateString()}
        </div>
      )}
      <BackButton fallback="/waybills" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
          Waybill #{wb.trackingNumber}
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {isEditing ? (
            <>
              <button
                onClick={() => updateWaybill.mutate()}
                disabled={updateWaybill.isPending}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.5rem 1rem', background: '#2563eb',
                  border: 'none', borderRadius: 6,
                  fontSize: '0.8125rem', cursor: 'pointer', color: '#fff',
                }}
              >
                {updateWaybill.isPending ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={cancelEditing}
                disabled={updateWaybill.isPending}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.5rem 1rem', background: 'var(--color-surface)',
                  border: '1px solid var(--color-border-input)', borderRadius: 6,
                  fontSize: '0.8125rem', cursor: 'pointer', color: 'var(--color-text-muted)',
                }}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={startEditing}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.5rem 1rem', background: 'var(--color-surface)',
                border: '1px solid var(--color-border-input)', borderRadius: 6,
                fontSize: '0.8125rem', cursor: 'pointer', color: 'var(--color-text)',
              }}
            >
              Edit Waybill
            </button>
          )}
          <button
            onClick={() => setDeleteWaybillId(id!)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.375rem',
              padding: '0.5rem 1rem', background: 'var(--color-surface)',
              border: '1px solid var(--badge-red-border)', borderRadius: 6,
              fontSize: '0.8125rem', cursor: 'pointer', color: 'var(--badge-red-text)',
            }}
          >
            <Trash2 size={16} /> Delete Waybill
          </button>
        </div>
      </div>

      {editError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: 'var(--badge-red-bg)', border: '1px solid var(--badge-red-border)', borderRadius: 8, marginBottom: '1rem', color: 'var(--badge-red-text)', fontSize: '0.875rem', fontWeight: 500 }}>
          <AlertTriangle size={18} />
          {editError}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 10 }}>
          <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Shipment Info</h3>
          <DetailRow label="Status" value={wb.status} />
          {isEditing ? (
            <>
              <FormField label="Service Type" value={editForm.serviceType || ''} onChange={(v) => handleFieldChange('serviceType', v)} />
              <FormField label="Weight (kg)" type="number" value={String(editForm.weight ?? '')} onChange={(v) => handleFieldChange('weight', parseFloat(v) || 0)} />
              <FormField label="Dimensions" value={editForm.dimensions || ''} onChange={(v) => handleFieldChange('dimensions', v)} placeholder="e.g. 10x10x10 cm" />
              <FormField label="Origin" value={editForm.origin || ''} onChange={(v) => handleFieldChange('origin', v)} />
              <FormField label="Destination" value={editForm.destination || ''} onChange={(v) => handleFieldChange('destination', v)} />
              <FormField label="Est. Delivery" type="date" value={editForm.estimatedDelivery ? editForm.estimatedDelivery.split('T')[0] : ''} onChange={(v) => handleFieldChange('estimatedDelivery', v ? new Date(v).toISOString() : '')} />
            </>
          ) : (
            <>
              <DetailRow label="Service Type" value={wb.serviceType} />
              <DetailRow label="Weight" value={`${wb.weight} kg`} />
              <DetailRow label="Dimensions" value={wb.dimensions} />
              <DetailRow label="Origin" value={wb.origin} />
              <DetailRow label="Destination" value={wb.destination} />
              <DetailRow label="Est. Delivery" value={wb.estimatedDelivery ? new Date(wb.estimatedDelivery).toLocaleDateString() : '—'} />
            </>
          )}
          <DetailRow label="SLA Status" value={wb.slaBreached ? 'Breached' : 'On Time'} />
          {eta && (
            <>
              <DetailRow label="Predictive ETA" value={eta.predictedDelivery ? new Date(eta.predictedDelivery).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'} />
              <DetailRow label="Confidence" value={`${eta.confidence}%`} />
              {eta.estimatedHours !== null && <DetailRow label="Est. Transit" value={`${eta.estimatedHours} hrs`} />}
              <DetailRow label="Based On" value={eta.basedOn} />
            </>
          )}
          {isEditing ? (
            <>
              <FormField label="Carrier" value={editForm.carrierName || ''} onChange={(v) => handleFieldChange('carrierName', v)} placeholder="e.g. FedEx" />
              <FormField label="Carrier Tracking" value={editForm.carrierTrackingNumber || ''} onChange={(v) => handleFieldChange('carrierTrackingNumber', v)} />
            </>
          ) : (
            wb.carrierName && (
              <>
                <DetailRow label="Carrier" value={wb.carrierName} />
                <DetailRow label="Carrier Tracking" value={wb.carrierTrackingNumber || '—'} />
              </>
            )
          )}
        </div>

        <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 10 }}>
          <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Recipient</h3>
          {isEditing ? (
            <>
              <FormField label="Name" value={editForm.recipientName || ''} onChange={(v) => handleFieldChange('recipientName', v)} />
              <FormField label="Phone" value={editForm.recipientPhone || ''} onChange={(v) => handleFieldChange('recipientPhone', v)} />
              <FormField label="Address" value={editForm.recipientAddress || ''} onChange={(v) => handleFieldChange('recipientAddress', v)} placeholder="Full delivery address" />
            </>
          ) : (
            <>
              <DetailRow label="Name" value={wb.recipientName} />
              <DetailRow label="Phone" value={wb.recipientPhone} />
              <DetailRow label="Address" value={wb.recipientAddress} />
            </>
          )}
          <TeamAssignment
            waybillId={id!}
            teamId={wb.teamId}
            teamName={wb.teamName}
            teams={teams || []}
          />
        </div>
      </div>

      <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 10, marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Paperclip size={18} color='var(--color-text-muted)' />
            <h3 style={{ fontWeight: 600 }}>Proof of Delivery Attachments</h3>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted-lighter)' }}>({attachments?.length || 0})</span>
          </div>
          <div>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer' }}>
              <Upload size={14} /> {uploading ? 'Uploading...' : 'Upload File'}
            </button>
            {uploadError && <p style={{ fontSize: '0.75rem', color: 'var(--badge-red-text)', marginTop: '0.375rem' }}>{uploadError}</p>}
          </div>
        </div>
        {(!attachments || attachments.length === 0) ? (
          <p style={{ color: 'var(--color-text-muted-lighter)', fontSize: '0.875rem' }}>No attachments yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {attachments.map((att: Attachment) => (
              <div key={att.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0.75rem', background: 'var(--color-surface-hover)', borderRadius: 8, border: '1px solid var(--color-border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                  <FileText size={16} color='var(--color-text-muted)' />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 500, fontSize: '0.875rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.fileName}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted-lighter)', margin: 0 }}>{formatFileSize(att.fileSize)} · {new Date(att.uploadedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.375rem' }}>
                  <button onClick={() => { const a = document.createElement('a'); a.href = `data:${att.fileType};base64,${att.data}`; a.download = att.fileName; a.click() }} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.625rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                    <Download size={12} /> Download
                  </button>
                  <button onClick={() => setDeleteAttachId(att.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.625rem', background: 'var(--color-surface)', border: '1px solid var(--badge-red-border)', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer', color: 'var(--badge-red-text)' }}>
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <ConfirmModal
        open={deleteAttachId !== null}
        title="Delete Attachment"
        message="Are you sure you want to delete this attachment? This action cannot be undone."
        onConfirm={() => { if (deleteAttachId) deleteAttachment.mutate(deleteAttachId); setDeleteAttachId(null) }}
        onCancel={() => setDeleteAttachId(null)}
      />
      <ConfirmModal
        open={deleteWaybillId !== null}
        title="Delete Waybill"
        message="Are you sure you want to delete this waybill? All associated data will be permanently removed. This action cannot be undone."
        confirmLabel="Delete Waybill"
        onConfirm={() => { if (deleteWaybillId) deleteWaybill.mutate(deleteWaybillId); setDeleteWaybillId(null) }}
        onCancel={() => setDeleteWaybillId(null)}
      />

      {wb.returnInfo ? (
        <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 10, marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ArrowLeftRight size={18} color="#7c3aed" />
              <h3 style={{ fontWeight: 600 }}>Reverse Logistics</h3>
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.75rem', borderRadius: 999, fontSize: '0.8125rem', fontWeight: 600, background: RETURN_COLORS[wb.returnInfo.status as ReturnStatus] + '20', color: RETURN_COLORS[wb.returnInfo.status as ReturnStatus] }}>
              {RETURN_LABELS[wb.returnInfo.status as ReturnStatus]}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.875rem' }}>
            <DetailRow label="Reason" value={wb.returnInfo.reason} />
            <DetailRow label="Requested" value={new Date(wb.returnInfo.requestedAt).toLocaleDateString()} />
            {wb.returnInfo.trackingNumber && <DetailRow label="RMA #" value={wb.returnInfo.trackingNumber} />}
            {wb.returnInfo.carrier && <DetailRow label="Return Carrier" value={wb.returnInfo.carrier} />}
            {wb.returnInfo.completedAt && <DetailRow label="Completed" value={new Date(wb.returnInfo.completedAt).toLocaleDateString()} />}
            {wb.returnInfo.notes && <DetailRow label="Notes" value={wb.returnInfo.notes} />}
          </div>
          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
            {wb.returnInfo.status === 'RETURN_REQUESTED' && (
              <button onClick={() => advanceReturn.mutate('RETURN_IN_TRANSIT')} disabled={advanceReturn.isPending} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.8125rem', cursor: 'pointer' }}>
                <RefreshCw size={14} /> Mark In Transit
              </button>
            )}
            {wb.returnInfo.status === 'RETURN_IN_TRANSIT' && (
              <button onClick={() => advanceReturn.mutate('RETURN_RECEIVED')} disabled={advanceReturn.isPending} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', background: '#0891b2', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.8125rem', cursor: 'pointer' }}>
                <RefreshCw size={14} /> Mark Received
              </button>
            )}
            {wb.returnInfo.status === 'RETURN_RECEIVED' && (
              <button onClick={() => advanceReturn.mutate('RETURN_COMPLETED')} disabled={advanceReturn.isPending} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.8125rem', cursor: 'pointer' }}>
                <RefreshCw size={14} /> Complete Return
              </button>
            )}
          </div>
        </div>
      ) : (['DELIVERED', 'FAILED_DELIVERY'].includes(wb.status) && (
        <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 10, marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ArrowLeftRight size={18} color="#d97706" />
              <h3 style={{ fontWeight: 600 }}>Reverse Logistics</h3>
            </div>
            {!initiatingReturn ? (
              <button onClick={() => setInitiatingReturn(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', background: '#d97706', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.8125rem', cursor: 'pointer' }}>
                <ArrowLeftRight size={14} /> Initiate Return
              </button>
            ) : null}
          </div>
          {initiatingReturn && (
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: 400 }}>
              <input placeholder="Return reason (e.g. Damaged, Wrong item)" value={returnReason} onChange={e => setReturnReason(e.target.value)} style={{ padding: '0.5rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.875rem' }} />
              <input placeholder="Return carrier (optional)" value={returnCarrier} onChange={e => setReturnCarrier(e.target.value)} style={{ padding: '0.5rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.875rem' }} />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => initiateReturn.mutate()} disabled={!returnReason || initiateReturn.isPending} style={{ padding: '0.5rem 1rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.875rem', cursor: 'pointer' }}>
                  {initiateReturn.isPending ? 'Initiating...' : 'Confirm Return'}
                </button>
                <button onClick={() => setInitiatingReturn(false)} style={{ padding: '0.5rem 1rem', background: 'var(--color-surface)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.875rem', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      ))}

      <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 10, marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ fontWeight: 600 }}>Milestone Event Log</h3>
          <AddScanForm waybillId={id!} onAdded={() => queryClient.invalidateQueries({ queryKey: ['waybill', id] })} />
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

      {wb.carrierEvents && wb.carrierEvents.length > 0 && (
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

      {dwellSegments && dwellSegments.length > 0 && (
        <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 10, marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Clock size={18} color={activeDwell ? 'var(--badge-red-text)' : 'var(--color-text-muted)'} />
            <h3 style={{ fontWeight: 600 }}>Dwell Time at Facilities</h3>
            {activeDwell && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.625rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600, background: 'var(--badge-red-bg)', color: 'var(--badge-red-text)', border: '1px solid var(--badge-red-border)' }}>
                <AlertTriangle size={10} /> Active Dwell
              </span>
            )}
          </div>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {dwellSegments.map((seg: DwellSegment) => {
              const duration = seg.durationMinutes || 0
              const hours = duration / 60
              const isExcessive = seg.isActive && hours >= 24
              return (
                <div key={seg.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', background: isExcessive ? 'var(--badge-red-bg)' : 'var(--color-surface-hover)', borderRadius: 8, border: isExcessive ? '1px solid var(--badge-red-border)' : '1px solid var(--color-border-subtle)' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: seg.isActive ? 'var(--badge-red-text)' : 'var(--badge-green-text)', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{seg.facility}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span>Arrived: {new Date(seg.arrivedAt).toLocaleString()}</span>
                      {seg.departedAt ? (
                        <span>Departed: {new Date(seg.departedAt).toLocaleString()}</span>
                      ) : (
                        <span style={{ color: 'var(--badge-red-text)', fontWeight: 500 }}>Still here</span>
                      )}
                      <span>·</span>
                      <span>Duration: <strong>{hours >= 24 ? `${(hours / 24).toFixed(1)}d` : `${hours.toFixed(1)}h`}</strong></span>
                    </div>
                  </div>
                  {isExcessive && <AlertTriangle size={16} color="#dc2626" />}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {geofenceEvents && geofenceEvents.length > 0 && (
        <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 10, marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <MapPin size={18} color="#0891b2" />
            <h3 style={{ fontWeight: 600 }}>Geofence Events</h3>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted-lighter)' }}>({geofenceEvents.length})</span>
          </div>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {geofenceEvents.map((evt: GeofenceEvent) => (
              <div key={evt.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.75rem', background: 'var(--color-surface-hover)', borderRadius: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: evt.eventType === 'ENTRY' ? '#16a34a20' : '#dc262620', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {evt.eventType === 'ENTRY' ? <LogIn size={12} color="#16a34a" /> : <LogOut size={12} color="#dc2626" />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{evt.eventType === 'ENTRY' ? 'Entered' : 'Exited'} {evt.zone}</span>
                    <span style={{ display: 'inline-flex', padding: '0.125rem 0.5rem', borderRadius: 4, fontSize: '0.6875rem', fontWeight: 500, background: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                      {evt.zoneType.replace(/_/g, ' ')}
                    </span>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted-lighter)' }}>
                      {new Date(evt.timestamp).toLocaleString()}
                    </span>
                  </div>
                  {evt.metadata && <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted-lighter)', margin: '0.125rem 0 0 0' }}>{evt.metadata}</p>}
                </div>
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
      <span style={{ width: 140, color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  )
}

function TeamAssignment({ waybillId, teamId, teamName, teams }: { waybillId: string; teamId?: string; teamName?: string; teams: any[] }) {
  const [selectedTeamId, setSelectedTeamId] = useState(teamId || '')
  const [assignError, setAssignError] = useState('')
  const queryClient = useQueryClient()

  useEffect(() => {
    setSelectedTeamId(teamId || '')
  }, [teamId])

  const assignTeam = useMutation({
    mutationFn: (teamIdValue: string | null) => teamService.assignToWaybill(waybillId, teamIdValue),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waybill', waybillId] })
      setAssignError('')
    },
    onError: (err: any) => {
      setAssignError(err?.response?.data?.error || 'Failed to assign team. Please try again.')
    },
  })

  const handleAssign = () => {
    assignTeam.mutate(selectedTeamId || null)
  }

  return (
    <div style={{ borderTop: '1px solid var(--color-border-subtle)', marginTop: '0.75rem', paddingTop: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <Shield size={16} color="#d97706" />
        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Team Assignment</span>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <select
          value={selectedTeamId}
          onChange={(e) => {
            setSelectedTeamId(e.target.value)
            setAssignError('')
          }}
          style={{ flex: 1, padding: '0.5rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.875rem', background: 'var(--color-surface)' }}
        >
          <option value="">Unassigned</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <button
          onClick={handleAssign}
          disabled={assignTeam.isPending || selectedTeamId === (teamId || '')}
          style={{
            padding: '0.5rem 1rem',
            background: selectedTeamId === (teamId || '') ? 'var(--color-border)' : '#2563eb',
            color: selectedTeamId === (teamId || '') ? 'var(--color-text-muted)' : '#fff',
            border: 'none',
            borderRadius: 6,
            fontSize: '0.8125rem',
            fontWeight: 500,
            cursor: selectedTeamId === (teamId || '') ? 'not-allowed' : 'pointer',
          }}
        >
          {assignTeam.isPending ? 'Assigning...' : 'Assign'}
        </button>
      </div>
      {assignError && (
        <p style={{ color: 'var(--badge-red-text)', fontSize: '0.75rem', marginTop: '0.375rem' }}>{assignError}</p>
      )}
      {teamName && !assignError && (
        <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: 'var(--badge-amber-text)' }}>
          <Shield size={12} />
          Currently assigned to <strong>{teamName}</strong>
        </div>
      )}
    </div>
  )
}

function FormField({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '0.75rem' }}>
      <label style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          padding: '0.5rem',
          border: '1px solid var(--color-border-input)',
          borderRadius: 6,
          fontSize: '0.875rem',
          background: 'var(--color-surface)',
          color: 'var(--color-text)',
        }}
      />
    </div>
  )
}

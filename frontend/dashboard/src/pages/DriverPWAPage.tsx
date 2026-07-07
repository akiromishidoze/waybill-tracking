import { useState, useRef, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { driverService } from '@/services/api'
import type { DriverAssignment, DriverStatusUpdate } from '@/types/waybill'
import {
  CheckCircle, XCircle, ScanLine, MapPin, Phone, User,
  Navigation, ChevronRight, ChevronLeft, Wifi, WifiOff, PenLine, RotateCcw,
} from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  ASSIGNED: '#f59e0b',
  PICKED_UP: '#3b82f6',
  IN_TRANSIT: '#8b5cf6',
  DELIVERED: '#16a34a',
  FAILED: '#dc2626',
}

const STATUS_NEXT: Record<string, string | null> = {
  ASSIGNED: 'PICKED_UP',
  PICKED_UP: 'IN_TRANSIT',
  IN_TRANSIT: null,
  DELIVERED: null,
  FAILED: null,
}

const SCAN_TYPE_FOR_STATUS: Record<string, string> = {
  PICKED_UP: 'PICKUP',
  IN_TRANSIT: 'ARRIVAL',
  DELIVERED: 'DELIVERY',
  FAILED: 'ATTEMPT',
}

type View = 'list' | 'detail' | 'scan' | 'signature'

export default function DriverPWAPage() {
  const queryClient = useQueryClient()
  const [view, setView] = useState<View>('list')
  const [selected, setSelected] = useState<DriverAssignment | null>(null)
  const [scanLocation, setScanLocation] = useState('')
  const [scanRemark, setScanRemark] = useState('')
  const [pendingStatus, setPendingStatus] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [successMsg, setSuccessMsg] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)
  const [hasSig, setHasSig] = useState(false)

  useEffect(() => {
    const up = () => setIsOnline(true)
    const down = () => setIsOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down) }
  }, [])

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['driver-assignments'],
    queryFn: () => driverService.listAssignments().then(r => r.data),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: DriverStatusUpdate }) => driverService.updateStatus(id, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['driver-assignments'] })
      queryClient.invalidateQueries({ queryKey: ['driver-scans'] })
      const updated = assignments?.find(a => a.id === vars.id)
      if (updated) setSelected({ ...updated, status: vars.data.status })
      const label = vars.data.status === 'DELIVERED' ? 'Delivered!' : vars.data.status === 'FAILED' ? 'Marked as failed' : `Status updated to ${vars.data.status.replace(/_/g, ' ')}`
      setSuccessMsg(label)
      setTimeout(() => setSuccessMsg(''), 3000)
      setView('detail')
    },
  })

  const activeAssignments = assignments?.filter(a => !['DELIVERED', 'FAILED'].includes(a.status)) ?? []
  const completedAssignments = assignments?.filter(a => ['DELIVERED', 'FAILED'].includes(a.status)) ?? []

  const getPos = (e: React.TouchEvent | React.MouseEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top }
  }

  const startDraw = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    drawingRef.current = true
    const canvas = canvasRef.current
    if (!canvas) return
    lastPointRef.current = getPos(e, canvas)
  }, [])

  const draw = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    if (!drawingRef.current || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pos = getPos(e, canvas)
    if (lastPointRef.current) {
      ctx.beginPath()
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.strokeStyle = '#1e293b'
      ctx.lineWidth = 2.5
      ctx.lineCap = 'round'
      ctx.stroke()
    }
    lastPointRef.current = pos
    setHasSig(true)
  }, [])

  const stopDraw = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    drawingRef.current = false
    lastPointRef.current = null
  }, [])

  const clearSig = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx?.clearRect(0, 0, canvas.width, canvas.height)
    setHasSig(false)
  }

  const submitDelivery = () => {
    if (!selected) return
    const signature = hasSig ? canvasRef.current?.toDataURL('image/png') : undefined
    updateMutation.mutate({
      id: selected.id,
      data: { status: 'DELIVERED', scanType: 'DELIVERY', location: scanLocation || selected.destination, remark: scanRemark, signature },
    })
  }

  const submitScan = () => {
    if (!selected || !pendingStatus) return
    updateMutation.mutate({
      id: selected.id,
      data: {
        status: pendingStatus as DriverAssignment['status'],
        scanType: SCAN_TYPE_FOR_STATUS[pendingStatus] || 'ARRIVAL',
        location: scanLocation || selected.destination,
        remark: scanRemark,
      },
    })
    setScanLocation('')
    setScanRemark('')
    setPendingStatus(null)
  }

  const openScan = (assignment: DriverAssignment, status: string) => {
    setSelected(assignment)
    setPendingStatus(status)
    setScanLocation(assignment.destination)
    setScanRemark('')
    if (status === 'DELIVERED') {
      setView('signature')
    } else {
      setView('scan')
    }
  }

  const statusColor = (s: string) => STATUS_COLORS[s] || '#94a3b8'

  if (isLoading) {
    return (
      <div style={styles.pwaShell}>
        <div style={styles.header}>
          <span style={styles.headerTitle}>Driver App</span>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading assignments...</div>
      </div>
    )
  }

  if (view === 'signature' && selected) {
    return (
      <div style={styles.pwaShell}>
        <div style={styles.header}>
          <button onClick={() => setView('detail')} style={styles.backBtn}><ChevronLeft size={20} /></button>
          <span style={styles.headerTitle}>Capture Signature</span>
        </div>
        <div style={{ padding: '1rem', flex: 1, overflowY: 'auto' }}>
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '1rem', marginBottom: '1rem' }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{selected.trackingNumber}</div>
            <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem' }}>
              <User size={12} style={{ marginRight: 4 }} />{selected.recipientName}
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
              <MapPin size={12} style={{ marginRight: 4 }} />{selected.recipientAddress}
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={styles.label}>Delivery Location</label>
            <input value={scanLocation} onChange={e => setScanLocation(e.target.value)}
              style={styles.input} placeholder="Confirm delivery address" />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={styles.label}>Remarks (optional)</label>
            <input value={scanRemark} onChange={e => setScanRemark(e.target.value)}
              style={styles.input} placeholder="e.g. Left at door" />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={styles.label}>Recipient Signature <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span></label>
              {hasSig && (
                <button onClick={clearSig} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}>
                  <RotateCcw size={12} /> Clear
                </button>
              )}
            </div>
            <div style={{ border: '2px dashed #cbd5e1', borderRadius: 10, background: '#fff', touchAction: 'none', userSelect: 'none' }}>
              <canvas
                ref={canvasRef}
                width={340}
                height={160}
                style={{ display: 'block', width: '100%', height: 160, borderRadius: 8, cursor: 'crosshair' }}
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={stopDraw}
                onMouseLeave={stopDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={stopDraw}
              />
            </div>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.375rem', textAlign: 'center' }}>
              {hasSig ? 'Signature captured' : 'Draw signature above (finger or stylus)'}
            </p>
          </div>

          <button
            onClick={submitDelivery}
            disabled={!scanLocation || updateMutation.isPending}
            style={{ ...styles.primaryBtn, width: '100%', opacity: !scanLocation ? 0.5 : 1 }}
          >
            <CheckCircle size={18} />
            {updateMutation.isPending ? 'Confirming...' : 'Confirm Delivery'}
          </button>
        </div>
      </div>
    )
  }

  if (view === 'scan' && selected && pendingStatus) {
    return (
      <div style={styles.pwaShell}>
        <div style={styles.header}>
          <button onClick={() => { setView('detail'); setPendingStatus(null) }} style={styles.backBtn}><ChevronLeft size={20} /></button>
          <span style={styles.headerTitle}>Record Scan</span>
        </div>
        <div style={{ padding: '1rem', flex: 1, overflowY: 'auto' }}>
          <div style={{ background: statusColor(pendingStatus) + '15', border: `1px solid ${statusColor(pendingStatus)}40`, borderRadius: 10, padding: '0.875rem', marginBottom: '1.25rem' }}>
            <div style={{ fontWeight: 700, color: statusColor(pendingStatus), fontSize: '0.875rem' }}>
              → {pendingStatus.replace(/_/g, ' ')}
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem' }}>{selected.trackingNumber}</div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={styles.label}>Location *</label>
            <input value={scanLocation} onChange={e => setScanLocation(e.target.value)}
              style={styles.input} placeholder="Current scan location" />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={styles.label}>Remark (optional)</label>
            <input value={scanRemark} onChange={e => setScanRemark(e.target.value)}
              style={styles.input} placeholder="e.g. Package in good condition" />
          </div>

          {pendingStatus === 'FAILED' && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '0.75rem', marginBottom: '1rem', fontSize: '0.8125rem', color: '#dc2626' }}>
              This will mark the delivery as failed. Make sure to provide a remark.
            </div>
          )}

          <button
            onClick={submitScan}
            disabled={!scanLocation || updateMutation.isPending}
            style={{
              ...styles.primaryBtn, width: '100%',
              background: pendingStatus === 'FAILED' ? '#dc2626' : '#2563eb',
              opacity: !scanLocation ? 0.5 : 1,
            }}
          >
            {pendingStatus === 'FAILED' ? <XCircle size={18} /> : <ScanLine size={18} />}
            {updateMutation.isPending ? 'Saving...' : 'Record Scan'}
          </button>
        </div>
      </div>
    )
  }

  if (view === 'detail' && selected) {
    const nextSt = STATUS_NEXT[selected.status]

    return (
      <div style={styles.pwaShell}>
        <div style={styles.header}>
          <button onClick={() => setView('list')} style={styles.backBtn}><ChevronLeft size={20} /></button>
          <span style={styles.headerTitle}>Delivery Detail</span>
        </div>
        <div style={{ padding: '1rem', flex: 1, overflowY: 'auto' }}>
          {successMsg && (
            <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 8, padding: '0.75rem', marginBottom: '1rem', fontSize: '0.875rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={16} /> {successMsg}
            </div>
          )}

          <div style={{ background: 'var(--color-surface)', borderRadius: 12, padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ fontWeight: 700, fontSize: '1.125rem' }}>{selected.trackingNumber}</div>
              <span style={{ padding: '0.25rem 0.75rem', borderRadius: 999, fontSize: '0.6875rem', fontWeight: 700, background: statusColor(selected.status) + '20', color: statusColor(selected.status) }}>
                {selected.status.replace(/_/g, ' ')}
              </span>
            </div>
            <div style={{ display: 'grid', gap: '0.625rem', fontSize: '0.875rem' }}>
              <div style={styles.detailRow}><User size={15} color="#94a3b8" /> <span>{selected.recipientName}</span></div>
              <div style={styles.detailRow}><Phone size={15} color="#94a3b8" /> <span>{selected.recipientPhone}</span></div>
              <div style={styles.detailRow}><MapPin size={15} color="#94a3b8" /> <span>{selected.recipientAddress}</span></div>
              <div style={styles.detailRow}><Navigation size={15} color="#94a3b8" /> <span>{selected.origin} → {selected.destination}</span></div>
            </div>
            {selected.notes && (
              <div style={{ marginTop: '0.75rem', padding: '0.625rem', background: '#fef3c7', borderRadius: 6, fontSize: '0.8125rem', color: '#92400e' }}>
                📝 {selected.notes}
              </div>
            )}
          </div>

          {!['DELIVERED', 'FAILED'].includes(selected.status) && (
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {nextSt && (
                <button
                  onClick={() => openScan(selected, nextSt)}
                  style={{ ...styles.primaryBtn, justifyContent: 'center' }}
                >
                  <Navigation size={18} />
                  Mark as {nextSt.replace(/_/g, ' ')}
                </button>
              )}
              <button
                onClick={() => openScan(selected, 'DELIVERED')}
                style={{ ...styles.primaryBtn, background: '#16a34a', justifyContent: 'center' }}
              >
                <CheckCircle size={18} />
                Deliver & Capture Signature
              </button>
              <button
                onClick={() => openScan(selected, 'FAILED')}
                style={{ ...styles.primaryBtn, background: '#dc2626', justifyContent: 'center' }}
              >
                <XCircle size={18} />
                Mark as Failed
              </button>
            </div>
          )}

          {selected.status === 'DELIVERED' && (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: '#16a34a' }}>
              <CheckCircle size={40} style={{ marginBottom: '0.5rem' }} />
              <div style={{ fontWeight: 600 }}>Delivery Completed</div>
              {selected.deliveredAt && <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem' }}>{new Date(selected.deliveredAt).toLocaleString()}</div>}
            </div>
          )}
          {selected.status === 'FAILED' && (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: '#dc2626' }}>
              <XCircle size={40} style={{ marginBottom: '0.5rem' }} />
              <div style={{ fontWeight: 600 }}>Delivery Failed</div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={styles.pwaShell}>
      <div style={styles.header}>
        <span style={styles.headerTitle}>My Deliveries</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: isOnline ? '#4ade80' : '#f87171' }}>
          {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
          {isOnline ? 'Online' : 'Offline'}
        </div>
      </div>

      <div style={{ padding: '1rem', flex: 1, overflowY: 'auto' }}>
        {successMsg && (
          <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 8, padding: '0.75rem', marginBottom: '1rem', fontSize: '0.875rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={16} /> {successMsg}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={styles.statCard}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b' }}>{activeAssignments.length}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Active</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#16a34a' }}>{completedAssignments.filter(a => a.status === 'DELIVERED').length}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Delivered</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#dc2626' }}>{completedAssignments.filter(a => a.status === 'FAILED').length}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Failed</div>
          </div>
        </div>

        {activeAssignments.length > 0 && (
          <>
            <div style={styles.sectionLabel}>Active Deliveries</div>
            <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {activeAssignments.map(a => (
                <button key={a.id} onClick={() => { setSelected(a); setView('detail') }} style={styles.assignmentCard}>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{a.trackingNumber}</span>
                      <span style={{ padding: '0.125rem 0.625rem', borderRadius: 999, fontSize: '0.6875rem', fontWeight: 700, background: statusColor(a.status) + '20', color: statusColor(a.status) }}>
                        {a.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <User size={12} /> {a.recipientName}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.125rem' }}>
                      <MapPin size={12} /> {a.destination}
                    </div>
                  </div>
                  <ChevronRight size={18} color="#94a3b8" />
                </button>
              ))}
            </div>
          </>
        )}

        {activeAssignments.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#64748b' }}>
            <CheckCircle size={48} color="#16a34a" style={{ marginBottom: '0.75rem' }} />
            <div style={{ fontWeight: 600, fontSize: '1rem' }}>All done!</div>
            <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>No active deliveries.</div>
          </div>
        )}

        {completedAssignments.length > 0 && (
          <>
            <div style={styles.sectionLabel}>Completed</div>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {completedAssignments.map(a => (
                <button key={a.id} onClick={() => { setSelected(a); setView('detail') }}
                  style={{ ...styles.assignmentCard, opacity: 0.75 }}>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{a.trackingNumber}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: statusColor(a.status) }}>
                        {a.status === 'DELIVERED' ? '✓ Delivered' : '✗ Failed'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.125rem' }}>{a.destination}</div>
                  </div>
                  <ChevronRight size={16} color="#cbd5e1" />
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
        <PenLine size={12} style={{ marginRight: 4 }} />
        Driver PWA · Tap a delivery to update status or capture signature
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  pwaShell: {
    maxWidth: 480,
    margin: '0 auto',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--color-bg)',
    position: 'relative',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem',
    background: '#1e293b',
    color: '#fff',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  headerTitle: {
    fontWeight: 700,
    fontSize: '1.0625rem',
  },
  backBtn: {
    background: 'transparent',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    padding: '0.25rem',
    display: 'flex',
    alignItems: 'center',
  },
  primaryBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.875rem 1.25rem',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: '0.9375rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  label: {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#64748b',
    marginBottom: '0.375rem',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid var(--color-border-input)',
    borderRadius: 8,
    fontSize: '1rem',
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    boxSizing: 'border-box' as const,
  },
  statCard: {
    flex: 1,
    background: 'var(--color-surface)',
    borderRadius: 10,
    padding: '0.875rem',
    textAlign: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  sectionLabel: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#94a3b8',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '0.625rem',
  },
  assignmentCard: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 10,
    padding: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    width: '100%',
  },
  detailRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.5rem',
    color: '#475569',
  },
}

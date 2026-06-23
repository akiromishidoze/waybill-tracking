import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { driverService } from '@/services/api'

import { Package, ScanLine, CheckCircle, XCircle, Truck, Clock, MapPin, User, Phone, Navigation, Camera, PenLine } from 'lucide-react'
import { SkeletonBlock } from '@/components/Skeleton'
import BackButton from '@/components/BackButton'

const STATUS_FLOW: Record<string, string[]> = {
  ASSIGNED: ['PICKED_UP'],
  PICKED_UP: ['IN_TRANSIT'],
  IN_TRANSIT: ['DELIVERED', 'FAILED'],
  DELIVERED: [],
  FAILED: [],
}

const STATUS_COLORS: Record<string, string> = {
  ASSIGNED: 'var(--status-orange)',
  PICKED_UP: 'var(--status-blue)',
  IN_TRANSIT: 'var(--status-violet)',
  DELIVERED: 'var(--status-green)',
  FAILED: 'var(--status-red)',
}

const SCAN_LABELS: Record<string, string> = {
  PICKUP: 'Pickup Scan',
  ARRIVAL: 'Arrival Scan',
  DELIVERY: 'Delivery Scan',
  ATTEMPT: 'Delivery Attempt',
  RETURN: 'Return Scan',
}

export default function DriverAppPage() {
  const queryClient = useQueryClient()
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null)
  const [showScanModal, setShowScanModal] = useState<string | null>(null)
  const [scanForm, setScanForm] = useState({ scanType: 'ARRIVAL', location: '', remark: '' })

  const { data: assignments, isLoading: loadingAssignments } = useQuery({
    queryKey: ['driver-assignments', selectedDriver],
    queryFn: () => driverService.listAssignments().then(r => r.data),
  })

  const { data: scans, isLoading: loadingScans } = useQuery({
    queryKey: ['driver-scans'],
    queryFn: () => driverService.listScans().then(r => r.data),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => driverService.updateStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-assignments'] })
      queryClient.invalidateQueries({ queryKey: ['driver-scans'] })
    },
  })

  const scanMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => driverService.updateStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-assignments'] })
      queryClient.invalidateQueries({ queryKey: ['driver-scans'] })
      setShowScanModal(null)
    },
  })

  const drivers = assignments?.reduce<string[]>((acc, a) => {
    if (!acc.includes(a.driverName)) acc.push(a.driverName)
    return acc
  }, []) || []

  const filteredAssignment = selectedDriver
    ? assignments?.filter(a => a.driverName === selectedDriver)
    : assignments

  const activeAssignments = filteredAssignment?.filter(a => !['DELIVERED', 'FAILED'].includes(a.status)) || []

  const nextStatus = (current: string) => STATUS_FLOW[current]?.[0] || null
  const statusColor = (s: string) => STATUS_COLORS[s] || 'var(--color-text-muted)'

  return (
    <div>
      <BackButton fallback="/dashboard" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Driver App Integration</h2>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Last-mile delivery management & scan tracking</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select
            value={selectedDriver || ''}
            onChange={e => setSelectedDriver(e.target.value || null)}
            style={{ padding: '0.5rem 0.75rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.875rem' }}
          >
            <option value="">All Drivers</option>
            {drivers.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            {activeAssignments.length} active / {filteredAssignment?.length || 0} total
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Truck size={18} color="#2563eb" /> Active Deliveries
          </h3>
          {loadingAssignments ? (
            <div style={{ display: 'grid', gap: '1rem' }}><SkeletonBlock height={120} /><SkeletonBlock height={120} /></div>
          ) : !activeAssignments.length ? (
            <div style={{ background: 'var(--color-surface)', borderRadius: 10, padding: '2rem', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
              <CheckCircle size={40} color="#16a34a" style={{ marginBottom: '0.75rem' }} />
              <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>All deliveries completed! No active assignments.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {activeAssignments.map(a => (
                <div key={a.id} style={{ background: 'var(--color-surface)', borderRadius: 10, padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {a.trackingNumber}
                        <span style={{
                          display: 'inline-block', padding: '0.125rem 0.5rem', borderRadius: 999, fontSize: '0.6875rem',
                          fontWeight: 600, background: statusColor(a.status) + '20', color: statusColor(a.status),
                        }}>
                          {a.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                        {a.driverName} &middot; Assigned {new Date(a.assignedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                      {nextStatus(a.status) && (() => {
                        const ns = nextStatus(a.status) as string
                        return (
                          <button
                            onClick={() => statusMutation.mutate({ id: a.id, data: { status: ns, scanType: ns === 'DELIVERED' ? 'DELIVERY' : ns === 'FAILED' ? 'ATTEMPT' : 'ARRIVAL', location: a.destination } })}
                            disabled={statusMutation.isPending}
                            title={`Mark as ${ns}`}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.75rem', background: statusColor(ns) + '20', color: statusColor(ns), border: '1px solid ' + statusColor(ns), borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500 }}
                          >
                            <Navigation size={12} /> {ns === 'DELIVERED' ? 'Deliver' : ns === 'FAILED' ? 'Fail' : ns.replace(/_/g, ' ')}
                          </button>
                        )
                      })()}
                      <button
                        onClick={() => { setShowScanModal(a.id); setScanForm({ scanType: 'ARRIVAL', location: a.destination, remark: '' }) }}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.75rem', background: 'transparent', color: 'var(--color-primary)', border: '1px solid var(--color-primary)', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500 }}
                      >
                        <Camera size={12} /> Scan
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <MapPin size={14} color='var(--color-text-muted-lighter)' /> {a.origin} &rarr; {a.destination}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <User size={14} color='var(--color-text-muted-lighter)' /> {a.recipientName}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <Phone size={14} color='var(--color-text-muted-lighter)' /> {a.recipientPhone}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <Clock size={14} color='var(--color-text-muted-lighter)' /> {a.pickedUpAt ? 'Picked up ' + new Date(a.pickedUpAt).toLocaleDateString() : 'Not picked up'}
                    </div>
                  </div>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                    {a.recipientAddress}
                  </div>
                  {a.notes && (
                    <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'var(--badge-red-bg)', borderRadius: 6, fontSize: '0.8125rem', color: 'var(--status-red)' }}>
                      Note: {a.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: '1.5rem 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={18} color='var(--color-text-muted)' /> Completed Deliveries
          </h3>
          {loadingAssignments ? (
            <SkeletonBlock height={80} />
          ) : !filteredAssignment?.length ? (
            <p style={{ color: 'var(--color-text-muted)' }}>No assignments found.</p>
          ) : (
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {filteredAssignment.filter(a => ['DELIVERED', 'FAILED'].includes(a.status)).map(a => (
                <div key={a.id} style={{ background: 'var(--color-surface)', borderRadius: 8, padding: '0.75rem 1rem', boxShadow: 'var(--shadow-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{a.trackingNumber}</span>
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: statusColor(a.status) }}>
                      {a.status === 'DELIVERED' ? 'Delivered' : 'Failed'}
                    </span>
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted-lighter)' }}>
                      {a.destination}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted-lighter)' }}>
                    {a.deliveredAt ? new Date(a.deliveredAt).toLocaleDateString() : '-'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ScanLine size={18} color="#8b5cf6" /> Recent Scan Events
          </h3>
          {loadingScans ? (
            <div style={{ display: 'grid', gap: '0.75rem' }}><SkeletonBlock height={64} /><SkeletonBlock height={64} /><SkeletonBlock height={64} /></div>
          ) : !scans?.length ? (
            <p style={{ color: 'var(--color-text-muted)' }}>No scan events yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {scans?.slice(0, 20).map(s => (
                <div key={s.id} style={{ background: 'var(--color-surface)', borderRadius: 8, padding: '0.75rem 1rem', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: s.scanType === 'DELIVERY' ? 'var(--badge-green-bg)' : s.scanType === 'ATTEMPT' ? 'var(--badge-red-bg)' : 'var(--color-primary-soft)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {s.scanType === 'DELIVERY' ? <CheckCircle size={18} color="var(--badge-green-text)" /> :
                     s.scanType === 'ATTEMPT' ? <XCircle size={18} color="var(--badge-red-text)" /> :
                     <ScanLine size={18} color="var(--color-primary)" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                      {SCAN_LABELS[s.scanType] || s.scanType}
                      <span style={{ marginLeft: '0.375rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 400 }}>
                        &middot; {s.trackingNumber}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted-lighter)', marginTop: '0.125rem' }}>
                      {s.driverName} &middot; {s.location} &middot; {new Date(s.timestamp).toLocaleString()}
                    </div>
                    {s.remark && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.125rem', fontStyle: 'italic' }}>
                        &ldquo;{s.remark}&rdquo;
                      </div>
                    )}
                  </div>
                  {s.signature && (
                    <div style={{ fontSize: '0.6875rem', color: 'var(--status-green)', display: 'flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap' }}>
                      <PenLine size={12} /> Signed
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showScanModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: 12, padding: '1.5rem', width: 400, maxWidth: '90vw', boxShadow: 'var(--shadow-md)' }}>
            <h3 style={{ margin: '0 0 1rem', fontWeight: 600, fontSize: '1.125rem' }}>Record Scan</h3>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Scan Type</label>
                <select value={scanForm.scanType} onChange={e => setScanForm({ ...scanForm, scanType: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.875rem' }}>
                  <option value="PICKUP">Pickup Scan</option>
                  <option value="ARRIVAL">Arrival Scan</option>
                  <option value="DELIVERY">Delivery Scan</option>
                  <option value="ATTEMPT">Delivery Attempt</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Location</label>
                <input value={scanForm.location} onChange={e => setScanForm({ ...scanForm, location: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.875rem' }} placeholder="e.g. 123 Main St" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Remark</label>
                <input value={scanForm.remark} onChange={e => setScanForm({ ...scanForm, remark: e.target.value })} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.875rem' }} placeholder="Optional note" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowScanModal(null)} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--color-border-input)', borderRadius: 6, cursor: 'pointer', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Cancel</button>
              <button
                onClick={() => {
                  const matching = assignments?.find(a => a.id === showScanModal)
                  const nextSt = matching ? (scanForm.scanType === 'DELIVERY' ? 'DELIVERED' : scanForm.scanType === 'ATTEMPT' ? 'FAILED' : matching.status === 'ASSIGNED' ? 'PICKED_UP' : matching.status) : undefined
                  scanMutation.mutate({
                    id: showScanModal!,
                    data: {
                      status: nextSt || 'IN_TRANSIT',
                      scanType: scanForm.scanType,
                      location: scanForm.location,
                      remark: scanForm.remark,
                    },
                  })
                }}
                disabled={!scanForm.location || scanMutation.isPending}
                style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}
              >
                <ScanLine size={16} /> Record Scan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

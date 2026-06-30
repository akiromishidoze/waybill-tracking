import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customsService } from '@/services/api'
import type { CustomsShipment, CustomsDocument } from '@/types/waybill'
import { FileText, Globe, CheckCircle, XCircle, Clock, Upload, Download, Search, Pencil, Trash2, X } from 'lucide-react'
import { SkeletonBlock } from '@/components/Skeleton'
import BackButton from '@/components/BackButton'
import { formatFileSize } from '@/utils/format'

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  NOT_REQUIRED: { label: 'Not Required', bg: 'var(--color-bg)', color: 'var(--color-text-muted)' },
  DOCUMENTS_PENDING: { label: 'Docs Pending', bg: 'var(--badge-amber-bg)', color: 'var(--badge-amber-text)' },
  DOCUMENTS_SUBMITTED: { label: 'Docs Submitted', bg: 'var(--badge-blue-bg)', color: 'var(--badge-blue-text)' },
  CLEARANCE_IN_PROGRESS: { label: 'Clearance In Progress', bg: 'var(--badge-indigo-bg)', color: 'var(--badge-indigo-text)' },
  CLEARED: { label: 'Cleared', bg: 'var(--badge-green-bg)', color: 'var(--badge-green-text)' },
  HELD: { label: 'Held', bg: 'var(--badge-red-bg)', color: 'var(--badge-red-text)' },
}

const DOC_LABELS: Record<string, string> = {
  COMMERCIAL_INVOICE: 'Commercial Invoice',
  PACKING_LIST: 'Packing List',
  CERT_OF_ORIGIN: 'Certificate of Origin',
  BILL_OF_LADING: 'Bill of Lading',
  CUSTOMS_DECLARATION: 'Customs Declaration',
  IMPORT_PERMIT: 'Import Permit',
  OTHER: 'Other',
}

const DOC_STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  PENDING: { label: 'Pending', bg: 'var(--badge-amber-bg)', color: 'var(--badge-amber-text)' },
  SUBMITTED: { label: 'Submitted', bg: 'var(--badge-blue-bg)', color: 'var(--badge-blue-text)' },
  APPROVED: { label: 'Approved', bg: 'var(--badge-green-bg)', color: 'var(--badge-green-text)' },
  REJECTED: { label: 'Rejected', bg: 'var(--badge-red-bg)', color: 'var(--badge-red-text)' },
}

const CUSTOMS_STATUSES = ['NOT_REQUIRED','DOCUMENTS_PENDING','DOCUMENTS_SUBMITTED','CLEARANCE_IN_PROGRESS','CLEARED','HELD']

export default function CustomsCompliancePage() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingStatus, setEditingStatus] = useState<{ id: string; status: string; notes: string } | null>(null)
  const [uploadingFor, setUploadingFor] = useState<string | null>(null)
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null)

  const { data: shipments, isLoading } = useQuery({
    queryKey: ['customs-shipments'],
    queryFn: () => customsService.listShipments().then(r => r.data),
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { customsStatus: string; notes?: string } }) =>
      customsService.updateStatus(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['customs-shipments'] }); setEditingStatus(null) },
  })

  const uploadDoc = useMutation({
    mutationFn: ({ waybillId, file }: { waybillId: string; file: File }) => {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('title', file.name)
      fd.append('docType', 'OTHER')
      return customsService.uploadDocument(waybillId, fd)
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['customs-shipments'] }); setUploadingFor(null) },
  })

  const deleteDoc = useMutation({
    mutationFn: (id: string) => customsService.deleteDocument(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['customs-shipments'] }); setDeleteDocId(null) },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && uploadingFor) {
      uploadDoc.mutate({ waybillId: uploadingFor, file })
    }
    e.target.value = ''
  }

  const international = (shipments || []).filter(
    (s: CustomsShipment) => s.originCountry !== s.destinationCountry
  )

  const domestic = (shipments || []).filter(
    (s: CustomsShipment) => s.originCountry === s.destinationCountry
  )

  const filtered = [...international, ...domestic].filter((s: CustomsShipment) => {
    if (search && !s.trackingNumber.toLowerCase().includes(search.toLowerCase()) && !s.shipperName.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter && s.customsStatus !== statusFilter) return false
    return true
  })

  return (
    <div>
      <BackButton fallback="/dashboard" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Customs & Compliance</h2>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            {international.length} international · {domestic.filter((s: CustomsShipment) => s.customsStatus !== 'NOT_REQUIRED').length} with compliance docs
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted-lighter)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tracking number or shipper..."
            style={{ width: '100%', padding: '0.625rem 0.75rem 0.625rem 2.25rem', border: '1px solid var(--color-border-input)', borderRadius: 8, fontSize: '0.875rem' }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '0.625rem 1rem', border: '1px solid var(--color-border-input)', borderRadius: 8, fontSize: '0.875rem', background: 'var(--color-surface)', minWidth: 180 }}>
          <option value="">All Statuses</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gap: '1rem' }}><SkeletonBlock height={120} /><SkeletonBlock height={120} /></div>
      ) : !filtered.length ? (
        <div style={{ background: 'var(--color-surface)', borderRadius: 12, padding: '2rem', textAlign: 'center', border: '1px solid var(--color-border)' }}>
          <Globe size={40} color='var(--color-text-muted-lighter)' style={{ marginBottom: '0.75rem' }} />
          <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>No customs shipments found.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {filtered.map((s: CustomsShipment) => {
            const cfg = STATUS_CONFIG[s.customsStatus] || STATUS_CONFIG.NOT_REQUIRED
            const isIntl = s.originCountry !== s.destinationCountry
            const pendingDocs = s.documents.filter(d => d.status !== 'APPROVED').length
            return (
              <div key={s.id} style={{ background: 'var(--color-surface)', borderRadius: 12, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                <div style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', flex: 1 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: isIntl ? 'var(--color-primary-soft)' : 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Globe size={20} color={isIntl ? 'var(--color-primary)' : 'var(--color-text-muted-lighter)'} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 600, fontSize: '1rem' }}>{s.trackingNumber}</span>
                          <span style={{ display: 'inline-block', padding: '0.2rem 0.625rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                          {isIntl && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.6875rem', fontWeight: 500, background: 'var(--color-primary-soft)', color: 'var(--color-primary)' }}><Globe size={10} /> International</span>}
                        </div>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                          {s.shipperName} &middot; {s.originCountry} &rarr; {s.destinationCountry}
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.375rem', fontSize: '0.8125rem', color: 'var(--color-text-muted-lighter)' }}>
                          <span>{s.recipientName}</span>
                          <span>{s.destination}</span>
                          {s.estimatedClearance && <span><Clock size={12} style={{ marginRight: '0.25rem' }} />Est. clearance: {new Date(s.estimatedClearance).toLocaleDateString()}</span>}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center', marginLeft: '1rem', flexWrap: 'wrap' }}>
                      {pendingDocs > 0 && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.625rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700, background: 'var(--badge-amber-bg)', color: 'var(--badge-amber-text)' }}>
                          <Clock size={12} /> {pendingDocs} pending
                        </span>
                      )}
                      <button onClick={() => setEditingStatus({ id: s.id, status: s.customsStatus, notes: '' })}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.625rem', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer', border: '1px solid var(--color-border-input)', background: 'transparent', color: 'var(--color-text-muted)' }}>
                        <Pencil size={12} /> Status
                      </button>
                      <button onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                        style={{ padding: '0.375rem 0.75rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer', border: '1px solid var(--color-border-input)', background: 'transparent', color: 'var(--color-text-secondary)' }}>
                        {expandedId === s.id ? 'Hide Docs' : `${s.documents.length} Documents`}
                      </button>
                    </div>
                  </div>
                </div>

                {expandedId === s.id && (
                  <div style={{ borderTop: '1px solid var(--color-border-subtle)', padding: '1rem 1.25rem', background: 'var(--color-surface-hover)' }}>
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                      {s.documents.length === 0 ? (
                        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted-lighter)', margin: 0 }}>No documents required for domestic shipments.</p>
                      ) : (
                        s.documents.map((doc: CustomsDocument) => {
                          const dcfg = DOC_STATUS_CONFIG[doc.status] || DOC_STATUS_CONFIG.PENDING
                          return (
                            <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--color-surface)', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FileText size={18} color='var(--color-text-muted)' />
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{doc.title}</div>
                                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.125rem', fontSize: '0.75rem', color: 'var(--color-text-muted-lighter)' }}>
                                  <span>{DOC_LABELS[doc.docType] || doc.docType}</span>
                                  <span>{formatFileSize(doc.fileSize)}</span>
                                  {doc.submittedAt && <span>Submitted: {new Date(doc.submittedAt).toLocaleDateString()}</span>}
                                </div>
                              </div>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.5rem', borderRadius: 999, fontSize: '0.6875rem', fontWeight: 600, background: dcfg.bg, color: dcfg.color, whiteSpace: 'nowrap' }}>
                                {doc.status === 'APPROVED' ? <CheckCircle size={10} /> : doc.status === 'REJECTED' ? <XCircle size={10} /> : <Clock size={10} />}
                                {dcfg.label}
                              </span>
                              <div style={{ display: 'flex', gap: '0.375rem' }}>
                                <a href={doc.fileUrl || '#'} target="_blank" rel="noopener noreferrer"
                                  style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.625rem', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer', border: '1px solid var(--color-border-input)', background: 'transparent', color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
                                  <Download size={12} /> Download
                                </a>
                                <button onClick={() => setDeleteDocId(doc.id)}
                                  style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.625rem', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer', border: 'none', background: '#dc2626', color: '#fff' }}>
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          )
                        })
                      )}
                      <button onClick={() => { setUploadingFor(s.id); fileInputRef.current?.click() }}
                        disabled={uploadDoc.isPending}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', borderRadius: 6, fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer', border: '1px dashed #2563eb', background: 'var(--color-primary-soft)', color: 'var(--color-primary)', justifyContent: 'center', width: '100%' }}>
                        <Upload size={14} /> {uploadDoc.isPending && uploadingFor === s.id ? 'Uploading...' : 'Upload Document'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleFileChange} />

      {editingStatus && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: 12, padding: '1.5rem', maxWidth: 420, width: '100%', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontWeight: 600, margin: 0 }}>Update Customs Status</h3>
              <button onClick={() => setEditingStatus(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={20} /></button>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>Customs Status</label>
              <select value={editingStatus.status} onChange={e => setEditingStatus(prev => prev ? { ...prev, status: e.target.value } : prev)}
                style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: '0.875rem', background: 'var(--color-surface)' }}>
                {CUSTOMS_STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>Notes (optional)</label>
              <textarea value={editingStatus.notes} onChange={e => setEditingStatus(prev => prev ? { ...prev, notes: e.target.value } : prev)}
                rows={3} placeholder="Add notes about this status update..."
                style={{ width: '100%', padding: '0.625rem', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: '0.875rem', background: 'var(--color-surface)', resize: 'vertical', fontFamily: 'inherit' }} />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setEditingStatus(null)} style={{ padding: '0.625rem 1.25rem', border: '1px solid var(--color-border)', borderRadius: 8, background: 'var(--color-surface)', cursor: 'pointer', fontSize: '0.875rem' }}>Cancel</button>
              <button onClick={() => updateStatus.mutate({ id: editingStatus.id, data: { customsStatus: editingStatus.status, notes: editingStatus.notes || undefined } })} disabled={updateStatus.isPending}
                style={{ padding: '0.625rem 1.25rem', border: 'none', borderRadius: 8, background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>
                {updateStatus.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteDocId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: 12, padding: '1.5rem', maxWidth: 380, width: '100%' }}>
            <h3 style={{ fontWeight: 600, margin: '0 0 0.75rem' }}>Delete Document?</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>This document will be permanently deleted and cannot be recovered.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteDocId(null)} style={{ padding: '0.5rem 1rem', border: '1px solid var(--color-border)', borderRadius: 8, background: 'var(--color-surface)', cursor: 'pointer', fontSize: '0.875rem' }}>Cancel</button>
              <button onClick={() => deleteDoc.mutate(deleteDocId)} disabled={deleteDoc.isPending}
                style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: 8, background: '#dc2626', color: '#fff', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>
                {deleteDoc.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

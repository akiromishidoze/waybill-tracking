import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'
import type { CustomsShipment, CustomsDocument } from '@/types/waybill'
import { FileText, Globe, CheckCircle, XCircle, Clock, Upload, Download, Search } from 'lucide-react'
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

export default function CustomsCompliancePage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data: shipments, isLoading } = useQuery({
    queryKey: ['customs-shipments'],
    queryFn: () => api.get<CustomsShipment[]>('/customs-shipments').then((r: { data: CustomsShipment[] }) => r.data),
  })

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
                    <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center', marginLeft: '1rem' }}>
                      {pendingDocs > 0 && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.625rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700, background: 'var(--badge-amber-bg)', color: 'var(--badge-amber-text)' }}>
                          <Clock size={12} /> {pendingDocs} pending
                        </span>
                      )}
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
                              <button style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.625rem', borderRadius: 6, fontSize: '0.75rem', cursor: 'pointer', border: '1px solid var(--color-border-input)', background: 'transparent', color: 'var(--color-text-secondary)' }}>
                                <Download size={12} /> Download
                              </button>
                            </div>
                          )
                        })
                      )}
                      {['DOCUMENTS_PENDING', 'DOCUMENTS_SUBMITTED'].includes(s.customsStatus) && (
                        <button style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', borderRadius: 6, fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer', border: '1px dashed #2563eb', background: 'var(--color-primary-soft)', color: 'var(--color-primary)', justifyContent: 'center', width: '100%' }}>
                          <Upload size={14} /> Upload Document
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

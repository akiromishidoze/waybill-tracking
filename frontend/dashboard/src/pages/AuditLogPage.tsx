import { useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { auditLogService } from '@/services/api'

import { Search, Clock, ClipboardList, Download } from 'lucide-react'
import { SkeletonTableRow } from '@/components/Skeleton'
import EmptyState from '@/components/EmptyState'
import BackButton from '@/components/BackButton'

const ACTION_COLORS: Record<string, string> = {
  USER_LOGIN: 'var(--status-blue)',
  USER_VIEW: 'var(--status-indigo)',
  ROLE_CHANGE: 'var(--status-purple)',
  WAYBILL_VIEW: 'var(--status-cyan)',
  WAYBILL_CREATE: 'var(--status-green)',
  STATUS_UPDATE: 'var(--status-amber)',
  EXCEPTION_CODE_VIEW: 'var(--status-gray)',
  REPORT_EXPORT: 'var(--status-green)',
  DASHBOARD_VIEW: 'var(--status-indigo)',
}

const ACTION_LABELS: Record<string, string> = {
  USER_LOGIN: 'Login',
  USER_VIEW: 'View Users',
  ROLE_CHANGE: 'Role Change',
  WAYBILL_VIEW: 'View Waybill',
  WAYBILL_CREATE: 'Create Waybill',
  STATUS_UPDATE: 'Status Update',
  EXCEPTION_CODE_VIEW: 'View Exception Codes',
  REPORT_EXPORT: 'Export Report',
  DASHBOARD_VIEW: 'View Dashboard',
}

export default function AuditLogPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [exportFrom, setExportFrom] = useState('')
  const [exportTo, setExportTo] = useState('')
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')

  const handleExport = async () => {
    setExporting(true)
    setExportError('')
    try {
      const res = await auditLogService.export(exportFrom || undefined, exportTo || undefined)
      const blob: Blob = res.data
      const contentType = String(res.headers['content-type'] ?? '')
      if (!contentType.includes('text/csv')) {
        const text = await blob.text()
        let message = 'Export failed.'
        try { message = (JSON.parse(text) as { error?: string }).error ?? message } catch { /* not JSON */ }
        setExportError(message)
        return
      }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const today = new Date().toISOString().slice(0, 10)
      a.download = `audit-logs-${today}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setExportError('Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearch(val)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => { setDebouncedSearch(val); setPage(1) }, 300)
  }

  const { data: pageResult, isLoading } = useQuery({
    queryKey: ['audit-logs', page, limit, debouncedSearch],
    queryFn: () => auditLogService.list(page, limit, debouncedSearch).then((r) => r.data),
    refetchInterval: 15000,
  })

  const logs = pageResult?.data ?? []
  const total = pageResult?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div>
      <BackButton fallback="/dashboard" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Audit Log</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
            Rows per page:
            <select
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value)); setPage(1) }}
              style={{ padding: '0.4rem 0.5rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.8125rem', background: 'var(--color-surface)', color: 'var(--color-text)', cursor: 'pointer' }}
            >
              {[20, 50, 100, 200].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted-lighter)' }} />
            <input
              type="text"
              placeholder="Search logs..."
              value={search}
              onChange={handleSearchChange}
              style={{
                padding: '0.5rem 0.75rem 0.5rem 2rem',
                border: '1px solid var(--color-border-input)',
                borderRadius: 6,
                fontSize: '0.875rem',
                width: 220,
              }}
            />
          </div>
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>Export range:</span>
          <input
            type="date"
            value={exportFrom}
            onChange={(e) => setExportFrom(e.target.value)}
            style={{ padding: '0.45rem 0.6rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.8125rem', background: 'var(--color-surface)', color: 'var(--color-text)' }}
          />
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>to</span>
          <input
            type="date"
            value={exportTo}
            onChange={(e) => setExportTo(e.target.value)}
            style={{ padding: '0.45rem 0.6rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.8125rem', background: 'var(--color-surface)', color: 'var(--color-text)' }}
          />
          <button
            onClick={handleExport}
            disabled={exporting}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.375rem',
              padding: '0.5rem 1rem',
              background: exporting ? 'var(--color-border)' : '#2563eb',
              color: exporting ? 'var(--color-text-muted)' : '#fff',
              border: 'none', borderRadius: 6,
              fontSize: '0.8125rem', fontWeight: 600, cursor: exporting ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <Download size={15} />
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>
      </div>
      {exportError && (
        <p style={{ color: 'var(--status-red, #dc2626)', fontSize: '0.8125rem', marginBottom: '0.75rem' }}>{exportError}</p>
      )}

      <div style={{ background: 'var(--color-surface)', borderRadius: 10, boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        {isLoading ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}><tbody>{Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} cols={4} />)}</tbody></table>
        ) : logs.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No audit logs" message={debouncedSearch ? 'No logs match your search.' : 'Audit log entries will appear once users perform actions.'} />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--color-surface-hover)', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Action</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>User</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Details</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>IP Address</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '0.125rem 0.5rem',
                        borderRadius: 4,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#fff',
                        background: ACTION_COLORS[log.action] || 'var(--status-gray)',
                      }}
                    >
                      {ACTION_LABELS[log.action] || log.action}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{log.userName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted-lighter)' }}>{log.userRole}</div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>{log.details}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{log.ipAddress}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <Clock size={14} />
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ padding: '0.375rem 0.75rem', border: '1px solid var(--color-border-input)', borderRadius: 6, background: 'var(--color-surface)', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}
          >← Prev</button>
          <span>Page {page} of {totalPages} ({total} total)</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{ padding: '0.375rem 0.75rem', border: '1px solid var(--color-border-input)', borderRadius: 6, background: 'var(--color-surface)', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}
          >Next →</button>
        </div>
      )}
    </div>
  )
}

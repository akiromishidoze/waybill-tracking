import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { auditLogService } from '@/services/api'

import { Search, Clock, ClipboardList } from 'lucide-react'
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

  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => auditLogService.list().then((r) => r.data),
    refetchInterval: 15000,
  })

  const filtered = (logs || []).filter(
    (l) =>
      l.userName.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div>
      <BackButton fallback="/dashboard" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Audit Log</h2>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted-lighter)' }} />
          <input
            type="text"
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem 0.5rem 2rem',
              border: '1px solid var(--color-border-input)',
              borderRadius: 6,
              fontSize: '0.875rem',
              width: 280,
            }}
          />
        </div>
      </div>

      <div style={{ background: 'var(--color-surface)', borderRadius: 10, boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        {isLoading ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}><tbody>{Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} cols={4} />)}</tbody></table>
        ) : filtered.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No audit logs" message={search ? 'No logs match your search.' : 'Audit log entries will appear once users perform actions.'} />
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
              {filtered.map((log) => (
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
    </div>
  )
}

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { auditLogService } from '@/services/api'

import { Search, Clock } from 'lucide-react'

const ACTION_COLORS: Record<string, string> = {
  USER_LOGIN: '#2563eb',
  USER_VIEW: '#6366f1',
  ROLE_CHANGE: '#7c3aed',
  WAYBILL_VIEW: '#0891b2',
  WAYBILL_CREATE: '#059669',
  STATUS_UPDATE: '#d97706',
  EXCEPTION_CODE_VIEW: '#6b7280',
  REPORT_EXPORT: '#16a34a',
  DASHBOARD_VIEW: '#4f46e5',
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Audit Log</h2>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem 0.5rem 2rem',
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              fontSize: '0.875rem',
              width: 280,
            }}
          />
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        {isLoading ? (
          <p style={{ padding: '2rem', color: '#64748b' }}>Loading audit logs...</p>
        ) : filtered.length === 0 ? (
          <p style={{ padding: '2rem', color: '#64748b' }}>No matching audit logs found.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, fontSize: '0.875rem', color: '#64748b' }}>Action</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, fontSize: '0.875rem', color: '#64748b' }}>User</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, fontSize: '0.875rem', color: '#64748b' }}>Details</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, fontSize: '0.875rem', color: '#64748b' }}>IP Address</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, fontSize: '0.875rem', color: '#64748b' }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr key={log.id} style={{ borderTop: '1px solid #f1f5f9' }}>
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
                        background: ACTION_COLORS[log.action] || '#6b7280',
                      }}
                    >
                      {ACTION_LABELS[log.action] || log.action}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{log.userName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{log.userRole}</div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#334155' }}>{log.details}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem', color: '#64748b', fontFamily: 'monospace' }}>{log.ipAddress}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem', color: '#64748b' }}>
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

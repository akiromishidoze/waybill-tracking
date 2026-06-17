import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userService } from '@/services/api'
import type { User } from '@/types/waybill'
import { useState } from 'react'

const ROLE_OPTIONS = ['SHIPPER', 'COURIER', 'OPS', 'ADMIN']

const ROLE_COLORS: Record<string, string> = {
  ADMIN: '#7c3aed',
  OPS: '#2563eb',
  SHIPPER: '#059669',
  COURIER: '#d97706',
}

export default function UsersPage() {
  const queryClient = useQueryClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState('')

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.list().then((r) => r.data),
  })

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      userService.updateRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setEditingId(null)
    },
  })

  const handleEdit = (u: User) => {
    setEditingId(u.id)
    setSelectedRole(u.role)
  }

  const handleSave = (id: string) => {
    if (selectedRole) {
      updateRole.mutate({ id, role: selectedRole })
    }
  }

  if (isLoading) return <p>Loading users...</p>

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Users</h2>
      </div>

      <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 600, fontSize: '0.875rem', color: '#64748b' }}>Name</th>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 600, fontSize: '0.875rem', color: '#64748b' }}>Email</th>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 600, fontSize: '0.875rem', color: '#64748b' }}>Company</th>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 600, fontSize: '0.875rem', color: '#64748b' }}>Role</th>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 600, fontSize: '0.875rem', color: '#64748b' }} />
            </tr>
          </thead>
          <tbody>
            {users?.map((u) => (
              <tr key={u.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{u.name}</td>
                <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{u.email}</td>
                <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{u.company || '—'}</td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  {editingId === u.id ? (
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      style={{
                        padding: '0.375rem 0.5rem',
                        border: '1px solid #cbd5e1',
                        borderRadius: 6,
                        fontSize: '0.875rem',
                      }}
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  ) : (
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '0.125rem 0.5rem',
                        borderRadius: 4,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#fff',
                        background: ROLE_COLORS[u.role] || '#6b7280',
                      }}
                    >
                      {u.role}
                    </span>
                  )}
                </td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  {editingId === u.id ? (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleSave(u.id)}
                        disabled={updateRole.isPending}
                        style={{
                          padding: '0.375rem 0.75rem',
                          background: '#2563eb',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontSize: '0.8125rem',
                        }}
                      >
                        {updateRole.isPending ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        style={{
                          padding: '0.375rem 0.75rem',
                          background: 'transparent',
                          color: '#64748b',
                          border: '1px solid #cbd5e1',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontSize: '0.8125rem',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEdit(u)}
                      style={{
                        padding: '0.375rem 0.75rem',
                        background: 'transparent',
                        color: '#2563eb',
                        border: '1px solid #2563eb',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: '0.8125rem',
                      }}
                    >
                      Edit Role
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

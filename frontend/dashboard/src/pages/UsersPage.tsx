import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userService } from '@/services/api'
import type { User } from '@/types/waybill'
import { Plus, Pencil, Trash2, X, Check, Users as UsersIcon } from 'lucide-react'
import { SkeletonTableRow } from '@/components/Skeleton'
import EmptyState from '@/components/EmptyState'
import ConfirmModal from '@/components/ConfirmModal'
import { useToast } from '@/contexts/ToastContext'

const ROLE_OPTIONS = ['SHIPPER', 'COURIER', 'OPS', 'ADMIN']
const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'var(--status-purple)', OPS: 'var(--status-blue)', SHIPPER: 'var(--status-green)', COURIER: 'var(--status-amber)',
}

export default function UsersPage() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  const [form, setForm] = useState({ email: '', name: '', role: 'SHIPPER', company: '', password: '' })

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.list().then((r) => r.data),
  })

  const createUser = useMutation({
    mutationFn: () => userService.create(form as any),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); setShowForm(false); resetForm(); toast.success('User created') },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Failed to create user'),
  })

  const updateUser = useMutation({
    mutationFn: () => userService.update(editingId!, form as any),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); setEditingId(null); resetForm(); toast.success('User updated') },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Failed to update user'),
  })

  const deleteUser = useMutation({
    mutationFn: (id: string) => userService.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); setDeleteUserId(null); toast.success('User deleted') },
    onError: (err: any) => { setDeleteUserId(null); toast.error(err?.response?.data?.error || 'Failed to delete user') },
  })

  const resetForm = () => setForm({ email: '', name: '', role: 'SHIPPER', company: '', password: '' })

  const openEdit = (u: User) => { setEditingId(u.id); setForm({ email: u.email, name: u.name, role: u.role, company: u.company || '', password: '' }) }
  const openAdd = () => { resetForm(); setEditingId(null); setShowForm(true) }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Users</h2>
        <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 500, cursor: 'pointer' }}>
          <Plus size={16} /> Add User
        </button>
      </div>

      {(showForm || editingId) && (
        <div style={{ background: 'var(--color-surface)', padding: '1.25rem', borderRadius: 10, marginBottom: '1rem', boxShadow: 'var(--shadow-sm)', display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Email</label><input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={{ padding: '0.5rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.875rem', width: 180 }} /></div>
          <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Name</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ padding: '0.5rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.875rem', width: 180 }} /></div>
          <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Role</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={{ padding: '0.5rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.875rem', width: 130 }}>
              {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Company</label><input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} style={{ padding: '0.5rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.875rem', width: 160 }} /></div>
          {!editingId && (
            <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Password</label><input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={{ padding: '0.5rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.875rem', width: 160 }} /></div>
          )}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => editingId ? updateUser.mutate() : createUser.mutate()} disabled={createUser.isPending || updateUser.isPending} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.875rem' }}>
              <Check size={14} /> {editingId ? 'Update' : 'Create'}
            </button>
            <button onClick={() => { setShowForm(false); setEditingId(null); resetForm() }} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem', background: 'transparent', color: 'var(--color-text-muted)', border: '1px solid var(--color-border-input)', borderRadius: 6, cursor: 'pointer', fontSize: '0.875rem' }}>
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ background: 'var(--color-surface)', borderRadius: 10, boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--color-surface-hover)', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Name</th>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Email</th>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Company</th>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Role</th>
              <th style={{ padding: '0.75rem 1rem' }} />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} cols={5} />)
            ) : users?.length === 0 ? (
              <tr><td colSpan={5}><EmptyState icon={UsersIcon} title="No users yet" message="Add users to give them access to the dashboard." /></td></tr>
            ) : (
              users?.map((u) => (
                <tr key={u.id} style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{u.name}</td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>{u.email}</td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>{u.company || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ display: 'inline-block', padding: '0.125rem 0.5rem', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600, color: '#fff', background: ROLE_COLORS[u.role] || 'var(--color-text-muted)' }}>{u.role}</span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => openEdit(u)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.625rem', background: 'transparent', color: 'var(--color-primary)', border: '1px solid var(--color-primary)', borderRadius: 6, cursor: 'pointer', fontSize: '0.8125rem' }}>
                        <Pencil size={12} /> Edit
                      </button>
                      <button onClick={() => setDeleteUserId(u.id)} disabled={deleteUser.isPending} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.625rem', background: 'transparent', color: 'var(--badge-red-text)', border: '1px solid #dc2626', borderRadius: 6, cursor: 'pointer', fontSize: '0.8125rem' }}>
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <ConfirmModal
        open={deleteUserId !== null}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        onConfirm={() => { if (deleteUserId) deleteUser.mutate(deleteUserId); setDeleteUserId(null) }}
        onCancel={() => setDeleteUserId(null)}
      />
    </div>
  )
}

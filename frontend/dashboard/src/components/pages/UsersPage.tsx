import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userService } from '@/services/api'
import type { User } from '@/types/waybill'
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react'

const ROLE_OPTIONS = ['SHIPPER', 'COURIER', 'OPS', 'ADMIN']
const ROLE_COLORS: Record<string, string> = {
  ADMIN: '#7c3aed', OPS: '#2563eb', SHIPPER: '#059669', COURIER: '#d97706',
}

export default function UsersPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ email: '', name: '', role: 'SHIPPER', company: '' })

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.list().then((r) => r.data),
  })

  const createUser = useMutation({
    mutationFn: () => userService.create(form as any),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); setShowForm(false); resetForm() },
  })

  const updateUser = useMutation({
    mutationFn: () => userService.update(editingId!, form as any),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); setEditingId(null); resetForm() },
  })

  const deleteUser = useMutation({
    mutationFn: (id: string) => userService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  const resetForm = () => setForm({ email: '', name: '', role: 'SHIPPER', company: '' })

  const openEdit = (u: User) => { setEditingId(u.id); setForm({ email: u.email, name: u.name, role: u.role, company: u.company || '' }) }
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
        <div style={{ background: '#fff', padding: '1.25rem', borderRadius: 10, marginBottom: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>Email</label><input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.875rem', width: 180 }} /></div>
          <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>Name</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.875rem', width: 180 }} /></div>
          <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>Role</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.875rem', width: 130 }}>
              {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>Company</label><input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.875rem', width: 160 }} /></div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => editingId ? updateUser.mutate() : createUser.mutate()} disabled={createUser.isPending || updateUser.isPending} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.875rem' }}>
              <Check size={14} /> {editingId ? 'Update' : 'Create'}
            </button>
            <button onClick={() => { setShowForm(false); setEditingId(null); resetForm() }} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem', background: 'transparent', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontSize: '0.875rem' }}>
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 600, fontSize: '0.875rem', color: '#64748b' }}>Name</th>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 600, fontSize: '0.875rem', color: '#64748b' }}>Email</th>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 600, fontSize: '0.875rem', color: '#64748b' }}>Company</th>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 600, fontSize: '0.875rem', color: '#64748b' }}>Role</th>
              <th style={{ padding: '0.75rem 1rem' }} />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading...</td></tr>
            ) : users?.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No users yet.</td></tr>
            ) : (
              users?.map((u) => (
                <tr key={u.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{u.name}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{u.email}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{u.company || '—'}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span style={{ display: 'inline-block', padding: '0.125rem 0.5rem', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600, color: '#fff', background: ROLE_COLORS[u.role] || '#6b7280' }}>{u.role}</span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => openEdit(u)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.625rem', background: 'transparent', color: '#2563eb', border: '1px solid #2563eb', borderRadius: 6, cursor: 'pointer', fontSize: '0.8125rem' }}>
                        <Pencil size={12} /> Edit
                      </button>
                      <button onClick={() => { if (confirm('Delete this user?')) deleteUser.mutate(u.id) }} disabled={deleteUser.isPending} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem 0.625rem', background: 'transparent', color: '#dc2626', border: '1px solid #dc2626', borderRadius: 6, cursor: 'pointer', fontSize: '0.8125rem' }}>
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
    </div>
  )
}

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsService, userService, teamService } from '@/services/api'
import { Key, Save, Plus, Trash2, Check, X, Shield } from 'lucide-react'

export default function SettingsPage() {
  const queryClient = useQueryClient()

  const { data: users } = useQuery({ queryKey: ['users'], queryFn: () => userService.list().then(r => r.data) })
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: () => settingsService.get().then(r => r.data) })
  const { data: teams } = useQuery({ queryKey: ['teams'], queryFn: () => teamService.list().then(r => r.data) })

  const [pwForm, setPwForm] = useState({ userId: '', newPassword: '' })
  const [pwMsg, setPwMsg] = useState('')

  const [settingsForm, setSettingsForm] = useState<any>(null)
  const [savedMsg, setSavedMsg] = useState('')

  const [teamForm, setTeamForm] = useState({ name: '', description: '', color: '#2563eb' })
  const [showTeamForm, setShowTeamForm] = useState(false)
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null)

  const resetPassword = useMutation({
    mutationFn: () => settingsService.resetPassword(pwForm.userId, pwForm.newPassword),
    onSuccess: (r) => { setPwMsg(r.data.message); setPwForm({ userId: '', newPassword: '' }) },
    onError: () => setPwMsg('Failed to reset password'),
  })

  const saveSettings = useMutation({
    mutationFn: () => settingsService.update(settingsForm),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['settings'] }); setSavedMsg('Settings saved') },
  })

  const createTeam = useMutation({
    mutationFn: () => teamService.create(teamForm),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['teams'] }); setShowTeamForm(false); setTeamForm({ name: '', description: '', color: '#2563eb' }) },
  })
  const updateTeam = useMutation({
    mutationFn: () => teamService.update(editingTeamId!, teamForm),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['teams'] }); setEditingTeamId(null); setShowTeamForm(false); setTeamForm({ name: '', description: '', color: '#2563eb' }) },
  })
  const deleteTeam = useMutation({
    mutationFn: (id: string) => teamService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teams'] }),
  })

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Settings</h2>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {/* Credential Management */}
        <section style={{ background: '#fff', borderRadius: 10, padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Key size={20} color="#7c3aed" />
            <h3 style={{ fontWeight: 600, fontSize: '1.125rem' }}>User Credentials</h3>
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#64748b', marginBottom: '0.75rem' }}>Reset passwords for any user account.</p>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>User</label>
              <select value={pwForm.userId} onChange={e => setPwForm({ ...pwForm, userId: e.target.value })} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.875rem', minWidth: 200 }}>
                <option value="">Select user...</option>
                {(users || []).map((u: any) => (<option key={u.id} value={u.id}>{u.name} ({u.email}) — {u.role}</option>))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>New Password</label>
              <input type="text" value={pwForm.newPassword} onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} placeholder="Enter new password" style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.875rem', width: 200 }} />
            </div>
            <button onClick={() => resetPassword.mutate()} disabled={!pwForm.userId || !pwForm.newPassword || resetPassword.isPending} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}>
              <Shield size={14} /> Reset Password
            </button>
          </div>
          {pwMsg && <p style={{ fontSize: '0.8125rem', color: '#16a34a', marginTop: '0.5rem' }}>{pwMsg}</p>}
        </section>

        {/* General Settings */}
        <section style={{ background: '#fff', borderRadius: 10, padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Save size={20} color="#2563eb" />
            <h3 style={{ fontWeight: 600, fontSize: '1.125rem' }}>General Settings</h3>
          </div>
          {settings && !settingsForm && (
            <button onClick={() => setSettingsForm({ ...settings })} style={{ padding: '0.5rem 1rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontSize: '0.875rem' }}>
              Edit Settings
            </button>
          )}
          {settings && !settingsForm && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem', fontSize: '0.875rem' }}>
              <div><span style={{ color: '#64748b' }}>Company:</span> <strong>{settings.companyName}</strong></div>
              <div><span style={{ color: '#64748b' }}>Timezone:</span> <strong>{settings.timezone}</strong></div>
              <div><span style={{ color: '#64748b' }}>Session Timeout:</span> <strong>{settings.sessionTimeout} min</strong></div>
              <div><span style={{ color: '#64748b' }}>Email Notifications:</span> <strong>{settings.emailNotifications ? 'On' : 'Off'}</strong></div>
              <div><span style={{ color: '#64748b' }}>Default Service:</span> <strong>{settings.defaultServiceType}</strong></div>
            </div>
          )}
          {settingsForm && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>Company Name</label><input value={settingsForm.companyName} onChange={e => setSettingsForm({ ...settingsForm, companyName: e.target.value })} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.875rem', width: 220 }} /></div>
                <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>Timezone</label>
                  <select value={settingsForm.timezone} onChange={e => setSettingsForm({ ...settingsForm, timezone: e.target.value })} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.875rem', width: 200 }}>
                    <option value="Asia/Manila">Asia/Manila</option>
                    <option value="Asia/Singapore">Asia/Singapore</option>
                    <option value="Asia/Tokyo">Asia/Tokyo</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
                <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>Session Timeout (min)</label><input type="number" value={settingsForm.sessionTimeout} onChange={e => setSettingsForm({ ...settingsForm, sessionTimeout: +e.target.value })} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.875rem', width: 100 }} /></div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>Default Service Type</label>
                  <select value={settingsForm.defaultServiceType} onChange={e => setSettingsForm({ ...settingsForm, defaultServiceType: e.target.value })} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.875rem', width: 160 }}>
                    <option value="STANDARD">Standard</option>
                    <option value="EXPRESS">Express</option>
                    <option value="OVERNIGHT">Overnight</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="checkbox" id="emailNotif" checked={settingsForm.emailNotifications} onChange={e => setSettingsForm({ ...settingsForm, emailNotifications: e.target.checked })} />
                  <label htmlFor="emailNotif" style={{ fontSize: '0.875rem' }}>Enable Email Notifications</label>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button onClick={() => saveSettings.mutate()} disabled={saveSettings.isPending} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}>
                  <Save size={14} /> Save Settings
                </button>
                <button onClick={() => setSettingsForm(null)} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
              {savedMsg && <p style={{ fontSize: '0.8125rem', color: '#16a34a' }}>{savedMsg}</p>}
            </div>
          )}
        </section>

        {/* Teams / Branches */}
        <section style={{ background: '#fff', borderRadius: 10, padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={20} color="#d97706" />
              <h3 style={{ fontWeight: 600, fontSize: '1.125rem' }}>Teams / Branches</h3>
            </div>
            <button onClick={() => { setShowTeamForm(true); setEditingTeamId(null); setTeamForm({ name: '', description: '', color: '#2563eb' }) }} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem', background: '#d97706', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}>
              <Plus size={14} /> Add Team
            </button>
          </div>
          {(showTeamForm) && (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '1rem', padding: '1rem', background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a' }}>
              <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>Name *</label><input value={teamForm.name} onChange={e => setTeamForm({ ...teamForm, name: e.target.value })} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.875rem', width: 180 }} /></div>
              <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>Description</label><input value={teamForm.description} onChange={e => setTeamForm({ ...teamForm, description: e.target.value })} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.875rem', width: 200 }} /></div>
              <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>Color</label><input type="color" value={teamForm.color} onChange={e => setTeamForm({ ...teamForm, color: e.target.value })} style={{ padding: '0.25rem', border: '1px solid #cbd5e1', borderRadius: 6, width: 60, height: 36 }} /></div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => editingTeamId ? updateTeam.mutate() : createTeam.mutate()} disabled={!teamForm.name || createTeam.isPending || updateTeam.isPending} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.875rem' }}>
                  <Check size={14} /> {editingTeamId ? 'Update' : 'Create'}
                </button>
                <button onClick={() => { setShowTeamForm(false); setEditingTeamId(null) }} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem', background: 'transparent', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer', fontSize: '0.875rem' }}>
                  <X size={14} /> Cancel
                </button>
              </div>
            </div>
          )}
          {(!teams || teams.length === 0) ? (
            <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No teams created yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {(teams || []).map((t: any) => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: 8 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: t.color }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{t.name}</span>
                    {t.description && <span style={{ color: '#64748b', fontSize: '0.8125rem', marginLeft: '0.5rem' }}>— {t.description}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '0.375rem' }}>
                    <button onClick={() => { setEditingTeamId(t.id); setTeamForm({ name: t.name, description: t.description, color: t.color }); setShowTeamForm(true) }} style={{ padding: '0.25rem 0.5rem', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem' }}>Edit</button>
                    <button onClick={() => { if (confirm('Delete team "' + t.name + '"?')) deleteTeam.mutate(t.id) }} style={{ padding: '0.25rem 0.5rem', background: 'transparent', border: '1px solid #dc2626', color: '#dc2626', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

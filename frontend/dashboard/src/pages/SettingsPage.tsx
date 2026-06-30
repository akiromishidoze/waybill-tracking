import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsService, userService, teamService, escalationRuleService } from '@/services/api'
import { userSchema, validate, type FieldErrors } from '@/utils/validation'
import { UserPlus, Save, Plus, Trash2, Check, X, Shield, AlertTriangle } from 'lucide-react'
import ConfirmModal from '@/components/ConfirmModal'

export default function SettingsPage() {
  const queryClient = useQueryClient()

  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: () => settingsService.get().then(r => r.data) })
  const { data: teams } = useQuery({ queryKey: ['teams'], queryFn: () => teamService.list().then(r => r.data) })

  const [createUserForm, setCreateUserForm] = useState({ email: '', name: '', password: '', role: 'SHIPPER', company: '' })
  const [createUserMsg, setCreateUserMsg] = useState('')
  const [createUserErrors, setCreateUserErrors] = useState<FieldErrors>({})

  const [settingsForm, setSettingsForm] = useState<any>(null)
  const [savedMsg, setSavedMsg] = useState('')

  const [teamForm, setTeamForm] = useState({ name: '', description: '', color: '#2563eb' })
  const [showTeamForm, setShowTeamForm] = useState(false)
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null)

  const [ruleForm, setRuleForm] = useState({ name: '', condition: 'SLA_BREACHED', threshold: 0, targetRole: 'OPS', isActive: true })
  const [showRuleForm, setShowRuleForm] = useState(false)
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null)
  const [deleteTeamTarget, setDeleteTeamTarget] = useState<{ id: string; name: string } | null>(null)
  const [deleteRuleTarget, setDeleteRuleTarget] = useState<{ id: string; name: string } | null>(null)

  const createUser = useMutation({
    mutationFn: () => userService.create(createUserForm as any),
    onSuccess: (r) => { setCreateUserMsg(`User ${r.data.name} created successfully`); setCreateUserForm({ email: '', name: '', password: '', role: 'SHIPPER', company: '' }); setCreateUserErrors({}); queryClient.invalidateQueries({ queryKey: ['users'] }) },
    onError: (e: any) => setCreateUserMsg(e.response?.data?.error || 'Failed to create user'),
  })

  const handleCreateUser = () => {
    setCreateUserMsg('')
    const { errors } = validate(userSchema, createUserForm)
    setCreateUserErrors(errors)
    if (Object.keys(errors).length > 0) return
    createUser.mutate()
  }

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

  const { data: rules } = useQuery({ queryKey: ['escalation-rules'], queryFn: () => escalationRuleService.list().then(r => r.data) })
  const createRule = useMutation({
    mutationFn: () => escalationRuleService.create(ruleForm as any),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['escalation-rules'] }); setShowRuleForm(false); setRuleForm({ name: '', condition: 'SLA_BREACHED', threshold: 0, targetRole: 'OPS', isActive: true }) },
  })
  const updateRule = useMutation({
    mutationFn: () => escalationRuleService.update(editingRuleId!, ruleForm as any),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['escalation-rules'] }); setEditingRuleId(null); setShowRuleForm(false); setRuleForm({ name: '', condition: 'SLA_BREACHED', threshold: 0, targetRole: 'OPS', isActive: true }) },
  })
  const deleteRule = useMutation({
    mutationFn: (id: string) => escalationRuleService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['escalation-rules'] }),
  })

  const CONDITION_LABELS: Record<string, string> = { SLA_BREACHED: 'SLA Breached', EXCEPTION_AGE: 'Exception Age (hours)', STATUS_STUCK: 'Stuck in Status (hours)' }

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Settings</h2>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {/* User Credentials */}
        <section style={{ background: 'var(--color-surface)', borderRadius: 10, padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <UserPlus size={20} color="#7c3aed" />
            <h3 style={{ fontWeight: 600, fontSize: '1.125rem' }}>User Credentials</h3>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>Create new user accounts with login credentials and role assignment.</p>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Email *</label>
              <input type="text" value={createUserForm.email} onChange={e => setCreateUserForm({ ...createUserForm, email: e.target.value })} placeholder="e.g. juan@company.com" style={{ padding: '0.5rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.875rem', width: 200 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Name *</label>
              <input type="text" value={createUserForm.name} onChange={e => setCreateUserForm({ ...createUserForm, name: e.target.value })} placeholder="e.g. Juan Dela Cruz" style={{ padding: '0.5rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.875rem', width: 200 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Password *</label>
              <input
                type="text"
                value={createUserForm.password}
                onChange={e => { setCreateUserForm({ ...createUserForm, password: e.target.value }); setCreateUserErrors(p => ({ ...p, password: undefined })) }}
                placeholder="e.g. SecurePass123"
                style={{ padding: '0.5rem', border: `1px solid ${createUserErrors.password ? 'var(--color-danger)' : 'var(--color-border-input)'}`, borderRadius: 6, fontSize: '0.875rem', width: 180 }}
              />
              {createUserErrors.password && <p style={{ margin: '0.25rem 0 0', fontSize: '0.7rem', color: 'var(--color-danger)' }}>{createUserErrors.password}</p>}
              {!createUserErrors.password && <p style={{ margin: '0.25rem 0 0', fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>8+ chars, uppercase, lowercase, digit</p>}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Role</label>
              <select value={createUserForm.role} onChange={e => setCreateUserForm({ ...createUserForm, role: e.target.value })} style={{ padding: '0.5rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.875rem', width: 140 }}>
                <option value="SHIPPER">Shipper</option>
                <option value="COURIER">Courier</option>
                <option value="OPS">Operations</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Company</label>
              <input type="text" value={createUserForm.company} onChange={e => setCreateUserForm({ ...createUserForm, company: e.target.value })} placeholder="Optional" style={{ padding: '0.5rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.875rem', width: 160 }} />
            </div>
            <button onClick={handleCreateUser} disabled={!createUserForm.email || !createUserForm.name || !createUserForm.password || createUser.isPending} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}>
              <UserPlus size={14} /> Create User
            </button>
          </div>
          {createUserMsg && <p style={{ fontSize: '0.8125rem', color: createUserMsg.includes('successfully') ? 'var(--badge-green-text)' : 'var(--badge-red-text)', marginTop: '0.5rem' }}>{createUserMsg}</p>}
        </section>

        {/* General Settings */}
        <section style={{ background: 'var(--color-surface)', borderRadius: 10, padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Save size={20} color="#2563eb" />
            <h3 style={{ fontWeight: 600, fontSize: '1.125rem' }}>General Settings</h3>
          </div>
          {settings && !settingsForm && (
            <button onClick={() => setSettingsForm({ ...settings })} style={{ padding: '0.5rem 1rem', background: 'var(--color-bg)', border: '1px solid var(--color-border-input)', borderRadius: 6, cursor: 'pointer', fontSize: '0.875rem' }}>
              Edit Settings
            </button>
          )}
          {settings && !settingsForm && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem', fontSize: '0.875rem' }}>
              <div><span style={{ color: 'var(--color-text-muted)' }}>Company:</span> <strong>{settings.companyName}</strong></div>
              <div><span style={{ color: 'var(--color-text-muted)' }}>Timezone:</span> <strong>{settings.timezone}</strong></div>
              <div><span style={{ color: 'var(--color-text-muted)' }}>Session Timeout:</span> <strong>{settings.sessionTimeout} min</strong></div>
              <div><span style={{ color: 'var(--color-text-muted)' }}>Email Notifications:</span> <strong>{settings.emailNotifications ? 'On' : 'Off'}</strong></div>
              <div><span style={{ color: 'var(--color-text-muted)' }}>Default Service:</span> <strong>{settings.defaultServiceType}</strong></div>
            </div>
          )}
          {settingsForm && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Company Name</label><input value={settingsForm.companyName} onChange={e => setSettingsForm({ ...settingsForm, companyName: e.target.value })} style={{ padding: '0.5rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.875rem', width: 220 }} /></div>
                <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Timezone</label>
                  <select value={settingsForm.timezone} onChange={e => setSettingsForm({ ...settingsForm, timezone: e.target.value })} style={{ padding: '0.5rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.875rem', width: 200 }}>
                    <option value="Asia/Manila">Asia/Manila</option>
                    <option value="Asia/Singapore">Asia/Singapore</option>
                    <option value="Asia/Tokyo">Asia/Tokyo</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
                <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Session Timeout (min)</label><input type="number" value={settingsForm.sessionTimeout} onChange={e => setSettingsForm({ ...settingsForm, sessionTimeout: +e.target.value })} style={{ padding: '0.5rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.875rem', width: 100 }} /></div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Default Service Type</label>
                  <select value={settingsForm.defaultServiceType} onChange={e => setSettingsForm({ ...settingsForm, defaultServiceType: e.target.value })} style={{ padding: '0.5rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.875rem', width: 160 }}>
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
                <button onClick={() => setSettingsForm(null)} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--color-border-input)', borderRadius: 6, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
              {savedMsg && <p style={{ fontSize: '0.8125rem', color: 'var(--badge-green-text)' }}>{savedMsg}</p>}
            </div>
          )}
        </section>

        {/* Teams / Branches */}
        <section style={{ background: 'var(--color-surface)', borderRadius: 10, padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
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
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '1rem', padding: '1rem', background: 'var(--badge-warm-bg)', borderRadius: 8, border: '1px solid var(--badge-amber-border)' }}>
              <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Name *</label><input value={teamForm.name} onChange={e => setTeamForm({ ...teamForm, name: e.target.value })} style={{ padding: '0.5rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.875rem', width: 180 }} /></div>
              <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Description</label><input value={teamForm.description} onChange={e => setTeamForm({ ...teamForm, description: e.target.value })} style={{ padding: '0.5rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.875rem', width: 200 }} /></div>
              <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Color</label><input type="color" value={teamForm.color} onChange={e => setTeamForm({ ...teamForm, color: e.target.value })} style={{ padding: '0.25rem', border: '1px solid var(--color-border-input)', borderRadius: 6, width: 60, height: 36 }} /></div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => editingTeamId ? updateTeam.mutate() : createTeam.mutate()} disabled={!teamForm.name || createTeam.isPending || updateTeam.isPending} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.875rem' }}>
                  <Check size={14} /> {editingTeamId ? 'Update' : 'Create'}
                </button>
                <button onClick={() => { setShowTeamForm(false); setEditingTeamId(null) }} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem', background: 'transparent', color: 'var(--color-text-muted)', border: '1px solid var(--color-border-input)', borderRadius: 6, cursor: 'pointer', fontSize: '0.875rem' }}>
                  <X size={14} /> Cancel
                </button>
              </div>
            </div>
          )}
          {(!teams || teams.length === 0) ? (
            <p style={{ color: 'var(--color-text-muted-lighter)', fontSize: '0.875rem' }}>No teams created yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {(teams || []).map((t: any) => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'var(--color-surface-hover)', borderRadius: 8 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: t.color }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{t.name}</span>
                    {t.description && <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', marginLeft: '0.5rem' }}>— {t.description}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '0.375rem' }}>
                    <button onClick={() => { setEditingTeamId(t.id); setTeamForm({ name: t.name, description: t.description, color: t.color }); setShowTeamForm(true) }} style={{ padding: '0.25rem 0.5rem', background: 'transparent', border: '1px solid var(--color-border-input)', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem' }}>Edit</button>
                    <button onClick={() => setDeleteTeamTarget({ id: t.id, name: t.name })} style={{ padding: '0.25rem 0.5rem', background: 'transparent', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Escalation Rules */}
        <section style={{ background: 'var(--color-surface)', borderRadius: 10, padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={20} color="#dc2626" />
              <h3 style={{ fontWeight: 600, fontSize: '1.125rem' }}>Escalation Rules</h3>
            </div>
            <button onClick={() => { setShowRuleForm(true); setEditingRuleId(null); setRuleForm({ name: '', condition: 'SLA_BREACHED', threshold: 0, targetRole: 'OPS', isActive: true }) }} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}>
              <Plus size={14} /> Add Rule
            </button>
          </div>
          {showRuleForm && (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '1rem', padding: '1rem', background: 'var(--badge-red-bg)', borderRadius: 8, border: '1px solid var(--badge-red-border)' }}>
              <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Name *</label><input value={ruleForm.name} onChange={e => setRuleForm({ ...ruleForm, name: e.target.value })} style={{ padding: '0.5rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.875rem', width: 180 }} /></div>
              <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Condition</label>
                <select value={ruleForm.condition} onChange={e => setRuleForm({ ...ruleForm, condition: e.target.value })} style={{ padding: '0.5rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.875rem', width: 180 }}>
                  <option value="SLA_BREACHED">SLA Breached</option>
                  <option value="EXCEPTION_AGE">Exception Age (hours)</option>
                  <option value="STATUS_STUCK">Stuck in Status (hours)</option>
                </select>
              </div>
              <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Threshold</label><input type="number" value={ruleForm.threshold} onChange={e => setRuleForm({ ...ruleForm, threshold: +e.target.value })} style={{ padding: '0.5rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.875rem', width: 80 }} /></div>
              <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Target Role</label>
                <select value={ruleForm.targetRole} onChange={e => setRuleForm({ ...ruleForm, targetRole: e.target.value })} style={{ padding: '0.5rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.875rem', width: 120 }}>
                  <option value="OPS">Operations</option>
                  <option value="ADMIN">Admin</option>
                  <option value="COURIER">Courier</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingBottom: '0.25rem' }}>
                <input type="checkbox" id="ruleActive" checked={ruleForm.isActive} onChange={e => setRuleForm({ ...ruleForm, isActive: e.target.checked })} />
                <label htmlFor="ruleActive" style={{ fontSize: '0.875rem' }}>Active</label>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => editingRuleId ? updateRule.mutate() : createRule.mutate()} disabled={!ruleForm.name || createRule.isPending || updateRule.isPending} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.875rem' }}>
                  <Check size={14} /> {editingRuleId ? 'Update' : 'Create'}
                </button>
                <button onClick={() => { setShowRuleForm(false); setEditingRuleId(null) }} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem', background: 'transparent', color: 'var(--color-text-muted)', border: '1px solid var(--color-border-input)', borderRadius: 6, cursor: 'pointer', fontSize: '0.875rem' }}>
                  <X size={14} /> Cancel
                </button>
              </div>
            </div>
          )}
          {(!rules || rules.length === 0) ? (
            <p style={{ color: 'var(--color-text-muted-lighter)', fontSize: '0.875rem' }}>No escalation rules configured.</p>
          ) : (
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {(rules || []).map((r: any) => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'var(--color-surface-hover)', borderRadius: 8 }}>
                  <AlertTriangle size={14} color={r.isActive ? 'var(--badge-red-text)' : 'var(--color-text-muted-lighter)'} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{r.name}</span>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', marginLeft: '0.5rem' }}>— {CONDITION_LABELS[r.condition] || r.condition} ({r.threshold}) → {r.targetRole}</span>
                    {!r.isActive && <span style={{ color: 'var(--color-text-muted-lighter)', fontSize: '0.75rem', marginLeft: '0.5rem' }}>(disabled)</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '0.375rem' }}>
                    <button onClick={() => { setEditingRuleId(r.id); setRuleForm({ name: r.name, condition: r.condition, threshold: r.threshold, targetRole: r.targetRole, isActive: r.isActive }); setShowRuleForm(true) }} style={{ padding: '0.25rem 0.5rem', background: 'transparent', border: '1px solid var(--color-border-input)', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem' }}>Edit</button>
                    <button onClick={() => setDeleteRuleTarget({ id: r.id, name: r.name })} style={{ padding: '0.25rem 0.5rem', background: 'transparent', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      <ConfirmModal
        open={deleteTeamTarget !== null}
        title="Delete Team"
        message={`Are you sure you want to delete team "${deleteTeamTarget?.name}"? This action cannot be undone.`}
        onConfirm={() => { if (deleteTeamTarget) deleteTeam.mutate(deleteTeamTarget.id); setDeleteTeamTarget(null) }}
        onCancel={() => setDeleteTeamTarget(null)}
      />
      <ConfirmModal
        open={deleteRuleTarget !== null}
        title="Delete Rule"
        message={`Are you sure you want to delete rule "${deleteRuleTarget?.name}"? This action cannot be undone.`}
        onConfirm={() => { if (deleteRuleTarget) deleteRule.mutate(deleteRuleTarget.id); setDeleteRuleTarget(null) }}
        onCancel={() => setDeleteRuleTarget(null)}
      />
    </div>
  )
}

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { whiteLabelService } from '@/services/api'
import type { WhiteLabelPortalData } from '@/types/waybill'
import {
  Globe, Users, Eye, Star, ShoppingBag, ExternalLink, Mail, Phone,
  CheckCircle, XCircle, Palette, Edit3, Save, X,
} from 'lucide-react'
import BackButton from '@/components/BackButton'

function ago(iso: string | null) {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const hrs = Math.floor(diff / 3600000)
  if (hrs < 1) return `${Math.floor(diff / 60000)}m ago`
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const STATUS_COLORS: Record<string, string> = {
  DELIVERED: 'var(--status-green)',
  IN_TRANSIT: 'var(--status-blue)',
  OUT_FOR_DELIVERY: 'var(--status-amber)',
  PICKED_UP: 'var(--status-purple)',
}

export default function WhiteLabelPortalPage() {
  const queryClient = useQueryClient()
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState<Partial<WhiteLabelPortalData['config']>>({})
  const [formError, setFormError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['white-label'],
    queryFn: () => whiteLabelService.getPortal().then(r => r.data),
  })

  const updateConfig = useMutation({
    mutationFn: (data: Partial<WhiteLabelPortalData['config']>) => whiteLabelService.updateConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['white-label'] })
      setEditMode(false)
      setFormError('')
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.error || 'Failed to update portal configuration.')
    },
  })

  const startEdit = () => {
    if (data) {
      setForm({ ...data.config })
      setEditMode(true)
      setFormError('')
    }
  }

  const cancelEdit = () => {
    setEditMode(false)
    setForm({})
    setFormError('')
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!form.brandName || !form.primaryColor || !form.supportEmail || !form.portalUrl) {
      setFormError('Brand name, primary color, support email, and portal URL are required.')
      return
    }
    updateConfig.mutate(form)
  }

  if (isLoading) {
    return (
      <div style={{ padding: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>White-Label Portal</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ height: 120, borderRadius: 10, background: 'var(--color-surface)', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      </div>
    )
  }

  if (!data) return null

  const { config, stats, recentTracking } = data

  return (
    <div style={{ padding: '2rem', maxWidth: 1400 }}>
      <BackButton fallback="/dashboard" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Customer-Facing White-Label Portal</h1>
        {!editMode && (
          <button
            onClick={startEdit}
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.625rem 1.25rem', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem' }}
          >
            <Edit3 size={16} /> Edit Configuration
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { icon: Eye, label: 'Active Sessions', value: stats.activeSessions.toLocaleString(), color: 'var(--status-blue)' },
          { icon: ShoppingBag, label: "Today's Queries", value: stats.trackingQueriesToday.toLocaleString(), color: 'var(--status-green)' },
          { icon: Users, label: 'Registered Customers', value: stats.totalRegisteredCustomers.toLocaleString(), color: 'var(--status-purple)' },
          { icon: Star, label: 'Avg Satisfaction', value: stats.averageSatisfaction.toFixed(1) + ' / 5', color: 'var(--status-amber)' },
        ].map((card, i) => (
          <div key={i} style={{ background: 'var(--color-surface)', borderRadius: 10, padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: card.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <card.icon size={20} color={card.color} />
              </div>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{card.label}</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{card.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Portal Configuration */}
        <div style={{ background: 'var(--color-surface)', borderRadius: 10, padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontWeight: 600, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Globe size={18} color="var(--color-primary)" /> Portal Configuration
            </h3>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.625rem', borderRadius: 6, fontSize: '0.6875rem', fontWeight: 600,
              background: config.enabled ? 'var(--status-green)20' : 'var(--color-bg)',
              color: config.enabled ? 'var(--status-green)' : 'var(--color-text-muted)',
            }}>
              {config.enabled ? <><CheckCircle size={12} /> Active</> : <><XCircle size={12} /> Disabled</>}
            </span>
          </div>
          {editMode ? (
            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Brand Name</label>
                  <input type="text" value={form.brandName || ''} onChange={(e) => setForm((prev) => ({ ...prev, brandName: e.target.value }))} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: '0.8125rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Primary Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="color" value={form.primaryColor || '#2563eb'} onChange={(e) => setForm((prev) => ({ ...prev, primaryColor: e.target.value }))} style={{ width: 36, height: 32, border: '1px solid var(--color-border)', borderRadius: 6, cursor: 'pointer' }} />
                    <input type="text" value={form.primaryColor || ''} onChange={(e) => setForm((prev) => ({ ...prev, primaryColor: e.target.value }))} style={{ flex: 1, padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: '0.8125rem' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Support Email</label>
                  <input type="email" value={form.supportEmail || ''} onChange={(e) => setForm((prev) => ({ ...prev, supportEmail: e.target.value }))} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: '0.8125rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Support Phone</label>
                  <input type="text" value={form.supportPhone || ''} onChange={(e) => setForm((prev) => ({ ...prev, supportPhone: e.target.value }))} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: '0.8125rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Portal URL</label>
                  <input type="text" value={form.portalUrl || ''} onChange={(e) => setForm((prev) => ({ ...prev, portalUrl: e.target.value }))} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: '0.8125rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Custom Domain</label>
                  <input type="text" value={form.customDomain || ''} onChange={(e) => setForm((prev) => ({ ...prev, customDomain: e.target.value }))} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: '0.8125rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Logo URL</label>
                  <input type="text" value={form.logoUrl || ''} onChange={(e) => setForm((prev) => ({ ...prev, logoUrl: e.target.value }))} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: '0.8125rem' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!form.enabled} onChange={(e) => setForm((prev) => ({ ...prev, enabled: e.target.checked }))} />
                    Enable portal
                  </label>
                </div>
              </div>
              {formError && <p style={{ color: 'var(--badge-red-text)', fontSize: '0.8125rem', marginBottom: '0.75rem' }}>{formError}</p>}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={cancelEdit} style={{ padding: '0.5rem 1rem', border: '1px solid var(--color-border)', borderRadius: 6, background: 'var(--color-surface)', cursor: 'pointer', fontSize: '0.8125rem' }}>
                  <X size={14} /> Cancel
                </button>
                <button type="submit" disabled={updateConfig.isPending} style={{ padding: '0.5rem 1rem', border: 'none', borderRadius: 6, background: 'var(--color-primary)', color: '#fff', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 500 }}>
                  <Save size={14} /> {updateConfig.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Brand Name</span>
                  <span style={{ fontWeight: 600 }}>{config.brandName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Custom Domain</span>
                  <span style={{ fontWeight: 600 }}>{config.customDomain || '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-border)', alignItems: 'center' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Primary Color</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                    <Palette size={14} color={config.primaryColor} /> {config.primaryColor}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Support Email</span>
                  <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.375rem' }}><Mail size={14} color="var(--color-text-muted)" /> {config.supportEmail}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Support Phone</span>
                  <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.375rem' }}><Phone size={14} color="var(--color-text-muted)" /> {config.supportPhone}</span>
                </div>
              </div>
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--color-bg)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Portal URL</span>
                <a href={config.portalUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8125rem', color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  {config.portalUrl} <ExternalLink size={12} />
                </a>
              </div>
            </>
          )}
        </div>

        {/* Recent Activity */}
        <div style={{ background: 'var(--color-surface)', borderRadius: 10, padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Eye size={18} color="var(--color-primary)" /> Recent Tracking Activity
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {recentTracking.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0.75rem', background: 'var(--color-bg)', borderRadius: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{t.trackingNumber}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{t.customerName} &middot; {t.carrier}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    display: 'inline-block', padding: '0.125rem 0.5rem', borderRadius: 4, fontSize: '0.6875rem', fontWeight: 600,
                    background: (STATUS_COLORS[t.status] || 'var(--status-gray)') + '20',
                    color: STATUS_COLORS[t.status] || 'var(--status-gray)',
                  }}>{t.status.replace(/_/g, ' ')}</span>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>{ago(t.timestamp)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
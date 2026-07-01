import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Trash2, Shield } from 'lucide-react'
import { waybillService, teamService, analyticsService } from '@/services/api'
import ConfirmModal from '@/components/ConfirmModal'
import type { Waybill } from '@/types/waybill'
import { SkeletonBlock, SkeletonLine } from '@/components/Skeleton'
import BackButton from '@/components/BackButton'
import ScanTimeline from '@/components/waybill-detail/ScanTimeline'
import AttachmentsTab from '@/components/waybill-detail/AttachmentsTab'
import ReturnTab from '@/components/waybill-detail/ReturnTab'
import TrackingTab from '@/components/waybill-detail/TrackingTab'

type TabKey = 'scans' | 'attachments' | 'returns' | 'tracking'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'scans', label: 'Scan Events' },
  { key: 'attachments', label: 'Attachments' },
  { key: 'returns', label: 'Returns' },
  { key: 'tracking', label: 'Tracking' },
]

export default function WaybillDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabKey>('scans')
  const [deleteWaybillId, setDeleteWaybillId] = useState<string | null>(null)
  const deleteWaybill = useMutation({
    mutationFn: (wid: string) => waybillService.delete(wid),
    onSuccess: () => navigate('/waybills'),
  })

  const { data: wb, isLoading } = useQuery({
    queryKey: ['waybill', id],
    queryFn: () => waybillService.get(id!).then((r) => r.data),
    enabled: !!id,
  })

  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Waybill>>({})
  const [editError, setEditError] = useState('')

  const updateWaybill = useMutation({
    mutationFn: () => waybillService.update(id!, editForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waybill', id] })
      setIsEditing(false)
      setEditError('')
    },
    onError: (err: any) => {
      setEditError(err?.response?.data?.error || 'Failed to update waybill. Please try again.')
    },
  })

  const startEditing = () => {
    if (!wb) return
    setEditForm({
      serviceType: wb.serviceType,
      weight: wb.weight,
      dimensions: wb.dimensions,
      origin: wb.origin,
      destination: wb.destination,
      estimatedDelivery: wb.estimatedDelivery,
      recipientName: wb.recipientName,
      recipientPhone: wb.recipientPhone,
      recipientAddress: wb.recipientAddress,
      carrierName: wb.carrierName,
      carrierTrackingNumber: wb.carrierTrackingNumber,
    })
    setIsEditing(true)
    setEditError('')
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setEditForm({})
    setEditError('')
  }

  const handleFieldChange = (field: keyof Waybill, value: string | number) => {
    setEditForm((prev) => ({ ...prev, [field]: value }))
  }

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamService.list().then((r) => r.data),
  })

  const { data: eta } = useQuery({
    queryKey: ['predict-eta', id],
    queryFn: () => analyticsService.predictEta(id!).then(r => r.data),
    enabled: !!id,
    refetchInterval: 60000,
  })

  if (isLoading) return <div style={{ display: 'grid', gap: '1rem', padding: '1rem' }}><SkeletonBlock height={60} /><SkeletonLine width="60%" /><SkeletonLine width="80%" /><SkeletonLine width="40%" /><SkeletonBlock height={200} /></div>
  if (!wb) return <p>Waybill not found</p>

  return (
    <div>
      {wb.slaBreached && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: 'var(--badge-red-bg)', border: '1px solid var(--badge-red-border)', borderRadius: 8, marginBottom: '1rem', color: 'var(--badge-red-text)', fontSize: '0.875rem', fontWeight: 500 }}>
          <AlertTriangle size={18} />
          SLA Breached — Estimated delivery was {new Date(wb.estimatedDelivery).toLocaleDateString()}
        </div>
      )}
      <BackButton fallback="/waybills" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
          Waybill #{wb.trackingNumber}
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {isEditing ? (
            <>
              <button
                onClick={() => updateWaybill.mutate()}
                disabled={updateWaybill.isPending}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.5rem 1rem', background: '#2563eb',
                  border: 'none', borderRadius: 6,
                  fontSize: '0.8125rem', cursor: 'pointer', color: '#fff',
                }}
              >
                {updateWaybill.isPending ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={cancelEditing}
                disabled={updateWaybill.isPending}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.5rem 1rem', background: 'var(--color-surface)',
                  border: '1px solid var(--color-border-input)', borderRadius: 6,
                  fontSize: '0.8125rem', cursor: 'pointer', color: 'var(--color-text-muted)',
                }}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={startEditing}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.5rem 1rem', background: 'var(--color-surface)',
                border: '1px solid var(--color-border-input)', borderRadius: 6,
                fontSize: '0.8125rem', cursor: 'pointer', color: 'var(--color-text)',
              }}
            >
              Edit Waybill
            </button>
          )}
          <button
            onClick={() => setDeleteWaybillId(id!)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.375rem',
              padding: '0.5rem 1rem', background: 'var(--color-surface)',
              border: '1px solid var(--badge-red-border)', borderRadius: 6,
              fontSize: '0.8125rem', cursor: 'pointer', color: 'var(--badge-red-text)',
            }}
          >
            <Trash2 size={16} /> Delete Waybill
          </button>
        </div>
      </div>

      {editError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: 'var(--badge-red-bg)', border: '1px solid var(--badge-red-border)', borderRadius: 8, marginBottom: '1rem', color: 'var(--badge-red-text)', fontSize: '0.875rem', fontWeight: 500 }}>
          <AlertTriangle size={18} />
          {editError}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 10 }}>
          <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Shipment Info</h3>
          <DetailRow label="Status" value={wb.status} />
          {isEditing ? (
            <>
              <FormField label="Service Type" value={editForm.serviceType || ''} onChange={(v) => handleFieldChange('serviceType', v)} />
              <FormField label="Weight (kg)" type="number" value={String(editForm.weight ?? '')} onChange={(v) => handleFieldChange('weight', parseFloat(v) || 0)} />
              <FormField label="Dimensions" value={editForm.dimensions || ''} onChange={(v) => handleFieldChange('dimensions', v)} placeholder="e.g. 10x10x10 cm" />
              <FormField label="Origin" value={editForm.origin || ''} onChange={(v) => handleFieldChange('origin', v)} />
              <FormField label="Destination" value={editForm.destination || ''} onChange={(v) => handleFieldChange('destination', v)} />
              <FormField label="Est. Delivery" type="date" value={editForm.estimatedDelivery ? editForm.estimatedDelivery.split('T')[0] : ''} onChange={(v) => handleFieldChange('estimatedDelivery', v ? new Date(v).toISOString() : '')} />
            </>
          ) : (
            <>
              <DetailRow label="Service Type" value={wb.serviceType} />
              <DetailRow label="Weight" value={`${wb.weight} kg`} />
              <DetailRow label="Dimensions" value={wb.dimensions} />
              <DetailRow label="Origin" value={wb.origin} />
              <DetailRow label="Destination" value={wb.destination} />
              <DetailRow label="Est. Delivery" value={wb.estimatedDelivery ? new Date(wb.estimatedDelivery).toLocaleDateString() : '—'} />
            </>
          )}
          <DetailRow label="SLA Status" value={wb.slaBreached ? 'Breached' : 'On Time'} />
          {eta && (
            <>
              <DetailRow label="Predictive ETA" value={eta.predictedDelivery ? new Date(eta.predictedDelivery).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'} />
              <DetailRow label="Confidence" value={`${eta.confidence}%`} />
              {eta.estimatedHours !== null && <DetailRow label="Est. Transit" value={`${eta.estimatedHours} hrs`} />}
              <DetailRow label="Based On" value={eta.basedOn} />
            </>
          )}
          {isEditing ? (
            <>
              <FormField label="Carrier" value={editForm.carrierName || ''} onChange={(v) => handleFieldChange('carrierName', v)} placeholder="e.g. FedEx" />
              <FormField label="Carrier Tracking" value={editForm.carrierTrackingNumber || ''} onChange={(v) => handleFieldChange('carrierTrackingNumber', v)} />
            </>
          ) : (
            wb.carrierName && (
              <>
                <DetailRow label="Carrier" value={wb.carrierName} />
                <DetailRow label="Carrier Tracking" value={wb.carrierTrackingNumber || '—'} />
              </>
            )
          )}
        </div>

        <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 10 }}>
          <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Recipient</h3>
          {isEditing ? (
            <>
              <FormField label="Name" value={editForm.recipientName || ''} onChange={(v) => handleFieldChange('recipientName', v)} />
              <FormField label="Phone" value={editForm.recipientPhone || ''} onChange={(v) => handleFieldChange('recipientPhone', v)} />
              <FormField label="Address" value={editForm.recipientAddress || ''} onChange={(v) => handleFieldChange('recipientAddress', v)} placeholder="Full delivery address" />
            </>
          ) : (
            <>
              <DetailRow label="Name" value={wb.recipientName} />
              <DetailRow label="Phone" value={wb.recipientPhone} />
              <DetailRow label="Address" value={wb.recipientAddress} />
            </>
          )}
          <TeamAssignment
            waybillId={id!}
            teamId={wb.teamId}
            teamName={wb.teamName}
            teams={teams || []}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '2px solid var(--color-border-subtle)', marginBottom: '1.5rem' }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '0.625rem 1.25rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid #2563eb' : '2px solid transparent',
              marginBottom: '-2px',
              fontSize: '0.875rem',
              fontWeight: activeTab === tab.key ? 600 : 400,
              color: activeTab === tab.key ? '#2563eb' : 'var(--color-text-muted)',
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'scans' && <ScanTimeline waybillId={id!} />}
      {activeTab === 'attachments' && <AttachmentsTab waybillId={id!} />}
      {activeTab === 'returns' && <ReturnTab waybillId={id!} />}
      {activeTab === 'tracking' && <TrackingTab waybillId={id!} />}

      <ConfirmModal
        open={deleteWaybillId !== null}
        title="Delete Waybill"
        message="Are you sure you want to delete this waybill? All associated data will be permanently removed. This action cannot be undone."
        confirmLabel="Delete Waybill"
        onConfirm={() => { if (deleteWaybillId) deleteWaybill.mutate(deleteWaybillId); setDeleteWaybillId(null) }}
        onCancel={() => setDeleteWaybillId(null)}
      />
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', marginBottom: '0.5rem' }}>
      <span style={{ width: 140, color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  )
}

function TeamAssignment({ waybillId, teamId, teamName, teams }: { waybillId: string; teamId?: string; teamName?: string; teams: any[] }) {
  const [selectedTeamId, setSelectedTeamId] = useState(teamId || '')
  const [assignError, setAssignError] = useState('')
  const queryClient = useQueryClient()

  useEffect(() => {
    setSelectedTeamId(teamId || '')
  }, [teamId])

  const assignTeam = useMutation({
    mutationFn: (teamIdValue: string | null) => teamService.assignToWaybill(waybillId, teamIdValue),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waybill', waybillId] })
      setAssignError('')
    },
    onError: (err: any) => {
      setAssignError(err?.response?.data?.error || 'Failed to assign team. Please try again.')
    },
  })

  const handleAssign = () => {
    assignTeam.mutate(selectedTeamId || null)
  }

  return (
    <div style={{ borderTop: '1px solid var(--color-border-subtle)', marginTop: '0.75rem', paddingTop: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <Shield size={16} color="#d97706" />
        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Team Assignment</span>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <select
          value={selectedTeamId}
          onChange={(e) => {
            setSelectedTeamId(e.target.value)
            setAssignError('')
          }}
          style={{ flex: 1, padding: '0.5rem', border: '1px solid var(--color-border-input)', borderRadius: 6, fontSize: '0.875rem', background: 'var(--color-surface)' }}
        >
          <option value="">Unassigned</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <button
          onClick={handleAssign}
          disabled={assignTeam.isPending || selectedTeamId === (teamId || '')}
          style={{
            padding: '0.5rem 1rem',
            background: selectedTeamId === (teamId || '') ? 'var(--color-border)' : '#2563eb',
            color: selectedTeamId === (teamId || '') ? 'var(--color-text-muted)' : '#fff',
            border: 'none',
            borderRadius: 6,
            fontSize: '0.8125rem',
            fontWeight: 500,
            cursor: selectedTeamId === (teamId || '') ? 'not-allowed' : 'pointer',
          }}
        >
          {assignTeam.isPending ? 'Assigning...' : 'Assign'}
        </button>
      </div>
      {assignError && (
        <p style={{ color: 'var(--badge-red-text)', fontSize: '0.75rem', marginTop: '0.375rem' }}>{assignError}</p>
      )}
      {teamName && !assignError && (
        <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: 'var(--badge-amber-text)' }}>
          <Shield size={12} />
          Currently assigned to <strong>{teamName}</strong>
        </div>
      )}
    </div>
  )
}

function FormField({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '0.75rem' }}>
      <label style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          padding: '0.5rem',
          border: '1px solid var(--color-border-input)',
          borderRadius: 6,
          fontSize: '0.875rem',
          background: 'var(--color-surface)',
          color: 'var(--color-text)',
        }}
      />
    </div>
  )
}

import { useState } from 'react'
import { waybillService } from '@/services/api'
import type { WaybillStatus } from '@/types/waybill'
import s from '@/styles/components.module.css'

const VALID_STATUSES: WaybillStatus[] = ['PICKED_UP', 'IN_TRANSIT', 'AT_SORTING_CENTER', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED_DELIVERY']

interface AddScanFormProps {
  waybillId: string
  onAdded: () => void
}

export default function AddScanForm({ waybillId, onAdded }: AddScanFormProps) {
  const [status, setStatus] = useState<WaybillStatus>('PICKED_UP')
  const [location, setLocation] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!location.trim()) {
      setError('Location is required')
      return
    }
    setSubmitting(true)
    try {
      await waybillService.updateStatus(waybillId, { status, location: location.trim() })
      setLocation('')
      onAdded()
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to add scan event')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', flexWrap: 'wrap' }}>
      <div>
        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, marginBottom: '0.25rem', color: 'var(--color-text-muted)' }}>Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as WaybillStatus)}
          className={s.formInput}
          style={{ fontSize: '0.875rem', padding: '0.375rem 0.5rem' }}
        >
          {VALID_STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, marginBottom: '0.25rem', color: 'var(--color-text-muted)' }}>Location</label>
        <input
          type="text"
          value={location}
          onChange={(e) => { setLocation(e.target.value); setError('') }}
          placeholder="e.g. Manila"
          className={s.formInput}
          style={{ fontSize: '0.875rem', padding: '0.375rem 0.5rem', width: 140 }}
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className={s.btnPrimary}
        style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}
      >
        {submitting ? 'Adding...' : 'Add Scan'}
      </button>
      {error && <span style={{ fontSize: '0.75rem', color: 'var(--badge-red-text)' }}>{error}</span>}
    </form>
  )
}

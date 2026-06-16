import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { waybillService } from '@/services/api'
import s from '@/styles/components.module.css'

interface FormData {
  recipientName: string
  recipientAddress: string
  recipientPhone: string
  origin: string
  destination: string
  weight: string
  dimensions: string
  serviceType: string
}

const initial: FormData = {
  recipientName: '',
  recipientAddress: '',
  recipientPhone: '',
  origin: '',
  destination: '',
  weight: '',
  dimensions: '',
  serviceType: 'STANDARD',
}

export default function WaybillNewPage() {
  const [form, setForm] = useState<FormData>(initial)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await waybillService.create({
        recipientName: form.recipientName,
        recipientAddress: form.recipientAddress,
        recipientPhone: form.recipientPhone,
        origin: form.origin,
        destination: form.destination,
        weight: parseFloat(form.weight),
        dimensions: form.dimensions,
        serviceType: form.serviceType,
      })
      navigate('/waybills')
    } catch {
      setError('Failed to create waybill. Please try again.')
    }
  }

  return (
    <div>
      <h2 className={s.pageTitle}>New Waybill</h2>

      <div style={{ maxWidth: 640 }}>
        <form onSubmit={handleSubmit} className={s.cardPadded}>
          {error && <p className={s.formError}>{error}</p>}

          <div className={s.grid2} style={{ marginBottom: '1.5rem' }}>
            <div className={s.formGroup}>
              <label className={s.formLabel}>Recipient Name</label>
              <input className={s.formInput} value={form.recipientName} onChange={set('recipientName')} required />
            </div>
            <div className={s.formGroup}>
              <label className={s.formLabel}>Recipient Phone</label>
              <input className={s.formInput} value={form.recipientPhone} onChange={set('recipientPhone')} required />
            </div>
          </div>

          <div className={s.formGroup}>
            <label className={s.formLabel}>Recipient Address</label>
            <input className={s.formInput} value={form.recipientAddress} onChange={set('recipientAddress')} required />
          </div>

          <div className={s.grid2} style={{ marginBottom: '1.5rem' }}>
            <div className={s.formGroup}>
              <label className={s.formLabel}>Origin</label>
              <input className={s.formInput} value={form.origin} onChange={set('origin')} required />
            </div>
            <div className={s.formGroup}>
              <label className={s.formLabel}>Destination</label>
              <input className={s.formInput} value={form.destination} onChange={set('destination')} required />
            </div>
          </div>

          <div className={s.grid2} style={{ marginBottom: '1.5rem' }}>
            <div className={s.formGroup}>
              <label className={s.formLabel}>Weight (kg)</label>
              <input className={s.formInput} type="number" step="0.01" min="0" value={form.weight} onChange={set('weight')} required />
            </div>
            <div className={s.formGroup}>
              <label className={s.formLabel}>Dimensions</label>
              <input className={s.formInput} placeholder="e.g. 30x20x15 cm" value={form.dimensions} onChange={set('dimensions')} />
            </div>
          </div>

          <div className={s.formGroup} style={{ marginBottom: '1.5rem' }}>
            <label className={s.formLabel}>Service Type</label>
            <select className={s.formInput} value={form.serviceType} onChange={set('serviceType')}>
              <option value="STANDARD">Standard</option>
              <option value="EXPRESS">Express</option>
              <option value="OVERNIGHT">Overnight</option>
              <option value="FREIGHT">Freight</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="submit" className={s.btnPrimary} style={{ padding: '0.625rem 1.5rem' }}>
              Create Waybill
            </button>
            <button type="button" className={s.btnOutline} onClick={() => navigate('/waybills')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

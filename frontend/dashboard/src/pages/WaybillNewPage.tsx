import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { waybillService } from '@/services/api'
import { waybillSchema, validate, type FieldErrors } from '@/utils/validation'
import FormField from '@/components/FormField'
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
  const [errors, setErrors] = useState<FieldErrors>({})
  const [serverError, setServerError] = useState('')
  const navigate = useNavigate()

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    setErrors(p => ({ ...p, [field]: undefined }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError('')
    const { errors: fieldErrors } = validate(waybillSchema, form)
    setErrors(fieldErrors)
    if (Object.keys(fieldErrors).length > 0) return

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
      setServerError('Failed to create waybill. Please try again.')
    }
  }

  return (
    <div>
      <h2 className={s.pageTitle}>New Waybill</h2>

      <div style={{ maxWidth: 640 }}>
        <form onSubmit={handleSubmit} className={s.cardPadded}>
          {serverError && <p className={s.formError}>{serverError}</p>}

          <div className={s.grid2} style={{ marginBottom: '1.5rem' }}>
            <FormField label="Recipient Name" error={errors.recipientName} required>
              <input className={s.formInput} value={form.recipientName} onChange={set('recipientName')} />
            </FormField>
            <FormField label="Recipient Phone" error={errors.recipientPhone} required>
              <input className={s.formInput} value={form.recipientPhone} onChange={set('recipientPhone')} />
            </FormField>
          </div>

          <FormField label="Recipient Address" error={errors.recipientAddress} required>
            <input className={s.formInput} value={form.recipientAddress} onChange={set('recipientAddress')} />
          </FormField>

          <div className={s.grid2} style={{ marginBottom: '1.5rem' }}>
            <FormField label="Origin" error={errors.origin} required>
              <input className={s.formInput} value={form.origin} onChange={set('origin')} />
            </FormField>
            <FormField label="Destination" error={errors.destination} required>
              <input className={s.formInput} value={form.destination} onChange={set('destination')} />
            </FormField>
          </div>

          <div className={s.grid2} style={{ marginBottom: '1.5rem' }}>
            <FormField label="Weight (kg)" error={errors.weight} required>
              <input className={s.formInput} type="number" step="0.01" value={form.weight} onChange={set('weight')} />
            </FormField>
            <FormField label="Dimensions">
              <input className={s.formInput} placeholder="e.g. 30x20x15 cm" value={form.dimensions} onChange={set('dimensions')} />
            </FormField>
          </div>

          <FormField label="Service Type">
            <select className={s.formInput} value={form.serviceType} onChange={set('serviceType')}>
              <option value="STANDARD">Standard</option>
              <option value="EXPRESS">Express</option>
              <option value="OVERNIGHT">Overnight</option>
              <option value="FREIGHT">Freight</option>
            </select>
          </FormField>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
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
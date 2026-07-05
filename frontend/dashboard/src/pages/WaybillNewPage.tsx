import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { waybillService, carrierRateService } from '@/services/api'
import type { RateQuote } from '@/types/waybill'
import { waybillSchema, validate, type FieldErrors } from '@/utils/validation'
import FormField from '@/components/FormField'
import s from '@/styles/components.module.css'
import { ArrowRight, ArrowLeft, CheckCircle2, Zap } from 'lucide-react'

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

function RateCompare({ form, onSelect, selectedRateId, onSkip }: {
  form: FormData
  onSelect: (q: RateQuote | null) => void
  selectedRateId: string | null
  onSkip: () => void
}) {
  const weight = parseFloat(form.weight) || 1
  const { data: quotes, isLoading, isError } = useQuery({
    queryKey: ['rate-compare', form.serviceType, form.origin, form.destination, weight],
    queryFn: () => carrierRateService.compare({
      serviceType: form.serviceType,
      origin: form.origin,
      destination: form.destination,
      weight,
    }).then(r => r.data),
    enabled: !!(form.origin && form.destination && form.weight),
  })

  if (isLoading) return <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Loading carrier rates…</p>
  if (isError || !quotes?.length) return (
    <div style={{ padding: '1.25rem', background: 'var(--color-bg)', borderRadius: 8, border: '1px solid var(--color-border)', textAlign: 'center' }}>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
        No carrier rates found for the selected route and service type. You can skip and create the waybill without a carrier.
      </p>
      <button type="button" onClick={onSkip} className={s.btnOutline} style={{ fontSize: '0.875rem' }}>Skip carrier selection</button>
    </div>
  )

  return (
    <div>
      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
        Select a carrier to pre-fill pricing, or skip to create the waybill without one.
      </p>
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {quotes.map((q, i) => {
          const selected = selectedRateId === q.rateId
          const cheapest = i === 0
          return (
            <div key={q.rateId} onClick={() => onSelect(selected ? null : q)}
              style={{
                background: selected ? 'var(--badge-blue-bg, #eff6ff)' : 'var(--color-surface)',
                border: `2px solid ${selected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                borderRadius: 10, padding: '1rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '1rem',
                transition: 'border-color 0.15s',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{q.carrierName}</span>
                  {cheapest && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', fontWeight: 600, color: '#16a34a', background: '#dcfce7', padding: '0.125rem 0.5rem', borderRadius: 99 }}>
                      <Zap size={10} /> Best Price
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <span>Base: {q.currency} {q.baseRate.toFixed(2)}</span>
                  <span>Weight charge: {q.currency} {q.weightCharge.toFixed(2)}</span>
                  <span>Transit: {q.transitDaysMin}–{q.transitDaysMax} days</span>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '1.375rem', fontWeight: 700, color: selected ? 'var(--color-primary)' : 'var(--color-text)' }}>
                  {q.currency} {q.totalRate.toFixed(2)}
                </div>
                {selected && <CheckCircle2 size={18} color="var(--color-primary)" style={{ marginTop: '0.25rem' }} />}
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ marginTop: '0.75rem', textAlign: 'right' }}>
        <button type="button" onClick={onSkip} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.8125rem', textDecoration: 'underline' }}>
          Skip carrier selection
        </button>
      </div>
    </div>
  )
}

export default function WaybillNewPage() {
  const [form, setForm] = useState<FormData>(initial)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [serverError, setServerError] = useState('')
  const [step, setStep] = useState<'details' | 'rates'>('details')
  const [selectedQuote, setSelectedQuote] = useState<RateQuote | null>(null)
  const navigate = useNavigate()

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    setErrors(p => ({ ...p, [field]: undefined }))
  }

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault()
    setServerError('')
    const { errors: fieldErrors } = validate(waybillSchema, form)
    setErrors(fieldErrors)
    if (Object.keys(fieldErrors).length > 0) return
    setSelectedQuote(null)
    setStep('rates')
  }

  const handleSubmit = async () => {
    setServerError('')
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
        ...(selectedQuote ? { carrierId: selectedQuote.carrierId } : {}),
      })
      navigate('/waybills')
    } catch {
      setServerError('Failed to create waybill. Please try again.')
      setStep('details')
    }
  }

  const stepStyle = (active: boolean) => ({
    display: 'flex', alignItems: 'center', gap: '0.375rem',
    fontSize: '0.8125rem', fontWeight: active ? 700 : 500,
    color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
  })

  return (
    <div>
      <h2 className={s.pageTitle}>New Waybill</h2>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <span style={stepStyle(step === 'details')}><span style={{ width: 22, height: 22, borderRadius: '50%', background: step === 'details' ? 'var(--color-primary)' : '#e2e8f0', color: step === 'details' ? '#fff' : 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>1</span> Shipment Details</span>
        <ArrowRight size={14} color="var(--color-text-muted)" />
        <span style={stepStyle(step === 'rates')}><span style={{ width: 22, height: 22, borderRadius: '50%', background: step === 'rates' ? 'var(--color-primary)' : '#e2e8f0', color: step === 'rates' ? '#fff' : 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>2</span> Compare Rates</span>
      </div>

      <div style={{ maxWidth: 640 }}>
        {step === 'details' && (
          <form onSubmit={handleNext} className={s.cardPadded}>
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
              <button type="submit" className={s.btnPrimary} style={{ padding: '0.625rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                Next: Compare Rates <ArrowRight size={15} />
              </button>
              <button type="button" className={s.btnOutline} onClick={() => navigate('/waybills')}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {step === 'rates' && (
          <div className={s.cardPadded}>
            <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: 'var(--color-bg)', borderRadius: 8, fontSize: '0.8125rem', color: 'var(--color-text-muted)', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              <span><strong>Route:</strong> {form.origin} → {form.destination}</span>
              <span><strong>Weight:</strong> {form.weight} kg</span>
              <span><strong>Service:</strong> {form.serviceType}</span>
              {selectedQuote && <span style={{ color: '#16a34a', fontWeight: 600 }}>✓ {selectedQuote.carrierName} selected · {selectedQuote.currency} {selectedQuote.totalRate.toFixed(2)}</span>}
            </div>

            <RateCompare
              form={form}
              selectedRateId={selectedQuote?.rateId ?? null}
              onSelect={setSelectedQuote}
              onSkip={() => { setSelectedQuote(null); handleSubmit() }}
            />

            {serverError && <p className={s.formError} style={{ marginTop: '0.75rem' }}>{serverError}</p>}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button type="button" className={s.btnOutline} onClick={() => setStep('details')} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <ArrowLeft size={15} /> Back
              </button>
              <button type="button" className={s.btnPrimary} onClick={handleSubmit} style={{ padding: '0.625rem 1.5rem' }}>
                {selectedQuote ? `Create Waybill with ${selectedQuote.carrierName}` : 'Create Waybill'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
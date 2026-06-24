import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { gpsService } from '@/services/api'
import { MapPin, Send, Navigation } from 'lucide-react'
import BackButton from '@/components/BackButton'

export default function GPSSimulatorPage() {
  const [form, setForm] = useState({
    waybillId: '',
    latitude: '',
    longitude: '',
    speed: '',
    heading: '',
  })

  const mutation = useMutation({
    mutationFn: (data: { waybillId: string; latitude: number; longitude: number; speed?: number; heading?: number }) =>
      gpsService.createLocation(data),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const lat = parseFloat(form.latitude)
    const lon = parseFloat(form.longitude)
    if (!form.waybillId || isNaN(lat) || isNaN(lon)) return

    mutation.mutate({
      waybillId: form.waybillId,
      latitude: lat,
      longitude: lon,
      speed: form.speed ? parseFloat(form.speed) : undefined,
      heading: form.heading ? parseFloat(form.heading) : undefined,
    })
  }

  const fillCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(prev => ({
          ...prev,
          latitude: pos.coords.latitude.toString(),
          longitude: pos.coords.longitude.toString(),
        }))
      },
      (err) => alert('Geolocation failed: ' + err.message),
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 600 }}>
      <BackButton fallback="/dashboard" />
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Navigation size={24} color="var(--color-primary)" /> GPS Simulator
      </h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
        Send a real-time GPS location update for a waybill. The map on the GPS Tracking page will update automatically.
      </p>

      <form onSubmit={handleSubmit} style={{ background: 'var(--color-surface)', borderRadius: 10, padding: '1.5rem', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Waybill ID</label>
          <input
            value={form.waybillId}
            onChange={e => setForm({ ...form, waybillId: e.target.value })}
            placeholder="e.g. WBT-12345678"
            style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 6, background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Latitude</label>
            <input
              value={form.latitude}
              onChange={e => setForm({ ...form, latitude: e.target.value })}
              placeholder="14.5995"
              style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 6, background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Longitude</label>
            <input
              value={form.longitude}
              onChange={e => setForm({ ...form, longitude: e.target.value })}
              placeholder="120.9842"
              style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 6, background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Speed (km/h)</label>
            <input
              value={form.speed}
              onChange={e => setForm({ ...form, speed: e.target.value })}
              placeholder="45"
              style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 6, background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Heading (°)</label>
            <input
              value={form.heading}
              onChange={e => setForm({ ...form, heading: e.target.value })}
              placeholder="90"
              style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 6, background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          <button
            type="button"
            onClick={fillCurrentLocation}
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 0.75rem', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 6, cursor: 'pointer', color: 'var(--color-text-muted)' }}
          >
            <MapPin size={14} /> Use My Location
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 0.75rem', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', opacity: mutation.isPending ? 0.6 : 1 }}
          >
            <Send size={14} /> {mutation.isPending ? 'Sending...' : 'Send GPS Update'}
          </button>
        </div>

        {mutation.isSuccess && (
          <div style={{ padding: '0.75rem', background: 'var(--badge-green-bg)', color: 'var(--badge-green-text)', borderRadius: 6, fontSize: '0.875rem' }}>
            GPS update sent successfully.
          </div>
        )}
        {mutation.isError && (
          <div style={{ padding: '0.75rem', background: 'var(--badge-red-bg)', color: 'var(--badge-red-text)', borderRadius: 6, fontSize: '0.875rem' }}>
            Failed to send GPS update.
          </div>
        )}
      </form>
    </div>
  )
}

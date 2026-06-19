import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { waybillService } from '@/services/api'
import { SkeletonLine } from '@/components/Skeleton'

export default function TrackingPage() {
  const [trackingNumber, setTrackingNumber] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const { data: wb, isLoading, error } = useQuery({
    queryKey: ['track', searchTerm],
    queryFn: () => waybillService.track(searchTerm).then((r) => r.data),
    enabled: !!searchTerm,
    retry: false,
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (trackingNumber.trim()) setSearchTerm(trackingNumber.trim())
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--color-bg)',
      }}
    >
      <div style={{ width: '100%', maxWidth: 600, padding: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, textAlign: 'center', marginBottom: '0.5rem' }}>
          Track Your Shipment
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
          Enter your tracking number to get real-time status
        </p>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
          <input
            type="text"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="e.g. WBT-2024-001234"
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              fontSize: '1rem',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '0.75rem 1.5rem',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Track
          </button>
        </form>

        {isLoading && <div style={{ maxWidth: 400, margin: '1rem auto', display: 'grid', gap: '0.75rem' }}><SkeletonLine /><SkeletonLine width="80%" /><SkeletonLine width="60%" /></div>}
        {error && (
          <p style={{ textAlign: 'center', color: '#dc2626' }}>
            Shipment not found. Please check your tracking number.
          </p>
        )}

        {wb && (
          <div style={{ background: 'var(--color-surface)', borderRadius: 12, padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Status</p>
                <p style={{ fontWeight: 700, fontSize: '1.125rem' }}>
                  {wb.status.replace(/_/g, ' ')}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Est. Delivery</p>
                <p style={{ fontWeight: 600 }}>
                  {wb.estimatedDelivery ? new Date(wb.estimatedDelivery).toLocaleDateString() : '—'}
                </p>
              </div>
            </div>

            <div style={{ position: 'relative', paddingLeft: '1.5rem' }}>
              {wb.events?.map((evt, idx) => (
                <div
                  key={evt.id}
                  style={{
                    position: 'relative',
                    paddingBottom: '1rem',
                    borderLeft: idx < wb.events.length - 1 ? '2px solid var(--color-border)' : 'none',
                    paddingLeft: '1.5rem',
                    marginLeft: '-0.75rem',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: -7,
                      top: 4,
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: idx === 0 ? '#16a34a' : '#2563eb',
                    }}
                  />
                  <p style={{ fontWeight: 500, fontSize: '0.9rem' }}>
                    {evt.status.replace(/_/g, ' ')}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    {evt.location} — {new Date(evt.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

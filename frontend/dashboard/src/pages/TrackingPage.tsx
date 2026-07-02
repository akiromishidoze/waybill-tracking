import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { waybillService } from '@/services/api'
import { SkeletonLine } from '@/components/Skeleton'
import PageTitle from '@/components/PageTitle'

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

  const pageTitle = wb
    ? `Shipment ${wb.trackingNumber} — ${wb.status.replace(/_/g, ' ')}`
    : searchTerm
    ? `Tracking ${searchTerm}`
    : 'Track Shipment'
  const pageDescription = wb
    ? `Track shipment ${wb.trackingNumber} with Waybill Tracking. Current status: ${wb.status.replace(/_/g, ' ')}.`
    : 'Track your shipment in real-time with Waybill Tracking. Enter your waybill number to see status, location, and estimated delivery.'
  const pageUrl = typeof window !== 'undefined' ? window.location.href : ''

  return (
    <>
      <PageTitle
        title={pageTitle}
        description={pageDescription}
        ogTitle={pageTitle}
        ogDescription={pageDescription}
        ogUrl={pageUrl}
      />
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

        <form onSubmit={handleSearch} style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label htmlFor="tracking-number" style={{ fontWeight: 600, fontSize: '0.95rem' }}>
              Waybill #
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                id="tracking-number"
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="e.g. WBT-2024-001234"
                maxLength={32}
                required
                aria-describedby={error ? 'tracking-error' : undefined}
                aria-invalid={error ? 'true' : 'false'}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  border: `1px solid ${error ? 'var(--badge-red-text)' : 'var(--color-border)'}`,
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
            </div>
          </div>
          {error && (
            <p id="tracking-error" role="alert" style={{ color: 'var(--badge-red-text)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Shipment not found. Please check your Waybill # and try again.
            </p>
          )}
        </form>

        {isLoading && <div style={{ maxWidth: 400, margin: '1rem auto', display: 'grid', gap: '0.75rem' }}><SkeletonLine /><SkeletonLine width="80%" /><SkeletonLine width="60%" /></div>}

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
  </>
)
}

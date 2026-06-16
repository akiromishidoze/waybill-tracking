import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { waybillService } from '@/services/api'
import { SkeletonBlock } from '@/components/Skeleton'
import s from '@/styles/components.module.css'

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
    <div className={s.centerPage}>
      <div className={s.trackContainer}>
        <h1 className={s.trackTitle}>Track Your Shipment</h1>
        <p className={s.trackSubtitle}>
          Enter your tracking number to get real-time status
        </p>

        <form onSubmit={handleSearch} className={s.trackForm}>
          <input
            type="text"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="e.g. WBT-2024-001234"
            className={s.formInput}
          />
          <button type="submit" className={s.btnPrimary} style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', fontWeight: 600 }}>
            Track
          </button>
        </form>

        {isLoading && (
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <SkeletonBlock height={180} />
          </div>
        )}
        {error && (
          <p style={{ textAlign: 'center', color: '#dc2626' }}>
            Shipment not found. Please check your tracking number.
          </p>
        )}

        {wb && (
          <div className={s.trackCard}>
            <div className={s.trackCardHeader}>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Status</p>
                <p style={{ fontWeight: 700, fontSize: '1.125rem' }}>
                  {wb.status.replace(/_/g, ' ')}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Est. Delivery</p>
                <p style={{ fontWeight: 600 }}>
                  {wb.estimatedDelivery
                    ? new Date(wb.estimatedDelivery).toLocaleDateString()
                    : '—'}
                </p>
              </div>
            </div>

            <div className={s.timeline}>
              {wb.events?.map((evt: any, idx: number) => (
                <div key={evt.id} className={s.timelineItem}
                  style={{ borderLeft: idx < wb.events.length - 1 ? '2px solid #e2e8f0' : 'none' }}
                >
                  <div className={s.timelineDot} style={{ background: idx === 0 ? '#16a34a' : '#2563eb' }} />
                  <p className={s.timelineStatus} style={{ fontSize: '0.9rem' }}>
                    {evt.status.replace(/_/g, ' ')}
                  </p>
                  <p className={s.timelineMeta} style={{ fontSize: '0.8rem' }}>
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
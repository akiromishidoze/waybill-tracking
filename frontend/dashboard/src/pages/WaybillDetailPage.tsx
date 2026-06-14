import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { waybillService } from '@/services/api'

export default function WaybillDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: wb, isLoading } = useQuery({
    queryKey: ['waybill', id],
    queryFn: () => waybillService.get(id!).then((r) => r.data),
    enabled: !!id,
  })

  if (isLoading) return <p>Loading...</p>
  if (!wb) return <p>Waybill not found</p>

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>
        Waybill #{wb.trackingNumber}
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: 10 }}>
          <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Shipment Info</h3>
          <DetailRow label="Status" value={wb.status} />
          <DetailRow label="Service Type" value={wb.serviceType} />
          <DetailRow label="Weight" value={`${wb.weight} kg`} />
          <DetailRow label="Dimensions" value={wb.dimensions} />
          <DetailRow label="Origin" value={wb.origin} />
          <DetailRow label="Destination" value={wb.destination} />
        </div>

        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: 10 }}>
          <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Recipient</h3>
          <DetailRow label="Name" value={wb.recipientName} />
          <DetailRow label="Phone" value={wb.recipientPhone} />
          <DetailRow label="Address" value={wb.recipientAddress} />
        </div>
      </div>

      <div style={{ background: '#fff', padding: '1.5rem', borderRadius: 10 }}>
        <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Tracking Timeline</h3>
        {wb.events?.length ? (
          <div style={{ position: 'relative', paddingLeft: '2rem' }}>
            {wb.events.map((evt) => (
              <div
                key={evt.id}
                style={{
                  position: 'relative',
                  paddingBottom: '1.25rem',
                  borderLeft: '2px solid #e2e8f0',
                  paddingLeft: '1.5rem',
                  marginLeft: '-1rem',
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
                    background: '#2563eb',
                  }}
                />
                <p style={{ fontWeight: 500 }}>{evt.status.replace(/_/g, ' ')}</p>
                <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
                  {evt.location} — {new Date(evt.timestamp).toLocaleString()}
                </p>
                {evt.remark && (
                  <p style={{ fontSize: '0.875rem', color: '#475569' }}>{evt.remark}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#64748b' }}>No scan events yet.</p>
        )}
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', marginBottom: '0.5rem' }}>
      <span style={{ width: 140, color: '#64748b', fontSize: '0.875rem' }}>
        {label}
      </span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  )
}

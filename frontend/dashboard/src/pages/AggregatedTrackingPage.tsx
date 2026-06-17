import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { aggregatedTrackingService } from '@/services/api'
import { Truck, ExternalLink, ChevronRight } from 'lucide-react'

const CARRIER_COLORS: Record<string, string> = {
  c1: '#2563eb',
  c2: '#7c3aed',
  c3: '#d97706',
}

export default function AggregatedTrackingPage() {
  const { data: items, isLoading } = useQuery({
    queryKey: ['aggregated-tracking'],
    queryFn: () => aggregatedTrackingService.list().then((r) => r.data),
    refetchInterval: 15000,
  })

  const grouped = (items || []).reduce(
    (acc: Record<string, typeof items>, item: any) => {
      if (!acc[item.carrierId]) acc[item.carrierId] = { name: item.carrierName, items: [] }
      acc[item.carrierId].items.push(item)
      return acc
    },
    {} as Record<string, any>,
  )

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>
        Multi-Carrier Aggregated Tracking
      </h2>

      {isLoading ? (
        <p style={{ color: '#64748b' }}>Loading...</p>
      ) : !items?.length ? (
        <p style={{ color: '#64748b' }}>No carrier-tracked waybills yet.</p>
      ) : (
        Object.entries(grouped).map(([carrierId, group]: [string, any]) => (
          <div
            key={carrierId}
            style={{
              background: '#fff',
              borderRadius: 10,
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              marginBottom: '1.5rem',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '0.75rem 1rem',
                background: (CARRIER_COLORS[carrierId] || '#6b7280') + '10',
                borderBottom: `2px solid ${CARRIER_COLORS[carrierId] || '#6b7280'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Truck size={18} color={CARRIER_COLORS[carrierId] || '#6b7280'} />
              <span style={{ fontWeight: 600 }}>{group.name}</span>
              <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                ({group.items.length} shipments)
              </span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                  <th style={{ padding: '0.625rem 1rem', fontSize: '0.8125rem', color: '#64748b', fontWeight: 600 }}>Waybill</th>
                  <th style={{ padding: '0.625rem 1rem', fontSize: '0.8125rem', color: '#64748b', fontWeight: 600 }}>Carrier Tracking</th>
                  <th style={{ padding: '0.625rem 1rem', fontSize: '0.8125rem', color: '#64748b', fontWeight: 600 }}>Recipient</th>
                  <th style={{ padding: '0.625rem 1rem', fontSize: '0.8125rem', color: '#64748b', fontWeight: 600 }}>Destination</th>
                  <th style={{ padding: '0.625rem 1rem', fontSize: '0.8125rem', color: '#64748b', fontWeight: 600 }}>Last Carrier Event</th>
                  <th style={{ padding: '0.625rem 1rem', fontSize: '0.8125rem', color: '#64748b', fontWeight: 600 }} />
                </tr>
              </thead>
              <tbody>
                {group.items.map((item: any) => (
                  <tr key={item.waybillId} style={{ borderTop: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.625rem 1rem' }}>
                      <Link
                        to={`/waybills/${item.waybillId}`}
                        style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 500, fontSize: '0.875rem' }}
                      >
                        {item.trackingNumber}
                      </Link>
                    </td>
                    <td style={{ padding: '0.625rem 1rem', fontSize: '0.875rem', fontFamily: 'monospace', color: '#334155' }}>
                      {item.carrierTrackingNumber}
                    </td>
                    <td style={{ padding: '0.625rem 1rem', fontSize: '0.875rem' }}>{item.recipientName}</td>
                    <td style={{ padding: '0.625rem 1rem', fontSize: '0.875rem', color: '#64748b' }}>{item.destination}</td>
                    <td style={{ padding: '0.625rem 1rem', fontSize: '0.8125rem' }}>
                      {item.lastCarrierEvent ? (
                        <div>
                          <span style={{ fontWeight: 500 }}>{item.lastCarrierEvent.status}</span>
                          <span style={{ color: '#94a3b8' }}> — {item.lastCarrierEvent.location}</span>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>No events yet</span>
                      )}
                    </td>
                    <td style={{ padding: '0.625rem 1rem' }}>
                      <Link
                        to={`/waybills/${item.waybillId}`}
                        style={{ display: 'flex', alignItems: 'center', color: '#2563eb', textDecoration: 'none' }}
                      >
                        <ChevronRight size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  )
}

import { useQuery } from '@tanstack/react-query'
import { carrierService } from '@/services/api'
import { Truck, ExternalLink, CheckCircle, XCircle } from 'lucide-react'

export default function CarriersPage() {
  const { data: carriers, isLoading } = useQuery({
    queryKey: ['carriers'],
    queryFn: () => carrierService.list().then((r) => r.data),
    refetchInterval: 30000,
  })

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>
        Carrier Integrations
      </h2>

      {isLoading ? (
        <p style={{ color: '#64748b' }}>Loading carriers...</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {carriers?.map((c) => (
            <div
              key={c.id}
              style={{
                background: '#fff',
                borderRadius: 10,
                padding: '1.25rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: c.isActive ? '#dcfce7' : '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Truck size={22} color={c.isActive ? '#16a34a' : '#94a3b8'} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '1rem' }}>{c.name}</span>
                  {c.isActive ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: '#16a34a', fontWeight: 500 }}>
                      <CheckCircle size={12} /> Active
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>
                      <XCircle size={12} /> Inactive
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.375rem', fontSize: '0.8125rem', color: '#64748b' }}>
                  <span>API: <code style={{ background: '#f1f5f9', padding: '0.125rem 0.375rem', borderRadius: 3 }}>{c.apiEndpoint}</code></span>
                  <span>Key: <code style={{ background: '#f1f5f9', padding: '0.125rem 0.375rem', borderRadius: 3 }}>{c.apiKey}</code></span>
                </div>
              </div>
              <a
                href={c.trackingUrlTemplate.replace('{{number}}', 'DEMO')}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  color: '#2563eb',
                  textDecoration: 'none',
                  fontSize: '0.8125rem',
                  whiteSpace: 'nowrap',
                }}
              >
                Tracking Page <ExternalLink size={14} />
              </a>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '2rem', background: '#fff', borderRadius: 10, padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <h3 style={{ fontWeight: 600, marginBottom: '0.75rem' }}>How Carrier Aggregation Works</h3>
        <ol style={{ color: '#475569', fontSize: '0.875rem', lineHeight: 1.8, paddingLeft: '1.25rem' }}>
          <li>Each waybill can be assigned to a carrier with a carrier-specific tracking number</li>
          <li>The system fetches real-time tracking events from the carrier's API</li>
          <li>Carrier events appear alongside internal tracking events on the waybill detail page</li>
          <li>Statuses are normalized into a unified timeline view</li>
        </ol>
      </div>
    </div>
  )
}

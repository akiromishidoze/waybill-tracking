import PageContainer from '@/components/PageContainer'
import BackButton from '@/components/BackButton'

const phases: { label: string; color: string; bg: string; border: string; items: { title: string; description: string; status: 'planned' | 'in-progress' | 'done' }[] }[] = [
  {
    label: 'Phase 2 — High Priority',
    color: '#b45309',
    bg: '#fffbeb',
    border: '#fde68a',
    items: [
      {
        title: 'Real carrier API polling worker',
        description: 'Background Celery beat task per carrier (J&T, LBC, 2GO) that polls the carrier tracking API and inserts scan_events, updating waybill status automatically.',
        status: 'planned',
      },
      {
        title: 'Scan event notifications',
        description: 'Call DispatchDeliveryNotification after every significant scan event type (DELIVERY, ATTEMPT, RETURN) — not just on waybill status changes.',
        status: 'planned',
      },
      {
        title: 'URL-synced waybill list pagination',
        description: 'Sync page, limit, and search query parameters to the URL using useSearchParams so deep-linking and page refresh work correctly.',
        status: 'planned',
      },
    ],
  },
  {
    label: 'Phase 3 — Medium Priority',
    color: '#1d4ed8',
    bg: '#eff6ff',
    border: '#bfdbfe',
    items: [
      {
        title: 'Elasticsearch waybill search',
        description: 'Index waybills to Elasticsearch on create/update and route search queries with a search parameter to Elasticsearch instead of ILIKE on PostgreSQL.',
        status: 'planned',
      },
      {
        title: 'Geofence zone definitions & triggers',
        description: 'Implement zone definitions (polygon or radius) and a GPS ingestion hook that evaluates each new GPS ping against active zones, creating geofence events automatically.',
        status: 'planned',
      },
      {
        title: 'IoT sensor threshold alerting',
        description: 'Add a threshold model per sensor and a background worker that checks readings against limits and creates escalations or notifications for cold-chain violations.',
        status: 'planned',
      },
    ],
  },
  {
    label: 'Phase 4 — UX',
    color: '#6d28d9',
    bg: '#f5f3ff',
    border: '#ddd6fe',
    items: [
      {
        title: 'Public tracking page SEO metadata',
        description: 'Add dynamic <title> and meta tags to /track/:trackingNumber via react-helmet-async for link preview and search engine visibility.',
        status: 'planned',
      },
      {
        title: 'GPS simulator role restriction',
        description: 'Restrict /gps-simulator to OPS and ADMIN roles in both the frontend route guard and backend GPS write endpoints.',
        status: 'planned',
      },
    ],
  },
  {
    label: 'Phase 5 — Future',
    color: '#065f46',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    items: [
      {
        title: 'Real-time dashboard auto-refresh',
        description: 'Add refetchInterval to the dashboard query or subscribe to a WebSocket channel for live KPI updates without manual page refresh.',
        status: 'planned',
      },
      {
        title: 'Driver mobile PWA',
        description: 'Build a Progressive Web App view for the driver workflow with offline support for scanning, capturing signatures, and updating delivery status in the field.',
        status: 'planned',
      },
      {
        title: 'Proof-of-delivery PDF generation',
        description: 'Add GET /waybills/:id/pod endpoint that renders a PDF Proof of Delivery document using waybill, recipient, delivery scan, and signature data.',
        status: 'planned',
      },
    ],
  },
]

const statusBadge: Record<string, { label: string; color: string; bg: string }> = {
  done: { label: 'Done', color: '#065f46', bg: '#d1fae5' },
  'in-progress': { label: 'In Progress', color: '#b45309', bg: '#fef3c7' },
  planned: { label: 'Planned', color: '#1e40af', bg: '#dbeafe' },
}

export default function RoadmapTrackingPage() {
  return (
    <>
      <BackButton fallback="/dashboard" />
      <PageContainer title="Tracking Roadmap">
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', maxWidth: 680 }}>
          Planned improvements to real-time tracking, GPS, geofencing, carrier polling, and public shipment visibility.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {phases.map((phase) => (
            <div key={phase.label} style={{ border: `1px solid ${phase.border}`, borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ background: phase.bg, padding: '0.75rem 1.25rem', borderBottom: `1px solid ${phase.border}` }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: phase.color }}>{phase.label}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {phase.items.map((item, i) => {
                  const badge = statusBadge[item.status]
                  return (
                    <div key={item.title} style={{ padding: '1rem 1.25rem', borderTop: i === 0 ? 'none' : '1px solid var(--color-border)', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>{item.title}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{item.description}</div>
                      </div>
                      <span style={{ flexShrink: 0, fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.65rem', borderRadius: 99, background: badge.bg, color: badge.color }}>{badge.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </PageContainer>
    </>
  )
}

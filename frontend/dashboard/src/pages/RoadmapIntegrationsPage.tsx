import PageContainer from '@/components/PageContainer'
import BackButton from '@/components/BackButton'

const phases: { label: string; color: string; bg: string; border: string; items: { title: string; description: string; status: 'planned' | 'in-progress' | 'done' }[] }[] = [
  {
    label: 'Phase 1 — Critical (Completed)',
    color: '#065f46',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    items: [
      {
        title: 'BI Integrations backend (migration, model, routes)',
        description: 'Created bi_integrations table migration, Go model, BiIntegrationRepository with List/Create/Update/Delete/Sync, BiIntegrationHandler, and registered all 5 routes.',
        status: 'done',
      },
    ],
  },
  {
    label: 'Phase 2 — High Priority',
    color: '#b45309',
    bg: '#fffbeb',
    border: '#fde68a',
    items: [
      {
        title: 'Real carrier API polling worker',
        description: 'Celery beat task or Go goroutine per carrier (J&T, LBC, 2GO) that polls carrier tracking APIs and ingests scan events automatically.',
        status: 'planned',
      },
      {
        title: 'E-Commerce pull-based sync worker',
        description: 'Scheduled Celery task that iterates connected ecommerce_platforms (Shopify, Lazada, Shopee) and pulls new orders on a configurable interval as a webhook fallback.',
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
        title: 'Customs document upload endpoint',
        description: 'Implement POST /customs-documents multipart upload endpoint with S3/GCS storage and a customs_documents database row per upload.',
        status: 'planned',
      },
      {
        title: 'IoT sensor threshold alerting',
        description: 'Add per-sensor threshold models and a background worker that checks readings against limits and creates escalations for cold-chain violations.',
        status: 'planned',
      },
      {
        title: 'Geofence zone definitions and GPS trigger',
        description: 'Implement zone polygon/radius definitions and a GPS ingestion hook that evaluates each new ping against active zones to emit geofence events.',
        status: 'planned',
      },
      {
        title: 'Auto-communications rule evaluation worker',
        description: 'Celery beat task that evaluates active auto-communication rules and dispatches email/SMS tasks when trigger conditions (status change, dwell time) are met.',
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
        title: 'Terraform infrastructure modules',
        description: 'Add Terraform modules for cloud infrastructure or document that Kubernetes manifests are the single source of truth and remove Terraform references.',
        status: 'planned',
      },
    ],
  },
  {
    label: 'Phase 5 — Future',
    color: '#374151',
    bg: '#f9fafb',
    border: '#e5e7eb',
    items: [
      {
        title: 'Driver mobile PWA',
        description: 'Progressive Web App for the driver workflow with offline scanning, signature capture, and delivery status updates in the field.',
        status: 'planned',
      },
      {
        title: 'Carrier rate comparison engine',
        description: 'carrier_rates table and a rate-comparison step in waybill creation so operators can compare costs across all connected carriers before booking.',
        status: 'planned',
      },
      {
        title: 'Multi-language / i18n support',
        description: 'Integrate react-i18next and externalize all UI strings to translation JSON files for Filipino and localized English operator variants.',
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

export default function RoadmapIntegrationsPage() {
  return (
    <>
      <BackButton fallback="/dashboard" />
      <PageContainer title="Integrations Roadmap">
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', maxWidth: 680 }}>
          Planned improvements to carrier integrations, e-commerce sync, IoT, customs, auto-communications, and geofencing.
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

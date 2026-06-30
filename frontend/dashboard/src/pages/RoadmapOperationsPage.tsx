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
        title: 'BI Integrations backend',
        description: 'Created bi_integrations migration, Go model, BiIntegrationRepository, BiIntegrationHandler, and registered all 5 routes in core-api.',
        status: 'done',
      },
      {
        title: 'Playwright E2E test coverage',
        description: 'Added auth setup, waybill CRUD, driver scan, public tracking, and returns specs covering the critical operator path across 28 test cases.',
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
        title: 'COD auto-population on delivery',
        description: 'Add a PostgreSQL trigger or application hook that auto-creates a cod_payments row when isCOD=true and a customs_shipments row for cross-border waybills on status change to DELIVERED.',
        status: 'planned',
      },
      {
        title: 'E-Commerce pull-based sync worker',
        description: 'Celery beat task that iterates connected ecommerce_platforms and pulls new orders on a configurable interval as a fallback to push webhooks.',
        status: 'planned',
      },
      {
        title: 'Frontend password policy enforcement',
        description: 'Add inline password strength feedback in SettingsPage and any change-password form, matching the backend 8-char / mixed-case / digit rules.',
        status: 'planned',
      },
      {
        title: 'Remove or merge courier_handler.go stub',
        description: 'courier_handler.go is an unused stub alongside driver_handler.go. Delete or merge it to eliminate confusion about the canonical driver/courier handler.',
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
        title: 'Auto-communications rule evaluation worker',
        description: 'Celery beat task that evaluates active auto-communication rules and enqueues send_email_notification / send_sms_notification tasks when conditions are met.',
        status: 'planned',
      },
      {
        title: 'Customs document upload endpoint',
        description: 'Implement POST /customs-documents multipart upload endpoint that stores files (S3/GCS) and creates a customs_documents row.',
        status: 'planned',
      },
      {
        title: 'registerCoreAPIRoutes refactor to Dependencies struct',
        description: 'The function now accepts 27 parameters. Refactor to a Dependencies struct passed as a single argument to reduce maintenance burden.',
        status: 'planned',
      },
      {
        title: 'Database migration rollback support',
        description: 'Add down migration files per migration and expose a --rollback flag to the migrator to avoid manual SQL intervention in production.',
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
        title: 'Global React error boundary',
        description: 'Add a top-level ErrorBoundary in App.tsx that shows a user-friendly error page instead of a blank white screen on unhandled render errors.',
        status: 'planned',
      },
      {
        title: '404 catch-all route',
        description: 'Add <Route path="*" element={<NotFoundPage />} /> so undefined paths show a proper 404 page instead of silently redirecting to /dashboard.',
        status: 'planned',
      },
      {
        title: 'WaybillDetailPage tab decomposition',
        description: 'Split the 40 KB WaybillDetailPage into tab-based sub-components (ScanTimeline, AttachmentsTab, ReturnTab, CustomsTab) for maintainability.',
        status: 'planned',
      },
      {
        title: 'Dark mode persistence',
        description: 'Persist the theme preference to localStorage on toggle and read it on initial load so dark mode survives page refresh.',
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

export default function RoadmapOperationsPage() {
  return (
    <>
      <BackButton fallback="/dashboard" />
      <PageContainer title="Operations Roadmap">
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', maxWidth: 680 }}>
          Planned improvements to COD automation, driver workflows, password policy, database reliability, and operator UX.
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

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
        title: 'Demand Forecasting endpoint with real SQL',
        description: 'Implemented GET /analytics/demand-forecast in analytics-api with real SQL aggregations by lane, region, and month. Replaced stub with actual data.',
        status: 'done',
      },
      {
        title: 'analytics-api JWT_SECRET hardening',
        description: 'Removed the weak default JWT_SECRET, added model_validator to enforce 32-char minimum on all run configurations including local dev and CI.',
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
        title: 'Scan event anomaly notifications',
        description: 'Trigger analytics anomaly detection alerts to shippers and recipients after DELIVERY_ATTEMPT and RETURN scan events, not just on status changes.',
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
        title: 'Elasticsearch full-text waybill search',
        description: 'Index waybills to Elasticsearch on create/update and route search queries with a search parameter to Elasticsearch instead of PostgreSQL ILIKE.',
        status: 'planned',
      },
      {
        title: 'Elasticsearch X-Pack security',
        description: 'Enable X-Pack security, set a superuser password, and pass credentials to core-api via environment variables to protect indexed waybill data.',
        status: 'planned',
      },
      {
        title: 'SkeletonBlock loading states for analytics pages',
        description: 'Add consistent skeleton loaders to BiIntegrationsPage, DemandForecastingPage, CostAnalyticsPage, and CarbonFootprintPage during data fetch.',
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
        title: 'SettingsPage code splitting',
        description: 'Apply React.lazy and Suspense to SettingsPage (27 KB) and other large pages to reduce initial bundle size and improve load performance.',
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
        title: 'Audit log CSV/Excel export',
        description: 'Add GET /audit-logs/export endpoint protected by ADMIN role, following the pattern used in the existing reports export endpoints.',
        status: 'planned',
      },
      {
        title: 'Carrier rate comparison engine',
        description: 'Add a carrier_rates table and a rate-comparison UI step in the waybill creation flow so operators can compare costs across carriers.',
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

export default function RoadmapAnalyticsPage() {
  return (
    <>
      <BackButton fallback="/dashboard" />
      <PageContainer title="Reports Roadmap">
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', maxWidth: 680 }}>
          Planned improvements to analytics, demand forecasting, Elasticsearch search, BI integrations, and report exports.
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

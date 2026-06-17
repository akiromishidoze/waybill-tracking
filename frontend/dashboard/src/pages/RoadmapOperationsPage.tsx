import s from '@/styles/components.module.css'

const essentials = [
  'Multi-user roles & permissions',
  'Assignment of waybills to teams / branches',
  'Automated escalation workflows',
  'Internal notes / case comments per waybill',
  'Return / reverse logistics tracking',
]

const possibles = [
  'Driver app integration (last-mile)',
  'Dynamic re-routing',
  'Automated customer communications',
  'Customs / compliance document tracking',
  'COD reconciliation module',
]

export default function RoadmapOperationsPage() {
  return (
    <div>
      <h2 className={s.pageTitle}>Operations &amp; Workflows</h2>
      <p className={s.pageSubtitle}>Day-to-day logistics operations and process automation.</p>

      <div style={{ maxWidth: 700 }}>
        <h3 className={s.formLabel} style={{ fontSize: '1.05rem', marginBottom: '0.75rem' }}>Essential</h3>
        <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2rem' }}>
          {essentials.map((item) => (
            <li key={item} className={s.roadmapItem}>
              <span className={s.roadmapCheckbox}>☐</span> {item}
            </li>
          ))}
        </ul>

        <h3 className={s.formLabel} style={{ fontSize: '1.05rem', marginBottom: '0.75rem' }}>Possible</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {possibles.map((item) => (
            <li key={item} className={s.roadmapItem}>
              <span className={s.roadmapCheckbox}>◇</span> {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

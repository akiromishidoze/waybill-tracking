import s from '@/styles/components.module.css'

const essentials = [
  'KPI dashboard (on-time rate, exception rate, volume)',
  'Carrier performance scoreboards',
  'Scheduled report delivery (email / PDF)',
  'Region / zone performance breakdown',
]

const possibles = [
  'BI tool integration (Power BI, Looker)',
  'Cost-per-shipment analytics',
  'Demand forecasting by lane / region',
  'Carbon footprint tracking',
]

export default function RoadmapAnalyticsPage() {
  return (
    <div>
      <h2 className={s.pageTitle}>Analytics &amp; Reporting</h2>
      <p className={s.pageSubtitle}>Business intelligence and performance measurement.</p>

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

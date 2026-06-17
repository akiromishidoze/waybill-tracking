import s from '@/styles/components.module.css'

const essentials = [
  'Real-time GPS map view',
  'Multi-carrier aggregated tracking',
  'Batch shipment status view',
  'Proof of delivery (POD) attachments',
  'Exception / exception reason codes',
  'SLA breach indicators',
  'Milestone event log',
  'Dwell time alerts at hub / facility',
  'Geofence entry / exit events',
  'Predictive ETA (ML-based)',
]

const possibles = [
  'Route deviation alerts',
  'Cold chain / temperature monitoring',
]

export default function RoadmapTrackingPage() {
  return (
    <div>
      <h2 className={s.pageTitle}>Visibility &amp; Tracking</h2>
      <p className={s.pageSubtitle}>Real-time shipment visibility across the delivery lifecycle.</p>

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

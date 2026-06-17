import s from '@/styles/components.module.css'

const essentials = [
  'ERP / WMS integration (SAP, Oracle, etc.)',
  'Carrier API aggregation',
  'Webhook event publishing',
  'Audit log of all user & system actions',
]

const possibles = [
  'E-commerce platform connectors (Shopify, Lazada, etc.)',
  'Customer-facing white-label tracking portal',
  'IoT sensor data ingestion',
  'AI chatbot for shipment inquiries',
]

export default function RoadmapIntegrationsPage() {
  return (
    <div>
      <h2 className={s.pageTitle}>Integrations &amp; API</h2>
      <p className={s.pageSubtitle}>Connectivity with external systems and data sources.</p>

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

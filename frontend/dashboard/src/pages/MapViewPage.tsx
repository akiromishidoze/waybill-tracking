import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import { useQuery } from '@tanstack/react-query'
import { analyticsService } from '@/services/api'
import { MapPin, Truck, Clock, AlertTriangle, CheckCircle } from 'lucide-react'
import 'leaflet/dist/leaflet.css'

import L from 'leaflet'

// Fix leaflet icon issue
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [0, -41],
})

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    CREATED: '#6b7280',
    PICKED_UP: '#2563eb',
    IN_TRANSIT: '#d97706',
    AT_SORTING_CENTER: '#7c3aed',
    OUT_FOR_DELIVERY: '#0891b2',
    DELIVERED: '#16a34a',
    FAILED_DELIVERY: '#dc2626',
    RETURNED: '#9333ea',
    CANCELLED: '#4b5563',
  }
  return colors[status] || '#6b7280'
}

export default function MapViewPage() {
  const [selectedWaybill, setSelectedWaybill] = useState<any>(null)
  const [lastUpdate, setLastUpdate] = useState(Date.now())

  const { data: waybills, isLoading } = useQuery({
    queryKey: ['waybills-map', lastUpdate],
    queryFn: () => analyticsService.getWaybillsMap().then((r) => r.data),
    refetchInterval: 15000,
  })

  const MapEvents = () => {
    const map = useMapEvents({
      click: () => setSelectedWaybill(null),
    })
    return null
  }

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <div style={{ padding: '1rem', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MapPin size={20} color="#2563eb" /> Real-Time GPS Tracking
        </h2>
        <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>{waybills?.length || 0} active shipments</span>
      </div>

      <div style={{ position: 'relative', height: 'calc(100vh - 64px)', width: '100%' }}>
        <MapContainer
          center={[14.5, 121.0]}
          zoom={7}
          style={{ height: '100%', width: '100%' }}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          <MapEvents />

          {waybills?.map((wb: any) => (
            <Marker
              key={wb.id}
              position={wb.currentCoords}
              icon={icon}
              eventHandlers={{ click: () => setSelectedWaybill(wb) }}
            >
              <Popup maxWidth={300} className="custom-popup">
                <div style={{ padding: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Truck size={16} color={getStatusColor(wb.status)} /> <strong>{wb.trackingNumber}</strong>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>{wb.recipientName}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem', fontSize: '0.8125rem' }}>
                    <MapPin size={12} color="#94a3b8" /> {wb.lastLocation}
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.75rem', background: getStatusColor(wb.status) + '20', color: getStatusColor(wb.status) }}>
                      {wb.status.replace(/_/g, ' ')}
                    </span>
                    {wb.slaBreached && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.75rem', background: '#fef2f2', color: '#dc2626' }}>
                        <AlertTriangle size={10} /> SLA Breached
                      </span>
                    )}
                  </div>
                  <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                    Last update: {new Date(wb.lastUpdate).toLocaleTimeString()}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {selectedWaybill && (
          <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', right: '1rem', background: '#fff', borderRadius: 8, padding: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', maxHeight: '40vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ fontWeight: 600, fontSize: '1.125rem' }}>Waybill #{selectedWaybill.trackingNumber}</h3>
              <button onClick={() => setSelectedWaybill(null)} style={{ padding: '0.25rem 0.5rem', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem' }}>Close</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.875rem' }}>
              <div>
                <div style={{ color: '#64748b', marginBottom: '0.25rem' }}>Origin</div>
                <div style={{ fontWeight: 500 }}>{selectedWaybill.origin}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', marginBottom: '0.25rem' }}>Destination</div>
                <div style={{ fontWeight: 500 }}>{selectedWaybill.destination}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', marginBottom: '0.25rem' }}>Status</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.75rem', background: getStatusColor(selectedWaybill.status) + '20', color: getStatusColor(selectedWaybill.status) }}>
                  {selectedWaybill.status.replace(/_/g, ' ')}
                </div>
              </div>
              <div>
                <div style={{ color: '#64748b', marginBottom: '0.25rem' }}>ETA</div>
                <div style={{ fontWeight: 500 }}>{selectedWaybill.origin} → {selectedWaybill.destination}</div>
              </div>
            </div>
            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9', fontSize: '0.8125rem', color: '#94a3b8' }}>
              Current location: {selectedWaybill.lastLocation}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

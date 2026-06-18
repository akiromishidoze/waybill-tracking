import { useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import { useQuery } from '@tanstack/react-query'
import { analyticsService } from '@/services/api'
import { MapPin, Truck, AlertTriangle } from 'lucide-react'
import L from 'leaflet'
import PageContainer from '@/components/PageContainer'
import ErrorBoundary from '@/components/ErrorBoundary'
import 'leaflet/dist/leaflet.css'

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

  const { data: waybills } = useQuery({
    queryKey: ['waybills-map'],
    queryFn: () => analyticsService.getWaybillsMap().then((r) => r.data),
    refetchInterval: 15000,
  })

  function MapEvents() {
    useMapEvents({
      click: () => setSelectedWaybill(null),
    })
    return null
  }

  return (
    <PageContainer
      title="Real-Time GPS Tracking"
      actions={<span className="text-sm text-slate-500">{waybills?.length || 0} active shipments</span>}
    >
      <div style={{ position: 'relative', height: '100%', width: '100%' }}>
        <ErrorBoundary>
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
                  <div className="p-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Truck size={16} color={getStatusColor(wb.status)} /> <strong>{wb.trackingNumber}</strong>
                    </div>
                    <div className="text-sm text-slate-500 mb-1">{wb.recipientName}</div>
                    <div className="flex items-center gap-1 mb-2 text-xs">
                      <MapPin size={12} className="text-slate-400" /> {wb.lastLocation}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <span className="px-2 py-1 rounded text-xs" style={{ background: getStatusColor(wb.status) + '20', color: getStatusColor(wb.status) }}>
                        {wb.status.replace(/_/g, ' ')}
                      </span>
                      {wb.slaBreached && (
                        <span className="px-2 py-1 rounded text-xs bg-red-50 text-red-600 flex items-center gap-1">
                          <AlertTriangle size={10} /> SLA Breached
                        </span>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </ErrorBoundary>

        {selectedWaybill && (
          <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', right: '1rem', background: '#fff', borderRadius: 8, padding: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', zIndex: 1000 }}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-lg">Waybill #{selectedWaybill.trackingNumber}</h3>
              <button onClick={() => setSelectedWaybill(null)} className="px-3 py-1 border rounded text-sm hover:bg-slate-50">Close</button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-slate-500">Origin</div>
                <div className="font-medium">{selectedWaybill.origin}</div>
              </div>
              <div>
                <div className="text-slate-500">Destination</div>
                <div className="font-medium">{selectedWaybill.destination}</div>
              </div>
              <div>
                <div className="text-slate-500">Status</div>
                <div className="px-2 py-1 rounded text-xs inline-block" style={{ background: getStatusColor(selectedWaybill.status) + '20', color: getStatusColor(selectedWaybill.status) }}>
                  {selectedWaybill.status.replace(/_/g, ' ')}
                </div>
              </div>
              <div>
                <div className="text-slate-500">Last Update</div>
                <div className="font-medium">{new Date(selectedWaybill.lastUpdate).toLocaleTimeString()}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  )
}

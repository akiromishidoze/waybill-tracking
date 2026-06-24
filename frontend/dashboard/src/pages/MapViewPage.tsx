import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import { useQuery } from '@tanstack/react-query'
import { gpsService } from '@/services/api'
import type { WaybillGPSView } from '@/types/waybill'
import { MapPin, Truck, AlertTriangle } from 'lucide-react'
import L from 'leaflet'
import PageContainer from '@/components/PageContainer'
import ErrorBoundary from '@/components/ErrorBoundary'
import 'leaflet/dist/leaflet.css'
import BackButton from '@/components/BackButton'

// Fix leaflet icon issue
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [0, -41],
})

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    CREATED: 'var(--color-text-muted)',
    PICKED_UP: 'var(--badge-blue-text)',
    IN_TRANSIT: 'var(--badge-amber-text)',
    AT_SORTING_CENTER: 'var(--badge-purple-text)',
    OUT_FOR_DELIVERY: 'var(--badge-cyan-text)',
    DELIVERED: 'var(--badge-green-text)',
    FAILED_DELIVERY: 'var(--badge-red-text)',
    RETURNED: 'var(--badge-purple-text)',
    CANCELLED: 'var(--color-text-muted)',
  }
  return colors[status] || 'var(--color-text-muted)'
}

export default function MapViewPage() {
  const [selectedWaybill, setSelectedWaybill] = useState<WaybillGPSView | null>(null)

  const { data: waybillsRaw, refetch } = useQuery({
    queryKey: ['gps-waybills'],
    queryFn: () => gpsService.listCurrent().then((r) => r.data),
    refetchInterval: 15000,
  })
  const waybills = Array.isArray(waybillsRaw) ? waybillsRaw : []

  useEffect(() => {
    const wsUrl = `${import.meta.env.VITE_WS_URL || (window.location.protocol === 'https:' ? 'wss:' : 'ws:')}//${window.location.host}/ws`
    const socket = new WebSocket(wsUrl)
    socket.onopen = () => {
      socket.send(JSON.stringify({ action: 'subscribe', trackingNumber: '*' }))
    }
    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'gps_update') {
          refetch()
        }
      } catch {
        // ignore
      }
    }
    return () => socket.close()
  }, [refetch])

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
      <BackButton fallback="/dashboard" />
      <div style={{ position: 'relative', height: '100%', width: '100%' }}>
        <ErrorBoundary>
          <MapContainer
            center={[14.5, 121.0]}
            zoom={7}
            style={{ height: '100%', width: '100%' }}
            attributionControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />

            <MapEvents />

            {waybills?.map((wb: WaybillGPSView) => (
              <Marker
                key={wb.id}
                position={[wb.latitude, wb.longitude]}
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
          <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', right: '1rem', background: 'var(--color-surface)', borderRadius: 8, padding: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', zIndex: 1000 }}>
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
                <div className="font-medium">{new Date(selectedWaybill.recordedAt).toLocaleTimeString()}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  )
}

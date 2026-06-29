import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import MapViewPage from './MapViewPage'
import type { WaybillGPSView } from '@/types/waybill'

const mockWaybills: WaybillGPSView[] = [
  {
    id: '1',
    trackingNumber: 'WBT-GPS-001',
    recipientName: 'Alice',
    status: 'IN_TRANSIT',
    origin: 'Manila',
    destination: 'Cebu',
    lastLocation: 'Manila Hub',
    latitude: 14.5,
    longitude: 121.0,
    recordedAt: '2024-01-01T00:00:00Z',
    slaBreached: false,
  },
  {
    id: '2',
    trackingNumber: 'WBT-GPS-002',
    recipientName: 'Bob',
    status: 'OUT_FOR_DELIVERY',
    origin: 'Cebu',
    destination: 'Manila',
    lastLocation: 'Cebu City',
    latitude: 14.6,
    longitude: 121.1,
    recordedAt: '2024-01-02T00:00:00Z',
    slaBreached: true,
  },
]

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children }: { children: React.ReactNode }) => <div data-testid="map-marker">{children}</div>,
  Popup: ({ children }: { children: React.ReactNode }) => <div data-testid="map-popup">{children}</div>,
  useMapEvents: () => null,
}))

vi.mock('leaflet', () => ({
  default: {
    icon: () => ({}),
  },
}))

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => ({ data: mockWaybills, refetch: vi.fn() })),
}))

vi.mock('@/services/api', () => ({
  gpsService: {},
}))

describe('MapViewPage', () => {
  it('renders title and shipment count', () => {
    render(
      <BrowserRouter>
        <MapViewPage />
      </BrowserRouter>,
    )
    expect(screen.getByText('Real-Time GPS Tracking')).toBeDefined()
    expect(screen.getByText('2 active shipments')).toBeDefined()
  })

  it('renders the map container', () => {
    render(
      <BrowserRouter>
        <MapViewPage />
      </BrowserRouter>,
    )
    expect(screen.getByTestId('map-container')).toBeDefined()
    expect(screen.getByTestId('tile-layer')).toBeDefined()
  })

  it('renders markers for each waybill', () => {
    render(
      <BrowserRouter>
        <MapViewPage />
      </BrowserRouter>,
    )
    const markers = screen.getAllByTestId('map-marker')
    expect(markers.length).toBe(2)
  })
})

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import WaybillListPage from './WaybillListPage'
import type { Waybill } from '@/types/waybill'

const mockWaybills: Waybill[] = [
  {
    id: '1',
    trackingNumber: 'WBT-001',
    shipperId: 's1',
    shipperName: 'Acme Co',
    recipientName: 'John Doe',
    recipientAddress: '123 Main St',
    recipientPhone: '+1234567890',
    origin: 'Manila',
    destination: 'Cebu',
    weight: 1.5,
    dimensions: '10x10x10',
    serviceType: 'STANDARD',
    status: 'CREATED',
    estimatedDelivery: '2024-01-05T00:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    events: [],
  },
  {
    id: '2',
    trackingNumber: 'WBT-002',
    shipperId: 's2',
    shipperName: 'Globex',
    recipientName: 'Jane Doe',
    recipientAddress: '456 Oak St',
    recipientPhone: '+0987654321',
    origin: 'Cebu',
    destination: 'Manila',
    weight: 2.0,
    dimensions: '20x20x20',
    serviceType: 'EXPRESS',
    status: 'IN_TRANSIT',
    estimatedDelivery: '2024-01-06T00:00:00Z',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    events: [],
  },
]

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn((opts: any) => {
    if (opts.queryKey[0] === 'waybills') {
      return { data: mockWaybills, isLoading: false }
    }
    if (opts.queryKey[0] === 'dwell-alerts') {
      return { data: [] }
    }
    return { data: undefined, isLoading: false }
  }),
}))

vi.mock('@/services/api', () => ({
  waybillService: {},
  dwellTimeService: {},
}))

describe('WaybillListPage', () => {
  it('renders title and new waybill link', () => {
    render(
      <BrowserRouter>
        <WaybillListPage />
      </BrowserRouter>,
    )
    expect(screen.getByText('Waybills')).toBeDefined()
    expect(screen.getByText('+ New Waybill')).toBeDefined()
  })

  it('renders waybill rows with tracking numbers', () => {
    render(
      <BrowserRouter>
        <WaybillListPage />
      </BrowserRouter>,
    )
    expect(screen.getByText('WBT-001')).toBeDefined()
    expect(screen.getByText('WBT-002')).toBeDefined()
  })

  it('renders status badges', () => {
    render(
      <BrowserRouter>
        <WaybillListPage />
      </BrowserRouter>,
    )
    expect(screen.getByText('CREATED')).toBeDefined()
    expect(screen.getByText('IN TRANSIT')).toBeDefined()
  })

  it('renders empty state when no waybills', async () => {
    const { useQuery } = await import('@tanstack/react-query')
    ;(useQuery as any).mockImplementation((opts: any) => {
      if (opts.queryKey[0] === 'waybills') {
        return { data: [], isLoading: false }
      }
      return { data: undefined, isLoading: false }
    })
    render(
      <BrowserRouter>
        <WaybillListPage />
      </BrowserRouter>,
    )
    expect(screen.getByText('No waybills found')).toBeDefined()
  })
})

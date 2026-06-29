import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import AnalyticsPage from './AnalyticsPage'

const mockStats = {
  totalWaybills: 1250,
  activeShipments: 340,
  deliveredToday: 45,
  exceptions: 12,
  slaCompliance: 94.5,
  avgTransitHours: 48,
}

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => ({ data: mockStats })),
  useState: vi.fn((initial: any) => [initial, vi.fn()]),
}))

vi.mock('@/services/api', () => ({
  analyticsService: {},
}))

describe('AnalyticsPage', () => {
  it('renders KPI dashboard title', () => {
    render(<AnalyticsPage />)
    expect(screen.getByText('KPI Dashboard')).toBeDefined()
  })

  it('renders export report button', () => {
    render(<AnalyticsPage />)
    expect(screen.getByRole('button', { name: /export report/i })).toBeDefined()
  })

  it('renders KPI cards with mocked stats', () => {
    render(<AnalyticsPage />)
    expect(screen.getByText('On-Time Delivery Rate')).toBeDefined()
    expect(screen.getByText('94.5%')).toBeDefined()
  })
})

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import DashboardPage from './DashboardPage'

vi.mock('@/services/api', () => ({
  analyticsService: {
    stats: vi.fn(),
  },
}))

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </BrowserRouter>,
  )
}

describe('DashboardPage', () => {
  it('renders dashboard heading', () => {
    renderWithProviders(<DashboardPage />)
    expect(screen.getByText('Dashboard')).toBeDefined()
  })

  it('renders stat card labels', () => {
    renderWithProviders(<DashboardPage />)
    expect(screen.getByText('Active Waybills')).toBeDefined()
    expect(screen.getByText('Delivered Today')).toBeDefined()
    expect(screen.getByText('In Transit')).toBeDefined()
    expect(screen.getByText('Pending Pickup')).toBeDefined()
  })

  it('renders Dashboard heading', () => {
    renderWithProviders(<DashboardPage />)
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeDefined()
  })
})
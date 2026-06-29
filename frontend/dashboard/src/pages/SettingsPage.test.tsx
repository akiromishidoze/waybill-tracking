import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import SettingsPage from './SettingsPage'
import type { AppSettings, Team, EscalationRule } from '@/types/waybill'

const mockSettings: AppSettings = {
  companyName: 'WaybillTrack',
  timezone: 'Asia/Manila',
  sessionTimeout: 30,
  emailNotifications: true,
  defaultServiceType: 'STANDARD',
  logoUrl: '',
}

const mockTeams: Team[] = [
  { id: 't1', name: 'North Team', description: 'Handles north region', color: '#2563eb' },
  { id: 't2', name: 'South Team', description: 'Handles south region', color: '#16a34a' },
]

const mockRules: EscalationRule[] = [
  { id: 'r1', name: 'SLA Alert', condition: 'SLA_BREACHED', threshold: 0, targetRole: 'OPS', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
]

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn((opts: any) => {
    if (opts.queryKey[0] === 'settings') return { data: mockSettings }
    if (opts.queryKey[0] === 'teams') return { data: mockTeams }
    if (opts.queryKey[0] === 'escalation-rules') return { data: mockRules }
    return { data: undefined }
  }),
  useMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
}))

vi.mock('@/services/api', () => ({
  settingsService: {},
  userService: {},
  teamService: {},
  escalationRuleService: {},
}))

describe('SettingsPage', () => {
  it('renders settings title', () => {
    render(<SettingsPage />)
    expect(screen.getByText('Settings')).toBeDefined()
  })

  it('renders user credentials section', () => {
    render(<SettingsPage />)
    expect(screen.getByText('User Credentials')).toBeDefined()
    expect(screen.getByRole('button', { name: /create user/i })).toBeDefined()
  })

  it('renders general settings section with company name', () => {
    render(<SettingsPage />)
    expect(screen.getByText('General Settings')).toBeDefined()
    expect(screen.getByText('WaybillTrack')).toBeDefined()
  })

  it('renders team list', () => {
    render(<SettingsPage />)
    expect(screen.getByText('North Team')).toBeDefined()
    expect(screen.getByText('South Team')).toBeDefined()
  })

  it('renders escalation rules', () => {
    render(<SettingsPage />)
    expect(screen.getByText('SLA Alert')).toBeDefined()
  })
})

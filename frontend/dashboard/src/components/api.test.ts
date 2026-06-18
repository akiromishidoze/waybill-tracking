import { describe, it, expect, vi, beforeEach } from 'vitest'
import { waybillService, authService, analyticsService } from './api'

vi.mock('axios', () => {
  const mockAxios = {
    create: vi.fn(() => mockAxios),
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  }

  return { default: mockAxios }
})

describe('waybillService', () => {
  it('exports list function', () => {
    expect(waybillService.list).toBeDefined()
    expect(typeof waybillService.list).toBe('function')
  })

  it('exports get function', () => {
    expect(waybillService.get).toBeDefined()
    expect(typeof waybillService.get).toBe('function')
  })

  it('exports track function', () => {
    expect(waybillService.track).toBeDefined()
    expect(typeof waybillService.track).toBe('function')
  })

  it('exports create function', () => {
    expect(waybillService.create).toBeDefined()
    expect(typeof waybillService.create).toBe('function')
  })

  it('exports updateStatus function', () => {
    expect(waybillService.updateStatus).toBeDefined()
    expect(typeof waybillService.updateStatus).toBe('function')
  })
})

describe('authService', () => {
  it('exports login function', () => {
    expect(authService.login).toBeDefined()
    expect(typeof authService.login).toBe('function')
  })

  it('exports me function', () => {
    expect(authService.me).toBeDefined()
    expect(typeof authService.me).toBe('function')
  })
})

describe('analyticsService', () => {
  it('exports stats function', () => {
    expect(analyticsService.stats).toBeDefined()
    expect(typeof analyticsService.stats).toBe('function')
  })

  it('exports slaReport function', () => {
    expect(analyticsService.slaReport).toBeDefined()
    expect(typeof analyticsService.slaReport).toBe('function')
  })

  it('exports exportExcel function', () => {
    expect(analyticsService.exportExcel).toBeDefined()
    expect(typeof analyticsService.exportExcel).toBe('function')
  })
})
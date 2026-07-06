import '@testing-library/react'
import { vi } from 'vitest'

class ResizeObserverStub {
  observe() { }
  unobserve() { }
  disconnect() { }
}

window.ResizeObserver = ResizeObserverStub as any

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const parts = key.split('.')
      return parts[parts.length - 1]
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (s) => s.toUpperCase())
        .trim()
    },
    i18n: { changeLanguage: vi.fn(), language: 'en' },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => children,
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}))
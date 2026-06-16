import '@testing-library/react'

class ResizeObserverStub {
  observe() { }
  unobserve() { }
  disconnect() { }
}

window.ResizeObserver = ResizeObserverStub as any
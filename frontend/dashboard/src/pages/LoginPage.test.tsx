import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import LoginPage from './LoginPage'

vi.mock('@/services/api', () => ({
  authService: {
    login: vi.fn(),
  },
}))

describe('LoginPage', () => {
  it('renders sign in heading', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>,
    )

    expect(screen.getByRole('heading', { name: /sign in/i })).toBeDefined()
  })

  it('renders email label', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>,
    )

    expect(screen.getByText('Email')).toBeDefined()
  })

  it('renders password label', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>,
    )

    expect(screen.getByText('Password')).toBeDefined()
  })

  it('renders sign in button', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>,
    )

    expect(screen.getByRole('button', { name: /sign in/i })).toBeDefined()
  })

  it('renders email input', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>,
    )

    expect(screen.getByRole('textbox')).toBeDefined()
  })
})
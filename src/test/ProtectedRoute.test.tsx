import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import { useAuthStore } from '../store/auth.store'
import { sign } from './helpers/jwt'

function renderWithRouter(
  element: React.ReactNode,
  { initialPath = '/' }: { initialPath?: string } = {}
) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/" element={<div>Dashboard</div>} />
        <Route
          path="/protected"
          element={<ProtectedRoute>{element}</ProtectedRoute>}
        />
        <Route
          path="/admin-only"
          element={
            <ProtectedRoute roles={['Admin']}>
              {element}
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  )
}

function loginAs(role: 'Admin' | 'Manager' | 'Buyer') {
  const token = sign({
    sub: 'user-id',
    email: 'u@t.com',
    given_name: 'A',
    family_name: 'B',
    role,
    exp: Math.floor(Date.now() / 1000) + 3600,
  })
  useAuthStore.getState().setTokens({ accessToken: token, refreshToken: 'rt' })
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, accessToken: null, refreshToken: null })
  })

  it('redirects unauthenticated user to /login', () => {
    renderWithRouter(<div>Secret</div>, { initialPath: '/protected' })
    expect(screen.getByText('Login Page')).toBeInTheDocument()
    expect(screen.queryByText('Secret')).not.toBeInTheDocument()
  })

  it('renders children for authenticated user without role restriction', () => {
    loginAs('Buyer')
    renderWithRouter(<div>Secret</div>, { initialPath: '/protected' })
    expect(screen.getByText('Secret')).toBeInTheDocument()
  })

  it('redirects to / when authenticated user lacks required role', () => {
    loginAs('Buyer')
    renderWithRouter(<div>Admin Content</div>, { initialPath: '/admin-only' })
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument()
  })

  it('renders children when authenticated user has required role', () => {
    loginAs('Admin')
    renderWithRouter(<div>Admin Content</div>, { initialPath: '/admin-only' })
    expect(screen.getByText('Admin Content')).toBeInTheDocument()
  })

  it('redirects Manager from Admin-only route to /', () => {
    loginAs('Manager')
    renderWithRouter(<div>Admin Content</div>, { initialPath: '/admin-only' })
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })
})

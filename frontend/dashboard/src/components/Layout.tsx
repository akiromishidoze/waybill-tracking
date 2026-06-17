import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import {
  Package, BarChart3, LayoutDashboard, LogOut, Eye, Settings, PieChart, Link2, Shield, ClipboardList, Truck,
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/waybills', label: 'Waybills', icon: Package },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/roadmap/tracking', label: 'Tracking', icon: Eye },
  { to: '/roadmap/operations', label: 'Operations', icon: Settings },
  { to: '/roadmap/analytics', label: 'Reports', icon: PieChart },
  { to: '/roadmap/integrations', label: 'Integrations', icon: Link2 },
  { to: '/tracking/aggregated', label: 'Multi-Carrier', icon: Truck },
]

const ROLE_COLORS: Record<string, string> = {
  ADMIN: '#7c3aed',
  OPS: '#2563eb',
  SHIPPER: '#059669',
  COURIER: '#d97706',
}

export default function Layout() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside
        style={{
          width: 260,
          background: '#1e293b',
          color: '#fff',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            WaybillTrack
          </h1>
          {!loading && user && (
            <div
              style={{
                padding: '0.625rem 0.75rem',
                background: '#334155',
                borderRadius: 8,
                fontSize: '0.8125rem',
              }}
            >
              <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{user.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: 2 }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '0.125rem 0.5rem',
                    borderRadius: 4,
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    color: '#fff',
                    background: ROLE_COLORS[user.role] || '#6b7280',
                  }}
                >
                  {user.role}
                </span>
                {user.company && (
                  <span style={{ color: '#94a3b8' }}>{user.company}</span>
                )}
              </div>
            </div>
          )}
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: 8,
                textDecoration: 'none',
                color: isActive ? '#fff' : '#94a3b8',
                background: isActive ? '#334155' : 'transparent',
                fontWeight: isActive ? 600 : 400,
              })}
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
          {user?.role === 'ADMIN' && (
            <>
              <div style={{ borderTop: '1px solid #334155', marginTop: '0.5rem', paddingTop: '0.5rem' }} />
              <NavLink
                to="/users"
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 8,
                  textDecoration: 'none',
                  color: isActive ? '#fff' : '#94a3b8',
                  background: isActive ? '#334155' : 'transparent',
                  fontWeight: isActive ? 600 : 400,
                })}
              >
                <Shield size={20} />
                Users
              </NavLink>
              <NavLink
                to="/carriers"
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 8,
                  textDecoration: 'none',
                  color: isActive ? '#fff' : '#94a3b8',
                  background: isActive ? '#334155' : 'transparent',
                  fontWeight: isActive ? 600 : 400,
                })}
              >
                <Truck size={20} />
                Carriers
              </NavLink>
              <NavLink
                to="/audit-logs"
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 8,
                  textDecoration: 'none',
                  color: isActive ? '#fff' : '#94a3b8',
                  background: isActive ? '#334155' : 'transparent',
                  fontWeight: isActive ? 600 : 400,
                })}
              >
                <ClipboardList size={20} />
                Audit Log
              </NavLink>
              <NavLink
                to="/settings"
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 8,
                  textDecoration: 'none',
                  color: isActive ? '#fff' : '#94a3b8',
                  background: isActive ? '#334155' : 'transparent',
                  fontWeight: isActive ? 600 : 400,
                })}
              >
                <Settings size={20} />
                Settings
              </NavLink>
            </>
          )}
        </nav>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            borderRadius: 8,
            fontSize: '1rem',
          }}
        >
          <LogOut size={20} />
          Logout
        </button>
      </aside>
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  )
}

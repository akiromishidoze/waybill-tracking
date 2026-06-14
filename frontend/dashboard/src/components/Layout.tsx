import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Package, BarChart3, LayoutDashboard, LogOut } from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/waybills', label: 'Waybills', icon: Package },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
]

export default function Layout() {
  const navigate = useNavigate()

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
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '2rem' }}>
          WaybillTrack
        </h1>
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

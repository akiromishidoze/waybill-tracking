import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Package, BarChart3, LayoutDashboard, LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import s from '@/styles/components.module.css'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/waybills', label: 'Waybills', icon: Package },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
]

export default function Layout() {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside className={s.sidebar}>
        <h1 className={s.sidebarBrand}>WaybillTrack</h1>
        <nav className={s.sidebarNav}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [s.navLink, isActive ? s.navLinkActive : ''].join(' ')
              }
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button onClick={handleLogout} className={s.logoutBtn}>
          <LogOut size={20} />
          Logout
        </button>
      </aside>

      <main className={s.mainContent}>
        <Outlet />
      </main>
    </div>
  )
}
import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import ErrorBoundary from '@/components/ErrorBoundary'
import { useTheme } from '@/contexts/ThemeContext'
import {
  Package, BarChart3, LayoutDashboard, LogOut, Eye, Settings, PieChart, Link2, Shield, ClipboardList, Truck, Webhook, TrendingUp, MapPin, ArrowLeftRight, Clock, ChevronDown, ChevronRight, Map, Navigation, Bell, Globe, Sun, Moon, DollarSign, Calculator, Leaf, ShoppingCart, Activity, MessageSquare,
} from 'lucide-react'

interface NavGroup {
  label: string
  icon: typeof Eye
  items: { to: string; label: string; icon: typeof Eye }[]
}

const navGroups: NavGroup[] = [
  {
    label: 'Tracking', icon: Eye,
    items: [
      { to: '/tracking/aggregated', label: 'Multi-Carrier', icon: Truck },
      { to: '/batch-status', label: 'Batch Status', icon: ClipboardList },
      { to: '/map', label: 'GPS Tracking', icon: MapPin },
      { to: '/geofence', label: 'Geofence Events', icon: Map },
      { to: '/roadmap/tracking', label: 'Roadmap', icon: Eye },
    ],
  },
  {
    label: 'Operations', icon: Settings,
    items: [
      { to: '/returns', label: 'Returns', icon: ArrowLeftRight },
      { to: '/driver-app', label: 'Driver App', icon: Truck },
      { to: '/customs', label: 'Customs & Compliance', icon: Globe },
      { to: '/rerouting', label: 'Re-routing', icon: Navigation },
      { to: '/auto-comms', label: 'Auto Comms', icon: Bell },
      { to: '/dwell-alerts', label: 'Dwell Alerts', icon: Clock },
      { to: '/cod', label: 'COD Reconciliation', icon: DollarSign },
      { to: '/escalations', label: 'Escalations', icon: ArrowLeftRight },
      { to: '/roadmap/operations', label: 'Roadmap', icon: Settings },
    ],
  },
  {
    label: 'Reports', icon: PieChart,
    items: [
      { to: '/carrier-performance', label: 'Carrier Scoreboard', icon: TrendingUp },
      { to: '/reports/schedules', label: 'Scheduled Reports', icon: PieChart },
      { to: '/analytics/regions', label: 'Region Performance', icon: BarChart3 },
      { to: '/analytics/bi-tools', label: 'BI Integrations', icon: BarChart3 },
      { to: '/analytics/cost-per-shipment', label: 'Cost Analytics', icon: Calculator },
      { to: '/analytics/demand-forecast', label: 'Demand Forecast', icon: BarChart3 },
      { to: '/analytics/carbon-footprint', label: 'Carbon Footprint', icon: Leaf },
      { to: '/roadmap/analytics', label: 'Roadmap', icon: PieChart },
    ],
  },
  {
    label: 'Integrations', icon: Link2,
    items: [
      { to: '/webhooks', label: 'Webhooks', icon: Webhook },
      { to: '/integrations/erp', label: 'ERP Integrations', icon: Link2 },
      { to: '/integrations/ecommerce', label: 'E-Commerce', icon: ShoppingCart },
      { to: '/integrations/white-label', label: 'White-Label Portal', icon: Globe },
      { to: '/integrations/iot-sensors', label: 'IoT Sensors', icon: Activity },
      { to: '/integrations/chatbot', label: 'AI Chatbot', icon: MessageSquare },
      { to: '/audit-logs', label: 'Audit Log', icon: ClipboardList },
      { to: '/roadmap/integrations', label: 'Roadmap', icon: Link2 },
    ],
  },
]

const ROLE_COLORS: Record<string, string> = {
  ADMIN: '#7c3aed',
  OPS: '#2563eb',
  SHIPPER: '#059669',
  COURIER: '#d97706',
}

const navLinkStyle = (isActive: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.75rem 1rem',
  borderRadius: 8,
  textDecoration: 'none',
  color: isActive ? '#fff' : '#94a3b8',
  background: isActive ? '#334155' : 'transparent',
  fontWeight: isActive ? 600 : 400,
  fontSize: '0.75rem',
})

const subLinkStyle = (isActive: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.5rem 1rem 0.5rem 2.5rem',
  borderRadius: 6,
  textDecoration: 'none',
  color: isActive ? '#fff' : '#94a3b8',
  background: isActive ? '#334155' : 'transparent',
  fontWeight: isActive ? 600 : 400,
  fontSize: '0.75rem',
})

function NavGroupSection({ group }: { group: NavGroup }) {
  const location = useLocation()
  const isActiveGroup = group.items.some(item => location.pathname === item.to || location.pathname.startsWith(item.to + '/'))
  const [open, setOpen] = useState(isActiveGroup)

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
          borderRadius: 8, border: 'none', background: 'transparent', color: isActiveGroup ? '#fff' : '#94a3b8',
          fontWeight: isActiveGroup ? 600 : 400, fontSize: '0.75rem', cursor: 'pointer', width: '100%', textAlign: 'left',
        }}
        className="nav-link"
      >
        <group.icon size={20} />
        {group.label}
        <span style={{ marginLeft: 'auto' }}>{open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</span>
      </button>
      {open && group.items.map(item => (
        <NavLink key={item.to} to={item.to} style={({ isActive }) => subLinkStyle(isActive)} className="nav-link" end>
          <item.icon size={16} />
          {item.label}
        </NavLink>
      ))}
    </div>
  )
}

export default function Layout() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <aside style={{ width: 260, background: '#1e293b', color: '#fff', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>WaybillTrack</h1>
          {!loading && user && (
            <div style={{ padding: '0.625rem 0.75rem', background: '#334155', borderRadius: 8, fontSize: '0.8125rem' }}>
              <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{user.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: 2 }}>
                <span style={{ display: 'inline-block', padding: '0.125rem 0.5rem', borderRadius: 4, fontSize: '0.6875rem', fontWeight: 600, color: '#fff', background: ROLE_COLORS[user.role] || '#6b7280' }}>
                  {user.role}
                </span>
                {user.company && <span style={{ color: '#94a3b8' }}>{user.company}</span>}
              </div>
            </div>
          )}
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, overflowY: 'auto', minHeight: 0 }} className="custom-scrollbar">
          <NavLink to="/dashboard" style={({ isActive }) => navLinkStyle(isActive)} className="nav-link">
            <LayoutDashboard size={20} /> Dashboard
          </NavLink>
          <NavLink to="/waybills" style={({ isActive }) => navLinkStyle(isActive)} className="nav-link">
            <Package size={20} /> Waybills
          </NavLink>
          <NavLink to="/analytics" style={({ isActive }) => navLinkStyle(isActive)} className="nav-link">
            <BarChart3 size={20} /> Analytics
          </NavLink>
          <div style={{ borderTop: '1px solid #334155', margin: '0.25rem 0' }} />
          {navGroups.map(group => (
            <NavGroupSection key={group.label} group={group} />
          ))}
          {user?.role === 'ADMIN' && (
            <>
              <div style={{ borderTop: '1px solid #334155', marginTop: '0.25rem', paddingTop: '0.25rem' }} />
              <NavLink to="/users" style={({ isActive }) => navLinkStyle(isActive)} className="nav-link">
                <Shield size={20} /> Users
              </NavLink>
              <NavLink to="/carriers" style={({ isActive }) => navLinkStyle(isActive)} className="nav-link">
                <Truck size={20} /> Carriers
              </NavLink>
              <NavLink to="/settings" style={({ isActive }) => navLinkStyle(isActive)} className="nav-link">
                <Settings size={20} /> Settings
              </NavLink>
            </>
          )}
        </nav>
        <button onClick={toggleTheme} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', borderRadius: 8, fontSize: '1rem' }}>
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />} {theme === 'dark' ? 'Light' : 'Dark'} Mode
        </button>
        <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', borderRadius: 8, fontSize: '1rem' }}>
          <LogOut size={20} /> Logout
        </button>
      </aside>
      <style>{`
        body { margin: 0; overflow: hidden; }
        .nav-link:hover { background: rgb(51, 65, 85) !important; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #1e293b; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #64748b; }
      `}</style>
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  )
}

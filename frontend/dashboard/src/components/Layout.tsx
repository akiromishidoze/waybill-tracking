import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import ErrorBoundary from '@/components/ErrorBoundary'
import PageTitle from '@/components/PageTitle'
import { useTheme } from '@/contexts/ThemeContext'
import {
  Package, BarChart3, LayoutDashboard, LogOut, Eye, Settings, PieChart, Link2, Shield, ClipboardList, Truck, Webhook, TrendingUp, MapPin, ArrowLeftRight, Clock, ChevronDown, ChevronRight, Map, Navigation, Bell, Globe, Sun, Moon, DollarSign, Calculator, Leaf, ShoppingCart, Activity, UploadCloud, Languages,
} from 'lucide-react'

interface NavGroupDef {
  labelKey: string
  icon: typeof Eye
  items: { to: string; labelKey: string; icon: typeof Eye }[]
}

const navGroupDefs: NavGroupDef[] = [
  {
    labelKey: 'nav.tracking', icon: Eye,
    items: [
      { to: '/tracking/aggregated', labelKey: 'nav.multiCarrier', icon: Truck },
      { to: '/batch-status', labelKey: 'nav.batchStatus', icon: ClipboardList },
      { to: '/map', labelKey: 'nav.gpsTracking', icon: MapPin },
      { to: '/gps-simulator', labelKey: 'nav.gpsSimulator', icon: Navigation },
      { to: '/geofence', labelKey: 'nav.geofenceEvents', icon: Map },
      { to: '/roadmap/tracking', labelKey: 'nav.roadmap', icon: Eye },
    ],
  },
  {
    labelKey: 'nav.operations', icon: Settings,
    items: [
      { to: '/returns', labelKey: 'nav.returns', icon: ArrowLeftRight },
      { to: '/driver-app', labelKey: 'nav.driverApp', icon: Truck },
      { to: '/driver-pwa', labelKey: 'nav.driverPwa', icon: Navigation },
      { to: '/customs', labelKey: 'nav.customsCompliance', icon: Globe },
      { to: '/rerouting', labelKey: 'nav.rerouting', icon: Navigation },
      { to: '/auto-comms', labelKey: 'nav.autoComms', icon: Bell },
      { to: '/dwell-alerts', labelKey: 'nav.dwellAlerts', icon: Clock },
      { to: '/cod', labelKey: 'nav.codReconciliation', icon: DollarSign },
      { to: '/escalations', labelKey: 'nav.escalations', icon: ArrowLeftRight },
      { to: '/roadmap/operations', labelKey: 'nav.roadmap', icon: Settings },
    ],
  },
  {
    labelKey: 'nav.reports', icon: PieChart,
    items: [
      { to: '/carrier-performance', labelKey: 'nav.carrierScoreboard', icon: TrendingUp },
      { to: '/reports/schedules', labelKey: 'nav.scheduledReports', icon: PieChart },
      { to: '/analytics/regions', labelKey: 'nav.regionPerformance', icon: BarChart3 },
      { to: '/analytics/bi-tools', labelKey: 'nav.biIntegrations', icon: BarChart3 },
      { to: '/analytics/cost-per-shipment', labelKey: 'nav.costAnalytics', icon: Calculator },
      { to: '/analytics/demand-forecast', labelKey: 'nav.demandForecast', icon: BarChart3 },
      { to: '/analytics/carbon-footprint', labelKey: 'nav.carbonFootprint', icon: Leaf },
      { to: '/roadmap/analytics', labelKey: 'nav.roadmap', icon: PieChart },
    ],
  },
  {
    labelKey: 'nav.integrations', icon: Link2,
    items: [
      { to: '/webhooks', labelKey: 'nav.webhooks', icon: Webhook },
      { to: '/integrations/erp', labelKey: 'nav.erpIntegrations', icon: Link2 },
      { to: '/integrations/ecommerce', labelKey: 'nav.ecommerce', icon: ShoppingCart },
      { to: '/integrations/white-label', labelKey: 'nav.whiteLabelPortal', icon: Globe },
      { to: '/integrations/iot-sensors', labelKey: 'nav.iotSensors', icon: Activity },
      { to: '/audit-logs', labelKey: 'nav.auditLog', icon: ClipboardList },
      { to: '/roadmap/integrations', labelKey: 'nav.roadmap', icon: Link2 },
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

function NavGroupSection({ group }: { group: NavGroupDef }) {
  const { t } = useTranslation()
  const location = useLocation()
  const isActiveGroup = group.items.some(item => location.pathname === item.to || location.pathname.startsWith(item.to + '/'))
  const [open, setOpen] = useState(isActiveGroup)
  const groupLabel = t(group.labelKey)
  const groupId = `nav-group-${group.labelKey.replace(/\./g, '-')}`

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setOpen(!open)
    }
  }

  return (
    <div role="group" aria-label={groupLabel}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onKeyDown={handleKeyDown}
        aria-expanded={open}
        aria-controls={groupId}
        aria-label={`${groupLabel} navigation group`}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
          borderRadius: 8, border: 'none', background: 'transparent', color: isActiveGroup ? '#fff' : '#94a3b8',
          fontWeight: isActiveGroup ? 600 : 400, fontSize: '0.75rem', cursor: 'pointer', width: '100%', textAlign: 'left',
        }}
        className="nav-link"
      >
        <group.icon size={20} aria-hidden="true" />
        {groupLabel}
        <span style={{ marginLeft: 'auto' }} aria-hidden="true">{open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</span>
      </button>
      {open && (
        <div id={groupId} role="region" aria-label={`${groupLabel} links`}>
          {group.items.map(item => {
            const itemLabel = t(item.labelKey)
            return (
              <NavLink key={item.to} to={item.to} style={({ isActive }) => subLinkStyle(isActive)} className="nav-link" end aria-label={itemLabel}>
                <item.icon size={16} aria-hidden="true" />
                {itemLabel}
              </NavLink>
            )
          })}
        </div>
      )}
    </div>
  )
}

const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/waybills': 'Waybills',
  '/waybills/import': 'Import Waybills',
  '/analytics': 'Analytics',
  '/users': 'Users',
  '/audit-logs': 'Audit Logs',
  '/carriers': 'Carriers',
  '/webhooks': 'Webhooks',
  '/escalations': 'Escalations',
  '/batch-status': 'Batch Status',
  '/settings': 'Settings',
  '/map': 'GPS Tracking',
  '/tracking/aggregated': 'Multi-Carrier Tracking',
  '/returns': 'Returns',
  '/geofence': 'Geofence Events',
  '/dwell-alerts': 'Dwell Alerts',
  '/scheduled-reports': 'Scheduled Reports',
  '/carrier-performance': 'Carrier Performance',
  '/region-performance': 'Region Performance',
  '/cost-analytics': 'Cost Analytics',
  '/demand-forecast': 'Demand Forecast',
  '/carbon-footprint': 'Carbon Footprint',
  '/iot-sensors': 'IoT Sensors',
  '/chatbot': 'Chatbot',
  '/customs-compliance': 'Customs Compliance',
  '/cod': 'COD',
  '/erp-integrations': 'ERP Integrations',
  '/bi-integrations': 'BI Integrations',
  '/ecommerce-integrations': 'E-Commerce Integrations',
  '/white-label': 'White Label Portal',
  '/driver-app': 'Driver App',
  '/dynamic-rerouting': 'Dynamic Rerouting',
  '/auto-communications': 'Auto Communications',
  '/roadmap/tracking': 'Roadmap Tracking',
  '/roadmap/operations': 'Roadmap Operations',
  '/roadmap/analytics': 'Roadmap Analytics',
  '/roadmap/integrations': 'Roadmap Integrations',
  '/unauthorized': 'Unauthorized',
}

function getPageTitle(pathname: string): string {
  if (routeTitles[pathname]) return routeTitles[pathname]
  if (pathname.startsWith('/waybills/')) return 'Waybill Details'
  if (pathname.startsWith('/tracking/')) return 'Tracking'
  return 'Dashboard'
}

export default function Layout() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { t, i18n } = useTranslation()
  const location = useLocation()

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    navigate('/login')
  }

  const toggleLanguage = () => {
    const next = i18n.language.startsWith('tl') ? 'en' : 'tl'
    i18n.changeLanguage(next)
  }

  const currentLangLabel = i18n.language.startsWith('tl') ? t('language.tl') : t('language.en')

  return (
    <>
      <PageTitle title={getPageTitle(location.pathname)} />
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        <a href="#main-content" className="skip-link">Skip to main content</a>
      <aside role="complementary" aria-label="Sidebar navigation" style={{ width: 260, background: '#1e293b', color: '#fff', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>WaybillTrack</h1>
          {!loading && user && (
            <div style={{ padding: '0.625rem 0.75rem', background: '#334155', borderRadius: 8, fontSize: '0.8125rem' }} aria-label="User profile">
              <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{user.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: 2 }}>
                <span style={{ display: 'inline-block', padding: '0.125rem 0.5rem', borderRadius: 4, fontSize: '0.6875rem', fontWeight: 600, color: '#fff', background: ROLE_COLORS[user.role] || '#6b7280' }} aria-label={`Role: ${user.role}`}>
                  {user.role}
                </span>
                {user.company && <span style={{ color: '#94a3b8' }}>{user.company}</span>}
              </div>
            </div>
          )}
        </div>

        <nav role="navigation" aria-label="Primary navigation" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, overflowY: 'auto', minHeight: 0 }} className="custom-scrollbar">
          <NavLink to="/dashboard" style={({ isActive }) => navLinkStyle(isActive)} className="nav-link" aria-label={t('nav.dashboard')}>
            <LayoutDashboard size={20} aria-hidden="true" /> {t('nav.dashboard')}
          </NavLink>
          <NavLink to="/waybills" style={({ isActive }) => navLinkStyle(isActive)} className="nav-link" aria-label={t('nav.waybills')}>
            <Package size={20} aria-hidden="true" /> {t('nav.waybills')}
          </NavLink>
          <NavLink to="/waybills/import" style={({ isActive }) => navLinkStyle(isActive)} className="nav-link" aria-label={t('nav.importWaybills')}>
            <UploadCloud size={20} aria-hidden="true" /> {t('nav.importWaybills')}
          </NavLink>
          <NavLink to="/analytics" style={({ isActive }) => navLinkStyle(isActive)} className="nav-link" aria-label={t('nav.analytics')}>
            <BarChart3 size={20} aria-hidden="true" /> {t('nav.analytics')}
          </NavLink>
          <div style={{ borderTop: '1px solid #334155', margin: '0.25rem 0' }} aria-hidden="true" />
          {navGroupDefs.map(group => (
            <NavGroupSection key={group.labelKey} group={group} />
          ))}
          {user?.role === 'ADMIN' && (
            <>
              <div style={{ borderTop: '1px solid #334155', marginTop: '0.25rem', paddingTop: '0.25rem' }} aria-hidden="true" />
              <NavLink to="/users" style={({ isActive }) => navLinkStyle(isActive)} className="nav-link" aria-label={t('nav.users')}>
                <Shield size={20} aria-hidden="true" /> {t('nav.users')}
              </NavLink>
              <NavLink to="/carriers" style={({ isActive }) => navLinkStyle(isActive)} className="nav-link" aria-label={t('nav.carriers')}>
                <Truck size={20} aria-hidden="true" /> {t('nav.carriers')}
              </NavLink>
              <NavLink to="/settings" style={({ isActive }) => navLinkStyle(isActive)} className="nav-link" aria-label={t('nav.settings')}>
                <Settings size={20} aria-hidden="true" /> {t('nav.settings')}
              </NavLink>
            </>
          )}
        </nav>
        <button type="button" onClick={toggleLanguage} aria-label={`Switch language, current: ${currentLangLabel}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', borderRadius: 8, fontSize: '1rem' }}>
          <Languages size={20} aria-hidden="true" /> {currentLangLabel}
        </button>
        <button type="button" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', borderRadius: 8, fontSize: '1rem' }}>
          {theme === 'dark' ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />} {theme === 'dark' ? t('nav.lightMode') : t('nav.darkMode')}
        </button>
        <button type="button" onClick={handleLogout} aria-label={t('nav.logout')} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', borderRadius: 8, fontSize: '1rem' }}>
          <LogOut size={20} aria-hidden="true" /> {t('nav.logout')}
        </button>
      </aside>
      <style>{`
        body { margin: 0; overflow: hidden; }
        .nav-link:hover { background: rgb(51, 65, 85) !important; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #1e293b; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #64748b; }
        .skip-link { position: absolute; top: -40px; left: 0; background: #2563eb; color: #fff; padding: 8px 16px; z-index: 100; text-decoration: none; border-radius: 0 0 8px 0; font-weight: 600; transition: top 0.2s; }
        .skip-link:focus { top: 0; }
      `}</style>
      <main id="main-content" role="main" aria-label="Main content" style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        <div aria-live="polite" aria-atomic="true" className="sr-only" style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
          {/* Screen reader announcements can be injected here */}
        </div>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  </>
)
}

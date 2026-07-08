import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import TrackingPage from './pages/TrackingPage'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastProvider } from './contexts/ToastContext'

const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const WaybillListPage = lazy(() => import('./pages/WaybillListPage'))
const WaybillNewPage = lazy(() => import('./pages/WaybillNewPage'))
const WaybillDetailPage = lazy(() => import('./pages/WaybillDetailPage'))
const WaybillImportPage = lazy(() => import('./pages/WaybillImportPage'))
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'))
const UsersPage = lazy(() => import('./pages/UsersPage'))
const AuditLogPage = lazy(() => import('./pages/AuditLogPage'))
const CarriersPage = lazy(() => import('./pages/CarriersPage'))
const AggregatedTrackingPage = lazy(() => import('./pages/AggregatedTrackingPage'))
const BatchStatusPage = lazy(() => import('./pages/BatchStatusPage'))
const WebhooksPage = lazy(() => import('./pages/WebhooksPage'))
const CarrierPerformancePage = lazy(() => import('./pages/CarrierPerformancePage'))
const MapViewPage = lazy(() => import('./pages/MapViewPage'))
const ReturnsPage = lazy(() => import('./pages/ReturnsPage'))
const DwellAlertsPage = lazy(() => import('./pages/DwellAlertsPage'))
const GeofenceEventsPage = lazy(() => import('./pages/GeofenceEventsPage'))
const RegionPerformancePage = lazy(() => import('./pages/RegionPerformancePage'))
const ErpIntegrationsPage = lazy(() => import('./pages/ErpIntegrationsPage'))
const CODPage = lazy(() => import('./pages/CODPage'))
const CostAnalyticsPage = lazy(() => import('./pages/CostAnalyticsPage'))
const DemandForecastingPage = lazy(() => import('./pages/DemandForecastingPage'))
const CarbonFootprintPage = lazy(() => import('./pages/CarbonFootprintPage'))
const IotSensorPage = lazy(() => import('./pages/IotSensorPage'))
const GPSSimulatorPage = lazy(() => import('./pages/GPSSimulatorPage'))
const RoadmapTrackingPage = lazy(() => import('./pages/RoadmapTrackingPage'))
const RoadmapOperationsPage = lazy(() => import('./pages/RoadmapOperationsPage'))
const RoadmapAnalyticsPage = lazy(() => import('./pages/RoadmapAnalyticsPage'))
const RoadmapIntegrationsPage = lazy(() => import('./pages/RoadmapIntegrationsPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const ScheduledReportsPage = lazy(() => import('./pages/ScheduledReportsPage'))
const DriverAppPage = lazy(() => import('./pages/DriverAppPage'))
const ECommerceIntegrationsPage = lazy(() => import('./pages/ECommerceIntegrationsPage'))
const CustomsCompliancePage = lazy(() => import('./pages/CustomsCompliancePage'))
const EscalationsPage = lazy(() => import('./pages/EscalationsPage'))
const BiIntegrationsPage = lazy(() => import('./pages/BiIntegrationsPage'))
const AutoCommunicationsPage = lazy(() => import('./pages/AutoCommunicationsPage'))
const DynamicReroutingPage = lazy(() => import('./pages/DynamicReroutingPage'))
const WhiteLabelPortalPage = lazy(() => import('./pages/WhiteLabelPortalPage'))
const DriverPWAPage = lazy(() => import('./pages/DriverPWAPage'))
const UnauthorizedPage = lazy(() => import('./pages/UnauthorizedPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--color-text-muted)' }}>
    Loading page...
  </div>
)

export default function App() {
  return (
    <ThemeProvider>
    <ToastProvider>
    <ErrorBoundary>
    <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/track/:trackingNumber" element={<TrackingPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/waybills" element={<WaybillListPage />} />
          <Route path="/waybills/new" element={<WaybillNewPage />} />
          <Route path="/waybills/import" element={<WaybillImportPage />} />
          <Route path="/waybills/:id" element={<WaybillDetailPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/tracking/aggregated" element={<AggregatedTrackingPage />} />
          <Route path="/batch-status" element={<BatchStatusPage />} />
          <Route path="/carrier-performance" element={<CarrierPerformancePage />} />

          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/users" element={<UsersPage />} />
            <Route path="/audit-logs" element={<AuditLogPage />} />
            <Route path="/carriers" element={<CarriersPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/webhooks" element={<WebhooksPage />} />
          </Route>
          <Route path="/map" element={<MapViewPage />} />
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'OPS']} />}>
            <Route path="/gps-simulator" element={<GPSSimulatorPage />} />
          </Route>
          <Route path="/returns" element={<ReturnsPage />} />
          <Route path="/escalations" element={<EscalationsPage />} />
          <Route path="/driver-app" element={<DriverAppPage />} />
          <Route path="/driver-pwa" element={<DriverPWAPage />} />
           <Route path="/rerouting" element={<DynamicReroutingPage />} />
           <Route path="/customs" element={<CustomsCompliancePage />} />
          <Route path="/cod" element={<CODPage />} />
          <Route path="/auto-comms" element={<AutoCommunicationsPage />} />
          <Route path="/dwell-alerts" element={<DwellAlertsPage />} />
          <Route path="/geofence" element={<GeofenceEventsPage />} />
          <Route path="/reports/schedules" element={<ScheduledReportsPage />} />
          <Route path="/analytics/regions" element={<RegionPerformancePage />} />
          <Route path="/analytics/bi-tools" element={<BiIntegrationsPage />} />
          <Route path="/analytics/cost-per-shipment" element={<CostAnalyticsPage />} />
          <Route path="/analytics/demand-forecast" element={<DemandForecastingPage />} />
          <Route path="/analytics/carbon-footprint" element={<CarbonFootprintPage />} />
          <Route path="/integrations/erp" element={<ErpIntegrationsPage />} />
          <Route path="/integrations/ecommerce" element={<ECommerceIntegrationsPage />} />
          <Route path="/integrations/white-label" element={<WhiteLabelPortalPage />} />
          <Route path="/integrations/iot-sensors" element={<IotSensorPage />} />
          <Route path="/roadmap/tracking" element={<RoadmapTrackingPage />} />
          <Route path="/roadmap/operations" element={<RoadmapOperationsPage />} />
          <Route path="/roadmap/analytics" element={<RoadmapAnalyticsPage />} />
          <Route path="/roadmap/integrations" element={<RoadmapIntegrationsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </Suspense>
    </ErrorBoundary>
    </ToastProvider>
    </ThemeProvider>
  )
}

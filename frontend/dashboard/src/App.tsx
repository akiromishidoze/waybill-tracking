import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import WaybillListPage from './pages/WaybillListPage'
import WaybillNewPage from './pages/WaybillNewPage'
import WaybillDetailPage from './pages/WaybillDetailPage'
import TrackingPage from './pages/TrackingPage'
import AnalyticsPage from './pages/AnalyticsPage'
import UsersPage from './pages/UsersPage'
import AuditLogPage from './pages/AuditLogPage'
import CarriersPage from './pages/CarriersPage'
import AggregatedTrackingPage from './pages/AggregatedTrackingPage'
import SettingsPage from './pages/SettingsPage'
import BatchStatusPage from './pages/BatchStatusPage'
import WebhooksPage from './pages/WebhooksPage'
import CarrierPerformancePage from './pages/CarrierPerformancePage'
import MapViewPage from './pages/MapViewPage'
import ReturnsPage from './pages/ReturnsPage'
import RoadmapTrackingPage from './pages/RoadmapTrackingPage'
import RoadmapOperationsPage from './pages/RoadmapOperationsPage'
import RoadmapAnalyticsPage from './pages/RoadmapAnalyticsPage'
import RoadmapIntegrationsPage from './pages/RoadmapIntegrationsPage'
import EscalationsPage from './pages/EscalationsPage'
import DwellAlertsPage from './pages/DwellAlertsPage'
import GeofenceEventsPage from './pages/GeofenceEventsPage'
import ScheduledReportsPage from './pages/ScheduledReportsPage'
import RegionPerformancePage from './pages/RegionPerformancePage'
import ErpIntegrationsPage from './pages/ErpIntegrationsPage'
import DriverAppPage from './pages/DriverAppPage'
import DynamicReroutingPage from './pages/DynamicReroutingPage'
import AutoCommunicationsPage from './pages/AutoCommunicationsPage'
import CustomsCompliancePage from './pages/CustomsCompliancePage'
import CODPage from './pages/CODPage'
import BiIntegrationsPage from './pages/BiIntegrationsPage'
import CostAnalyticsPage from './pages/CostAnalyticsPage'
import DemandForecastingPage from './pages/DemandForecastingPage'
import CarbonFootprintPage from './pages/CarbonFootprintPage'
import ECommerceIntegrationsPage from './pages/ECommerceIntegrationsPage'
import WhiteLabelPortalPage from './pages/WhiteLabelPortalPage'
import WaybillImportPage from './pages/WaybillImportPage'
import IotSensorPage from './pages/IotSensorPage'
import GPSSimulatorPage from './pages/GPSSimulatorPage'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import UnauthorizedPage from './pages/UnauthorizedPage'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastProvider } from './contexts/ToastContext'

export default function App() {
  return (
    <ThemeProvider>
    <ToastProvider>
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
          <Route path="/gps-simulator" element={<GPSSimulatorPage />} />
          <Route path="/returns" element={<ReturnsPage />} />
          <Route path="/escalations" element={<EscalationsPage />} />
          <Route path="/driver-app" element={<DriverAppPage />} />
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
    </Routes>
    </ToastProvider>
    </ThemeProvider>
  )
}

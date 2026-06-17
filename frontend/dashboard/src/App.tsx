import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import WaybillListPage from './pages/WaybillListPage'
import WaybillDetailPage from './pages/WaybillDetailPage'
import TrackingPage from './pages/TrackingPage'
import AnalyticsPage from './pages/AnalyticsPage'
import UsersPage from './pages/UsersPage'
import RoadmapTrackingPage from './pages/RoadmapTrackingPage'
import RoadmapOperationsPage from './pages/RoadmapOperationsPage'
import RoadmapAnalyticsPage from './pages/RoadmapAnalyticsPage'
import RoadmapIntegrationsPage from './pages/RoadmapIntegrationsPage'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/track/:trackingNumber" element={<TrackingPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/waybills" element={<WaybillListPage />} />
          <Route path="/waybills/:id" element={<WaybillDetailPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/roadmap/tracking" element={<RoadmapTrackingPage />} />
          <Route path="/roadmap/operations" element={<RoadmapOperationsPage />} />
          <Route path="/roadmap/analytics" element={<RoadmapAnalyticsPage />} />
          <Route path="/roadmap/integrations" element={<RoadmapIntegrationsPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

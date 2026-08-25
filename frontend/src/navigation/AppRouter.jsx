import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from '../layouts/AppShell.jsx'
import EventBoardPage from '../pages/EventBoardPage.jsx'
import CreateEventPage from '../pages/CreateEventPage.jsx'
import EventDetailsPage from '../pages/EventDetailsPage.jsx'
import CalendarPage from '../pages/CalendarPage.jsx'
import CommunityRequestsPage from '../pages/CommunityRequestsPage.jsx'
import CreateEventRequestPage from '../pages/CreateEventRequestPage.jsx'
import EventRequestDetailsPage from '../pages/EventRequestDetailsPage.jsx'
import LoginPage from '../pages/LoginPage.jsx'
import RegisterPage from '../pages/RegisterPage.jsx'
import ProtectedRoute from './ProtectedRoute.jsx'
import { useAuth } from '../context/AuthContext.jsx'

function PublicOnly({ children }) {
  const { loading, authenticated } = useAuth()
  if (loading) return <div className="page-placeholder"><p>Checking authentication…</p></div>
  if (authenticated) return <Navigate to="/" replace />
  return children
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><RegisterPage /></PublicOnly>} />
      <Route element={<AppShell />}>
        <Route path="/" element={<EventBoardPage />} />
        <Route path="/events/new" element={<ProtectedRoute><CreateEventPage /></ProtectedRoute>} />
        <Route path="/events/:eventId" element={<EventDetailsPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/community-requests" element={<CommunityRequestsPage />} />
        <Route path="/community-requests/new" element={<ProtectedRoute><CreateEventRequestPage /></ProtectedRoute>} />
        <Route path="/community-requests/:requestId" element={<EventRequestDetailsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

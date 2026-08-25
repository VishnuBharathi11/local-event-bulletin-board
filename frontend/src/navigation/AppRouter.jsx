import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from '../layouts/AppShell.jsx'
import EventBoardPage from '../pages/EventBoardPage.jsx'
import CreateEventPage from '../pages/CreateEventPage.jsx'
import EventDetailsPage from '../pages/EventDetailsPage.jsx'
import CalendarPage from '../pages/CalendarPage.jsx'
import CommunityRequestsPage from '../pages/CommunityRequestsPage.jsx'
import CreateEventRequestPage from '../pages/CreateEventRequestPage.jsx'
import EventRequestDetailsPage from '../pages/EventRequestDetailsPage.jsx'

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<EventBoardPage />} />
        <Route path="/events/new" element={<CreateEventPage />} />
        <Route path="/events/:eventId" element={<EventDetailsPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/community-requests" element={<CommunityRequestsPage />} />
        <Route path="/community-requests/new" element={<CreateEventRequestPage />} />
        <Route path="/community-requests/:requestId" element={<EventRequestDetailsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from '../layouts/AppShell.jsx'
import PlaceholderPage from '../pages/PlaceholderPage.jsx'
import EventBoardPage from '../pages/EventBoardPage.jsx'
import CreateEventPage from '../pages/CreateEventPage.jsx'
import EventDetailsPage from '../pages/EventDetailsPage.jsx'

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<EventBoardPage />} />
        <Route path="/events/new" element={<CreateEventPage />} />
        <Route path="/events/:eventId" element={<EventDetailsPage />} />
        <Route path="/calendar" element={<PlaceholderPage title="Calendar" description="Calendar functionality will be implemented in a later migration phase." />} />
        <Route path="/community-requests" element={<PlaceholderPage title="Community Requests" description="Community request functionality will be implemented later." />} />
        <Route path="/community-requests/new" element={<PlaceholderPage title="Request Event" description="Event request creation will be implemented later." />} />
        <Route path="/community-requests/:requestId" element={<PlaceholderPage title="Request Details" description="Request details will be implemented later." />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

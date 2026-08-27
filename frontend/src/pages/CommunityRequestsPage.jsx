import communityEventHero from '../assets/community-event-hero.jpeg'
import { Link } from 'react-router-dom'
import EventRequestCard from '../components/community/EventRequestCard.jsx'
import { useEventRequests } from '../hooks/useEventRequests.js'
import '../styles/communityRequests.css'
import '../styles/communityRequestsUi06.css'
import '../styles/eventRequestUi07.css'

export default function CommunityRequestsPage() {
  const { status, requests, error, reload, interestedIds, interestLoadingId, interestError, addInterest } = useEventRequests()

  return (
    <section className="community-requests-page community-requests-page--ui06">
      <header className="community-requests-header community-requests-header--ui06">
        <div className="community-requests-header__copy">
          <span className="community-requests-header__badge">EventHive · Demand</span>
          <h1>What the Community Wants</h1>
          <p className="community-requests-header__sub">See what events people are asking for and help bring them to life.</p>
        </div>
        <Link className="primary-button community-requests-header__action" to="/community-requests/new">Request Event</Link>
      </header>

      {status === 'loading' && (
        <div className="state-card community-request-state community-request-state--loading" role="status" aria-live="polite">
          <span className="community-request-state__icon" aria-hidden="true">…</span>
          <strong>Loading community requests</strong>
          <span>Retrieving current local event requests.</span>
        </div>
      )}

      {status === 'error' && (
        <div className="state-card state-card--error community-request-state" role="alert">
          <span className="community-request-state__icon" aria-hidden="true">!</span>
          <strong>We couldn't load community requests</strong>
          <span>Please try again. Your existing requests and interest data have not been changed.</span>
          <button className="secondary-button" type="button" onClick={reload}>Try Again</button>
        </div>
      )}

      {status === 'success' && requests.length === 0 && (
        <div className="state-card community-request-state community-request-state--empty">
          <span className="community-request-state__icon" aria-hidden="true">○</span>
          <strong>No active community requests</strong>
          <span>There are no proposed local events to browse right now. You can submit a request for something you want to happen in your area.</span>
          <Link className="secondary-link" to="/community-requests/new">Request an Event</Link>
        </div>
      )}

      {status === 'success' && requests.length > 0 && (
        <div className="request-grid request-grid--ui06" aria-live="polite">
          {requests.map((request) => (
            <EventRequestCard
              key={request.requestId}
              request={request}
              isInterested={interestedIds.has(request.requestId)}
              interestLoading={interestLoadingId === request.requestId}
              interestError={interestError?.requestId === request.requestId ? interestError.message : null}
              onInterest={() => addInterest(request.requestId)}
            />
          ))}
        </div>
      )}
    </section>
  )
}

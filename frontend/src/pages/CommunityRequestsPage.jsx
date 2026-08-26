import { Link } from 'react-router-dom'
import EventRequestCard from '../components/community/EventRequestCard.jsx'
import { useEventRequests } from '../hooks/useEventRequests.js'
import '../styles/communityRequests.css'

export default function CommunityRequestsPage() {
  const { status, requests, error, reload, interestedIds, interestLoadingId, interestError, addInterest } = useEventRequests()

  return (
    <section className="community-requests-page">
      <header className="community-requests-header">
        <div>
          <p className="eyebrow">Community demand</p>
          <h1>Community Requests</h1>
          <p>Request an event you want to happen, then help it reach the community demand threshold. Demand is separate from RSVP attendance.</p>
        </div>
        <Link className="primary-button" to="/community-requests/new">Request Event</Link>
      </header>

      {status === 'loading' && <div className="state-card" role="status"><strong>Loading requests…</strong><span>Retrieving community-demand requests.</span></div>}
      {status === 'error' && <div className="state-card state-card--error" role="alert"><strong>Unable to load requests</strong><span>{error}</span><button className="secondary-button" type="button" onClick={reload}>Try Again</button></div>}
      {status === 'success' && requests.length === 0 && (
        <div className="state-card"><strong>No active requests</strong><span>Want something to happen in your area? Request it.</span><Link className="secondary-link" to="/community-requests/new">Request an Event</Link></div>
      )}
      {status === 'success' && requests.length > 0 && (
        <div className="request-grid" aria-live="polite">
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

import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ConflictReview from '../components/ConflictReview.jsx'
import { confirmEventRequest, confirmEventRequestAnyway, declineEventRequest, expressInterest, getEventRequestById, getInterestStatus } from '../services/eventRequestService.js'
import { useAuth } from '../context/AuthContext.jsx'
import { formatDate, formatEventTimeRange } from '../utils/dateTime.js'
import {
  getDemandCount,
  getDemandMessage,
  getDemandPercentage,
  getDemandProgress,
  getDemandStateLabel,
  getDemandThreshold,
} from '../utils/eventRequestPresentation.js'
import '../styles/communityRequests.css'
import '../styles/communityRequestsUi06.css'
import '../styles/eventRequestUi07.css'

const statusLabels = { COLLECTING_DEMAND: 'Collecting Demand', THRESHOLD_REACHED: 'Threshold Reached', CONFIRMED: 'Confirmed', DECLINED: 'Declined' }

export default function EventRequestDetailsPage() {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const { authenticated, currentUser } = useAuth()
  const [request, setRequest] = useState(null)
  const [interested, setInterested] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [action, setAction] = useState(null)
  const [error, setError] = useState(null)
  const [conflicts, setConflicts] = useState([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setNotFound(false)
      setError(null)
      try {
        const requestData = await getEventRequestById(requestId)
        let interestData = { interested: false }
        if (authenticated) interestData = await getInterestStatus(requestId)
        if (!cancelled) { setRequest(requestData); setInterested(Boolean(interestData.interested)) }
      } catch (loadError) {
        if (!cancelled) {
          if (loadError.status === 404) setNotFound(true)
          else setError(loadError.message)
        }
      } finally { if (!cancelled) setLoading(false) }
    }
    load()
    return () => { cancelled = true }
  }, [requestId, authenticated])

  async function handleInterest() {
    setAction('interest'); setError(null)
    try { const updated = await expressInterest(requestId); setRequest(updated); setInterested(true) }
    catch (actionError) { setError(actionError.message) }
    finally { setAction(null) }
  }

  async function handleConfirm() {
    setAction('confirm'); setError(null)
    try {
      const event = await confirmEventRequest(requestId)
      navigate(`/events/${encodeURIComponent(event.eventId)}`)
    } catch (actionError) {
      if (actionError.status === 409 && actionError.conflicts?.length) setConflicts(actionError.conflicts)
      else setError(actionError.message)
    } finally { setAction(null) }
  }

  async function handleContinueAnyway() {
    setAction('continue'); setError(null)
    try {
      const event = await confirmEventRequestAnyway(requestId)
      setConflicts([])
      navigate(`/events/${encodeURIComponent(event.eventId)}`)
    } catch (actionError) { setError(actionError.message) }
    finally { setAction(null) }
  }

  async function handleDecline() {
    setAction('decline'); setError(null)
    try { await declineEventRequest(requestId); navigate('/community-requests') }
    catch (actionError) { setError(actionError.message) }
    finally { setAction(null) }
  }

  if (loading) return <div className="state-card community-request-state community-request-state--loading" role="status"><span className="community-request-state__icon" aria-hidden="true">…</span><strong>Loading request details</strong><span>Retrieving the selected community request.</span></div>
  if (notFound) return <div className="state-card community-request-state" role="alert"><span className="community-request-state__icon" aria-hidden="true">?</span><strong>Request not found</strong><span>The requested community event request does not exist.</span><Link className="secondary-link" to="/community-requests">Back to Requests</Link></div>
  if (error && !request) return <div className="state-card state-card--error community-request-state" role="alert"><span className="community-request-state__icon" aria-hidden="true">!</span><strong>We couldn't load this request</strong><span>Please return to Community Requests and try again.</span><Link className="secondary-link" to="/community-requests">Back to Requests</Link></div>
  if (!request) return <div className="state-card community-request-state"><span className="community-request-state__icon" aria-hidden="true">?</span><strong>Request not found</strong><Link className="secondary-link" to="/community-requests">Back to Requests</Link></div>

  const demandCount = getDemandCount(request)
  const demandThreshold = getDemandThreshold(request)
  const demandPercentage = getDemandPercentage(request)
  const progress = getDemandProgress(request)
  const demandMessage = getDemandMessage(request)
  const demandState = getDemandStateLabel(request.status)
  const isOrganizer = authenticated && currentUser?.userId === request.organizerId
  const canReview = isOrganizer && request.status === 'THRESHOLD_REACHED'
  const isThresholdReached = request.status === 'THRESHOLD_REACHED'

  return (
    <section className="request-details request-details--ui06 request-details--ui07">
      <Link className="back-link" to="/community-requests">← Community Requests</Link>

      <header className="request-details__header--ui06 request-details__header--ui07">
        <div className="request-details__status-row request-details__status-row--ui07">
          <span className="request-card__category">{request.category}</span>
          <span className={`request-card__status request-card__status--${request.status.toLowerCase()}`}>
            {statusLabels[request.status] || request.status}
          </span>
        </div>
        <h1>{request.title}</h1>
        <p className="request-details__description">{request.description}</p>
      </header>

      <dl className="request-details__facts request-details__facts--ui06 request-details__facts--ui07">
        <div><dt>Category</dt><dd>{request.category}</dd></div>
        <div><dt>City</dt><dd>{request.city}</dd></div>
        <div><dt>Neighborhood</dt><dd>{request.neighborhood || 'Not specified'}</dd></div>
        <div><dt>Location</dt><dd>{request.location || 'Venue to be confirmed'}</dd></div>
        <div><dt>Date</dt><dd>{formatDate(request.startTime)}</dd></div>
        <div><dt>Time</dt><dd>{formatEventTimeRange(request.startTime, request.endTime)}</dd></div>
        <div><dt>Created</dt><dd>{formatDate(request.createdAt)}</dd></div>
        {request.organizerId && <div><dt>Organizer</dt><dd>Request organizer</dd></div>}
      </dl>

      <section className={`request-details__demand request-details__demand--ui06 request-details__demand--ui07 ${isThresholdReached ? 'request-details__demand--threshold' : ''}`} aria-label="Community demand">
        <div className="request-details__demand-heading">
          <div>
            <p className="eyebrow">Demand intelligence</p>
            <h2>Community Demand</h2>
            <p className="request-details__demand-heading__support">Progress is based on the configured demand threshold.</p>
          </div>
          <strong>{Math.round(demandPercentage)}%</strong>
        </div>
        <div className="request-details__demand-count request-details__demand-count--ui07"><strong>{demandCount} / {demandThreshold}</strong><span>people interested</span></div>
        <div
          className="demand-progress__track"
          role="progressbar"
          aria-valuemin="0"
          aria-valuemax={demandThreshold}
          aria-valuenow={Math.min(demandCount, demandThreshold)}
          aria-valuetext={`${demandCount} of ${demandThreshold} people interested`}
          aria-label="Community demand progress"
        >
          <span style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="request-details__demand-state request-details__demand-state--ui07"><strong>{demandState}</strong><span>{demandMessage}</span></div>
        <div className="request-details__actions request-details__actions--ui06 request-details__actions--ui07">
          {request.status === 'COLLECTING_DEMAND' && authenticated && <button className="primary-button" type="button" disabled={interested || action === 'interest'} onClick={handleInterest}>{action === 'interest' ? 'Saving…' : interested ? 'Interested ✓' : 'Express Interest'}</button>}
          {request.status === 'COLLECTING_DEMAND' && !authenticated && <><span className="request-details__interest-note">Sign in to express interest.</span><Link className="primary-button" to="/login">Login to Express Interest</Link></>}
          {request.status === 'THRESHOLD_REACHED' && <strong className="request-details__threshold-state request-details__threshold-state--ui07"><span aria-hidden="true">✓</span> Threshold Reached — organizer review is available.</strong>}
          {request.status === 'CONFIRMED' && <strong className="request-details__terminal-state request-details__terminal-state--ui07">This request has been confirmed and is now a published event.</strong>}
          {request.status === 'DECLINED' && <strong className="request-details__terminal-state request-details__terminal-state--ui07">This request was declined by the organizer.</strong>}
        </div>
      </section>

      {error && <p className="form-error request-details__action-error request-details__action-error--ui07" role="alert">{error}</p>}

      {canReview && (
        <section className="request-details__organizer request-details__organizer--ui06 request-details__organizer--ui07">
          <div className="request-details__organizer-copy--ui07">
            <p className="eyebrow">Organizer action</p>
            <h2>Review this request</h2>
            <p>Demand has reached the configured threshold. Confirming creates the existing Event model as a published event; declining closes the request.</p>
          </div>
          <div className="request-details__organizer-actions--ui07">
            <div className="request-details__actions">
              <button className="primary-button" type="button" disabled={action !== null} onClick={handleConfirm}>{action === 'confirm' ? 'Checking…' : 'Confirm Event'}</button>
              <button className="button-danger" type="button" disabled={action !== null} onClick={handleDecline}>{action === 'decline' ? 'Declining…' : 'Decline'}</button>
            </div>
          </div>
        </section>
      )}

      {conflicts.length > 0 && <ConflictReview conflicts={conflicts} onCancel={() => setConflicts([])} onContinue={handleContinueAnyway} continuing={action === 'continue'} />}
    </section>
  )
}

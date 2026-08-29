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

  if (loading) return <div className="state-card" role="status"><strong>Loading request…</strong><span>Retrieving request details.</span></div>
  if (notFound) return <div className="state-card" role="alert"><strong>Request not found</strong><span>The requested community event request does not exist.</span><Link className="secondary-link" to="/community-requests">Back to Requests</Link></div>
  if (error && !request) return <div className="state-card state-card--error" role="alert"><strong>Unable to load request</strong><span>{error}</span><Link className="secondary-link" to="/community-requests">Back to Requests</Link></div>
  if (!request) return <div className="state-card"><strong>Request not found</strong><Link className="secondary-link" to="/community-requests">Back to Requests</Link></div>

  const demandCount = getDemandCount(request)
  const demandThreshold = getDemandThreshold(request)
  const demandPercentage = getDemandPercentage(request)
  const progress = getDemandProgress(request)
  const demandMessage = getDemandMessage(request)
  const demandState = getDemandStateLabel(request.status)
  const isOrganizer = authenticated && currentUser?.userId === request.organizerId
  const hasReachedThreshold = demandCount >= demandThreshold && demandThreshold > 0
  const canReview = isOrganizer && (request.status === 'THRESHOLD_REACHED' || hasReachedThreshold) && (request.status === 'COLLECTING_DEMAND' || request.status === 'THRESHOLD_REACHED')

  return (
    <section className="request-details">
      <Link className="back-link" to="/community-requests">← Community Requests</Link>

      <div className="request-details__topline">
        <span className="event-badge">{request.category}</span>
        <span className={`status-badge request-card__status--${request.status.toLowerCase()}`}>{statusLabels[request.status] || request.status}</span>
      </div>

      <h1>{request.title}</h1>

      {request.imageUrl && (
        <div className="request-details__image-wrap">
          <img src={request.imageUrl} alt="" />
        </div>
      )}

      <div className="request-details-grid">
        <div className="request-details__main-flow">
          <section className="request-details__section">
            <p className="request-details__description">{request.description}</p>
          </section>

          {/* Connected Demand Card */}
          <section className={"demand-card " + (request.status === 'THRESHOLD_REACHED' || request.status === 'CONFIRMED' ? 'demand-card--threshold' : '')} aria-label="Community demand">
            <div className="demand-card__heading">
              <div className="demand-card__numbers">
                <span className="demand-card__current">{demandCount}</span>
                <span className="demand-card__required">/ {demandThreshold}</span>
              </div>
              <span className="demand-card__percentage">{Math.round(demandPercentage)}% met</span>
            </div>
            <div role="progressbar" aria-valuemin="0" aria-valuemax={demandThreshold} aria-valuenow={Math.min(demandCount, demandThreshold)} className="demand-card__track">
              <span className="demand-card__progress" style={{ width: (progress * 100) + "%" }} />
            </div>
            <div className="demand-card__footer">
              <span className="demand-card__state">{demandState}</span>
              <span className="demand-card__message">{demandMessage}</span>
            </div>
          </section>

          {/* Stepper Lifecycle */}
          <div className="lifecycle-progress-wrapper">
            <p className="eyebrow">Request status lifecycle</p>
            <div className="lifecycle-steps">
              {/* Step 1: Collecting Demand */}
              <div className={`lifecycle-step ${
                request.status === 'COLLECTING_DEMAND' ? 'lifecycle-step--active' : 'lifecycle-step--completed'
              }`}>
                <span className="step-number">
                  {request.status === 'COLLECTING_DEMAND' ? '→' : '✓'}
                </span>
                <div className="step-content">
                  <span className="step-label">Collecting Demand</span>
                  <span className="step-status-tag">
                    {request.status === 'COLLECTING_DEMAND' ? 'Current' : 'Completed'}
                  </span>
                </div>
              </div>
              
              {/* Step 2: Threshold Reached */}
              <div className={`lifecycle-step ${
                request.status === 'COLLECTING_DEMAND' 
                  ? 'lifecycle-step--pending' 
                  : 'lifecycle-step--completed'
              }`}>
                <span className="step-number">
                  {request.status === 'COLLECTING_DEMAND' ? '○' : '✓'}
                </span>
                <div className="step-content">
                  <span className="step-label">Threshold Reached</span>
                  <span className="step-status-tag">
                    {request.status === 'COLLECTING_DEMAND' ? 'Pending' : 'Completed'}
                  </span>
                </div>
              </div>
              
              {/* Step 3: Organizer Review */}
              <div className={`lifecycle-step ${
                request.status === 'COLLECTING_DEMAND'
                  ? 'lifecycle-step--pending'
                  : request.status === 'THRESHOLD_REACHED'
                    ? 'lifecycle-step--active'
                    : 'lifecycle-step--completed'
              }`}>
                <span className="step-number">
                  {request.status === 'COLLECTING_DEMAND' 
                    ? '○' 
                    : request.status === 'THRESHOLD_REACHED' 
                      ? '→' 
                      : '✓'}
                </span>
                <div className="step-content">
                  <span className="step-label">Organizer Review</span>
                  <span className="step-status-tag">
                    {request.status === 'COLLECTING_DEMAND' 
                      ? 'Pending' 
                      : request.status === 'THRESHOLD_REACHED' 
                        ? 'Current' 
                        : 'Completed'}
                  </span>
                </div>
              </div>
              
              {/* Step 4: Confirmed / Declined */}
              <div className={`lifecycle-step ${
                request.status === 'CONFIRMED' 
                  ? 'lifecycle-step--completed' 
                  : request.status === 'DECLINED' 
                    ? 'lifecycle-step--declined' 
                    : 'lifecycle-step--pending'
              }`}>
                <span className="step-number">
                  {request.status === 'CONFIRMED' 
                    ? '✓' 
                    : request.status === 'DECLINED' 
                      ? '×' 
                      : '○'}
                </span>
                <div className="step-content">
                  <span className="step-label">
                    {request.status === 'DECLINED' ? 'Declined' : 'Confirmed'}
                  </span>
                  <span className="step-status-tag">
                    {request.status === 'CONFIRMED' 
                      ? 'Confirmed' 
                      : request.status === 'DECLINED' 
                        ? 'Declined' 
                        : 'Pending'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Organizer Review Stage */}
          {canReview && (
            <section className="request-details__organizer">
              <p className="eyebrow" style={{ color: '#c2410c', margin: 0 }}>Organizer Action Required</p>
              <h2>Organizer Decision Stage</h2>
              <p>Demand has successfully reached the required threshold. Confirming creates the Event and publishes it; declining closes this request.</p>
              <div className="request-details__organizer-actions">
                <button className="primary-button" type="button" disabled={action !== null} onClick={handleConfirm}>{action === 'confirm' ? 'Checking…' : 'Confirm Event'}</button>
                <button className="button-danger" type="button" disabled={action !== null} onClick={handleDecline}>{action === 'decline' ? 'Declining…' : 'Decline'}</button>
              </div>
            </section>
          )}
        </div>

        <div className="request-details__sidebar">
          {/* Details Sidebar facts */}
          <div className="request-sidebar-card">
            <h3>Request Information</h3>
            <dl className="request-details__facts">
              <div><dt>Category</dt><dd>{request.category}</dd></div>
              <div><dt>City</dt><dd>{request.city}</dd></div>
              <div><dt>Neighborhood</dt><dd>{request.neighborhood || 'Not specified'}</dd></div>
              <div><dt>Location</dt><dd>{request.location || 'Venue to be confirmed'}</dd></div>
              <div><dt>Proposed Date</dt><dd>{formatDate(request.startTime)}</dd></div>
              <div><dt>Proposed Time</dt><dd>{formatEventTimeRange(request.startTime, request.endTime)}</dd></div>
              <div><dt>Created On</dt><dd>{formatDate(request.createdAt)}</dd></div>
            </dl>
          </div>

          {/* Action sidebar callouts */}
          <div className="request-sidebar-card request-sidebar-card--action">
            {request.status === 'COLLECTING_DEMAND' && authenticated && !isOrganizer && (
              <div style={{ display: 'grid', gap: '10px' }}>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4' }}>Help bring this event idea to life by expressing interest!</p>
                <button className="primary-button" type="button" disabled={interested || action === 'interest'} onClick={handleInterest} style={{ width: '100%' }}>
                  {action === 'interest' ? 'Saving…' : interested ? 'Interested ✓' : 'Express Interest'}
                </button>
              </div>
            )}
            {request.status === 'COLLECTING_DEMAND' && authenticated && isOrganizer && (
              <p className="request-sidebar-note">You proposed this event idea. Encourage community members to express interest!</p>
            )}
            {request.status === 'COLLECTING_DEMAND' && !authenticated && (
              <div style={{ display: 'grid', gap: '10px' }}>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4' }}>Sign in to express your interest in this event.</p>
                <Link className="primary-button" to="/login" style={{ width: '100%', textAlign: 'center', minHeight: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Login</Link>
              </div>
            )}
            {request.status === 'THRESHOLD_REACHED' && (
              <p className="request-sidebar-note request-sidebar-note--success">Demand threshold met. Pending organizer decision.</p>
            )}
            {request.status === 'CONFIRMED' && (
              <div style={{ display: 'grid', gap: '10px' }}>
                <p className="request-sidebar-note request-sidebar-note--success">This event request is confirmed and published!</p>
                {request.eventId && (
                  <Link className="primary-button" to={`/events/${encodeURIComponent(request.eventId)}`} style={{ width: '100%', textAlign: 'center', minHeight: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>View Event Page</Link>
                )}
              </div>
            )}
            {request.status === 'DECLINED' && (
              <p className="request-sidebar-note request-sidebar-note--danger">This request has been declined by the organizer.</p>
            )}
          </div>
        </div>
      </div>

      {error && <p className="form-error" role="alert" style={{ marginTop: 18 }}>{error}</p>}
      {conflicts.length > 0 && <ConflictReview conflicts={conflicts} onCancel={() => setConflicts([])} onContinue={handleContinueAnyway} continuing={action === 'continue'} />}
    </section>
  )
}

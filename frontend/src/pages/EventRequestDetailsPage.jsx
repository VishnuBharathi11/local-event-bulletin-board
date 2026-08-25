import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { confirmEventRequest, declineEventRequest, expressInterest, getEventRequestById, getInterestStatus } from '../services/eventRequestService.js'
import { formatDate, formatEventTimeRange } from '../utils/dateTime.js'
import '../styles/communityRequests.css'

const DEVELOPMENT_USER_ID = 'dev_user'
const statusLabels = { COLLECTING_DEMAND: 'Collecting Demand', THRESHOLD_REACHED: 'Threshold Reached', CONFIRMED: 'Confirmed', DECLINED: 'Declined' }

export default function EventRequestDetailsPage() {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const [request, setRequest] = useState(null)
  const [interested, setInterested] = useState(false)
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [requestData, interestData] = await Promise.all([getEventRequestById(requestId), getInterestStatus(requestId)])
        if (!cancelled) { setRequest(requestData); setInterested(Boolean(interestData.interested)) }
      } catch (loadError) { if (!cancelled) setError(loadError.message) } finally { if (!cancelled) setLoading(false) }
    }
    load()
    return () => { cancelled = true }
  }, [requestId])

  async function handleInterest() {
    setAction('interest'); setError(null)
    try { const updated = await expressInterest(requestId); setRequest(updated); setInterested(true) }
    catch (actionError) { setError(actionError.message) }
    finally { setAction(null) }
  }

  async function handleConfirm() {
    setAction('confirm'); setError(null)
    try { const event = await confirmEventRequest(requestId); navigate(`/events/${encodeURIComponent(event.eventId)}`) }
    catch (actionError) { setError(actionError.message); setAction(null) }
  }

  async function handleDecline() {
    setAction('decline'); setError(null)
    try { await declineEventRequest(requestId); navigate('/community-requests') }
    catch (actionError) { setError(actionError.message); setAction(null) }
  }

  if (loading) return <div className="state-card" role="status"><strong>Loading request…</strong><span>Retrieving request details.</span></div>
  if (error && !request) return <div className="state-card state-card--error" role="alert"><strong>Unable to load request</strong><span>{error}</span><Link className="secondary-link" to="/community-requests">Back to Requests</Link></div>
  if (!request) return <div className="state-card"><strong>Request not found</strong><Link className="secondary-link" to="/community-requests">Back to Requests</Link></div>

  const progress = request.demandThreshold > 0 ? Math.min(request.demandCount / request.demandThreshold, 1) : 0
  const isOrganizer = request.organizerId === DEVELOPMENT_USER_ID
  const canReview = isOrganizer && request.status === 'THRESHOLD_REACHED'

  return (
    <section className="request-details">
      <Link className="back-link" to="/community-requests">← Community Requests</Link>
      <div className="request-card__topline"><span className="request-card__category">{request.category}</span><span className={`request-card__status request-card__status--${request.status.toLowerCase()}`}>{statusLabels[request.status] || request.status}</span></div>
      <h1>{request.title}</h1>
      <p className="request-details__meta"><strong>{formatDate(request.startTime)}</strong> · {formatEventTimeRange(request.startTime, request.endTime)}</p>
      <p className="request-details__meta">{request.location || 'Venue to be confirmed'} · {request.neighborhood ? `${request.neighborhood}, ` : ''}{request.city}</p>
      <p className="request-details__description">{request.description}</p>

      <section className="request-details__demand" aria-label="Community demand">
        <h2>Community Demand</h2>
        <p>{request.demandCount} / {request.demandThreshold} users interested</p>
        <div className="demand-progress__track"><span style={{ width: `${progress * 100}%` }} /></div>
        <div className="request-details__actions">
          {request.status === 'COLLECTING_DEMAND' && <button className="primary-button" type="button" disabled={interested || action === 'interest'} onClick={handleInterest}>{action === 'interest' ? 'Saving…' : interested ? 'Interested ✓' : 'Express Interest'}</button>}
          {request.status === 'THRESHOLD_REACHED' && <strong>Threshold reached — organizer review is now available.</strong>}
          {request.status === 'CONFIRMED' && <strong>This request has been confirmed and is now a published event.</strong>}
        </div>
      </section>

      {error && <p className="form-error" role="alert" style={{ marginTop: 18 }}>{error}</p>}

      {canReview && (
        <section className="request-details__organizer">
          <h2>Organizer Review</h2>
          <p>The demand threshold has been reached. Confirming creates the existing Event model as a published event; declining closes the request.</p>
          <div className="request-details__actions">
            <button className="primary-button" type="button" disabled={action !== null} onClick={handleConfirm}>{action === 'confirm' ? 'Confirming…' : 'Confirm Event'}</button>
            <button className="button-danger" type="button" disabled={action !== null} onClick={handleDecline}>{action === 'decline' ? 'Declining…' : 'Decline'}</button>
          </div>
        </section>
      )}
    </section>
  )
}

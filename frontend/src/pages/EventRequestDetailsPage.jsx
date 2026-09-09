import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Users,
  Share2,
  MoreHorizontal,
  User,
  Calendar,
  RotateCw,
  Hourglass,
  UserCheck,
  CheckCircle2,
  ArrowRight,
  Info,
  LayoutGrid,
  Building2,
  MapPin,
  Clock,
  PenLine,
  Check,
  Edit3
} from 'lucide-react'
import ConflictReview from '../components/ConflictReview.jsx'
import {
  confirmEventRequest,
  confirmEventRequestAnyway,
  declineEventRequest,
  expressInterest,
  getEventRequestById,
  getInterestStatus,
  removeInterest
} from '../services/eventRequestService.js'
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
import defaultHeroImage from '../assets/community-event-hero.jpeg'
import '../styles/communityRequests.css'

const statusLabels = {
  COLLECTING_DEMAND: 'Collecting Demand',
  THRESHOLD_REACHED: 'Threshold Reached',
  CONFIRMED: 'Confirmed',
  DECLINED: 'Declined'
}

function formatHeaderDate(timestamp) {
  if (!timestamp) return 'Aug 29, 2026'
  const date = new Date(Number(timestamp) || timestamp)
  if (isNaN(date.getTime())) return 'Aug 29, 2026'
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

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
  const [copied, setCopied] = useState(false)

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
        if (!cancelled) {
          setRequest(requestData)
          setInterested(Boolean(interestData.interested))
        }
      } catch (loadError) {
        if (!cancelled) {
          if (loadError.status === 404) setNotFound(true)
          else setError(loadError.message)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [requestId, authenticated])

  async function handleInterest() {
    if (!authenticated || action === 'interest') return
    setAction('interest')
    setError(null)
    try {
      const updated = interested
        ? await removeInterest(requestId)
        : await expressInterest(requestId)
      setRequest(updated)
      setInterested(!interested)
    } catch (actionError) {
      setError(actionError.message)
    } finally {
      setAction(null)
    }
  }

  async function handleConfirm() {
    setAction('confirm')
    setError(null)
    try {
      const event = await confirmEventRequest(requestId)
      navigate(`/events/${encodeURIComponent(event.eventId)}`)
    } catch (actionError) {
      if (actionError.status === 409 && actionError.conflicts?.length) setConflicts(actionError.conflicts)
      else setError(actionError.message)
    } finally {
      setAction(null)
    }
  }

  async function handleContinueAnyway() {
    setAction('continue')
    setError(null)
    try {
      const event = await confirmEventRequestAnyway(requestId)
      setConflicts([])
      navigate(`/events/${encodeURIComponent(event.eventId)}`)
    } catch (actionError) {
      setError(actionError.message)
    } finally {
      setAction(null)
    }
  }

  async function handleDecline() {
    setAction('decline')
    setError(null)
    try {
      await declineEventRequest(requestId)
      navigate('/community-requests')
    } catch (actionError) {
      setError(actionError.message)
    } finally {
      setAction(null)
    }
  }

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy share link: ', err)
    }
  }

  if (loading) return <div className="state-card" role="status"><strong>Loading request…</strong><span>Retrieving request details.</span></div>
  if (notFound) return <div className="state-card" role="alert"><strong>Request not found</strong><span>The requested community event request does not exist.</span><Link className="secondary-link" to="/community-requests">Back to Requests</Link></div>
  if (error && !request) return <div className="state-card state-card--error" role="alert"><strong>Unable to load request</strong><span>{error}</span><Link className="secondary-link" to="/community-requests">Back to Requests</Link></div>
  if (!request) return <div className="state-card"><strong>Request not found</strong><Link className="secondary-link" to="/community-requests">Back to Requests</Link></div>

  const demandCount = getDemandCount(request)
  const demandThreshold = getDemandThreshold(request)
  const demandPercentage = getDemandPercentage(request)
  const demandMessage = getDemandMessage(request)
  const demandState = getDemandStateLabel(request.status)
  const isOrganizer = authenticated && currentUser?.userId === request.organizerId
  const hasReachedThreshold = demandCount >= demandThreshold && demandThreshold > 0
  const canReview = isOrganizer && (request.status === 'THRESHOLD_REACHED' || hasReachedThreshold) && (request.status === 'COLLECTING_DEMAND' || request.status === 'THRESHOLD_REACHED')

  // Lifecycle node statuses
  const isCollecting = request.status === 'COLLECTING_DEMAND'
  const isThresholdMet = request.status === 'THRESHOLD_REACHED' || hasReachedThreshold
  const isConfirmed = request.status === 'CONFIRMED'
  const isDeclined = request.status === 'DECLINED'

  const stage1Active = isCollecting && !hasReachedThreshold
  const stage1Completed = !stage1Active

  const stage2Active = isCollecting && hasReachedThreshold
  const stage2Completed = request.status === 'THRESHOLD_REACHED' || isConfirmed

  const stage3Active = request.status === 'THRESHOLD_REACHED'
  const stage3Completed = isConfirmed

  const stage4Active = isConfirmed || isDeclined
  const stage4Completed = isConfirmed

  return (
    <section className="event-request-view-page">
      <div className="event-request-view-card">
        {/* Top Back Link */}
        <Link className="request-view-back-link" to="/community-requests">
          <ArrowLeft size={16} strokeWidth={2.2} />
          <span>Back to Community Requests</span>
        </Link>

        {/* Badges & Action Buttons */}
        <div className="request-view-top-row">
          <div className="request-view-badges">
            <span className="request-badge request-badge--category">
              <Users size={14} strokeWidth={2.2} />
              <span>{request.category}</span>
            </span>
            <span className="request-badge request-badge--status">
              <span>{statusLabels[request.status] || request.status}</span>
            </span>
          </div>

          <div className="request-view-actions">
            {isOrganizer && (
              <Link
                to={`/community-requests/edit/${encodeURIComponent(requestId)}`}
                className="request-action-btn request-action-btn--edit"
              >
                <Edit3 size={15} strokeWidth={2.2} />
                <span>Edit</span>
              </Link>
            )}
          </div>
        </div>

        {/* Event Request Title */}
        <h1 className="request-view-title">{request.title}</h1>

        {/* Meta Info Row */}
        <div className="request-view-meta-row">
          <div className="request-view-meta-item">
            <User size={15} strokeWidth={2} />
            <span>Requested by {request.organizerName || request.organizerEmail?.split('@')[0] || 'Community Member'}</span>
          </div>
          <div className="request-view-meta-item">
            <Calendar size={15} strokeWidth={2} />
            <span>{formatHeaderDate(request.createdAt || request.startTime)}</span>
          </div>
        </div>

        {/* Two-Column Grid */}
        <div className="request-view-grid">
          {/* Main Left Column */}
          <div className="request-view-main-column">
            {/* Large Event Request Image */}
            <div className="request-view-image-wrap">
              <img
                src={request.imageUrl || defaultHeroImage}
                alt={request.title}
                className="request-view-image"
              />
            </div>

            {/* Event Description (if present) */}
            {request.description && (
              <div className="request-view-desc-box">
                <p>{request.description}</p>
              </div>
            )}

            {/* Community Interest Section */}
            <div className="request-view-section">
              <div className="request-view-section-header">
                <Users size={17} className="request-view-section-icon" strokeWidth={2.2} />
                <h2>Community Interest</h2>
              </div>

              <div className="request-interest-card">
                <div className="request-interest-card__top">
                  <div className="request-interest-card__counts">
                    <span className="request-interest-count-current">{demandCount}</span>
                    <span className="request-interest-count-divider">/</span>
                    <span className="request-interest-count-total">{demandThreshold}</span>
                  </div>
                  <span className="request-interest-percentage">
                    {Math.round(demandPercentage)}% met
                  </span>
                </div>

                <div className="request-interest-track" role="progressbar" aria-valuenow={Math.min(demandCount, demandThreshold)} aria-valuemax={demandThreshold}>
                  <div
                    className="request-interest-fill"
                    style={{ width: `${Math.min(100, Math.round(demandPercentage))}%` }}
                  />
                </div>

                <div className="request-interest-card__bottom">
                  <strong className="request-interest-state">
                    {demandState.toUpperCase()}
                  </strong>
                  <span className="request-interest-message">
                    {demandMessage || (demandCount >= demandThreshold ? 'Threshold reached!' : 'Almost there!')}
                  </span>
                </div>
              </div>
            </div>

            {/* Request Status Lifecycle Section */}
            <div className="request-view-section">
              <div className="request-view-section-header">
                <RotateCw size={17} className="request-view-section-icon" strokeWidth={2.2} />
                <h2>Request Status Lifecycle</h2>
              </div>

              <div className="request-lifecycle-card">
                <div className="request-lifecycle-flow">
                  {/* Stage 1: Collecting Demand */}
                  <div className="request-lifecycle-node">
                    <div className={`request-lifecycle-icon ${stage1Active ? 'request-lifecycle-icon--active' : stage1Completed ? 'request-lifecycle-icon--completed' : ''}`}>
                      <Users size={16} strokeWidth={2.2} />
                    </div>
                    <div className="request-lifecycle-info">
                      <strong className="request-lifecycle-title">Collecting Demand</strong>
                      <span className={`request-lifecycle-tag ${stage1Active ? 'request-lifecycle-tag--active' : 'request-lifecycle-tag--completed'}`}>
                        {stage1Active ? 'CURRENT' : 'COMPLETED'}
                      </span>
                    </div>
                  </div>

                  <div className="request-lifecycle-arrow">
                    <ArrowRight size={15} />
                  </div>

                  {/* Stage 2: Threshold Reached */}
                  <div className="request-lifecycle-node">
                    <div className={`request-lifecycle-icon ${stage2Active ? 'request-lifecycle-icon--active' : stage2Completed ? 'request-lifecycle-icon--completed' : ''}`}>
                      <Hourglass size={16} strokeWidth={2.2} />
                    </div>
                    <div className="request-lifecycle-info">
                      <strong className="request-lifecycle-title">Threshold Reached</strong>
                      <span className={`request-lifecycle-tag ${stage2Active ? 'request-lifecycle-tag--active' : stage2Completed ? 'request-lifecycle-tag--completed' : 'request-lifecycle-tag--pending'}`}>
                        {stage2Active ? 'CURRENT' : stage2Completed ? 'COMPLETED' : 'PENDING'}
                      </span>
                    </div>
                  </div>

                  <div className="request-lifecycle-arrow">
                    <ArrowRight size={15} />
                  </div>

                  {/* Stage 3: Organizer Review */}
                  <div className="request-lifecycle-node">
                    <div className={`request-lifecycle-icon ${stage3Active ? 'request-lifecycle-icon--active' : stage3Completed ? 'request-lifecycle-icon--completed' : ''}`}>
                      <UserCheck size={16} strokeWidth={2.2} />
                    </div>
                    <div className="request-lifecycle-info">
                      <strong className="request-lifecycle-title">Organizer Review</strong>
                      <span className={`request-lifecycle-tag ${stage3Active ? 'request-lifecycle-tag--active' : stage3Completed ? 'request-lifecycle-tag--completed' : 'request-lifecycle-tag--pending'}`}>
                        {stage3Active ? 'CURRENT' : stage3Completed ? 'COMPLETED' : 'PENDING'}
                      </span>
                    </div>
                  </div>

                  <div className="request-lifecycle-arrow">
                    <ArrowRight size={15} />
                  </div>

                  {/* Stage 4: Confirmed */}
                  <div className="request-lifecycle-node">
                    <div className={`request-lifecycle-icon ${stage4Active ? 'request-lifecycle-icon--active' : stage4Completed ? 'request-lifecycle-icon--completed' : isDeclined ? 'request-lifecycle-icon--declined' : ''}`}>
                      <CheckCircle2 size={16} strokeWidth={2.2} />
                    </div>
                    <div className="request-lifecycle-info">
                      <strong className="request-lifecycle-title">{isDeclined ? 'Declined' : 'Confirmed'}</strong>
                      <span className={`request-lifecycle-tag ${stage4Completed ? 'request-lifecycle-tag--completed' : isDeclined ? 'request-lifecycle-tag--declined' : 'request-lifecycle-tag--pending'}`}>
                        {stage4Completed ? 'CONFIRMED' : isDeclined ? 'DECLINED' : 'PENDING'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Organizer Action Required Section (if eligible) */}
            {canReview && (
              <section className="request-details__organizer" style={{ marginTop: '20px', padding: '18px 22px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '14px' }}>
                <p className="eyebrow" style={{ color: '#ea580c', margin: '0 0 4px', fontSize: '11px', fontWeight: 800 }}>ORGANIZER ACTION REQUIRED</p>
                <h3 style={{ margin: '0 0 6px', fontSize: '16px', color: '#9a3412', fontWeight: 800 }}>Organizer Decision Stage</h3>
                <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#7c2d12', lineHeight: '1.45' }}>Demand has reached the required threshold. Confirming publishes this event to the community board; declining closes this request.</p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="primary-button" type="button" disabled={action !== null} onClick={handleConfirm} style={{ minHeight: '38px', padding: '8px 16px', fontSize: '13px' }}>
                    {action === 'confirm' ? 'Checking…' : 'Confirm Event'}
                  </button>
                  <button className="button-danger" type="button" disabled={action !== null} onClick={handleDecline} style={{ minHeight: '38px', padding: '8px 16px', fontSize: '13px' }}>
                    {action === 'decline' ? 'Declining…' : 'Decline'}
                  </button>
                </div>
              </section>
            )}
          </div>

          {/* Right Sidebar Column */}
          <div className="request-view-sidebar-column">
            {/* Request Information Card */}
            <div className="request-info-sidebar-card">
              <div className="request-info-sidebar-header">
                <Info size={17} className="request-info-icon" />
                <h3>Request Information</h3>
              </div>

              <div className="request-info-list">
                {/* Category */}
                <div className="request-info-row">
                  <div className="request-info-icon-box">
                    <LayoutGrid size={15} strokeWidth={2.2} />
                  </div>
                  <div className="request-info-content">
                    <span className="request-info-label">Category</span>
                    <strong className="request-info-value">{request.category || 'Not specified'}</strong>
                  </div>
                </div>

                {/* City */}
                <div className="request-info-row">
                  <div className="request-info-icon-box">
                    <Building2 size={15} strokeWidth={2.2} />
                  </div>
                  <div className="request-info-content">
                    <span className="request-info-label">City</span>
                    <strong className="request-info-value">{request.city || 'Not specified'}</strong>
                  </div>
                </div>

                {/* Neighborhood */}
                <div className="request-info-row">
                  <div className="request-info-icon-box">
                    <MapPin size={15} strokeWidth={2.2} />
                  </div>
                  <div className="request-info-content">
                    <span className="request-info-label">Neighborhood</span>
                    <strong className="request-info-value">{request.neighborhood || 'Not specified'}</strong>
                  </div>
                </div>

                {/* Location */}
                <div className="request-info-row">
                  <div className="request-info-icon-box">
                    <MapPin size={15} strokeWidth={2.2} />
                  </div>
                  <div className="request-info-content">
                    <span className="request-info-label">Location</span>
                    <strong className="request-info-value">{request.location || 'Venue to be confirmed'}</strong>
                  </div>
                </div>

                {/* Proposed Date */}
                <div className="request-info-row">
                  <div className="request-info-icon-box">
                    <Calendar size={15} strokeWidth={2.2} />
                  </div>
                  <div className="request-info-content">
                    <span className="request-info-label">Proposed Date</span>
                    <strong className="request-info-value">{formatDate(request.startTime)}</strong>
                  </div>
                </div>

                {/* Proposed Time */}
                <div className="request-info-row">
                  <div className="request-info-icon-box">
                    <Clock size={15} strokeWidth={2.2} />
                  </div>
                  <div className="request-info-content">
                    <span className="request-info-label">Proposed Time</span>
                    <strong className="request-info-value">{formatEventTimeRange(request.startTime, request.endTime)}</strong>
                  </div>
                </div>

                {/* Created On */}
                <div className="request-info-row">
                  <div className="request-info-icon-box">
                    <PenLine size={15} strokeWidth={2.2} />
                  </div>
                  <div className="request-info-content">
                    <span className="request-info-label">Created On</span>
                    <strong className="request-info-value">{formatDate(request.createdAt)}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Interest CTA Card */}
            {!isOrganizer && (
              <div className="request-cta-card">
                <p className="request-cta-text">
                  Help bring this event idea to life by expressing interest!
                </p>

                {authenticated ? (
                  <button
                    type="button"
                    className="request-cta-button"
                    onClick={handleInterest}
                    disabled={action === 'interest'}
                  >
                    <span>{action === 'interest' ? 'Updating…' : (interested ? 'Interested ✓' : 'Interested')}</span>
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="request-cta-button"
                  >
                    <span>Log In to Express Interest</span>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {error && <p className="form-error" role="alert" style={{ marginTop: 18 }}>{error}</p>}
        {conflicts.length > 0 && <ConflictReview conflicts={conflicts} onCancel={() => setConflicts([])} onContinue={handleContinueAnyway} continuing={action === 'continue'} />}
      </div>
    </section>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Clock3, MapPin } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { formatDate, formatEventTimeRange } from '../../utils/dateTime.js'
import { isPincode } from '../../utils/eventDiscovery.js'
import { getDemandCount, getDemandMessage, getDemandPercentage, getDemandProgress, getDemandStateLabel, getDemandThreshold } from '../../utils/eventRequestPresentation.js'

const statusLabels = { COLLECTING_DEMAND: 'Collecting Demand', THRESHOLD_REACHED: 'Threshold Reached', CONFIRMED: 'Confirmed', DECLINED: 'Declined' }

export default function EventRequestCard({ request, isInterested, interestLoading, interestError, onInterest, isManagement = false, onEdit, onDelete, isDeleting = false }) {
  const { authenticated, currentUser } = useAuth()
  const [imageError, setImageError] = useState(false)
  const demandCount = getDemandCount(request)
  const demandThreshold = getDemandThreshold(request)
  const demandPercentage = getDemandPercentage(request)
  const progress = getDemandProgress(request)
  const demandMessage = getDemandMessage(request)
  const demandState = getDemandStateLabel(request.status)
  const isConfirmed = request.status === 'CONFIRMED' || Boolean(request.eventId)
  const isOwner = currentUser?.userId === request.organizerId

  return (
    <article className="request-card">
      {request.imageUrl && !imageError ? (
        <div className="request-card__image-wrap" style={{ margin: '-20px -20px 16px', height: '160px', overflow: 'hidden', borderTopLeftRadius: 'var(--radius-md)', borderTopRightRadius: 'var(--radius-md)' }}><img src={request.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImageError(true)} /></div>
      ) : (
        <div className="request-card__image-wrap" style={{ margin: '-20px -20px 16px', height: '160px', overflow: 'hidden', borderTopLeftRadius: 'var(--radius-md)', borderTopRightRadius: 'var(--radius-md)', background: 'linear-gradient(145deg, #f0f4f8, #f8fafc)', display: 'grid', placeItems: 'center', color: 'var(--text-muted)' }}><div style={{ fontSize: '32px', opacity: 0.15 }}>EH</div></div>
      )}
      <div className="request-card__topline">
        <span className={`request-card__category request-card__category--${request.category.toLowerCase().replace(/\s+/g, '-')}`}>{request.category}</span>
        <span className={`request-card__status request-card__status--${request.status.toLowerCase()}`}>{statusLabels[request.status] || request.status}</span>
      </div>
      <h2>{request.title}</h2>
      <p className="request-card__description">{request.description}</p>
      <div className="request-card__info-block">
        <div className="request-card__info-item"><CalendarDays size={14} aria-hidden="true" /><span>{formatDate(request.startTime)}</span></div>
        <div className="request-card__info-item"><Clock3 size={14} aria-hidden="true" /><span>{formatEventTimeRange(request.startTime, request.endTime)}</span></div>
        <div className="request-card__info-item"><MapPin size={14} aria-hidden="true" /><span>{request.location || 'Venue to be confirmed'} · {[request.neighborhood, request.city].filter(Boolean).filter(v => !isPincode(v)).join(', ')}</span></div>
      </div>

      <div className={"demand-card " + (request.status === 'THRESHOLD_REACHED' || request.status === 'CONFIRMED' ? 'demand-card--threshold' : '')} aria-label={`Demand ${demandCount} of ${demandThreshold}`}>
        <div className="demand-card__heading"><div className="demand-card__numbers"><span className="demand-card__current">{demandCount}</span><span className="demand-card__required">/ {demandThreshold}</span></div><span className="demand-card__percentage">{Math.round(demandPercentage)}% met</span></div>
        <div role="progressbar" aria-valuemin="0" aria-valuemax={demandThreshold} aria-valuenow={Math.min(demandCount, demandThreshold)} className="demand-card__track"><span className="demand-card__progress" style={{ width: `${progress * 100}%` }} /></div>
        <div className="demand-card__footer"><span className="demand-card__state">{demandState}</span><span className="demand-card__message">{demandMessage}</span></div>
      </div>

      <p className="request-card__created">Requested {formatDate(request.createdAt)}</p>
      <div className="request-card__footer">
        <Link className="request-card__link" to={`/community-requests/${encodeURIComponent(request.requestId)}`}>View Request</Link>
        {isManagement ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            {!isConfirmed && <button className="secondary-button" type="button" onClick={onEdit}>Edit</button>}
            <button className="button-danger" type="button" disabled={isDeleting || isConfirmed} onClick={onDelete} style={{ minHeight: '38px', padding: '0 12px', fontSize: '13px' }}>{isDeleting ? 'Deleting...' : 'Delete'}</button>
          </div>
        ) : (
          <>
            {isConfirmed && request.eventId && <Link className="primary-button" to={`/events/${encodeURIComponent(request.eventId)}`}>View Event</Link>}
            {request.status === 'COLLECTING_DEMAND' && authenticated && !isOwner && (
              <div className="request-card__action">
                <button className={isInterested ? 'secondary-button' : 'primary-button'} type="button" disabled={interestLoading} onClick={onInterest}>
                  {interestLoading ? 'Updating…' : isInterested ? 'Interested ✓' : "I'm Interested"}
                </button>
              </div>
            )}
            {request.status === 'COLLECTING_DEMAND' && !authenticated && <div className="request-card__action"><Link className="primary-button" to="/login">Login to Express Interest</Link></div>}
          </>
        )}
      </div>
      {interestError && <p className="form-error" role="alert">{interestError}</p>}
    </article>
  )
}

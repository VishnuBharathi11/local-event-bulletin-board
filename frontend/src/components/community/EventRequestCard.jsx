import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { formatDate, formatEventTimeRange } from '../../utils/dateTime.js'
import {
  getDemandCount,
  getDemandMessage,
  getDemandPercentage,
  getDemandProgress,
  getDemandStateLabel,
  getDemandThreshold,
} from '../../utils/eventRequestPresentation.js'

const statusLabels = {
  COLLECTING_DEMAND: 'Collecting Demand',
  THRESHOLD_REACHED: 'Threshold Reached',
  CONFIRMED: 'Confirmed',
  DECLINED: 'Declined',
}

export default function EventRequestCard({
  request,
  isInterested,
  interestLoading,
  interestError,
  onInterest,
  isManagement = false,
  onEdit,
  onDelete,
  isDeleting = false
}) {
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
        <div className="request-card__image-wrap" style={{ margin: '-20px -20px 16px', height: '160px', overflow: 'hidden', borderTopLeftRadius: 'var(--radius-md)', borderTopRightRadius: 'var(--radius-md)' }}>
          <img
            src={request.imageUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={() => setImageError(true)}
          />
        </div>
      ) : (
        <div className="request-card__image-wrap" style={{ margin: '-20px -20px 16px', height: '160px', overflow: 'hidden', borderTopLeftRadius: 'var(--radius-md)', borderTopRightRadius: 'var(--radius-md)', background: 'linear-gradient(145deg, #f0f4f8, #f8fafc)', display: 'grid', placeItems: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '32px', opacity: 0.15 }}>EH</div>
        </div>
      )}
      <div className="request-card__topline">
        <span className="request-card__category">{request.category}</span>
        <span className={`request-card__status request-card__status--${request.status.toLowerCase()}`}>
          {statusLabels[request.status] || request.status}
        </span>
      </div>
      <h2>{request.title}</h2>
      <p className="request-card__description">{request.description}</p>
      <p className="request-card__date">{formatDate(request.startTime)}</p>
      <p className="request-card__meta">{formatEventTimeRange(request.startTime, request.endTime)}</p>
      <p className="request-card__meta">{request.location || 'Venue to be confirmed'} · {request.neighborhood ? `${request.neighborhood}, ` : ''}{request.city}</p>

      <div className="demand-progress" aria-label={`Demand ${demandCount} of ${demandThreshold}`}>
        <div className="demand-progress__label">
          <strong>{demandCount} / {demandThreshold}</strong>
          <span>{Math.round(demandPercentage)}% showed interest</span>
        </div>
        <div className="demand-progress__track" role="progressbar" aria-valuemin="0" aria-valuemax={demandThreshold} aria-valuenow={Math.min(demandCount, demandThreshold)} aria-label="Community demand progress">
          <span style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="demand-progress__status">
          <strong>{demandState}</strong>
          <span>{demandMessage}</span>
        </div>
      </div>

      <p className="request-card__created">Requested {formatDate(request.createdAt)}</p>

      <div className="request-card__footer">
        <Link className="request-card__link" to={`/community-requests/${encodeURIComponent(request.requestId)}`}>View Request</Link>

        {isManagement ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            {!isConfirmed && (
              <button className="secondary-button" type="button" onClick={onEdit}>Edit</button>
            )}
            <button
              className="button-danger"
              type="button"
              disabled={isDeleting || isConfirmed}
              onClick={onDelete}
              style={{ minHeight: '38px', padding: '0 12px', fontSize: '13px' }}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        ) : (
          <>
            {isConfirmed && request.eventId && (
              <Link className="primary-button" to={`/events/${encodeURIComponent(request.eventId)}`}>View Event</Link>
            )}
            {request.status === 'COLLECTING_DEMAND' && (
              authenticated ? (
                !isOwner && (
                  <button className="primary-button" type="button" disabled={isInterested || interestLoading} onClick={onInterest}>
                    {interestLoading ? 'Saving…' : isInterested ? 'Interested ✓' : 'Express Interest'}
                  </button>
                )
              ) : (
                <Link className="primary-button" to="/login">Login to Express Interest</Link>
              )
            )}
          </>
        )}
      </div>
      {interestError && <p className="form-error" role="alert">{interestError}</p>}
    </article>
  )
}

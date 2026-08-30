import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Clock3, MapPin, Share2, User } from 'lucide-react'
import CategoryBadge from '../events/CategoryBadge.jsx'
import EventStatusBadge from '../events/EventStatusBadge.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { formatDate, formatEventTimeRange } from '../../utils/dateTime.js'
import { isPincode } from '../../utils/eventDiscovery.js'
import { shareRequest } from '../../utils/eventShare.js'
import {
  getDemandCount,
  getDemandPercentage,
  getDemandProgress,
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
  isDeleting = false,
}) {
  const { authenticated, currentUser } = useAuth()
  const [imageError, setImageError] = useState(false)
  const [shareFeedback, setShareFeedback] = useState('')
  const demandCount = getDemandCount(request)
  const demandThreshold = getDemandThreshold(request)
  const demandPercentage = getDemandPercentage(request)
  const demandProgress = getDemandProgress(request)
  const isConfirmed = request.status === 'CONFIRMED' || Boolean(request.eventId)
  const isOwner = currentUser?.userId === request.organizerId
  const canToggleInterest =
    request.status === 'COLLECTING_DEMAND' || (request.status === 'THRESHOLD_REACHED' && isInterested)

  const cleanLocalityList = [request.neighborhood, request.city]
    .filter(Boolean)
    .filter((v) => !isPincode(v))
  const locationLabel = [request.location || 'Venue to be confirmed', ...cleanLocalityList].join(', ')
  const requesterName = request.requesterName || request.organizerName || 'Community Member'
  const interestedLabel = `${demandCount} ${demandCount === 1 ? 'person interested' : 'people interested'}`

  const handleShare = async () => {
    try {
      const result = await shareRequest(request)
      if (result?.message) {
        setShareFeedback(result.message)
        setTimeout(() => setShareFeedback(''), 2500)
      }
    } catch (err) {
      setShareFeedback(err?.message || 'Unable to share request')
      setTimeout(() => setShareFeedback(''), 2500)
    }
  }

  return (
    <article className="event-card request-card">
      {request.imageUrl && !imageError ? (
        <div className="event-card__image-wrap">
          <img
            src={request.imageUrl}
            alt={request.title}
            className="event-card__image"
            onError={() => setImageError(true)}
          />
        </div>
      ) : (
        <div className="event-card__image-wrap event-card__image-wrap--fallback">
          <div className="event-card__fallback-text">EH</div>
        </div>
      )}

      <div className="event-card__badges">
        <CategoryBadge category={request.category} />
        <span className={`event-status request-card__status--${(request.status || '').toLowerCase()}`}>
          {statusLabels[request.status] || request.status}
        </span>
      </div>

      <h2 className="event-card__title" title={request.title}>
        {request.title}
      </h2>

      <div className="event-card__organizer" aria-label={`Organizer ${requesterName}`}>
        <User size={13} aria-hidden="true" />
        <span className="event-card__organizer-name">{requesterName}</span>
      </div>

      <div className="event-card__info-block">
        <div className="event-card__info-item">
          <CalendarDays size={14} aria-hidden="true" />
          <span className="event-card__datetime">
            <strong>{formatDate(request.startTime)}</strong>
          </span>
        </div>
        <div className="event-card__info-item">
          <Clock3 size={14} aria-hidden="true" />
          <span className="event-card__datetime">
            {formatEventTimeRange(request.startTime, request.endTime)}
          </span>
        </div>
      </div>

      <div className="event-card__location" title={locationLabel}>
        <MapPin size={15} aria-hidden="true" style={{ flexShrink: 0, color: 'var(--brand)', marginTop: '1px' }} />
        <span className="event-card__location-text">
          <strong>{request.location || 'Venue to be confirmed'}</strong>
          <small>{cleanLocalityList.join(' · ') || 'Local Community'}</small>
        </span>
      </div>

      <div className="event-card__footer">
        <span className="event-card__rsvp">{interestedLabel}</span>
        <div className="event-card__actions">
          {isManagement ? (
            <div style={{ display: 'flex', gap: '6px' }}>
              {!isConfirmed && (
                <button
                  className="secondary-button"
                  type="button"
                  onClick={onEdit}
                  style={{ minHeight: '34px', padding: '0 10px', fontSize: '12px' }}
                >
                  Edit
                </button>
              )}
              <button
                className="button-danger"
                type="button"
                disabled={isDeleting || isConfirmed}
                onClick={onDelete}
                style={{ minHeight: '34px', padding: '0 10px', fontSize: '12px' }}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          ) : (
            <>
              {isConfirmed && request.eventId ? (
                <Link
                  className="secondary-button"
                  to={`/events/${encodeURIComponent(request.eventId)}`}
                  style={{ minHeight: '34px', padding: '0 12px', fontSize: '12px' }}
                >
                  View Event
                </Link>
              ) : canToggleInterest && !isOwner ? (
                authenticated ? (
                  <div className="event-card__rsvp-action">
                    <button
                      className={isInterested ? 'secondary-button' : 'primary-button'}
                      type="button"
                      disabled={interestLoading}
                      onClick={onInterest}
                      style={{ minHeight: '34px', padding: '0 12px', fontSize: '12px' }}
                    >
                      {interestLoading ? '…' : !isInterested ? 'Express Interest' : 'Interested ✓'}
                    </button>
                  </div>
                ) : (
                  <div className="event-card__rsvp-action">
                    <Link
                      className="secondary-link"
                      to="/login"
                      style={{ minHeight: '34px', padding: '0 12px', fontSize: '12px' }}
                    >
                      Login to Express Interest
                    </Link>
                  </div>
                )
              ) : null}
            </>
          )}

          <button
            type="button"
            className="event-card__share-btn"
            onClick={handleShare}
            aria-label="Share request"
            title={shareFeedback || 'Share request'}
          >
            <Share2 size={15} strokeWidth={2} />
          </button>
        </div>
      </div>

      {shareFeedback && (
        <p className="event-card__share-toast" role="status" aria-live="polite">
          {shareFeedback}
        </p>
      )}

      {interestError && (
        <p className="form-error" role="alert" style={{ margin: '6px 0 0', fontSize: '12px' }}>
          {interestError}
        </p>
      )}

      <Link
        className="event-card__link"
        to={`/community-requests/${encodeURIComponent(request.requestId)}`}
      >
        View Request <span aria-hidden="true">→</span>
      </Link>
    </article>
  )
}

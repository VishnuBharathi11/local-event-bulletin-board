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

export default function EventRequestCard({ request, isInterested, interestLoading, interestError, onInterest }) {
  const { authenticated } = useAuth()
  const demandCount = getDemandCount(request)
  const demandThreshold = getDemandThreshold(request)
  const demandPercentage = getDemandPercentage(request)
  const progress = getDemandProgress(request)
  const demandMessage = getDemandMessage(request)
  const demandState = getDemandStateLabel(request.status)
  const isThresholdReached = request.status === 'THRESHOLD_REACHED'

  return (
    <article className={`request-card request-card--ui06 ${isThresholdReached ? 'request-card--threshold' : ''}`}>
      <div className="request-card__topline">
        <span className="request-card__category">{request.category}</span>
        <span className={`request-card__status request-card__status--${request.status.toLowerCase()}`}>
          {statusLabels[request.status] || request.status}
        </span>
      </div>

      <div className="request-card__heading">
        <h2>{request.title}</h2>
        <span className="request-card__demand-context">Community proposal</span>
      </div>

      <p className="request-card__description">{request.description}</p>

      <div className="request-card__metadata" aria-label="Request details">
        <div className="request-card__metadata-item">
          <span className="request-card__metadata-label">Date</span>
          <strong>{formatDate(request.startTime)}</strong>
        </div>
        <div className="request-card__metadata-item">
          <span className="request-card__metadata-label">Time</span>
          <strong>{formatEventTimeRange(request.startTime, request.endTime)}</strong>
        </div>
        <div className="request-card__metadata-item request-card__metadata-item--wide">
          <span className="request-card__metadata-label">Location</span>
          <strong>{request.location || 'Venue to be confirmed'}</strong>
          <span>{[request.neighborhood, request.city].filter(Boolean).join(' · ')}</span>
        </div>
      </div>

      <div className="demand-progress demand-progress--ui06" aria-label={`Demand ${demandCount} of ${demandThreshold}`}>
        <div className="demand-progress__label">
          <div>
            <span className="demand-progress__eyebrow">Community interest</span>
            <strong>{demandCount} / {demandThreshold}</strong>
          </div>
          <strong className="demand-progress__percentage">{Math.round(demandPercentage)}%</strong>
        </div>
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
        <div className="demand-progress__status">
          <strong>{demandState}</strong>
          <span>{demandMessage}</span>
        </div>
      </div>

      <p className="request-card__created">Requested {formatDate(request.createdAt)}</p>

      <div className="request-card__footer request-card__footer--ui06">
        <Link className="request-card__link" to={`/community-requests/${encodeURIComponent(request.requestId)}`}>View Request</Link>
        <div className="request-card__action">
          {request.status === 'COLLECTING_DEMAND' && (
            authenticated ? (
              <button className="primary-button" type="button" disabled={isInterested || interestLoading} onClick={onInterest}>
                {interestLoading ? 'Saving…' : isInterested ? 'Interested ✓' : 'Express Interest'}
              </button>
            ) : (
              <Link className="primary-button" to="/login">Login to Express Interest</Link>
            )
          )}
          {isThresholdReached && (
            <span className="request-card__threshold-state" role="status">
              <span aria-hidden="true">✓</span>
              Threshold Reached
            </span>
          )}
        </div>
      </div>

      {interestError && <p className="form-error request-card__interest-error" role="alert">{interestError}</p>}
    </article>
  )
}

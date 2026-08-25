import { Link } from 'react-router-dom'
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

export default function EventRequestCard({ request, isInterested, interestLoading, onInterest }) {
  const demandCount = getDemandCount(request)
  const demandThreshold = getDemandThreshold(request)
  const demandPercentage = getDemandPercentage(request)
  const progress = getDemandProgress(request)
  const demandMessage = getDemandMessage(request)
  const demandState = getDemandStateLabel(request.status)

  return (
    <article className="request-card">
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
          <span>{Math.round(demandPercentage)}% demand</span>
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
        {request.status === 'COLLECTING_DEMAND' && (
          <button className="primary-button" type="button" disabled={isInterested || interestLoading} onClick={onInterest}>
            {interestLoading ? 'Saving…' : isInterested ? 'Interested ✓' : 'Express Interest'}
          </button>
        )}
      </div>
    </article>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getEventById } from '../services/eventService.js'
import { formatDate, formatEventTimeRange } from '../utils/dateTime.js'
import '../styles/conflictReview.css'

export default function ConflictReview({ conflicts, onCancel, onContinue, continuing = false }) {
  const [events, setEvents] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function loadConflictingEvents() {
      setLoading(true)
      setError(null)
      try {
        const entries = await Promise.all(conflicts.map(async (conflict) => {
          const event = await getEventById(conflict.conflictingEventId)
          return [conflict.conflictingEventId, event]
        }))
        if (!cancelled) setEvents(Object.fromEntries(entries))
      } catch (loadError) {
        if (!cancelled) setError(loadError.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadConflictingEvents()
    return () => { cancelled = true }
  }, [conflicts])

  return (
    <div className="conflict-overlay" role="presentation">
      <section className="conflict-dialog" role="dialog" aria-modal="true" aria-labelledby="conflict-title">
        <header className="conflict-dialog__header">
          <div>
            <span className="conflict-dialog__badge">Organizer Action Required</span>
            <h2 id="conflict-title">Review Potential Event Conflict</h2>
          </div>
          <button className="conflict-dialog__close" type="button" onClick={onCancel} disabled={continuing} aria-label="Close conflict review">×</button>
        </header>

        <div className="conflict-assessment-box">
          <p className="conflict-dialog__summary">
            A potential timing, location, or content conflict has been detected. The system identified <strong>{conflicts.length} similar event{conflicts.length === 1 ? '' : 's'}</strong> with overlapping details.
          </p>
        </div>

        {loading && <p className="conflict-dialog__state">Loading conflicting event details…</p>}
        {error && <p className="form-error" role="alert">{error}</p>}

        <div className="conflict-list">
          {conflicts.map((conflict) => {
            const event = events[conflict.conflictingEventId]
            const activityPercent = Math.round((conflict.activitySimilarity ?? 0) * 100)
            const isHighConflict = conflict.conflictScore >= 75
            const isMediumConflict = conflict.conflictScore >= 40 && conflict.conflictScore < 75

            return (
              <article className="conflict-card" key={conflict.conflictingEventId}>
                <div className="conflict-card__topline">
                  <span className="conflict-card__subtitle">Conflict Evidence Signals</span>
                  <Link className="secondary-link" to={`/events/${encodeURIComponent(conflict.conflictingEventId)}`}>Inspect Original Event →</Link>
                </div>

                {/* Evidence Metrics Grid */}
                <div className="conflict-metrics-grid" aria-label="Conflict intelligence">
                  <div className={`conflict-metric-card ${isHighConflict ? 'conflict-metric-card--danger' : isMediumConflict ? 'conflict-metric-card--warning' : 'conflict-metric-card--success'}`}>
                    <span className="conflict-metric-card__value">{conflict.conflictScore} / 100</span>
                    <span className="conflict-metric-card__label">Conflict Score</span>
                  </div>
                  <div className="conflict-metric-card">
                    <span className="conflict-metric-card__value">{activityPercent}%</span>
                    <span className="conflict-metric-card__label">Activity Similarity</span>
                  </div>
                  <div className="conflict-metric-card">
                    <span className="conflict-metric-card__value conflict-metric-card__value--text" title={conflict.activityDomain || 'GENERAL'}>
                      {conflict.activityDomain || 'GENERAL'}
                    </span>
                    <span className="conflict-metric-card__label">Detected Domain</span>
                  </div>
                </div>

                {/* Flagged Reasons list */}
                <div className="conflict-reasons-wrapper">
                  <h4 className="conflict-reasons__title">Flagged Conflict Indicators</h4>
                  <ul className="conflict-card__reasons">
                    {conflict.reasons.map((reason) => <li key={reason}>{reason}</li>)}
                  </ul>
                </div>

                {/* Conflicting Event Preview */}
                {event ? (
                  <div className="conflict-card__event">
                    <span className="conflict-event__eyebrow">Conflicting Published Event</span>
                    <h3>{event.title}</h3>
                    <p className="conflict-event__meta">
                      <strong style={{ color: 'var(--text-strong)' }}>{event.category}</strong> · {formatDate(event.startTime)} · {formatEventTimeRange(event.startTime, event.endTime)}
                    </p>
                    <p className="conflict-event__venue">
                      {event.location} · {event.neighborhood}, {event.city}
                    </p>
                  </div>
                ) : (
                  <p className="conflict-dialog__state">Conflicting event details are currently unavailable.</p>
                )}
              </article>
            )
          })}
        </div>

        <div className="organizer-decision-section">
          <h3>Organizer Decision</h3>
          <p className="conflict-dialog__note">
            Review the conflict metrics and indicators above. Select whether to decline the confirmation or proceed with an override.
          </p>
          
          <footer className="conflict-dialog__actions">
            {/* Primary safety action - Cancel / Decline */}
            <button className="primary-button" type="button" onClick={onCancel} disabled={continuing}>
              Decline & Cancel
            </button>
            {/* Secondary warning action - Confirm Anyway (Override) */}
            <button className="secondary-button conflict-dialog__override-btn" type="button" onClick={onContinue} disabled={continuing}>
              {continuing ? 'Confirming Event…' : 'Override & Confirm Anyway'}
            </button>
          </footer>
        </div>
      </section>
    </div>
  )
}

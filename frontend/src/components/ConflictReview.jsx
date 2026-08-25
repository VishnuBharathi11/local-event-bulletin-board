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
            <p className="eyebrow">Organizer review</p>
            <h2 id="conflict-title">Potential Event Conflict</h2>
          </div>
          <button className="conflict-dialog__close" type="button" onClick={onCancel} disabled={continuing} aria-label="Close conflict review">×</button>
        </header>

        <p className="conflict-dialog__summary">
          We found {conflicts.length} similar event{conflicts.length === 1 ? '' : 's'} that may overlap with yours.
        </p>

        {loading && <p className="conflict-dialog__state">Loading existing event details…</p>}
        {error && <p className="form-error" role="alert">{error}</p>}

        <div className="conflict-list">
          {conflicts.map((conflict) => {
            const event = events[conflict.conflictingEventId]
            const activityPercent = Math.round((conflict.activitySimilarity ?? 0) * 100)
            const hasMeaningfulActivity = activityPercent >= 60

            return (
              <article className="conflict-card" key={conflict.conflictingEventId}>
                <div className="conflict-card__topline">
                  <strong>Conflict Score: {conflict.conflictScore} / 100</strong>
                  <Link className="secondary-link" to={`/events/${encodeURIComponent(conflict.conflictingEventId)}`}>Review Existing Event</Link>
                </div>

                <div className="conflict-card__intelligence" aria-label="Conflict intelligence">
                  <div>
                    <span>Activity Similarity</span>
                    <strong>{activityPercent}%</strong>
                  </div>
                  {hasMeaningfulActivity && (
                    <div>
                      <span>Activity / Domain</span>
                      <strong>{conflict.activityDomain || 'Unknown / General'}</strong>
                    </div>
                  )}
                </div>

                {event ? (
                  <div className="conflict-card__event">
                    <h3>{event.title}</h3>
                    <p>{event.category} · {formatDate(event.startTime)} · {formatEventTimeRange(event.startTime, event.endTime)}</p>
                    <p>{event.location} · {event.neighborhood}, {event.city}</p>
                  </div>
                ) : (
                  <p className="conflict-dialog__state">Existing event details are unavailable.</p>
                )}
                <ul className="conflict-card__reasons">
                  {conflict.reasons.map((reason) => <li key={reason}>{reason}</li>)}
                </ul>
              </article>
            )
          })}
        </div>

        <p className="conflict-dialog__note">Review the existing events before deciding whether to continue.</p>
        <footer className="conflict-dialog__actions">
          <button className="secondary-button" type="button" onClick={onCancel} disabled={continuing}>Cancel</button>
          <button className="primary-button" type="button" onClick={onContinue} disabled={continuing}>{continuing ? 'Creating Event…' : 'Continue Anyway'}</button>
        </footer>
      </section>
    </div>
  )
}

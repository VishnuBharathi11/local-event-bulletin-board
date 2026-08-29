import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getEventById } from '../services/eventService.js'
import { formatDate, formatEventTimeRange } from '../utils/dateTime.js'
import '../styles/conflictReview.css'

export default function ConflictReview({
  conflicts,
  suggestions = [],
  onCancel,
  onContinue,
  onCheckAvailability,
  onConfirm,
  checking = false,
  continuing = false,
  availabilityMessage = null
}) {
  const [events, setEvents] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedAlternative, setSelectedAlternative] = useState(null)

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
            <span className="conflict-dialog__badge" style={{ backgroundColor: '#fff1f2', color: '#be123c', borderColor: '#fda4af' }}>⚠ Scheduling Conflict</span>
            <h2 id="conflict-title">Conflict Resolution Required</h2>
          </div>
          <button className="conflict-dialog__close" type="button" onClick={onCancel} disabled={continuing || checking} aria-label="Close conflict review">×</button>
        </header>

        <div className="conflict-assessment-box">
          <p className="conflict-dialog__summary">
            Another event is already scheduled at this location during the selected time.
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
              <article className="conflict-card" key={conflict.conflictingEventId} style={{ borderLeft: isHighConflict ? '4px solid #be123c' : '4px solid #eab308' }}>
                <div className="conflict-card__topline">
                  <span className="conflict-card__subtitle">Conflict Evidence</span>
                  <Link className="secondary-link" to={`/events/${encodeURIComponent(conflict.conflictingEventId)}`}>View Original →</Link>
                </div>

                {!onCheckAvailability && conflict.conflictScore > 0 && (
                  <div className="conflict-metrics-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                    <div className={`conflict-metric-card ${isHighConflict ? 'conflict-metric-card--danger' : 'conflict-metric-card--warning'}`} style={{ padding: '10px', borderRadius: '6px', background: isHighConflict ? '#fff1f2' : '#fefce8' }}>
                      <span style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>Score</span>
                      <strong style={{ fontSize: '16px' }}>{conflict.conflictScore}%</strong>
                    </div>
                    {activityPercent > 0 && (
                      <div className="conflict-metric-card" style={{ padding: '10px', borderRadius: '6px', background: '#f8fafc' }}>
                        <span style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>Topic Match</span>
                        <strong style={{ fontSize: '16px' }}>{activityPercent}%</strong>
                      </div>
                    )}
                  </div>
                )}

                {event ? (
                  <div className="conflict-card__event">
                    <span className="conflict-event__eyebrow" style={{ color: isHighConflict ? '#be123c' : '#854d0e' }}>Conflicting Published Event</span>
                    <h3 style={{ margin: '4px 0', fontSize: '16px' }}>{event.title}</h3>
                    <p className="conflict-event__meta" style={{ fontSize: '13px', margin: '2px 0' }}>
                      <strong>{event.category}</strong> · {formatDate(event.startTime)} · {formatEventTimeRange(event.startTime, event.endTime)}
                    </p>
                    <p className="conflict-event__venue" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {event.location} · {event.neighborhood}
                    </p>
                  </div>
                ) : (
                  <p className="conflict-dialog__state">Conflicting event details are currently unavailable.</p>
                )}
              </article>
            )
          })}
        </div>

        {onCheckAvailability && (
          <div className="suggestions-section">
            <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '12px' }}>Suggested Alternatives</h3>
            {suggestions.length > 0 ? (
              <div className="suggestions-list">
                {suggestions.map((alt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`suggestion-item ${selectedAlternative === alt ? 'selected' : ''}`}
                    onClick={() => { setSelectedAlternative(alt); onCheckAvailability(null, true); }}
                  >
                    <span className="suggestion-item__icon">
                      {selectedAlternative === alt ? '✓' : '○'}
                    </span>
                    <div>
                      <strong style={{ display: 'block', fontSize: '14px' }}>{formatDate(alt.startTime)} • {formatEventTimeRange(alt.startTime, alt.endTime)}</strong>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{alt.location} · {alt.neighborhood}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="conflict-dialog__state">No available alternatives found.</p>
            )}

            {selectedAlternative && (
              <div className="selected-alternative-preview">
                <h4>Selected Alternative</h4>
                <div style={{ fontSize: '15px' }}>
                  <p><strong>Date:</strong> {formatDate(selectedAlternative.startTime)}</p>
                  <p><strong>Time:</strong> {formatEventTimeRange(selectedAlternative.startTime, selectedAlternative.endTime)}</p>
                  <p><strong>Location:</strong> {selectedAlternative.location}</p>
                </div>

                {availabilityMessage && (
                  <p className="availability-success-msg">
                    {availabilityMessage}
                  </p>
                )}

                <div style={{ marginTop: '16px' }}>
                  {!availabilityMessage ? (
                    <button
                      className="primary-button"
                      type="button"
                      onClick={() => onCheckAvailability(selectedAlternative)}
                      disabled={checking}
                      style={{ width: '100%' }}
                    >
                      {checking ? 'Checking…' : 'Check Availability'}
                    </button>
                  ) : (
                    <button
                      className="primary-button confirm-create-btn"
                      type="button"
                      onClick={() => onConfirm(selectedAlternative)}
                      disabled={continuing}
                      style={{ width: '100%' }}
                    >
                      {continuing ? 'Creating…' : 'Confirm & Create Event'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {onContinue && (
          <div className="organizer-decision-section" style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            <h3>Organizer Decision</h3>
            <p className="conflict-dialog__note" style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Review the conflict details above. You can choose to cancel or proceed with an override.
            </p>
            <footer className="conflict-dialog__actions" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="secondary-button" type="button" onClick={onCancel} disabled={continuing}>
                Decline & Cancel
              </button>
              <button className="primary-button conflict-dialog__override-btn" type="button" onClick={onContinue} disabled={continuing}>
                {continuing ? 'Confirming…' : 'Override & Confirm Anyway'}
              </button>
            </footer>
          </div>
        )}

        {onCheckAvailability && (
          <div className="organizer-decision-section" style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            <footer className="conflict-dialog__actions">
              <button className="secondary-button" type="button" onClick={onCancel} disabled={continuing || checking}>
                Return to Form
              </button>
            </footer>
          </div>
        )}
      </section>
    </div>
  )
}

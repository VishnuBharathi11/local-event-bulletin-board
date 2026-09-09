import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getEventById } from '../services/eventService.js'
import { formatDate, formatEventTimeRange } from '../utils/dateTime.js'
import '../styles/conflictReview.css'

export default function ConflictReview({
  conflicts,
  suggestions = [],
  onCancel,
  onCheckAvailability,
  onConfirm,
  checking = false,
  continuing = false,
  availabilityMessage = null,
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
        const entries = await Promise.all(
          conflicts.map(async (conflict) => {
            const event = await getEventById(conflict.conflictingEventId)
            return [conflict.conflictingEventId, event]
          })
        )

        if (!cancelled) {
          setEvents(Object.fromEntries(entries))
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadConflictingEvents()

    return () => {
      cancelled = true
    }
  }, [conflicts])

  return (
    <div className="conflict-overlay" role="presentation">
      <section
        className="conflict-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="conflict-title"
      >
        <header className="conflict-dialog__header">
          <div>
            <span
              className="conflict-dialog__badge"
              style={{
                backgroundColor: '#fff1f2',
                color: '#be123c',
                borderColor: '#fda4af',
              }}
            >
              ⚠ Scheduling Conflict
            </span>

            <h2 id="conflict-title">
              Conflict Resolution Required
            </h2>
          </div>

          <button
            className="conflict-dialog__close"
            type="button"
            onClick={onCancel}
            disabled={continuing || checking}
            aria-label="Close conflict review"
          >
            ×
          </button>
        </header>

        <div className="conflict-assessment-box">
          <h3
            style={{
              margin: '0 0 8px',
              fontSize: '17px',
              fontWeight: '800',
            }}
          >
            Your event cannot use this time and venue
          </h3>

          <p className="conflict-dialog__summary">
            EventHive found one or more published events that already
            occupy the selected location during your requested time.
            Publishing your event at the same venue and time could
            create a scheduling conflict for organizers and attendees.
          </p>

          <p
            className="conflict-dialog__summary"
            style={{ marginTop: '10px' }}
          >
            Please choose a different time or venue. EventHive has
            provided alternative options below when available.
          </p>
        </div>

        {loading && (
          <p className="conflict-dialog__state">
            Loading conflicting event details…
          </p>
        )}

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <div className="conflict-list">
          {conflicts.map((conflict) => {
            const event = events[conflict.conflictingEventId]

            const activityPercent = Math.round(
              (conflict.activitySimilarity ?? 0) * 100
            )

            const isHardConflict =
              Boolean(conflict.isHardConflict)

            const isHighConflict =
              isHardConflict ||
              conflict.conflictScore >= 75

            const isMediumConflict =
              conflict.conflictScore >= 40 &&
              conflict.conflictScore < 75

            return (
              <article
                className="conflict-card"
                key={conflict.conflictingEventId}
                style={{
                  borderLeft: isHighConflict
                    ? '4px solid #be123c'
                    : '4px solid #eab308',
                }}
              >
                <div className="conflict-card__topline">
                  <span className="conflict-card__subtitle">
                    Conflict Evidence
                  </span>

                  <Link
                    className="secondary-link"
                    to={`/events/${encodeURIComponent(
                      conflict.conflictingEventId
                    )}`}
                  >
                    View Original →
                  </Link>
                </div>

                {conflict.conflictScore > 0 && (
                  <div
                    className="conflict-metrics-grid"
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        activityPercent > 0
                          ? '1fr 1fr'
                          : '1fr',
                      gap: '8px',
                      marginBottom: '16px',
                    }}
                  >
                    <div
                      className={`conflict-metric-card ${
                        isHighConflict
                          ? 'conflict-metric-card--danger'
                          : 'conflict-metric-card--warning'
                      }`}
                      style={{
                        padding: '10px',
                        borderRadius: '6px',
                        background: isHighConflict
                          ? '#fff1f2'
                          : '#fefce8',
                      }}
                    >
                      <span
                        style={{
                          display: 'block',
                          fontSize: '11px',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                        }}
                      >
                        Conflict Score
                      </span>

                      <strong style={{ fontSize: '16px' }}>
                        {conflict.conflictScore}%
                      </strong>
                    </div>

                    {activityPercent > 0 && (
                      <div
                        className="conflict-metric-card"
                        style={{
                          padding: '10px',
                          borderRadius: '6px',
                          background: '#f8fafc',
                        }}
                      >
                        <span
                          style={{
                            display: 'block',
                            fontSize: '11px',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                          }}
                        >
                          Topic Match
                        </span>

                        <strong style={{ fontSize: '16px' }}>
                          {activityPercent}%
                        </strong>
                      </div>
                    )}
                  </div>
                )}

                {event ? (
                  <div className="conflict-card__event">
                    <span
                      className="conflict-event__eyebrow"
                      style={{
                        color: isHighConflict
                          ? '#be123c'
                          : '#854d0e',
                      }}
                    >
                      Conflicting Published Event
                    </span>

                    <h3
                      style={{
                        margin: '4px 0',
                        fontSize: '16px',
                      }}
                    >
                      {event.title}
                    </h3>

                    <p
                      className="conflict-event__meta"
                      style={{
                        fontSize: '13px',
                        margin: '2px 0',
                      }}
                    >
                      <strong>{event.category}</strong>
                      {' · '}
                      {formatDate(event.startTime)}
                      {' · '}
                      {formatEventTimeRange(
                        event.startTime,
                        event.endTime
                      )}
                    </p>

                    <p
                      className="conflict-event__venue"
                      style={{
                        fontSize: '13px',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {event.location}
                      {' · '}
                      {event.neighborhood}
                    </p>

                    {isHardConflict && (
                      <div
                        style={{
                          marginTop: '12px',
                          padding: '10px 12px',
                          borderRadius: '6px',
                          background: '#fff7ed',
                          border: '1px solid #fed7aa',
                        }}
                      >
                        <strong
                          style={{
                            display: 'block',
                            marginBottom: '4px',
                            fontSize: '13px',
                            color: '#9a3412',
                          }}
                        >
                          Why this requires a change
                        </strong>

                        <span
                          style={{
                            display: 'block',
                            fontSize: '13px',
                            lineHeight: '1.5',
                            color: '#7c2d12',
                          }}
                        >
                          This published event is already using the
                          selected venue during the same time period.
                          Your event should use another available time
                          or venue to avoid two events being scheduled
                          at the same place simultaneously.
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="conflict-dialog__state">
                    Conflicting event details are currently
                    unavailable.
                  </p>
                )}
              </article>
            )
          })}
        </div>

        {onCheckAvailability && (
          <div className="suggestions-section">
            <h3
              style={{
                fontSize: '16px',
                fontWeight: '800',
                marginBottom: '8px',
              }}
            >
              Recommended Alternatives
            </h3>

            <p
              style={{
                fontSize: '13px',
                lineHeight: '1.5',
                color: 'var(--text-muted)',
                marginBottom: '12px',
              }}
            >
              Select an alternative time or venue that works for
              your event. EventHive will verify that the selected
              option is available before allowing the event to be
              created.
            </p>

            {suggestions.length > 0 ? (
              <div className="suggestions-list">
                {suggestions.map((alt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`suggestion-item ${
                      selectedAlternative === alt
                        ? 'selected'
                        : ''
                    }`}
                    onClick={() =>
                      setSelectedAlternative(alt)
                    }
                    disabled={checking || continuing}
                  >
                    <span className="suggestion-item__icon">
                      {selectedAlternative === alt ? '✓' : '○'}
                    </span>

                    <div>
                      <strong
                        style={{
                          display: 'block',
                          fontSize: '14px',
                        }}
                      >
                        {formatDate(alt.startTime)}
                        {' • '}
                        {formatEventTimeRange(
                          alt.startTime,
                          alt.endTime
                        )}
                      </strong>

                      <span
                        style={{
                          fontSize: '13px',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {alt.location}
                        {' · '}
                        {alt.neighborhood}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="conflict-dialog__state">
                No available alternatives were found automatically.
                Please return to the form and choose a different
                time or venue.
              </p>
            )}

            {selectedAlternative && (
              <div className="selected-alternative-preview">
                <h4>Selected Alternative</h4>

                <div style={{ fontSize: '15px' }}>
                  <p>
                    <strong>Date:</strong>{' '}
                    {formatDate(
                      selectedAlternative.startTime
                    )}
                  </p>

                  <p>
                    <strong>Time:</strong>{' '}
                    {formatEventTimeRange(
                      selectedAlternative.startTime,
                      selectedAlternative.endTime
                    )}
                  </p>

                  <p>
                    <strong>Location:</strong>{' '}
                    {selectedAlternative.location}
                  </p>
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
                      onClick={() =>
                        onCheckAvailability(
                          selectedAlternative
                        )
                      }
                      disabled={checking}
                      style={{ width: '100%' }}
                    >
                      {checking
                        ? 'Checking…'
                        : 'Check Availability'}
                    </button>
                  ) : (
                    <button
                      className="primary-button confirm-create-btn"
                      type="button"
                      onClick={() =>
                        onConfirm(selectedAlternative)
                      }
                      disabled={continuing}
                      style={{ width: '100%' }}
                    >
                      {continuing
                        ? 'Creating…'
                        : 'Confirm & Create Event'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div
          className="organizer-decision-section"
          style={{
            borderTop: '1px solid var(--border)',
            paddingTop: '20px',
          }}
        >
          <h3>What should you do?</h3>

          <p
            className="conflict-dialog__note"
            style={{
              fontSize: '14px',
              lineHeight: '1.6',
              color: 'var(--text-muted)',
              marginBottom: '16px',
            }}
          >
            To keep the community schedule clear and prevent
            overlapping events at the same venue, choose a different
            time or location for your event.
          </p>

          {onCheckAvailability ? (
            <div
              className="conflict-dialog__actions"
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
              }}
            >
              <button
                className="secondary-button"
                type="button"
                onClick={onCancel}
                disabled={continuing || checking}
              >
                Return to Form
              </button>
            </div>
          ) : (
            <div
              className="conflict-dialog__actions"
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
              }}
            >
              <button
                className="secondary-button"
                type="button"
                onClick={onCancel}
                disabled={continuing || checking}
              >
                Change Time or Venue
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ArrowLeft, Navigation } from 'lucide-react'
import CategoryBadge from '../components/events/CategoryBadge.jsx'
import EventStatusBadge from '../components/events/EventStatusBadge.jsx'
import EventActions from '../components/events/EventActions.jsx'
import { useEvent } from '../hooks/useEvent.js'
import { useEventRSVP } from '../hooks/useEventRSVP.js'
import { useAuth } from '../context/AuthContext.jsx'
import { formatDate, formatEventTimeRange } from '../utils/dateTime.js'
import { isPincode } from '../utils/eventDiscovery.js'
import { getEventLifecycleStatus, getNextEventLifecycleBoundary } from '../utils/eventLifecycle.js'
import EventMap from '../components/map/EventMap.jsx'
import '../styles/eventDetails.css'

export default function EventDetailsPage() {
  const { eventId } = useParams()
  const { status, event, error } = useEvent(eventId)
  const { authenticated, currentUser } = useAuth()
  const rsvp = useEventRSVP(eventId, authenticated)
  const [lifecycleStatus, setLifecycleStatus] = useState(() => getEventLifecycleStatus(event))

  useEffect(() => {
    if (!event) return undefined
    let timerId
    let cancelled = false

    const updateLifecycle = () => {
      if (cancelled) return
      const nextStatus = getEventLifecycleStatus(event)
      setLifecycleStatus(nextStatus)
      const boundary = getNextEventLifecycleBoundary(event)
      if (boundary) timerId = window.setTimeout(updateLifecycle, Math.max(boundary - Date.now(), 0) + 50)
    }

    updateLifecycle()
    return () => {
      cancelled = true
      if (timerId) window.clearTimeout(timerId)
    }
  }, [event])

  if (status === 'loading') return <div className="state-card state-card--loading" role="status"><div className="state-card__icon" aria-hidden="true">◷</div><strong>Loading event…</strong><span>Retrieving event details.</span></div>
  if (status === 'not-found') return <div className="state-card state-card--error"><div className="state-card__icon" aria-hidden="true">!</div><strong>Event not found</strong><span>The requested event does not exist or is no longer available.</span><Link className="secondary-link" to="/">Back to Event Board</Link></div>
  if (status === 'error') return <div className="state-card state-card--error" role="alert"><div className="state-card__icon" aria-hidden="true">!</div><strong>Unable to load event</strong><span>{error}</span><Link className="secondary-link" to="/">Back to Event Board</Link></div>

  const isOngoing = lifecycleStatus === 'ACTIVE'
  const isExpired = lifecycleStatus === 'EXPIRED'

  async function handleGoing() {
    await rsvp.setGoing()
  }

  async function handleNotGoing() {
    await rsvp.setNotGoing()
  }

  return (
    <article className="event-details">
      <Link className="back-link" to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><ArrowLeft size={16} /> Back to Event Board</Link>

      <div className="event-details__container">
        <div className="event-details__left">
          {event.imageUrl ? <div className="event-details__image-wrap"><img src={event.imageUrl} alt={event.title} className="event-details__image" /></div> : <div className="event-details__visual" aria-label="Event visual placeholder"><div className="event-details__visual-mark" aria-hidden="true">EH</div><span>Local event</span><strong>{event.category}</strong></div>}

          <div className="event-details__badges"><CategoryBadge category={event.category} /><EventStatusBadge status={lifecycleStatus} /></div>
          <h1 className="event-details__title">{event.title}</h1>

          <div className="event-details__organizer" aria-label={`Organizer ${event.organizerName || 'Event Organizer'}`}>
            <span>Organizer</span>
            <strong>{event.organizerName || 'Event Organizer'}</strong>
          </div>

          <div className="event-details__facts-left">
            <div className="event-detail-fact">
              <svg className="event-detail-fact__icon" aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <div><span className="event-detail-fact__label">Date & time</span><strong>{formatDate(event.startTime)}</strong><span>{formatEventTimeRange(event.startTime, event.endTime)}</span></div>
            </div>
          </div>

          <div className="event-details__rsvp-actions">
            {authenticated ? (
              currentUser?.userId !== event.organizerId ? (
                <>
                  <EventActions event={event} going={rsvp.going} isBusy={rsvp.isBusy || rsvp.status === 'loading'} disabled={isOngoing || isExpired} onGoing={handleGoing} onNotGoing={handleNotGoing} />
                  {rsvp.status === 'loading' && <p className="action-message" role="status">Checking your RSVP status…</p>}
                  {rsvp.status === 'error' && <p className="action-message action-message--error" role="alert">{rsvp.error}</p>}
                </>
              ) : <div className="event-details__actions-organizer"><p className="action-message">You are organizing this event. Manage it from your profile.</p></div>
            ) : (
              <div className="event-details__login-prompt"><div><strong>Want to attend?</strong><span>Sign in to RSVP to this event.</span></div><Link className="primary-button" to="/login">Login</Link></div>
            )}
          </div>
        </div>

        <div className="event-details__right">
          <div className="event-details__right-panel">
            <section className="event-details__description-section"><p className="event-details__section-eyebrow">Event information</p><h2 id="event-description-heading">About this event</h2><p className="event-details__description-text">{event.description}</p></section>
            <hr className="event-details__divider" />

            <div className="event-details__attendance-section">
              <p className="event-details__section-eyebrow">Attendance</p>
              <div className="event-details__rsvp" aria-label="RSVP count"><div><strong>{event.rsvpCount} {event.rsvpCount === 1 ? 'person is' : 'people are'} going</strong></div>{rsvp.going && <span className="event-details__rsvp-state">You're on the list!</span>}{authenticated && currentUser?.userId === event.organizerId && <span className="event-details__rsvp-state" style={{ color: 'var(--brand)' }}>You are the organizer</span>}</div>
            </div>

            <hr className="event-details__divider" />

            <div className="event-details__location-section">
              <p className="event-details__section-eyebrow">Location</p>
              {event.latitude && event.longitude ? <div className="event-details__map-container"><EventMap events={[event]} center={[event.latitude, event.longitude]} zoom={15} height="250px" /></div> : <div className="event-details__map-placeholder"><span>Map not available for this location</span></div>}
              <div className="event-details__venue-card"><Navigation className="event-details__venue-icon" aria-hidden="true" size={20} /><div className="event-details__venue-info"><strong>{event.location}</strong><span>{[event.neighborhood, event.city].filter(Boolean).filter(v => !isPincode(v)).join(', ')}</span></div></div>
              {event.latitude && event.longitude && <a href={`https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`} target="_blank" rel="noopener noreferrer" className="secondary-button event-details__directions-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}><Navigation size={16} /> Get Directions</a>}
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

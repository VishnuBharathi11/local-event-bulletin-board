import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import EventForm from '../components/events/EventForm.jsx'
import ConflictReview from '../components/ConflictReview.jsx'
import { createEvent, continueEventCreation } from '../services/eventService.js'

export default function CreateEventPage() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState(null)
  const [conflicts, setConflicts] = useState([])
  const [pendingEvent, setPendingEvent] = useState(null)
  const [continuing, setContinuing] = useState(false)

  async function handleCreate(event) {
    setSubmitting(true)
    setServerError(null)
    try {
      await createEvent(event)
      navigate('/', { replace: true })
    } catch (error) {
      if (error.status === 409 && error.conflicts?.length) {
        setPendingEvent(event)
        setConflicts(error.conflicts)
      } else {
        setServerError(error.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleContinue() {
    if (!pendingEvent) return
    setContinuing(true)
    setServerError(null)
    try {
      await continueEventCreation(pendingEvent)
      setConflicts([])
      setPendingEvent(null)
      navigate('/', { replace: true })
    } catch (error) {
      setServerError(error.message)
    } finally {
      setContinuing(false)
    }
  }

  function handleCancelConflict() {
    setConflicts([])
    setPendingEvent(null)
  }

  return (
    <section className="event-page event-page--form">
      <header className="page-header-simple">
        <Link className="back-link" to="/">← Back to Event Board</Link>
        <p className="eyebrow">New event</p>
        <h1>Create New Event</h1>
      </header>
      <EventForm onSubmit={handleCreate} submitting={submitting} serverError={serverError} />
      {conflicts.length > 0 && (
        <ConflictReview
          conflicts={conflicts}
          onCancel={handleCancelConflict}
          onContinue={handleContinue}
          continuing={continuing}
        />
      )}
    </section>
  )
}

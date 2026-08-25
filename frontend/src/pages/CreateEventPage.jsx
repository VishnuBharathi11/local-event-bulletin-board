import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import EventForm from '../components/events/EventForm.jsx'
import { createEvent } from '../services/eventService.js'

export default function CreateEventPage() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState(null)

  async function handleCreate(event) {
    setSubmitting(true)
    setServerError(null)
    try {
      await createEvent(event)
      navigate('/', { replace: true })
    } catch (error) {
      setServerError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="event-page event-page--form">
      <header className="page-header-simple">
        <Link className="back-link" to="/">← Back to Event Board</Link>
        <p className="eyebrow">New event</p>
        <h1>Create New Event</h1>
      </header>
      <EventForm onSubmit={handleCreate} submitting={submitting} serverError={serverError} />
    </section>
  )
}

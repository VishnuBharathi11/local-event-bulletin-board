import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getMyEventRequests, deleteEventRequest } from '../services/eventRequestService.js'
import EventRequestCard from '../components/community/EventRequestCard.jsx'
import '../styles/communityRequests.css'

export default function ProfilePage() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        const data = await getMyEventRequests()
        if (!cancelled) setRequests(data)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  async function handleDelete(requestId) {
    if (!window.confirm('Delete this event request? This action cannot be undone.')) return

    setDeletingId(requestId)
    try {
      await deleteEventRequest(requestId)
      setRequests(current => current.filter(r => r.requestId !== requestId))
    } catch (err) {
      alert(`Unable to delete event request: ${err.message}`)
    } finally {
      setDeletingId(null)
    }
  }

  function handleEdit(requestId) {
    navigate(`/community-requests/edit/${encodeURIComponent(requestId)}`)
  }

  return (
    <div className="event-page">
      <header className="event-page__header">
        <div>
          <h1>My Profile</h1>
          <p className="event-page__description">Manage your account and view your activity.</p>
        </div>
      </header>

      <div style={{ display: 'grid', gap: '32px', marginTop: '24px' }}>
        <section className="page-placeholder" style={{ margin: 0 }}>
          <div style={{ display: 'grid', gap: '24px' }}>
            <div>
              <span className="eyebrow" style={{ display: 'block', marginBottom: '8px' }}>User Information</span>
              <div style={{ display: 'grid', gap: '8px' }}>
                <p><strong>Name:</strong> {currentUser?.name || 'N/A'}</p>
                <p><strong>Email:</strong> {currentUser?.email || 'N/A'}</p>
              </div>
            </div>

            <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: 0 }} />

            <div>
              <span className="eyebrow" style={{ display: 'block', marginBottom: '8px' }}>Account Status</span>
              <p>You are currently logged in to EventHive.</p>
            </div>
          </div>
        </section>

        <section id="my-requests">
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '20px' }}>
            <h2 style={{ margin: 0 }}>Your Event Requests</h2>
            <Link className="secondary-link" to="/community-requests/new">Request an Event</Link>
          </header>

          {loading && (
            <div className="state-card">
              <strong>Loading your event requests...</strong>
            </div>
          )}

          {error && (
            <div className="state-card state-card--error">
              <strong>Unable to load your event requests</strong>
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && requests.length === 0 && (
            <div className="state-card">
              <strong>You haven't created any event requests yet.</strong>
              <span>Want something to happen in your area? Request it.</span>
              <Link className="primary-button" style={{ marginTop: '12px' }} to="/community-requests/new">Request an Event</Link>
            </div>
          )}

          {!loading && !error && requests.length > 0 && (
            <div className="request-grid">
              {requests.map(request => (
                <EventRequestCard
                  key={request.requestId}
                  request={request}
                  isManagement={true}
                  onEdit={() => handleEdit(request.requestId)}
                  onDelete={() => handleDelete(request.requestId)}
                  isDeleting={deletingId === request.requestId}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

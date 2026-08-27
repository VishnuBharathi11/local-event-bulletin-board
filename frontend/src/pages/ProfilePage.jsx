import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getMyEventRequests, deleteEventRequest } from '../services/eventRequestService.js'
import { getMyEvents, deleteEvent } from '../services/eventService.js'
import EventRequestCard from '../components/community/EventRequestCard.jsx'
import EventCard from '../components/events/EventCard.jsx'
import '../styles/communityRequests.css'

export default function ProfilePage() {
  const { currentUser, updateProfile } = useAuth()
  const navigate = useNavigate()

  const [requests, setRequests] = useState([])
  const [loadingRequests, setLoadingRequests] = useState(true)
  const [requestError, setRequestError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const [events, setEvents] = useState([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [eventError, setEventError] = useState(null)
  const [deletingEventId, setDeletingEventId] = useState(null)

  const [activeTab, setActiveTab] = useState('events')

  const [isEditing, setIsEditMode] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    country: '',
    state: '',
    city: '',
    pincode: ''
  })
  const [updateStatus, setUpdateStatus] = useState('idle')
  const [updateError, setUpdateError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoadingRequests(true)
        const data = await getMyEventRequests()
        if (!cancelled) setRequests(data)
      } catch (err) {
        if (!cancelled) setRequestError(err.message)
      } finally {
        if (!cancelled) setLoadingRequests(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoadingEvents(true)
        const data = await getMyEvents()
        if (!cancelled) setEvents(data)
      } catch (err) {
        if (!cancelled) setEventError(err.message)
      } finally {
        if (!cancelled) setLoadingEvents(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (currentUser) {
      setEditForm({
        name: currentUser.name || '',
        phone: currentUser.phone || '',
        country: currentUser.country || '',
        state: currentUser.state || '',
        city: currentUser.city || '',
        pincode: currentUser.pincode || ''
      })
    }
  }, [currentUser])

  async function handleDeleteRequest(requestId) {
    if (!window.confirm('Are you sure you want to delete this event request? This action cannot be undone.')) return

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

  async function handleDeleteEvent(eventId) {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) return

    setDeletingEventId(eventId)
    try {
      await deleteEvent(eventId)
      setEvents(current => current.filter(e => e.eventId !== eventId))
    } catch (err) {
      alert(`Unable to delete event: ${err.message}`)
    } finally {
      setDeletingEventId(null)
    }
  }

  function handleEditRequest(requestId) {
    navigate(`/community-requests/edit/${encodeURIComponent(requestId)}`)
  }

  function handleEditEvent(eventId) {
    navigate(`/events/edit/${encodeURIComponent(eventId)}`)
  }

  async function handleUpdateProfile(e) {
    e.preventDefault()
    setUpdateStatus('saving')
    setUpdateError(null)
    try {
      await updateProfile(editForm)
      setIsEditMode(false)
      setUpdateStatus('success')
      setTimeout(() => setUpdateStatus('idle'), 3000)
    } catch (err) {
      setUpdateError(err.message)
      setUpdateStatus('idle')
    }
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A'
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(timestamp))
  }

  return (
    <div className="event-page">
      <header className="event-page__header">
        <div>
          <h1>User Profile</h1>
          <p className="event-page__description">Manage your account, personal information, and event requests.</p>
        </div>
      </header>

      <div className="profile-container">

        {/* PROFILE HEADER CARD */}
        <section className="profile-card profile-header-card" style={{
          background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%)',
          color: 'white',
          padding: '40px',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: '32px',
          boxShadow: 'var(--shadow-md)'
        }}>
          <div className="profile-avatar" style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.2)',
            display: 'grid',
            placeItems: 'center',
            fontSize: '40px',
            fontWeight: 'bold',
            border: '4px solid rgba(255,255,255,0.3)'
          }}>
            {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: '32px', color: 'white' }}>{currentUser?.name}</h2>
            <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '16px' }}>EventHive Member</p>
            <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
              <button
                className="secondary-button"
                onClick={() => setIsEditMode(true)}
                style={{ backgroundColor: 'white', border: 'none', color: 'var(--brand-dark)' }}
              >
                Edit Profile
              </button>
            </div>
          </div>

        </section>

        {updateStatus === 'success' && (
          <div className="action-message" style={{ backgroundColor: '#ecfdf5', color: 'var(--success)', padding: '12px 16px', borderRadius: '8px', border: '1px solid #d1fae5' }}>
            Profile updated successfully!
          </div>
        )}

        {/* INFO GRID */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '24px'
        }}>

          {/* PERSONAL & CONTACT */}
          <section className="profile-card" style={{
            backgroundColor: 'white',
            padding: '28px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h3 style={{ margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              Contact Details
            </h3>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Email Address</label>
                <p style={{ margin: 0, fontSize: '16px' }}>{currentUser?.email}</p>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Phone Number</label>
                <p style={{ margin: 0, fontSize: '16px' }}>{currentUser?.phone || 'Not provided'}</p>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Member Since</label>
                <p style={{ margin: 0, fontSize: '16px' }}>{formatDate(currentUser?.createdAt)}</p>
              </div>
            </div>
          </section>

          {/* LOCATION */}
          <section className="profile-card" style={{
            backgroundColor: 'white',
            padding: '28px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h3 style={{ margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              Location Details
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Country</label>
                <p style={{ margin: 0, fontSize: '16px' }}>{currentUser?.country || 'Not provided'}</p>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>State</label>
                <p style={{ margin: 0, fontSize: '16px' }}>{currentUser?.state || 'Not provided'}</p>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>City</label>
                <p style={{ margin: 0, fontSize: '16px' }}>{currentUser?.city || 'Not provided'}</p>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Pincode</label>
                <p style={{ margin: 0, fontSize: '16px' }}>{currentUser?.pincode || 'Not provided'}</p>
              </div>
            </div>
          </section>
        </div>

        {/* NAVIGATION TABS */}
        <div className="profile-tabs" style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
          <button
            onClick={() => setActiveTab('events')}
            className={`nav-link ${activeTab === 'events' ? 'nav-link--active' : ''}`}
            style={{ borderRadius: '8px 8px 0 0', borderBottom: activeTab === 'events' ? '3px solid var(--brand)' : 'none' }}
          >
            Created Events
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`nav-link ${activeTab === 'requests' ? 'nav-link--active' : ''}`}
            style={{ borderRadius: '8px 8px 0 0', borderBottom: activeTab === 'requests' ? '3px solid var(--brand)' : 'none' }}
          >
            Event Requests
          </button>
        </div>

        {/* CREATED EVENTS SECTION */}
        {activeTab === 'events' && (
          <section id="my-events">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0 }}>Your Created Events</h2>
              <Link className="primary-button" to="/events/new">Create Event</Link>
            </header>

            {loadingEvents && (
              <div className="state-card" style={{ padding: '60px' }}>
                <div style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid var(--brand)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }}></div>
                <strong>Loading your events...</strong>
              </div>
            )}

            {eventError && (
              <div className="state-card state-card--error">
                <strong>Unable to load your events</strong>
                <span>{eventError}</span>
              </div>
            )}

            {!loadingEvents && !eventError && events.length === 0 && (
              <div className="state-card" style={{ padding: '60px', borderStyle: 'dashed' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>📅</div>
                <strong>You haven't created any events yet.</strong>
                <span>Organize an event and invite the community!</span>
                <Link className="secondary-button" style={{ marginTop: '20px' }} to="/events/new">Create an Event</Link>
              </div>
            )}

            {!loadingEvents && !eventError && events.length > 0 && (
              <div className={"event-grid event-grid--" + (events.length === 1 ? "1" : events.length === 2 ? "2" : events.length === 3 ? "3" : "many")}>
                {events.map(event => (
                  <EventCard
                    key={event.eventId}
                    event={event}
                    isManagement={true}
                    onEdit={() => handleEditEvent(event.eventId)}
                    onDelete={() => handleDeleteEvent(event.eventId)}
                    isDeleting={deletingEventId === event.eventId}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* MY REQUESTS SECTION */}
        {activeTab === 'requests' && (
          <section id="my-requests">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0 }}>Your Event Requests</h2>
              <Link className="primary-button" to="/community-requests/new">Request an Event</Link>
            </header>

            {loadingRequests && (
              <div className="state-card" style={{ padding: '60px' }}>
                <div style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid var(--brand)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }}></div>
                <strong>Loading your event requests...</strong>
              </div>
            )}

            {requestError && (
              <div className="state-card state-card--error">
                <strong>Unable to load your event requests</strong>
                <span>{requestError}</span>
              </div>
            )}

            {!loadingRequests && !requestError && requests.length === 0 && (
              <div className="state-card" style={{ padding: '60px', borderStyle: 'dashed' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>✉️</div>
                <strong>You haven't created any event requests yet.</strong>
                <span>Want something to happen in your area? Help shape your community.</span>
                <Link className="secondary-button" style={{ marginTop: '20px' }} to="/community-requests/new">Request an Event</Link>
              </div>
            )}

            {!loadingRequests && !requestError && requests.length > 0 && (
              <div className="request-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))' }}>
                {requests.map(request => (
                  <EventRequestCard
                    key={request.requestId}
                    request={request}
                    isManagement={true}
                    onEdit={() => handleEditRequest(request.requestId)}
                    onDelete={() => handleDeleteRequest(request.requestId)}
                    isDeleting={deletingId === request.requestId}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditing && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'grid',
          placeItems: 'center',
          zIndex: 100,
          padding: '20px',
          backdropFilter: 'blur(4px)'
        }}>
          <div className="modal-content" style={{
            backgroundColor: 'white',
            padding: '32px',
            borderRadius: 'var(--radius-lg)',
            width: 'min(100%, 600px)',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
          }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0 }}>Edit Profile</h2>
              <button
                onClick={() => setIsEditMode(false)}
                style={{ background: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                &times;
              </button>
            </header>

            <form onSubmit={handleUpdateProfile} style={{ display: 'grid', gap: '20px' }}>
              <div className="form-field">
                <label>Full Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm({...editForm, name: e.target.value})}
                  required
                />
              </div>

              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-field">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={e => setEditForm({...editForm, phone: e.target.value})}
                  />
                </div>
                <div className="form-field">
                  <label>Pincode</label>
                  <input
                    type="text"
                    value={editForm.pincode}
                    onChange={e => setEditForm({...editForm, pincode: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-field">
                  <label>Country</label>
                  <input
                    type="text"
                    value={editForm.country}
                    onChange={e => setEditForm({...editForm, country: e.target.value})}
                  />
                </div>
                <div className="form-field">
                  <label>State</label>
                  <input
                    type="text"
                    value={editForm.state}
                    onChange={e => setEditForm({...editForm, state: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-field">
                <label>City</label>
                <input
                  type="text"
                  value={editForm.city}
                  onChange={e => setEditForm({...editForm, city: e.target.value})}
                />
              </div>

              {updateError && (
                <p className="form-error" style={{ margin: 0 }}>{updateError}</p>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setIsEditMode(false)}
                  disabled={updateStatus === 'saving'}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={updateStatus === 'saving'}
                >
                  {updateStatus === 'saving' ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

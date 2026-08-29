import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getMyEventRequests, deleteEventRequest } from '../services/eventRequestService.js'
import { getMyEvents, deleteEvent } from '../services/eventService.js'
import EventRequestCard from '../components/community/EventRequestCard.jsx'
import EventCard from '../components/events/EventCard.jsx'
import ClickSpark from '../components/common/ClickSpark.jsx'
import Magnet from '../components/common/Magnet.jsx'
import '../styles/profile.css'
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
    if (!timestamp) return 'August 2026'
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(timestamp))
  }

  return (
    <div className="profile-page-wrapper">
      {/* 1. PROFILE PAGE HEADER */}
      <header className="profile-page-header">
        <div className="profile-header-icon-container">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
        <div className="profile-header-text">
          <h1 className="profile-header-title">My Profile</h1>
          <p className="profile-header-subtitle">Manage your account, personal information, and event requests.</p>
        </div>
      </header>

      {/* 2. LARGE PROFILE HERO CARD */}
      <section className="profile-hero-card">
        <div className="profile-hero-bg-curve" aria-hidden="true" />
        <div className="profile-hero-dot-pattern--bottom-left" aria-hidden="true" />
        <div className="profile-hero-dot-pattern--top-right" aria-hidden="true" />

        <div className="profile-hero-left">
          <div className="profile-hero-avatar">
            {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
          </div>

          <div className="profile-hero-info">
            <h2 className="profile-hero-name">{currentUser?.name || 'User'}</h2>
            <span className="profile-hero-role">EventHive Member</span>
            <button
              type="button"
              className="profile-hero-edit-btn"
              onClick={() => setIsEditMode(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Edit Profile
            </button>
          </div>
        </div>

        <div className="profile-hero-divider" aria-hidden="true" />

        <div className="profile-hero-stats">
          <div className="profile-hero-stat-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
              <polygon points="12 12.2 12.8 13.8 14.6 14.1 13.3 15.3 13.6 17.1 12 16.2 10.4 17.1 10.7 15.3 9.4 14.1 11.2 13.8 12 12.2" fill="currentColor" stroke="none"></polygon>
            </svg>
          </div>
          <span className="profile-hero-stat-label">Events Created</span>
          <span className="profile-hero-stat-count">{loadingEvents ? '—' : events.length}</span>
          <span className="profile-hero-stat-desc">Events you've organized</span>
        </div>
      </section>

      {updateStatus === 'success' && (
        <div className="profile-alert-success">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          Profile updated successfully!
        </div>
      )}

      {/* 3 & 4. TWO INFORMATION CARDS (Contact & Location Details) */}
      <div className="profile-info-grid">
        {/* Left Card: Contact Details */}
        <section className="profile-info-card">
          <div className="profile-card-header">
            <div className="profile-card-icon-container">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <h3 className="profile-card-title">Contact Details</h3>
          </div>

          <div className="profile-contact-rows">
            <div className="profile-contact-row">
              <div className="profile-contact-left">
                <div className="profile-row-icon-container">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </div>
                <span className="profile-contact-label">Email Address</span>
              </div>
              <span className="profile-contact-value" title={currentUser?.email}>{currentUser?.email || 'N/A'}</span>
            </div>

            <div className="profile-contact-row">
              <div className="profile-contact-left">
                <div className="profile-row-icon-container">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                </div>
                <span className="profile-contact-label">Phone Number</span>
              </div>
              <span className="profile-contact-value">{currentUser?.phone || 'Not provided'}</span>
            </div>

            <div className="profile-contact-row">
              <div className="profile-contact-left">
                <div className="profile-row-icon-container">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </div>
                <span className="profile-contact-label">Member Since</span>
              </div>
              <span className="profile-contact-value">{formatDate(currentUser?.createdAt)}</span>
            </div>
          </div>
        </section>

        {/* Right Card: Location Details */}
        <section className="profile-info-card">
          <div className="profile-card-header">
            <div className="profile-card-icon-container">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <h3 className="profile-card-title">Location Details</h3>
          </div>

          <div className="profile-location-grid">
            <div className="profile-location-item">
              <div className="profile-row-icon-container">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
              </div>
              <div className="profile-location-content">
                <span className="profile-location-label">Country</span>
                <span className="profile-location-value">{currentUser?.country || 'India'}</span>
              </div>
            </div>

            <div className="profile-location-item">
              <div className="profile-row-icon-container">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                  <line x1="8" y1="2" x2="8" y2="18"></line>
                  <line x1="16" y1="6" x2="16" y2="22"></line>
                </svg>
              </div>
              <div className="profile-location-content">
                <span className="profile-location-label">State</span>
                <span className="profile-location-value">{currentUser?.state || 'TN'}</span>
              </div>
            </div>

            <div className="profile-location-item">
              <div className="profile-row-icon-container">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21h18"></path>
                  <path d="M5 21V7l8-4v18"></path>
                  <path d="M19 21V11l-6-4"></path>
                  <line x1="9" y1="9" x2="9" y2="9.01"></line>
                  <line x1="9" y1="13" x2="9" y2="13.01"></line>
                  <line x1="9" y1="17" x2="9" y2="17.01"></line>
                </svg>
              </div>
              <div className="profile-location-content">
                <span className="profile-location-label">City</span>
                <span className="profile-location-value">{currentUser?.city || 'Coimbatore'}</span>
              </div>
            </div>

            <div className="profile-location-item">
              <div className="profile-row-icon-container">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <div className="profile-location-content">
                <span className="profile-location-label">Pincode</span>
                <span className="profile-location-value">{currentUser?.pincode || '641032'}</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* EVENT MANAGEMENT TABS & SECTIONS */}
      <div className="profile-tabs">
        <button
          type="button"
          onClick={() => setActiveTab('events')}
          className={`profile-tab-btn ${activeTab === 'events' ? 'profile-tab-btn--active' : ''}`}
        >
          Created Events
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('requests')}
          className={`profile-tab-btn ${activeTab === 'requests' ? 'profile-tab-btn--active' : ''}`}
        >
          Event Requests
        </button>
      </div>

      {/* CREATED EVENTS SECTION */}
      {activeTab === 'events' && (
        <section id="my-events">
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: 'var(--text-strong)' }}>Your Created Events</h2>
            <ClickSpark style={{ width: 'auto' }}>
              <Magnet strength={0.08} range={35} style={{ width: 'auto' }}>
                <Link className="primary-button" to="/events/new">Create Event</Link>
              </Magnet>
            </ClickSpark>
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
            <div className={"event-grid event-grid--" + (events.length === 1 ? "1" : events.length === 2 ? "2" : events.length === 3 ? "3" : "many")} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
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
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: 'var(--text-strong)' }}>Your Event Requests</h2>
            <ClickSpark style={{ width: 'auto' }}>
              <Magnet strength={0.08} range={35} style={{ width: 'auto' }}>
                <Link className="primary-button" to="/community-requests/new">Request an Event</Link>
              </Magnet>
            </ClickSpark>
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
            <div className="request-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '24px' }}>
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
            width: 'min(100%, 580px)',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
          }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: 'var(--text-strong)' }}>Edit Profile</h2>
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

              <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-field">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={e => setEditForm({...editForm, phone: e.target.value})}
                    placeholder="e.g. 9361406761"
                  />
                </div>
                <div className="form-field">
                  <label>Pincode</label>
                  <input
                    type="text"
                    value={editForm.pincode}
                    onChange={e => setEditForm({...editForm, pincode: e.target.value})}
                    placeholder="e.g. 641032"
                  />
                </div>
              </div>

              <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-field">
                  <label>Country</label>
                  <input
                    type="text"
                    value={editForm.country}
                    onChange={e => setEditForm({...editForm, country: e.target.value})}
                    placeholder="e.g. India"
                  />
                </div>
                <div className="form-field">
                  <label>State</label>
                  <input
                    type="text"
                    value={editForm.state}
                    onChange={e => setEditForm({...editForm, state: e.target.value})}
                    placeholder="e.g. TN"
                  />
                </div>
              </div>

              <div className="form-field">
                <label>City</label>
                <input
                  type="text"
                  value={editForm.city}
                  onChange={e => setEditForm({...editForm, city: e.target.value})}
                  placeholder="e.g. Coimbatore"
                />
              </div>

              {updateError && (
                <p className="form-error" style={{ margin: 0 }}>{updateError}</p>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <ClickSpark style={{ width: 'auto' }}>
                  <Magnet strength={0.08} range={35} style={{ width: 'auto' }}>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => setIsEditMode(false)}
                      disabled={updateStatus === 'saving'}
                    >
                      Cancel
                    </button>
                  </Magnet>
                </ClickSpark>
                <ClickSpark style={{ width: 'auto' }}>
                  <Magnet strength={0.08} range={35} style={{ width: 'auto' }}>
                    <button
                      type="submit"
                      className="primary-button"
                      disabled={updateStatus === 'saving'}
                    >
                      {updateStatus === 'saving' ? 'Saving Changes...' : 'Save Changes'}
                    </button>
                  </Magnet>
                </ClickSpark>
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

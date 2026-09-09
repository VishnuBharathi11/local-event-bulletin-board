import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, ArrowRight, Send, X, CheckCircle2, Users, Sparkles } from 'lucide-react'
import communityEventHero from '../assets/community-event-hero.jpeg'
import EventRequestCard from '../components/community/EventRequestCard.jsx'
import EmptyRequestsIllustration from '../components/community/EmptyRequestsIllustration.jsx'
import { useEventRequests } from '../hooks/useEventRequests.js'
import '../styles/communityRequests.css'
import '../styles/communityRequestsUi06.css'
import '../styles/eventRequestUi07.css'

export default function CommunityRequestsPage() {
  const { status, requests, reload, interestedIds, interestLoadingId, interestError, toggleInterest } = useEventRequests()
  const [howItWorksOpen, setHowItWorksOpen] = useState(false)

  return (
    <section className="community-requests-page community-requests-page--reference">
      {/* 1. Hero Section matching Event Board hero card */}
      <header className="event-board-header event-board-header--all">
        <div
          className="event-board-header__bg"
          style={{ backgroundImage: `url(${communityEventHero})` }}
          aria-hidden="true"
        />
        <div className="event-board-header__overlay" />
        <div className="event-board-header__content">
          <span className="event-board-header__badge">EventHive · Demand</span>
          <h1>Community Ideas Matter</h1>
          <p className="event-board-header__sub">
            See what events people are asking for and help bring them to life.
          </p>
          <div className="event-board-header__actions" style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <Link
              className="primary-button event-board-header__btn"
              to="/community-requests/new"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <PlusCircle size={16} /> Request Event
            </Link>
            <Link
              className="event-board-header__link-how-it-works"
              to="/how-it-works"
            >
              See How it works?
            </Link>
          </div>
        </div>
      </header>

      {/* Loading state */}
      {status === 'loading' && (
        <div className="community-empty-card" role="status" aria-live="polite">
          <h2 className="community-empty-card__title" style={{ fontSize: '20px' }}>Loading community requests…</h2>
          <p className="community-empty-card__desc">Retrieving current local event requests.</p>
        </div>
      )}

      {/* Error state */}
      {status === 'error' && (
        <div className="community-empty-card" role="alert">
          <h2 className="community-empty-card__title" style={{ color: 'var(--danger)', fontSize: '20px' }}>We couldn't load community requests</h2>
          <p className="community-empty-card__desc">Please try again. Your existing requests and interest data have not been changed.</p>
          <button className="community-hero-card__btn-primary" type="button" onClick={reload} style={{ marginTop: '12px' }}>
            Try Again
          </button>
        </div>
      )}

      {/* Empty state matching reference screenshot */}
      {status === 'success' && requests.length === 0 && (
        <div className="community-empty-card" role="region" aria-label="No community requests">
          <EmptyRequestsIllustration />
          <h2 className="community-empty-card__title">No active community requests</h2>
          <p className="community-empty-card__desc">
            There are no proposed local events to browse right now.<br />
            You can submit a request for something you want to happen in your area.
          </p>
          <Link className="community-empty-card__btn" to="/community-requests/new">
            <Send size={16} strokeWidth={2.2} />
            <span>Request an Event</span>
          </Link>
        </div>
      )}

      {/* Populated Requests Grid */}
      {status === 'success' && requests.length > 0 && (
        <div className="event-grid event-grid--many request-grid" aria-live="polite">
          {requests.map((request) => (
            <EventRequestCard
              key={request.requestId}
              request={request}
              isInterested={interestedIds.has(request.requestId)}
              interestLoading={interestLoadingId === request.requestId}
              interestError={interestError?.requestId === request.requestId ? interestError.message : null}
              onInterest={() => toggleInterest(request.requestId)}
            />
          ))}
        </div>
      )}

      {/* How it works modal guide */}
      {howItWorksOpen && (
        <div className="community-modal-backdrop" onClick={() => setHowItWorksOpen(false)}>
          <div className="community-modal-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="how-it-works-title">
            <div className="community-modal-card__header">
              <span className="community-hero-card__eyebrow">GUIDE</span>
              <h2 id="how-it-works-title">How Community Requests Work</h2>
              <button
                type="button"
                className="community-modal-card__close"
                onClick={() => setHowItWorksOpen(false)}
                aria-label="Close guide"
              >
                <X size={20} />
              </button>
            </div>
            <div className="community-modal-card__steps">
              <div className="community-modal-step">
                <div className="community-modal-step__icon"><Sparkles size={20} /></div>
                <div>
                  <strong>1. Submit Your Idea</strong>
                  <p>Tell the community what event, meetup, or workshop you'd love to attend locally.</p>
                </div>
              </div>
              <div className="community-modal-step">
                <div className="community-modal-step__icon"><Users size={20} /></div>
                <div>
                  <strong>2. Rally Support</strong>
                  <p>Neighbors and locals express interest to show real community demand.</p>
                </div>
              </div>
              <div className="community-modal-step">
                <div className="community-modal-step__icon"><CheckCircle2 size={20} /></div>
                <div>
                  <strong>3. Turn into Reality</strong>
                  <p>Once threshold is met, local organizers can claim and schedule the official event!</p>
                </div>
              </div>
            </div>
            <div className="community-modal-card__footer">
              <Link
                to="/community-requests/new"
                className="community-hero-card__btn-primary"
                onClick={() => setHowItWorksOpen(false)}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <PlusCircle size={18} />
                <span>Request an Event</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

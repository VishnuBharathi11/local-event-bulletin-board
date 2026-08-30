import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Sparkles,
  Users,
  MapPin,
  Calendar,
  CheckCircle2,
  FileSearch,
  ShieldCheck,
  Lightbulb
} from 'lucide-react'

import step1Hero from '../../assets/create-event-hero.png'
import step2Hero from '../../assets/create-step2-date.png'
import step3Hero from '../../assets/create-step3-location.png'
import step4Hero from '../../assets/create-step4-details.png'
import step5Hero from '../../assets/create-step5-review.png'

const STEP_ILLUSTRATIONS = {
  1: step1Hero,
  2: step2Hero,
  3: step3Hero,
  4: step4Hero,
  5: step5Hero,
}

const STEP_TIPS = {
  1: 'A catchy title and detailed description help explain your event idea clearly.',
  2: 'Suggest a date and time when the community is most likely to participate.',
  3: 'Selecting an accurate location and pinning it on the map helps neighbors discover your request.',
  4: 'Setting a realistic support target increases the chances of an organizer picking it up!',
  5: 'Review all proposal details before submitting to ensure accuracy.',
}

export default function CreateEventRequestLeftPanel({ currentStep = 1, isEdit = false }) {
  const illustrationSrc = STEP_ILLUSTRATIONS[currentStep] || step1Hero
  const tipText = STEP_TIPS[currentStep] || STEP_TIPS[1]

  return (
    <aside className="create-event-panel-left" aria-label="Event Request Guide">
      {/* Top decorative dot pattern */}
      <div className="create-event-dots-pattern" aria-hidden="true" />

      {/* Top Header */}
      <div className="create-event-panel-left__header">
        <Link
          className="create-event-back-link"
          to={isEdit ? '/profile' : '/community-requests'}
        >
          <ArrowLeft size={16} strokeWidth={2.2} />
          <span>{isEdit ? 'Back to Profile' : 'Back to Community Requests'}</span>
        </Link>
        <div className="create-event-badge-row">
          <span className="create-event-badge">
            {isEdit ? 'EDIT REQUEST' : 'NEW REQUEST'}
          </span>
        </div>
        <h1 className="create-event-panel-left__title">
          {isEdit ? 'Update Request' : 'Request New Event'}
        </h1>
        <p className="create-event-panel-left__desc">
          {isEdit
            ? 'Refine the details of your event request. Changes will be reflected immediately across the community bulletin board.'
            : (
              <>
                Tell the community about an event you want to see happen.<br />
                Gather interest to turn your idea into a published event.
              </>
            )}
        </p>
      </div>

      {/* Middle Content: How Requests Work Glass Card & Illustration */}
      <div className="create-event-panel-left__body">
        {currentStep < 5 ? (
          <div className="create-event-feature-card">
            <h2 className="create-event-feature-card__title">How Requests Work</h2>
            <ul className="create-event-feature-list">
              <li className="create-event-feature-item">
                <div className="create-event-feature-icon">
                  <Sparkles size={14} strokeWidth={2.2} />
                </div>
                <div>
                  <strong>Propose Your Idea</strong>
                  <p>Suggest a title, category, and description.</p>
                </div>
              </li>
              <li className="create-event-feature-item">
                <div className="create-event-feature-icon">
                  <Calendar size={14} strokeWidth={2.2} />
                </div>
                <div>
                  <strong>Suggest Date &amp; Time</strong>
                  <p>Pick the best time for the community.</p>
                </div>
              </li>
              <li className="create-event-feature-item">
                <div className="create-event-feature-icon">
                  <MapPin size={14} strokeWidth={2.2} />
                </div>
                <div>
                  <strong>Pick Venue &amp; Location</strong>
                  <p>Suggest a venue or pin on the map.</p>
                </div>
              </li>
              <li className="create-event-feature-item">
                <div className="create-event-feature-icon">
                  <Users size={14} strokeWidth={2.2} />
                </div>
                <div>
                  <strong>Set Support Target</strong>
                  <p>Define minimum attendees needed.</p>
                </div>
              </li>
              <li className="create-event-feature-item">
                <div className="create-event-feature-icon">
                  <CheckCircle2 size={14} strokeWidth={2.2} />
                </div>
                <div>
                  <strong>Organizer Confirmation</strong>
                  <p>Organizers host it once target is met.</p>
                </div>
              </li>
            </ul>
          </div>
        ) : (
          <div className="create-event-feature-card">
            <h2 className="create-event-feature-card__title">You're almost done!</h2>
            <p className="create-event-feature-card__subtitle">Review your request details before submitting.</p>
            <ul className="create-event-feature-list" style={{ marginTop: '14px' }}>
              <li className="create-event-feature-item">
                <div className="create-event-feature-icon">
                  <FileSearch size={14} strokeWidth={2.2} />
                </div>
                <div>
                  <strong>Review Proposal</strong>
                  <p>Double-check your request details.</p>
                </div>
              </li>
              <li className="create-event-feature-item">
                <div className="create-event-feature-icon">
                  <ShieldCheck size={14} strokeWidth={2.2} />
                </div>
                <div>
                  <strong>Ensure Accuracy</strong>
                  <p>Verify time, location, and target goal.</p>
                </div>
              </li>
              <li className="create-event-feature-item">
                <div className="create-event-feature-icon">
                  <Users size={14} strokeWidth={2.2} />
                </div>
                <div>
                  <strong>Ready to Submit</strong>
                  <p>Neighbors can start upvoting immediately.</p>
                </div>
              </li>
            </ul>
          </div>
        )}

        {/* Dynamic Illustration for each step */}
        <div className="create-event-illustration-wrap" aria-hidden="true">
          <img
            key={illustrationSrc}
            src={illustrationSrc}
            alt=""
            className="create-event-illustration-img"
          />
        </div>
      </div>

      {/* Bottom Tip Card */}
      <div className="create-event-tip-card">
        <div className="create-event-tip-icon" aria-hidden="true">
          <Lightbulb size={18} strokeWidth={2.2} />
        </div>
        <div className="create-event-tip-text">
          <strong>Tip:</strong> <span>{tipText}</span>
        </div>
      </div>
    </aside>
  )
}

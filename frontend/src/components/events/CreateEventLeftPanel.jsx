import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  MapPin,
  Megaphone,
  Ticket,
  CalendarClock,
  ShieldCheck,
  Camera,
  FileSearch,
  Users,
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
  1: 'Provide clear and detailed information to attract more attendees to your event.',
  2: 'Choose a suitable date and time so attendees can plan ahead.',
  3: 'Selecting an accurate location helps more people discover and attend your event.',
  4: 'Provide clear and engaging details to make your event stand out.',
  5: 'A well-written and accurate event gets more visibility and more attendees.',
}

export default function CreateEventLeftPanel({ currentStep = 1, isEdit = false }) {
  const illustrationSrc = STEP_ILLUSTRATIONS[currentStep] || step1Hero
  const tipText = STEP_TIPS[currentStep] || STEP_TIPS[1]

  return (
    <aside className="create-event-panel-left" aria-label="Event Creation Guide">
      {/* Top decorative dot pattern */}
      <div className="create-event-dots-pattern" aria-hidden="true" />

      {/* Top Header */}
      <div className="create-event-panel-left__header">
        <Link className="create-event-back-link" to="/">
          <ArrowLeft size={16} strokeWidth={2.2} />
          <span>Back to Event Board</span>
        </Link>
        <div className="create-event-badge-row">
          <span className="create-event-badge">
            {isEdit ? 'EDIT EVENT' : 'NEW EVENT'}
          </span>
        </div>
        <h1 className="create-event-panel-left__title">
          {isEdit ? 'Edit Event' : 'Create New Event'}
        </h1>
        <p className="create-event-panel-left__desc">
          {isEdit
            ? 'Update the details of your event. Changes will be reflected immediately across the community bulletin board.'
            : (
              <>
                Publish a local event with the date, time, location,<br />
                category, and description attendees need.
              </>
            )}
        </p>
      </div>

      {/* Middle Content: Everything You Can Do / You're Almost Done Card & Illustration */}
      <div className="create-event-panel-left__body">
        {currentStep < 5 ? (
          <div className="create-event-feature-card">
            <h2 className="create-event-feature-card__title">Everything you can do</h2>
            <ul className="create-event-feature-list">
              <li className="create-event-feature-item">
                <div className="create-event-feature-icon"><MapPin size={14} strokeWidth={2.2} /></div>
                <div>
                  <strong>Add Event Location</strong>
                  <p>Choose the perfect venue or exact location.</p>
                </div>
              </li>
              <li className="create-event-feature-item">
                <div className="create-event-feature-icon"><Megaphone size={14} strokeWidth={2.2} /></div>
                <div>
                  <strong>Promote Your Event</strong>
                  <p>Reach more people in your community.</p>
                </div>
              </li>
              <li className="create-event-feature-item">
                <div className="create-event-feature-icon"><Ticket size={14} strokeWidth={2.2} /></div>
                <div>
                  <strong>Manage Registrations</strong>
                  <p>Set ticket types and track registrations.</p>
                </div>
              </li>
              <li className="create-event-feature-item">
                <div className="create-event-feature-icon"><CalendarClock size={14} strokeWidth={2.2} /></div>
                <div>
                  <strong>Set Reminders</strong>
                  <p>Send updates and reminders to attendees.</p>
                </div>
              </li>
              <li className="create-event-feature-item">
                <div className="create-event-feature-icon"><ShieldCheck size={14} strokeWidth={2.2} /></div>
                <div>
                  <strong>Ensure Safety</strong>
                  <p>Provide important guidelines and contacts.</p>
                </div>
              </li>
              <li className="create-event-feature-item">
                <div className="create-event-feature-icon"><Camera size={14} strokeWidth={2.2} /></div>
                <div>
                  <strong>Capture Memories</strong>
                  <p>Share photos and moments after the event.</p>
                </div>
              </li>
            </ul>
          </div>
        ) : (
          <div className="create-event-feature-card">
            <h2 className="create-event-feature-card__title">You're almost done!</h2>
            <p className="create-event-feature-card__subtitle">Review your event details before publishing.</p>
            <ul className="create-event-feature-list" style={{ marginTop: '14px' }}>
              <li className="create-event-feature-item">
                <div className="create-event-feature-icon"><FileSearch size={14} strokeWidth={2.2} /></div>
                <div>
                  <strong>Review Information</strong>
                  <p>Double-check your event details.</p>
                </div>
              </li>
              <li className="create-event-feature-item">
                <div className="create-event-feature-icon"><ShieldCheck size={14} strokeWidth={2.2} /></div>
                <div>
                  <strong>Ensure Accuracy</strong>
                  <p>Make sure everything is correct.</p>
                </div>
              </li>
              <li className="create-event-feature-item">
                <div className="create-event-feature-icon"><Users size={14} strokeWidth={2.2} /></div>
                <div>
                  <strong>Ready to Publish</strong>
                  <p>Once published, your event will be visible to the community.</p>
                </div>
              </li>
            </ul>
          </div>
        )}

        {/* Step Dynamic Illustration */}
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

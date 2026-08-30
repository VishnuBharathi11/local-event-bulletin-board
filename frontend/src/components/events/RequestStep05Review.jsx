import { Eye, Calendar, MapPin, Users, ExternalLink, Info } from 'lucide-react'

function formatDisplayDate(dateStr) {
  if (!dateStr) return 'Not specified'
  try {
    const [year, month, day] = dateStr.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return dateStr
  }
}

function formatDisplayTime(timeStr) {
  if (!timeStr) return '--:--'
  const [hourStr, minuteStr] = timeStr.split(':')
  const hour24 = Number(hourStr)
  if (!Number.isFinite(hour24)) return timeStr
  let hour12 = hour24 % 12
  if (hour12 === 0) hour12 = 12
  const period = hour24 >= 12 ? 'PM' : 'AM'
  return `${String(hour12).padStart(2, '0')}:${minuteStr} ${period}`
}

export default function RequestStep05Review({ form, currentUser, onGoToStep }) {
  const proposerDisplay = currentUser?.name
    ? `${currentUser.name} (${currentUser.email || ''})`
    : 'Community Member'

  return (
    <div className="create-step-content create-step-content--review" role="region" aria-labelledby="request-step5-title">
      <div className="create-step-header create-step-header--review">
        <div className="create-step-header__title-row">
          <Eye size={22} className="create-step-header__icon" />
          <h2 id="request-step5-title" className="create-step-title">Review &amp; Submit Request</h2>
        </div>
        <p className="create-step-desc">Please review your event proposal before submitting to the community.</p>
      </div>

      <div className="review-scroll-container">
        <div className="review-cards-grid">
          {/* Card 1: Basic Information */}
          <div className="review-card">
            <div className="review-card__header">
              <div className="review-card__icon-wrap">
                <Calendar size={16} />
              </div>
              <h3 className="review-card__title">Basic Information</h3>
            </div>
            <div className="review-card__body">
              <div className="review-row">
                <span className="review-label">Proposed Title</span>
                <span className="review-value font-medium">{form.title || 'Untitled Request'}</span>
              </div>
              <div className="review-row">
                <span className="review-label">Proposed By</span>
                <span className="review-value">{proposerDisplay}</span>
              </div>
              <div className="review-row">
                <span className="review-label">Description</span>
                <span className="review-value review-value--clamp">{form.description || 'No description'}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Date & Time */}
          <div className="review-card">
            <div className="review-card__header">
              <div className="review-card__icon-wrap">
                <Calendar size={16} />
              </div>
              <h3 className="review-card__title">Suggested Date &amp; Time</h3>
            </div>
            <div className="review-card__body">
              <div className="review-row">
                <span className="review-label">Date</span>
                <span className="review-value">{formatDisplayDate(form.date)}</span>
              </div>
              <div className="review-row">
                <span className="review-label">Start Time</span>
                <span className="review-value">{formatDisplayTime(form.startTime)}</span>
              </div>
              <div className="review-row">
                <span className="review-label">End Time</span>
                <span className="review-value">{formatDisplayTime(form.endTime)}</span>
              </div>
            </div>
          </div>

          {/* Card 3: Location */}
          <div className="review-card">
            <div className="review-card__header">
              <div className="review-card__icon-wrap">
                <MapPin size={16} />
              </div>
              <h3 className="review-card__title">Suggested Location</h3>
            </div>
            <div className="review-card__body">
              <div className="review-row">
                <span className="review-label">Venue</span>
                <span className="review-value">{form.location || 'Not specified'}</span>
              </div>
              <div className="review-row">
                <span className="review-label">City</span>
                <span className="review-value">{form.city || 'Not specified'}</span>
              </div>
              <div className="review-row">
                <span className="review-label">Neighborhood</span>
                <span className="review-value">{form.neighborhood || 'None'}</span>
              </div>
              {form.latitude && form.longitude && (
                <div className="review-row" style={{ marginTop: '8px' }}>
                  <button
                    type="button"
                    className="review-map-link"
                    onClick={() => onGoToStep && onGoToStep(3)}
                  >
                    <span>View on Map</span>
                    <ExternalLink size={13} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Card 4: Details & Community Goal */}
          <div className="review-card">
            <div className="review-card__header">
              <div className="review-card__icon-wrap">
                <Users size={16} />
              </div>
              <h3 className="review-card__title">Details &amp; Community Goal</h3>
            </div>
            <div className="review-card__body">
              <div className="review-row">
                <span className="review-label">Category</span>
                <span className="review-value">
                  {form.category ? (
                    <span className="review-category-pill">{form.category}</span>
                  ) : 'Not selected'}
                </span>
              </div>
              <div className="review-row">
                <span className="review-label">Support Goal</span>
                <span className="review-value">
                  {form.demandThreshold ? `${form.demandThreshold} interested people needed` : 'Not set'}
                </span>
              </div>
              <div className="review-row review-row--image" style={{ marginTop: '4px' }}>
                <span className="review-label">Banner Image</span>
                <div className="review-image-preview">
                  {form.imageUrl ? (
                    <img src={form.imageUrl} alt="Request banner" className="review-thumb-img" />
                  ) : (
                    <span className="review-no-image">No image uploaded</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info hint */}
        <div className="create-step-info-hint" style={{ marginTop: '16px', marginBottom: '8px' }}>
          <Info size={16} />
          <span><strong>Note:</strong> Once submitted, community members can upvote this proposal. Organizers can host it once the goal is reached.</span>
        </div>
      </div>
    </div>
  )
}

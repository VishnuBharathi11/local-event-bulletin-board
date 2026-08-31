import { ListFilter, UploadCloud, Image as ImageIcon, X } from 'lucide-react'
import CustomSelect from '../common/CustomSelect.jsx'

const CATEGORIES = [
  'Sports',
  'Music',
  'Food',
  'Workshops',
  'Meetups',
  'Student Events',
  'Garage Sale',
  'Community',
]

export default function RequestStep04Details({ form, update, errors = {} }) {
  function handleImageChange(event) {
    const file = event.target?.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert('Image file is too large. Max size is 5MB.')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        update('imageUrl', reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  function clearImage(e) {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    update('imageUrl', null)
  }

  return (
    <div className="create-step-content" role="region" aria-labelledby="request-step4-title">
      <div className="create-step-header">
        <div className="create-step-header__title-row">
          <ListFilter size={22} className="create-step-header__icon" />
          <h2 id="request-step4-title" className="create-step-title">Details &amp; Community Goal</h2>
        </div>
        <p className="create-step-desc">Select a category, set your community interest target, and add an optional image banner.</p>
      </div>

      <div className="create-step-form">
        {/* Category Field */}
        <div className="form-group">
          <label htmlFor="request-category">
            Category <span className="required-star">*</span>
          </label>
          <CustomSelect
            id="request-category"
            value={form.category || ''}
            onChange={(val) => update('category', val)}
            options={CATEGORIES}
            placeholder="Select category"
            iconType="category"
            error={Boolean(errors.category)}
          />
          {errors.category && <span className="form-field-error">{errors.category}</span>}
        </div>

        {/* Community Goal */}
        <div className="form-group">
          <label htmlFor="request-min-participants">
            Minimum Required Participants <span className="required-star">*</span>
          </label>
          <input
            id="request-min-participants"
            type="number"
            min="1"
            placeholder="e.g. 10"
            value={form.demandThreshold || ''}
            onChange={(e) => update('demandThreshold', e.target.value)}
            className={`form-input ${errors.demandThreshold ? 'form-input--error' : ''}`}
          />
          <span className="create-request-target-hint" style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
            The event proposal will be highlighted for organizer review once this goal is reached.
          </span>
          {errors.demandThreshold && <span className="form-field-error">{errors.demandThreshold}</span>}
        </div>

        {/* Image Upload Box */}
        <div className="form-group" style={{ marginTop: '4px' }}>
          <label htmlFor="request-banner-upload">
            Event Image / Banner
          </label>

          <div className="event-upload-dropzone">
            {!form.imageUrl ? (
              <label htmlFor="request-banner-upload" className="event-upload-dropzone__inner">
                <input
                  id="request-banner-upload"
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={handleImageChange}
                  className="event-upload-input"
                />
                <div className="event-upload-icon-circle">
                  <UploadCloud size={24} />
                </div>
                <div className="event-upload-text">
                  <strong>Click or drag an image here to upload</strong>
                  <span>PNG, JPG or JPEG (max. 5MB)</span>
                </div>
                <div className="event-upload-preview-sample" aria-hidden="true">
                  <ImageIcon size={32} opacity={0.4} />
                </div>
              </label>
            ) : (
              <div className="event-upload-preview-active">
                <img src={form.imageUrl} alt="Selected Banner Preview" className="event-upload-preview-img" />
                <button
                  type="button"
                  className="event-upload-clear-btn"
                  onClick={clearImage}
                  title="Remove image"
                  aria-label="Remove image"
                >
                  <X size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

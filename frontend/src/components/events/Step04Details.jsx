import { ListFilter, UploadCloud, Image as ImageIcon, X } from 'lucide-react'

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

export default function Step04Details({ form, update, errors = {} }) {
  function handleImageChange(event) {
    const file = event.target.files[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert('Image file is too large. Max size is 5MB.')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      update('imageUrl', reader.result)
    }
    reader.readAsDataURL(file)
  }

  function clearImage(e) {
    e.preventDefault()
    e.stopPropagation()
    update('imageUrl', null)
  }

  return (
    <div className="create-step-content" role="region" aria-labelledby="step4-title">
      <div className="create-step-header">
        <div className="create-step-header__title-row">
          <ListFilter size={22} className="create-step-header__icon" />
          <h2 id="step4-title" className="create-step-title">Event Details</h2>
        </div>
        <p className="create-step-desc">Add more information to help people understand your event better.</p>
      </div>

      <div className="create-step-form">
        <div className="form-group">
          <label htmlFor="event-category">
            Category <span className="required-star">*</span>
          </label>
          <select
            id="event-category"
            value={form.category || ''}
            onChange={(e) => update('category', e.target.value)}
            className={`form-select ${errors.category ? 'form-select--error' : ''}`}
          >
            <option value="">Select category</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          {errors.category && <span className="form-field-error">{errors.category}</span>}
        </div>

        {/* Image Upload Box */}
        <div className="form-group">
          <label htmlFor="event-banner-upload">
            Event Image / Banner
          </label>
          
          <div className="event-upload-dropzone">
            {!form.imageUrl ? (
              <label htmlFor="event-banner-upload" className="event-upload-dropzone__inner">
                <input
                  id="event-banner-upload"
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={handleImageChange}
                  className="event-upload-input"
                />
                <div className="event-upload-icon-circle">
                  <UploadCloud size={24} />
                </div>
                <div className="event-upload-text">
                  <strong>Drag &amp; drop an image here or click to browse</strong>
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
          {errors.image && <span className="form-field-error">{errors.image}</span>}
        </div>
      </div>
    </div>
  )
}

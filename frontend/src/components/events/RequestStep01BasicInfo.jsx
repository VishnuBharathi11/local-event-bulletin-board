export default function RequestStep01BasicInfo({ form, update, currentUser, errors = {} }) {
  const maxChars = 500
  const currentCount = (form.description || '').length

  return (
    <div className="create-step-content" role="region" aria-labelledby="request-step1-title">
      <div className="create-step-header">
        <h2 id="request-step1-title" className="create-step-title">Basic Information</h2>
        <p className="create-step-desc">Describe the event idea you are proposing to the community.</p>
      </div>

      <div className="create-step-form">
        <div className="form-row-2">
          <div className="form-group">
            <label htmlFor="user-name">Name</label>
            <input
              id="user-name"
              type="text"
              value={currentUser?.name || 'Community Member'}
              readOnly
              className="form-input form-input--readonly"
            />
          </div>

          <div className="form-group">
            <label htmlFor="user-email">Email</label>
            <input
              id="user-email"
              type="email"
              value={currentUser?.email || ''}
              readOnly
              className="form-input form-input--readonly"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="request-title">
            Proposed Title <span className="required-star">*</span>
          </label>
          <input
            id="request-title"
            type="text"
            placeholder="e.g., Neighborhood Weekend Cleanup"
            value={form.title || ''}
            onChange={(e) => update('title', e.target.value)}
            className={`form-input ${errors.title ? 'form-input--error' : ''}`}
            autoFocus
          />
          {errors.title && <span className="form-field-error">{errors.title}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="request-description">
            Description <span className="required-star">*</span>
          </label>
          <textarea
            id="request-description"
            rows={5}
            maxLength={maxChars}
            placeholder="What is this event about? Explain why the community would love it..."
            value={form.description || ''}
            onChange={(e) => update('description', e.target.value)}
            className={`form-textarea ${errors.description ? 'form-textarea--error' : ''}`}
          />
          <div className="form-field-footer">
            {errors.description ? (
              <span className="form-field-error">{errors.description}</span>
            ) : <span />}
            <span className="form-char-count">{currentCount} / {maxChars}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useAuth } from '../context/AuthContext.jsx'

export default function ProfilePage() {
  const { currentUser } = useAuth()

  return (
    <div className="event-page">
      <header className="event-page__header">
        <div>
          <h1>My Profile</h1>
          <p className="event-page__description">Manage your account and view your activity.</p>
        </div>
      </header>

      <section className="page-placeholder" style={{ marginTop: '20px' }}>
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
    </div>
  )
}

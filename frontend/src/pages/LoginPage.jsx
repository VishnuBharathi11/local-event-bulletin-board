import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import ClickSpark from '../components/reactbits/ClickSpark.jsx'
import GlareHover from '../components/reactbits/GlareHover.jsx'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    if (!form.email.trim() || !form.password) {
      setError('Email and password are required.')
      return
    }
    setSubmitting(true)
    try {
      await login(form)
      navigate(location.state?.from || '/', { replace: true })
    } catch (requestError) {
      setError(requestError.status === 401 ? 'Invalid email or password.' : requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="auth-page">
      <GlareHover className="auth-glare-surface" glareColor="#ffffff" glareOpacity={0.24}>
        <div className="auth-card">
          <p className="eyebrow">EventHive account</p>
          <h1>Log in</h1>
          <p className="auth-card__description">Sign in to create events, RSVP, and participate in community requests.</p>
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <label className="form-field">
              <span>Email</span>
              <input type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            </label>
            <label className="form-field">
              <span>Password</span>
              <input type="password" autoComplete="current-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
            </label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <ClickSpark sparkColor="#ffffff" sparkSize={7} sparkRadius={16} sparkCount={8}>
              <button className="primary-button" type="submit" disabled={submitting}>{submitting ? 'Signing in…' : 'Login'}</button>
            </ClickSpark>
          </form>
          <p className="auth-card__footer">No account? <Link to="/register">Register</Link></p>
        </div>
      </GlareHover>
    </section>
  )
}

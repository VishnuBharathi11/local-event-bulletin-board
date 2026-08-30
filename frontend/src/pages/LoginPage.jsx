import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import logo from '../assets/eventhive.svg'
import GradientBlinds from '../components/common/GradientBlinds.jsx'

const BLINDS_GRADIENT_COLORS = ['#FF9FFC', '#5227FF']

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth()
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

  async function handleGoogleSignIn() {
    if (submitting) return
    setError(null)
    setSubmitting(true)
    try {
      await loginWithGoogle()
      navigate(location.state?.from || '/', { replace: true })
    } catch (requestError) {
      setError(requestError.message || 'Unable to sign in with Google. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-page__bg-blinds" aria-hidden="true">
        <GradientBlinds
          gradientColors={BLINDS_GRADIENT_COLORS}
          angle={20}
          noise={0.5}
          blindCount={16}
          blindMinWidth={60}
          spotlightRadius={0.5}
          spotlightSoftness={1}
          spotlightOpacity={1}
          mouseDampening={0.15}
          distortAmount={0}
          shineDirection="left"
          mixBlendMode="lighten"
        />
      </div>
      <div className="auth-card">
        <div className="auth-brand-logo">
          <img src={logo} alt="" />
          <span>EventHive</span>
        </div>
        <h1 className="auth-card__heading">Welcome back to EventHive</h1>
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
          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Login'}
          </button>
          <div className="auth-divider" aria-hidden="true"><span>OR</span></div>
          <button className="google-auth-button" type="button" onClick={handleGoogleSignIn} disabled={submitting}>
            <span className="google-auth-button__icon" aria-hidden="true">G</span>
            {submitting ? 'Signing in…' : 'Continue with Google'}
          </button>
        </form>
        <p className="auth-card__footer">No account? <Link to="/register">Register</Link></p>
      </div>
    </section>
  )
}

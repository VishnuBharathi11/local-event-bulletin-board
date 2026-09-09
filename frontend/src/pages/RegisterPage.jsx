import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import logo from '../assets/eventhive.svg'
import GradientBlinds from '../components/common/GradientBlinds.jsx'

const BLINDS_GRADIENT_COLORS = ['#FF9FFC', '#5227FF']

export default function RegisterPage() {
  const { register, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    if (!form.name.trim()) return setError('Name is required.')
    if (!form.email.trim()) return setError('Email is required.')
    if (!form.password) return setError('Password is required.')
    if (form.password.length < 8) return setError('Password must be at least 8 characters.')

    setSubmitting(true)
    try {
      await register({ ...form, name: form.name.trim(), email: form.email.trim() })
      navigate('/', { replace: true })
    } catch (requestError) {
      setError(requestError.status === 409 ? 'An account with this email already exists.' : requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGoogleSignIn() {
    if (submitting) return
    setError(null)
    setSubmitting(true)
    try {
      await loginWithGoogle('register')
      navigate('/', { replace: true })
    } catch (requestError) {
      setError(requestError.message || 'Unable to continue with Google. Please try again.')
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
        <h1 className="auth-card__heading">Create your EventHive account</h1>
        <p className="auth-card__description">Sign in to create events, RSVP, and participate in community requests.</p>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label className="form-field">
            <span>Name</span>
            <input type="text" autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </label>
          <label className="form-field">
            <span>Email</span>
            <input type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          </label>
          <label className="form-field">
            <span>Password</span>
            <input type="password" autoComplete="new-password" minLength={8} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Register'}
          </button>
          <div className="auth-divider" aria-hidden="true"><span>OR</span></div>
          <button className="google-auth-button" type="button" onClick={handleGoogleSignIn} disabled={submitting}>
            <svg className="google-auth-button__icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{submitting ? 'Signing in…' : 'Continue with Google'}</span>
          </button>
        </form>
        <p className="auth-card__footer">Already registered? <Link to="/login">Login</Link></p>
      </div>
    </section>
  )
}

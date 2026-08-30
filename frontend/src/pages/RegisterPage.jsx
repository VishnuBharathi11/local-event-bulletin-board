import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import logo from '../assets/eventhive.svg'
import GradientBlinds from '../components/common/GradientBlinds.jsx'

const BLINDS_GRADIENT_COLORS = ['#FF9FFC', '#5227FF'];

export default function RegisterPage() {
  const { register } = useAuth()
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
        </form>
        <p className="auth-card__footer">Already registered? <Link to="/login">Login</Link></p>
      </div>
    </section>
  )
}

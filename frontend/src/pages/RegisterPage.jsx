import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

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
      <div className="auth-card">
        <p className="eyebrow">EventHive account</p>
        <h1>Create account</h1>
        <p className="auth-card__description">Create a local EventHive account with a name, email, and password.</p>
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
          <button className="primary-button" type="submit" disabled={submitting}>{submitting ? 'Creating account…' : 'Register'}</button>
        </form>
        <p className="auth-card__footer">Already registered? <Link to="/login">Login</Link></p>
      </div>
    </section>
  )
}

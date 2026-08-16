import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth.js'
import { supabase } from '../lib/supabase.js'

function getLoginErrorMessage(message) {
  const normalizedMessage = message.toLowerCase()

  if (normalizedMessage.includes('email not confirmed')) {
    return 'Please confirm your email before logging in. Check your inbox or resend the confirmation email below.'
  }

  return 'We could not log you in. Please check your email and password.'
}

function Login() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [password, setPassword] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const from = location.state?.from?.pathname ?? '/browse'

  if (user) {
    return <Navigate to={from} replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccessMessage('')
    setIsSubmitting(true)

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    setIsSubmitting(false)

    if (loginError) {
      setError(getLoginErrorMessage(loginError.message))
      return
    }

    navigate(from, { replace: true })
  }

  async function resendConfirmation() {
    setError('')
    setSuccessMessage('')

    if (!email.trim()) {
      setError('Enter your email address first, then resend the confirmation email.')
      return
    }

    setIsSubmitting(true)

    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: {
        emailRedirectTo: window.location.origin,
      },
    })

    setIsSubmitting(false)

    if (resendError) {
      setError('We could not send a new confirmation email right now.')
      return
    }

    setSuccessMessage('Confirmation email sent. Check your inbox and spam folder.')
  }

  return (
    <section className="auth-card">
      <p className="eyebrow">Market pass</p>
      <h1>Log in to Krafzee</h1>
      <p>Log in to walk the market, open your booth, and manage the products you want to sell.</p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Email
          <input
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </label>
        <label>
          Password
          <input
            autoComplete="current-password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>

        {error && <p className="form-error">{error}</p>}
        {successMessage && <p className="form-success">{successMessage}</p>}

        <button className="button button-primary" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Opening gate...' : 'Log in'}
        </button>
        <button
          className="button button-secondary"
          disabled={isSubmitting}
          onClick={resendConfirmation}
          type="button"
        >
          Resend confirmation email
        </button>
      </form>

      <p>
        New around here? <Link to="/signup">Create an account</Link>
      </p>
    </section>
  )
}

export default Login

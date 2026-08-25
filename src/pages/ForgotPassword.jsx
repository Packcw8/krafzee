import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getPublicUrl } from '../lib/site-url.js'
import { supabase } from '../lib/supabase.js'

function getResetErrorMessage(message) {
  const normalizedMessage = message.toLowerCase()

  if (normalizedMessage.includes('rate limit') || normalizedMessage.includes('too many')) {
    return 'Too many password emails were requested in a short time. Please wait a few minutes, then try again.'
  }

  return 'We could not send a password reset email right now. Please try again soon.'
}

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccessMessage('')
    setIsSubmitting(true)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: getPublicUrl('/reset-password'),
    })

    setIsSubmitting(false)

    if (resetError) {
      setError(getResetErrorMessage(resetError.message))
      return
    }

    setSuccessMessage('If an account exists for that email, a password reset link is on the way.')
  }

  return (
    <section className="auth-card">
      <p className="eyebrow">Account help</p>
      <h1>Reset your password</h1>
      <p>Enter your account email and Krafzee will send a secure reset link.</p>

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

        {error && <p className="form-error">{error}</p>}
        {successMessage && <p className="form-success">{successMessage}</p>}

        <button className="button button-primary" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Sending reset link...' : 'Send reset link'}
        </button>
      </form>

      <p>
        Remembered it? <Link to="/login">Log in</Link>
      </p>
    </section>
  )
}

export default ForgotPassword

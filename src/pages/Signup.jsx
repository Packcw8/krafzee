import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'

function getSignupErrorMessage(message) {
  if (message.toLowerCase().includes('rate limit')) {
    return 'Krafzee has sent too many signup emails in a short time. Please wait a few minutes, then try again.'
  }

  return 'Could not create your account. Please check the details and try again.'
}

function Signup() {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [password, setPassword] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccessMessage('')
    setIsSubmitting(true)

    const { data, error: signupError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          display_name: displayName.trim(),
        },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    })

    setIsSubmitting(false)

    if (signupError) {
      setError(getSignupErrorMessage(signupError.message))
      return
    }

    if (!data.session) {
      setSuccessMessage(
        'Check your email to confirm your Krafzee account. After you confirm it, come back here and log in.',
      )
      return
    }

    setSuccessMessage('Your account is ready. You can log in and walk the market.')
  }

  return (
    <section className="auth-card">
      <p className="eyebrow">Join the market</p>
      <h1>Create a Krafzee account</h1>
      <p>Create an account so you can browse the market and open a booth to sell your products.</p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Display name
          <input
            autoComplete="name"
            onChange={(event) => setDisplayName(event.target.value)}
            required
            type="text"
            value={displayName}
          />
        </label>
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
            autoComplete="new-password"
            minLength={6}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>

        {error && <p className="form-error">{error}</p>}
        {successMessage && <p className="form-success">{successMessage}</p>}

        <button className="button button-primary" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Setting up account...' : 'Sign up'}
        </button>
      </form>

      <p>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </section>
  )
}

export default Signup

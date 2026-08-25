import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'

function ResetPassword() {
  const navigate = useNavigate()
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isReady, setIsReady] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [password, setPassword] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    async function hydrateRecoverySession() {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      const searchParams = new URLSearchParams(window.location.search)
      const accessToken = hashParams.get('access_token') || searchParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token')

      if (accessToken && refreshToken) {
        const { data } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (isMounted) {
          setIsReady(Boolean(data.session))
        }
      }
    }

    hydrateRecoverySession()

    supabase.auth.getSession().then(({ data }) => {
      if (isMounted) {
        setIsReady(Boolean(data.session))
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setIsReady(Boolean(session))
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccessMessage('')

    if (password.length < 6) {
      setError('Use at least 6 characters for your new password.')
      return
    }

    if (password !== confirmPassword) {
      setError('The passwords do not match.')
      return
    }

    setIsSubmitting(true)

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    })

    setIsSubmitting(false)

    if (updateError) {
      setError('We could not update your password. Open the reset link again or request a new one.')
      return
    }

    setSuccessMessage('Your password has been updated. Sending you to login.')
    await supabase.auth.signOut()
    window.setTimeout(() => navigate('/login', { replace: true }), 1200)
  }

  return (
    <section className="auth-card">
      <p className="eyebrow">Account recovery</p>
      <h1>Choose a new password</h1>
      <p>Use the reset link from your email, then save a new password for your Krafzee account.</p>

      {!isReady && (
        <p className="form-error">
          This reset link is missing or expired. Request a new password reset email.
        </p>
      )}

      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          New password
          <input
            autoComplete="new-password"
            disabled={!isReady || isSubmitting}
            minLength={6}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>
        <label>
          Confirm password
          <input
            autoComplete="new-password"
            disabled={!isReady || isSubmitting}
            minLength={6}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            type="password"
            value={confirmPassword}
          />
        </label>

        {error && <p className="form-error">{error}</p>}
        {successMessage && <p className="form-success">{successMessage}</p>}

        <button className="button button-primary" disabled={!isReady || isSubmitting} type="submit">
          {isSubmitting ? 'Saving password...' : 'Save new password'}
        </button>
      </form>

      <p>
        Need another link? <Link to="/forgot-password">Request reset email</Link>
      </p>
    </section>
  )
}

export default ResetPassword

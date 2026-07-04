import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth.js'
import { supabase } from '../lib/supabase.js'

function Login() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [password, setPassword] = useState('')
  const from = location.state?.from?.pathname ?? '/browse'

  if (user) {
    return <Navigate to={from} replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setIsSubmitting(false)

    if (loginError) {
      setError(loginError.message)
      return
    }

    navigate(from, { replace: true })
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

        <button className="button button-primary" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Opening gate...' : 'Log in'}
        </button>
      </form>

      <p>
        New around here? <Link to="/signup">Create an account</Link>
      </p>
    </section>
  )
}

export default Login

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import OnboardingShell from '../components/OnboardingShell.jsx'
import { useAuth } from '../contexts/useAuth.js'
import { supabase } from '../lib/supabase.js'

function TermsAcceptance() {
  const navigate = useNavigate()
  const { refreshProfile, user } = useAuth()
  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleFinish() {
    if (!accepted || !user) {
      return
    }

    setError('')
    setIsSubmitting(true)

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: 'seller' })
      .eq('id', user.id)

    if (profileError) {
      setError(profileError.message)
      setIsSubmitting(false)
      return
    }

    await refreshProfile()
    setIsSubmitting(false)
    navigate('/seller-dashboard')
  }

  return (
    <OnboardingShell
      actions={
        <button
          className="button button-primary"
          disabled={!accepted || isSubmitting}
          onClick={handleFinish}
          type="button"
        >
          {isSubmitting ? 'Opening booth...' : 'Finish and open my booth'}
        </button>
      }
      currentStep="Terms Acceptance"
      intro="Read the market rules, then pin your booth card to the board."
      title="Accept the seller terms."
    >
      <div className="policy-link-grid">
        <Link to="/terms">Terms of Service</Link>
        <Link to="/seller-terms">Seller Terms</Link>
        <Link to="/privacy">Privacy Policy</Link>
        <Link to="/prohibited-items">Prohibited Items Policy</Link>
        <Link to="/fee-policy">Fee Policy</Link>
        <Link to="/refund-dispute-policy">Refund & Dispute Policy</Link>
      </div>

      <label className="acceptance-check">
        <input
          checked={accepted}
          onChange={(event) => setAccepted(event.target.checked)}
          type="checkbox"
        />
        I have read the seller terms, fee notes, and market policies.
      </label>

      {error && <p className="form-error">{error}</p>}
    </OnboardingShell>
  )
}

export default TermsAcceptance

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth.js'
import { supabase } from '../lib/supabase.js'

const marketOptions = [
  {
    value: 'handmade',
    title: 'Handmade & Artisan Market',
    description: 'USA hand-crafted products created in the USA.',
  },
  {
    value: 'jumble_market',
    title: 'Jumble Market',
    description:
      'Tools, car parts, furniture, electronics, collectibles, garden goods, salvage, and useful odds and ends.',
  },
]

function OpenYourBooth() {
  const navigate = useNavigate()
  const { profile, refreshProfile, user } = useAuth()
  const [agreementAccepted, setAgreementAccepted] = useState(false)
  const [boothDescription, setBoothDescription] = useState('')
  const [boothName, setBoothName] = useState('')
  const [city, setCity] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [marketType, setMarketType] = useState('handmade')
  const [sellerBio, setSellerBio] = useState('')
  const [stateName, setStateName] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  if (!user) {
    return (
      <section className="auth-card">
        <p className="eyebrow">Open Your Booth</p>
        <h1>Sign in before setting up your table.</h1>
        <p>
          Create an account or log in, then you can open a simple booth and add
          products later.
        </p>
        <div className="hero-actions">
          <Link className="button button-primary" to="/signup">
            Create an account
          </Link>
          <Link className="button button-secondary" to="/login">
            Log in
          </Link>
        </div>
      </section>
    )
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccessMessage('')

    if (!agreementAccepted) {
      setError('Please agree to the Krafzee marketplace rules before opening your booth.')
      return
    }

    setIsSubmitting(true)

    const ownerName =
      profile?.display_name ||
      user.user_metadata?.display_name ||
      user.email?.split('@')[0] ||
      'Krafzee seller'
    const location = `${city.trim()}, ${stateName.trim()}`

    const boothPayload = {
      owner_id: user.id,
      name: boothName.trim(),
      description: boothDescription.trim(),
      owner_name: ownerName,
      bio: sellerBio.trim(),
      location,
      market_type: marketType,
    }

    const { data: existingBooth, error: lookupError } = await supabase
      .from('booths')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle()

    if (lookupError) {
      setError(lookupError.message)
      setIsSubmitting(false)
      return
    }

    const { error: boothError } = existingBooth
      ? await supabase
          .from('booths')
          .update(boothPayload)
          .eq('owner_id', user.id)
      : await supabase.from('booths').insert(boothPayload)

    if (boothError) {
      setError(boothError.message)
      setIsSubmitting(false)
      return
    }

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
    setSuccessMessage('Your booth is open. Taking you to your seller dashboard...')
    setIsSubmitting(false)

    setTimeout(() => {
      navigate('/seller-dashboard')
    }, 700)
  }

  return (
    <section className="onboarding-card booth-onboarding-card">
      <p className="eyebrow">Open Your Booth</p>
      <h1>Open Your Booth</h1>
      <p>
        Start with a simple booth. Add products, projects, and payment setup
        later.
      </p>

      <form className="auth-form booth-onboarding-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label>
            Booth name
            <input
              onChange={(event) => setBoothName(event.target.value)}
              placeholder="Example: Cody's Products and Goods"
              required
              type="text"
              value={boothName}
            />
          </label>
          <label>
            City
            <input
              onChange={(event) => setCity(event.target.value)}
              placeholder="Example: Knoxville"
              required
              type="text"
              value={city}
            />
          </label>
          <label>
            State
            <input
              onChange={(event) => setStateName(event.target.value)}
              placeholder="Example: TN"
              required
              type="text"
              value={stateName}
            />
          </label>
        </div>

        <label>
          Booth description
          <textarea
            onChange={(event) => setBoothDescription(event.target.value)}
            placeholder="Tell shoppers what they will find on your table."
            required
            rows="4"
            value={boothDescription}
          />
        </label>

        <label>
          Seller bio
          <textarea
            onChange={(event) => setSellerBio(event.target.value)}
            placeholder="Share a little about you, your goods, and your market style."
            required
            rows="4"
            value={sellerBio}
          />
        </label>

        <fieldset className="market-choice-fieldset">
          <legend>Choose your market aisle</legend>
          <div className="choice-grid">
            {marketOptions.map((option) => (
              <label className="market-choice-card" key={option.value}>
                <input
                  checked={marketType === option.value}
                  name="market_type"
                  onChange={() => setMarketType(option.value)}
                  type="radio"
                  value={option.value}
                />
                <span>
                  <strong>{option.title}</strong>
                  <small>{option.description}</small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="acceptance-check">
          <input
            checked={agreementAccepted}
            onChange={(event) => setAgreementAccepted(event.target.checked)}
            type="checkbox"
          />
          I agree to list items honestly, follow Krafzee marketplace rules, and
          only sell items I am legally allowed to sell.
        </label>

        {error && <p className="form-error">{error}</p>}
        {successMessage && <p className="form-success">{successMessage}</p>}

        <button className="button button-primary" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Opening your booth...' : 'Open my booth'}
        </button>
      </form>
    </section>
  )
}

export default OpenYourBooth

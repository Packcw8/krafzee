import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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

function splitLocation(location = '') {
  const [city = '', state = ''] = location.split(',').map((item) => item.trim())

  return { city, state }
}

function SellerDashboard() {
  const { profile, user } = useAuth()
  const [booth, setBooth] = useState(null)
  const [boothDescription, setBoothDescription] = useState('')
  const [boothName, setBoothName] = useState('')
  const [city, setCity] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [marketType, setMarketType] = useState('handmade')
  const [sellerBio, setSellerBio] = useState('')
  const [stateName, setStateName] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadBooth() {
      if (!user) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError('')

      const { data, error: boothError } = await supabase
        .from('booths')
        .select('id, owner_id, name, description, owner_name, bio, location, market_type')
        .eq('owner_id', user.id)
        .maybeSingle()

      if (!isMounted) {
        return
      }

      if (boothError) {
        setError(boothError.message)
        setBooth(null)
      } else if (data) {
        const locationParts = splitLocation(data.location)

        setBooth(data)
        setBoothName(data.name ?? '')
        setBoothDescription(data.description ?? '')
        setSellerBio(data.bio ?? '')
        setCity(locationParts.city)
        setStateName(locationParts.state)
        setMarketType(data.market_type ?? 'handmade')
      } else {
        setBooth(null)
      }

      setIsLoading(false)
    }

    loadBooth()

    return () => {
      isMounted = false
    }
  }, [user])

  async function handleSave(event) {
    event.preventDefault()
    setError('')
    setSuccessMessage('')
    setIsSaving(true)

    const ownerName =
      profile?.display_name ||
      user.user_metadata?.display_name ||
      user.email?.split('@')[0] ||
      'Krafzee seller'

    const updates = {
      name: boothName.trim(),
      description: boothDescription.trim(),
      owner_name: ownerName,
      bio: sellerBio.trim(),
      location: `${city.trim()}, ${stateName.trim()}`,
      market_type: marketType,
    }

    const { data, error: saveError } = await supabase
      .from('booths')
      .update(updates)
      .eq('owner_id', user.id)
      .select('id, owner_id, name, description, owner_name, bio, location, market_type')
      .single()

    if (saveError) {
      setError(saveError.message)
      setIsSaving(false)
      return
    }

    setBooth(data)
    setSuccessMessage('Booth details saved. Your table is looking tidy.')
    setIsSaving(false)
  }

  if (isLoading) {
    return (
      <article className="state-card">
        <h1>Opening your seller table</h1>
        <p>Loading your booth details.</p>
      </article>
    )
  }

  if (!booth) {
    return (
      <article className="state-card">
        <h1>No booth found yet</h1>
        <p>Open your booth first, then come back here to manage the table.</p>
        <div className="hero-actions">
          <Link className="button button-primary" to="/open-your-booth">
            Open Your Booth
          </Link>
        </div>
      </article>
    )
  }

  return (
    <div className="page-stack">
      <section className="page-intro">
        <p className="eyebrow">Seller dashboard</p>
        <h1>Your booth table is ready.</h1>
        <p>
          Welcome {profile?.display_name ?? 'seller'}. Keep your booth details
          fresh so shoppers know what kind of table they are walking up to.
        </p>
      </section>

      <section className="dashboard-grid">
        <article className="dashboard-card">
          <h2>Booth details</h2>
          <p>{booth.name}</p>
        </article>
        <article className="dashboard-card">
          <h2>Market aisle</h2>
          <p>{booth.market_type === 'handmade' ? 'Handmade & Artisan Market' : 'Jumble Market'}</p>
        </article>
        <article className="dashboard-card">
          <h2>Public booth</h2>
          <p>
            <Link to={`/booth/${booth.id}`}>View your booth</Link>
          </p>
        </article>
      </section>

      <section className="onboarding-card seller-manage-card">
        <p className="eyebrow">Manage booth</p>
        <h2>Update your booth card</h2>

        <form className="auth-form booth-onboarding-form" onSubmit={handleSave}>
          <div className="form-grid">
            <label>
              Booth name
              <input
                onChange={(event) => setBoothName(event.target.value)}
                required
                type="text"
                value={boothName}
              />
            </label>
            <label>
              City
              <input
                onChange={(event) => setCity(event.target.value)}
                required
                type="text"
                value={city}
              />
            </label>
            <label>
              State
              <input
                onChange={(event) => setStateName(event.target.value)}
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
              required
              rows="4"
              value={boothDescription}
            />
          </label>

          <label>
            Seller bio
            <textarea
              onChange={(event) => setSellerBio(event.target.value)}
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

          {error && <p className="form-error">{error}</p>}
          {successMessage && <p className="form-success">{successMessage}</p>}

          <button className="button button-primary" disabled={isSaving} type="submit">
            {isSaving ? 'Saving booth...' : 'Save booth details'}
          </button>
        </form>
      </section>
    </div>
  )
}

export default SellerDashboard

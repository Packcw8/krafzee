import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { categories } from '../data/marketplace.js'
import { supabase } from '../lib/supabase.js'

function Browse() {
  const [booths, setBooths] = useState([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadBooths() {
      setIsLoading(true)
      setError('')

      const { data, error: boothError } = await supabase
        .from('booths')
        .select('id, name, description, owner_name, bio, location, market_type')

      if (!isMounted) {
        return
      }

      if (boothError) {
        setError(boothError.message)
        setBooths([])
      } else {
        setBooths(data ?? [])
      }

      setIsLoading(false)
    }

    loadBooths()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="page-stack">
      <section className="page-intro">
        <p className="eyebrow">Handmade & Artisan Market</p>
        <h1>Browse handmade booths from independent makers.</h1>
        <p>
          USA hand-crafted products created in the USA. Explore ceramics,
          textiles, prints, candles, woodwork, soaps, jewelry, and original
          goods made by hand.
        </p>
      </section>

      <section className="filter-bar" aria-label="Marketplace filters">
        {categories.map((category) => (
          <button className="filter-chip" key={category} type="button">
            {category}
          </button>
        ))}
      </section>

      {isLoading && (
        <article className="state-card">
          <h2>Setting up the booth tables</h2>
          <p>Gathering the latest maker booths.</p>
        </article>
      )}

      {!isLoading && error && (
        <article className="state-card state-card-error">
          <h2>Could not load the market</h2>
          <p>{error}</p>
        </article>
      )}

      {!isLoading && !error && booths.length === 0 && (
        <article className="state-card">
          <h2>No booths are open yet</h2>
          <p>Check back soon as makers begin setting up their tables.</p>
        </article>
      )}

      {!isLoading && !error && booths.length > 0 && (
        <section className="section">
          <div className="section-heading market-aisle-heading market-aisle-handmade">
            <p className="eyebrow">Maker booths</p>
            <h2>Handmade tables</h2>
            <p>Curated booths for original goods and hand-crafted products.</p>
          </div>

          <div className="listing-grid" aria-label="Handmade maker booths">
            {booths.map((booth) => (
              <article className="listing-card" key={booth.id ?? booth.name}>
                <span className="listing-image">Booth</span>
                <div>
                  <h3>{booth.name}</h3>
                  <p>{booth.description}</p>
                </div>
                <dl className="listing-meta">
                  <div>
                    <dt>Owner</dt>
                    <dd>{booth.owner_name}</dd>
                  </div>
                  <div>
                    <dt>Location</dt>
                    <dd>{booth.location || 'Studio location coming soon'}</dd>
                  </div>
                </dl>
                <div className="card-footer">
                  <strong>USA handmade</strong>
                  <Link to={`/booth/${booth.id}`}>Visit booth</Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default Browse

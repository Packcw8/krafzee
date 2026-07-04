import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { categories } from '../data/marketplace.js'
import { supabase } from '../lib/supabase.js'

const marketGroups = [
  {
    key: 'handmade',
    title: 'Handmade & Artisan Market',
    eyebrow: 'USA handmade aisle',
    description:
      'USA hand-crafted products created in the USA. Shop maker booths for ceramics, textiles, prints, candles, woodwork, soaps, jewelry, and original goods made by hand.',
  },
  {
    key: 'trading_post',
    title: 'Jumble Market',
    eyebrow: 'Yard sale aisle',
    description:
      'An online yard sale aisle for tools, car parts, furniture, electronics, collectibles, records, garden items, salvage, and useful odds and ends.',
  },
]

function getMarketKey(marketType = '') {
  const normalized = marketType.toLowerCase().replaceAll('-', '_').replaceAll(' ', '_')

  if (normalized.includes('handmade') || normalized.includes('artisan')) {
    return 'handmade'
  }

  if (normalized.includes('jumble')) {
    return 'trading_post'
  }

  return 'trading_post'
}

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

  const boothsByMarket = marketGroups.reduce((groups, group) => {
    groups[group.key] = booths.filter(
      (booth) => getMarketKey(booth.market_type) === group.key,
    )
    return groups
  }, {})

  return (
    <div className="page-stack">
      <section className="page-intro">
        <p className="eyebrow">Walk the market</p>
        <h1>Two market rows, one Krafzee stroll.</h1>
        <p>
          Start with the Handmade & Artisan Market, then wander over to the
          Jumble Market for the rest of the yard sale, workshop, garage, and
          county fair finds.
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
          <p>Fetching the latest Krafzee booths from Supabase.</p>
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
          <h2>No booths yet</h2>
          <p>Add rows to the booths table to start filling the market rows.</p>
        </article>
      )}

      {!isLoading &&
        !error &&
        marketGroups.map((group) => (
          <section className="section" key={group.key}>
            <div className={`section-heading market-aisle-heading market-aisle-${group.key}`}>
              <p className="eyebrow">{group.eyebrow}</p>
              <h2>{group.title}</h2>
              <p>{group.description}</p>
            </div>

            {boothsByMarket[group.key].length === 0 ? (
              <article className="state-card">
                <h3>No booths on this row yet</h3>
                <p>This section is ready when sellers start setting up.</p>
              </article>
            ) : (
              <div className="listing-grid" aria-label={`${group.title} booths`}>
                {boothsByMarket[group.key].map((booth) => (
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
                        <dd>{booth.location || 'Local pickup notes coming soon'}</dd>
                      </div>
                    </dl>
                    <div className="card-footer">
                      <strong>{group.key === 'handmade' ? 'USA handmade' : 'Jumble Market'}</strong>
                      <Link to={`/booth/${booth.id}`}>Visit booth</Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ))}
    </div>
  )
}

export default Browse

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { categories } from '../data/marketplace.js'
import { supabase } from '../lib/supabase.js'

function formatPrice(price) {
  if (price === null || price === undefined || price === '') {
    return 'Price not posted'
  }

  return `$${Number(price).toFixed(2)}`
}

function includesSearch(fields, searchTerm) {
  if (!searchTerm) {
    return true
  }

  return fields
    .filter(Boolean)
    .some((field) => field.toLowerCase().includes(searchTerm))
}

function Browse() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [booths, setBooths] = useState([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [listings, setListings] = useState([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadMarket() {
      setIsLoading(true)
      setError('')

      const [
        { data: boothData, error: boothError },
        { data: listingData, error: listingError },
      ] = await Promise.all([
        supabase
          .from('booths')
          .select('id, name, description, owner_name, bio, location, market_type, thumbnail_url'),
        supabase
          .from('listings')
          .select('id, booth_id, title, description, price, image_url, market_type, category'),
      ])

      if (!isMounted) {
        return
      }

      const loadError = boothError || listingError

      if (loadError) {
        setError(loadError.message)
        setBooths([])
        setListings([])
      } else {
        setBooths(boothData ?? [])
        setListings(listingData ?? [])
      }

      setIsLoading(false)
    }

    loadMarket()

    return () => {
      isMounted = false
    }
  }, [])

  const normalizedSearch = searchQuery.trim().toLowerCase()
  const isCategoryFiltered = activeCategory !== 'All'
  const boothById = new Map(booths.map((booth) => [booth.id, booth]))

  const filteredListings = listings.filter((listing) => {
    const booth = boothById.get(listing.booth_id)
    const matchesCategory = !isCategoryFiltered || listing.category === activeCategory
    const matchesSearch = includesSearch(
      [
        listing.title,
        listing.description,
        listing.category,
        booth?.name,
        booth?.owner_name,
        booth?.location,
      ],
      normalizedSearch,
    )

    return matchesCategory && matchesSearch
  })

  const filteredBooths = booths.filter((booth) => {
    const boothListings = listings.filter((listing) => listing.booth_id === booth.id)
    const matchesCategory =
      !isCategoryFiltered ||
      boothListings.some((listing) => listing.category === activeCategory)
    const matchesSearch = includesSearch(
      [
        booth.name,
        booth.description,
        booth.owner_name,
        booth.location,
        ...boothListings.flatMap((listing) => [
          listing.title,
          listing.description,
          listing.category,
        ]),
      ],
      normalizedSearch,
    )

    return matchesCategory && matchesSearch
  })

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

      <section className="market-search-card" aria-label="Search handmade market">
        <label>
          Search the market
          <input
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search item names, categories, booth names, or sellers"
            type="search"
            value={searchQuery}
          />
        </label>
      </section>

      <section className="filter-bar" aria-label="Marketplace filters">
        {['All', ...categories].map((category) => (
          <button
            className={category === activeCategory ? 'filter-chip filter-chip-active' : 'filter-chip'}
            key={category}
            onClick={() => setActiveCategory(category)}
            type="button"
          >
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

      {!isLoading && !error && booths.length === 0 && listings.length === 0 && (
        <article className="state-card">
          <h2>No booths are open yet</h2>
          <p>Check back soon as makers begin setting up their tables.</p>
        </article>
      )}

      {!isLoading && !error && (booths.length > 0 || listings.length > 0) && (
        <>
        <section className="section">
          <div className="section-heading market-aisle-heading market-aisle-handmade">
            <p className="eyebrow">New on the tables</p>
            <h2>Items to browse</h2>
            <p>Scroll the latest handmade goods from open booths.</p>
          </div>

          {filteredListings.length === 0 ? (
            <article className="state-card">
              <h3>No items match that search</h3>
              <p>Try another category, item name, or booth name.</p>
            </article>
          ) : (
            <div className="scrolling-listing-row" aria-label="Matching handmade items">
              {filteredListings.map((listing) => {
                const booth = boothById.get(listing.booth_id)

                return (
                  <article className="listing-card market-item-card" key={listing.id}>
                    {listing.image_url ? (
                      <img src={listing.image_url} alt="" className="card-image" />
                    ) : (
                      <span className="listing-image">{listing.category || 'Item'}</span>
                    )}
                    <div>
                      <h3>{listing.title}</h3>
                      <p>{listing.description}</p>
                    </div>
                    <dl className="listing-meta">
                      <div>
                        <dt>Booth</dt>
                        <dd>{booth?.name || 'Maker booth'}</dd>
                      </div>
                      <div>
                        <dt>Category</dt>
                        <dd>{listing.category || 'Original goods'}</dd>
                      </div>
                    </dl>
                    <div className="card-footer">
                      <strong>{formatPrice(listing.price)}</strong>
                      <Link to={`/listing/${listing.id}`}>View item</Link>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        <section className="section">
          <div className="section-heading market-aisle-heading market-aisle-handmade">
            <p className="eyebrow">Maker booths</p>
            <h2>Handmade tables</h2>
            <p>Curated booths matching your market search.</p>
          </div>

          {filteredBooths.length === 0 ? (
            <article className="state-card">
              <h3>No booths match that search</h3>
              <p>Clear the search or choose another category to walk more tables.</p>
            </article>
          ) : (
            <div className="listing-grid" aria-label="Handmade maker booths">
              {filteredBooths.map((booth) => (
              <article className="listing-card" key={booth.id ?? booth.name}>
                {booth.thumbnail_url ? (
                  <img src={booth.thumbnail_url} alt="" className="card-image" />
                ) : (
                  <span className="listing-image">Booth</span>
                )}
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
          )}
        </section>
        </>
      )}
    </div>
  )
}

export default Browse

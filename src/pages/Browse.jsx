import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, ShoppingBag } from 'lucide-react'
import { useCart } from '../contexts/useCart.js'
import {
  formatListingAttributes,
  getMarketSection,
  listingSelectFields,
  marketSections,
} from '../data/marketplace.js'
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
    .some((field) => String(field).toLowerCase().includes(searchTerm))
}

function getListingType(listing) {
  return listing.item_type || listing.category || 'Market finds'
}

function Browse() {
  const { addToCart } = useCart()
  const [searchParams, setSearchParams] = useSearchParams()
  const [booths, setBooths] = useState([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [listings, setListings] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const marketFromUrl = searchParams.get('market') === 'jumble' ? 'jumble' : 'handmade'
  const activeMarket = getMarketSection(marketFromUrl)

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
          .select(listingSelectFields),
      ])

      if (!isMounted) {
        return
      }

      const loadError = boothError || listingError

      if (loadError) {
        setError('We could not load the market right now. Please try again soon.')
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
  const boothById = new Map(booths.map((booth) => [booth.id, booth]))

  const filteredListings = listings.filter((listing) => {
    const booth = boothById.get(listing.booth_id)
    const matchesMarket = (listing.market_type || 'handmade') === marketFromUrl
    const matchesSearch = includesSearch(
      [
        listing.title,
        listing.description,
        listing.item_type,
        listing.processing_time,
        ...(listing.materials ?? []),
        ...formatListingAttributes(listing.attributes).map((attribute) => attribute.value),
        ...(listing.variants ?? []).map((variant) => variant.name),
        booth?.name,
        booth?.owner_name,
        booth?.location,
      ],
      normalizedSearch,
    )

    return matchesMarket && matchesSearch
  })

  const listingsByType = filteredListings.reduce((groups, listing) => {
    const type = getListingType(listing)
    const typeListings = groups.get(type) ?? []
    typeListings.push(listing)
    groups.set(type, typeListings)
    return groups
  }, new Map())

  const typeRows = Array.from(listingsByType, ([type, typeListings]) => ({
    listings: typeListings,
    type,
  }))

  const filteredBooths = booths.filter((booth) => {
    const boothListings = listings.filter((listing) => listing.booth_id === booth.id)
    const matchesMarket =
      (booth.market_type || 'handmade') === marketFromUrl ||
      boothListings.some((listing) => (listing.market_type || 'handmade') === marketFromUrl)
    const matchesSearch = includesSearch(
      [
        booth.name,
        booth.description,
        booth.owner_name,
        booth.location,
        ...boothListings.flatMap((listing) => [
          listing.title,
          listing.description,
          listing.item_type,
          listing.processing_time,
          ...(listing.materials ?? []),
          ...formatListingAttributes(listing.attributes).map((attribute) => attribute.value),
          ...(listing.variants ?? []).map((variant) => variant.name),
        ]),
      ],
      normalizedSearch,
    )

    return matchesMarket && matchesSearch
  })

  function handleMarketSelect(marketType) {
    setSearchParams({ market: marketType })
  }

  const boothEyebrow = marketFromUrl === 'jumble' ? 'Jumble booths' : 'Maker booths'
  const boothHeading = marketFromUrl === 'jumble' ? 'Jumble tables' : 'Handcrafted tables'
  const boothAriaLabel =
    marketFromUrl === 'jumble' ? 'Jumble market booths' : 'Handcrafted maker booths'
  const boothBadge = marketFromUrl === 'jumble' ? 'Jumble table' : 'USA handcrafted'

  return (
    <div className="page-stack">
      <section className="page-intro">
        <p className="eyebrow">{activeMarket.eyebrow}</p>
        <h1>{activeMarket.title}</h1>
        <p>{activeMarket.description}</p>
      </section>

      <section className="market-lane-tabs" aria-label="Market lanes">
        {marketSections.map((section) => (
          <button
            className={section.key === marketFromUrl ? 'market-lane-tab market-lane-tab-active' : 'market-lane-tab'}
            key={section.key}
            onClick={() => handleMarketSelect(section.key)}
            type="button"
          >
            <strong>{section.title}</strong>
            <span>{section.key === 'jumble' ? 'Resale and table finds' : 'Maker-made goods'}</span>
          </button>
        ))}
      </section>

      <section className="market-search-card" aria-label="Search market">
        <Search aria-hidden="true" size={20} />
        <label>
          Search the market
          <input
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search item names, product types, booth names, or sellers"
            type="search"
            value={searchQuery}
          />
        </label>
      </section>

      {isLoading && (
        <article className="state-card">
          <h2>Setting up the booth tables</h2>
          <p>Gathering the latest market booths.</p>
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
          <p>Check back soon as sellers begin setting up their tables.</p>
        </article>
      )}

      {!isLoading && !error && (booths.length > 0 || listings.length > 0) && (
        <>
        <section className="section">
          <div className="section-heading market-aisle-heading market-aisle-handmade">
            <p className="eyebrow">New on the tables</p>
            <h2>Browse by product type</h2>
            <p>
              Showing {filteredListings.length} item{filteredListings.length === 1 ? '' : 's'} across{' '}
              {typeRows.length} product type{typeRows.length === 1 ? '' : 's'}. Scroll sideways in each row.
            </p>
          </div>

          {filteredListings.length === 0 ? (
            <article className="state-card">
              <h3>No items match that search</h3>
              <p>Try another item name, product type, booth name, or seller.</p>
            </article>
          ) : (
            <div className="product-type-section-list">
              {typeRows.map(({ type, listings: typeListings }) => (
                <section className="product-type-row" aria-label={`${type} items`} key={type}>
                  <div className="product-type-row-heading">
                    <div>
                      <p className="eyebrow">Product type</p>
                      <h3>{type}</h3>
                    </div>
                    <span>
                      {typeListings.length} item{typeListings.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="scrolling-listing-row" aria-label={`${type} market items`}>
                    {typeListings.map((listing) => {
                      const booth = boothById.get(listing.booth_id)
                      const attributes = formatListingAttributes(listing.attributes)

                      return (
                        <article className="listing-card market-item-card" key={listing.id}>
                          {listing.image_url ? (
                            <img src={listing.image_url} alt="" className="card-image" />
                          ) : (
                            <span className="listing-image">{listing.category || type}</span>
                          )}
                          <div>
                            <h3>{listing.title}</h3>
                            <p>{listing.description}</p>
                          </div>
                          <dl className="listing-meta">
                            <div>
                              <dt>Booth</dt>
                              <dd>
                                {booth?.id ? (
                                  <Link to={`/booth/${booth.id}`}>{booth.name || 'Maker booth'}</Link>
                                ) : (
                                  booth?.name || 'Maker booth'
                                )}
                              </dd>
                            </div>
                            <div>
                              <dt>Type</dt>
                              <dd>{type}</dd>
                            </div>
                          </dl>
                          {attributes.length > 0 && (
                            <div className="attribute-chip-list">
                              {attributes.slice(0, 3).map((attribute) => (
                                <span className="attribute-chip" key={attribute.key}>
                                  {attribute.label}: {attribute.value}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="card-footer">
                            <strong>{formatPrice(listing.price)}</strong>
                            <Link to={`/listing/${listing.id}`}>View item</Link>
                          </div>
                          <button
                            className="quick-cart-button"
                            onClick={() =>
                              addToCart({
                                id: listing.id,
                                booth_id: listing.booth_id,
                                boothName: booth?.name || 'Maker booth',
                                category: listing.category,
                                image_url: listing.image_url,
                                price: listing.price,
                                selectedOption: listing.variants?.[0]?.name ?? '',
                                title: listing.title,
                              })
                            }
                            type="button"
                          >
                            <ShoppingBag aria-hidden="true" size={16} />
                            Add
                          </button>
                        </article>
                      )
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </section>

        <section className="section">
          <div className="section-heading market-aisle-heading market-aisle-handmade">
            <p className="eyebrow">{boothEyebrow}</p>
            <h2>{boothHeading}</h2>
            <p>
              {filteredBooths.length} booth{filteredBooths.length === 1 ? '' : 's'} match this view.
            </p>
          </div>

          {filteredBooths.length === 0 ? (
            <article className="state-card">
              <h3>No booths match that search</h3>
              <p>Clear the search to walk more tables.</p>
            </article>
          ) : (
            <div className="scrolling-booth-row" aria-label={boothAriaLabel}>
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
                  <strong>{boothBadge}</strong>
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

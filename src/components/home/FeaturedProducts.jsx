import { Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { categoryVisuals } from '../../data/homepage.js'
import { getMarketSection } from '../../data/marketplace.js'

function formatPrice(price) {
  if (price === null || price === undefined || price === '') {
    return 'Price not posted'
  }

  return `$${Number(price).toFixed(2)}`
}

function getVisual(category) {
  return categoryVisuals[category] || 'original'
}

function getListingType(listing) {
  return listing.item_type || listing.category || 'Market finds'
}

function FeaturedProductCard({ booth, listing }) {
  const category = listing.category || 'Original goods'
  const listingType = getListingType(listing)

  return (
    <article className="featured-product-card" key={listing.id}>
      <div className={`product-visual product-visual-${getVisual(category)}`}>
        {listing.image_url ? (
          <img src={listing.image_url} alt="" className="featured-card-image" />
        ) : (
          <span>{category}</span>
        )}
        <button aria-label={`Save ${listing.title}`} className="favorite-button" type="button">
          <Heart aria-hidden="true" size={18} />
        </button>
      </div>
      <div className="product-card-copy">
        <p className="eyebrow">{listingType}</p>
        <h3>{listing.title}</h3>
        <p>
          {booth?.id ? (
            <Link to={`/booth/${booth.id}`}>{booth.name || 'Market booth'}</Link>
          ) : (
            booth?.name || 'Market booth'
          )}
        </p>
        <dl className="listing-meta">
          <div>
            <dt>Price</dt>
            <dd>{formatPrice(listing.price)}</dd>
          </div>
          <div>
            <dt>Location</dt>
            <dd>{booth?.location || 'Location coming soon'}</dd>
          </div>
        </dl>
        <Link to={`/listing/${listing.id}`}>View item</Link>
      </div>
    </article>
  )
}

function FeaturedProductTypeRow({ boothById, listings, type }) {
  const market = getMarketSection(listings[0]?.market_type || 'handmade')
  const visibleListings = listings.slice(0, 8)

  return (
    <section className="featured-market-row" aria-label={`${type} featured items`}>
      <div className="featured-row-heading">
        <div>
          <p className="eyebrow">{market.title}</p>
          <h3>{type}</h3>
        </div>
        <Link to={`/browse?market=${market.key}`}>View all</Link>
      </div>

      <div className="featured-product-row">
        {visibleListings.map((listing) => (
          <FeaturedProductCard
            booth={boothById.get(listing.booth_id)}
            key={listing.id}
            listing={listing}
          />
        ))}
      </div>
    </section>
  )
}

function FeaturedProducts({ booths = [], error = '', isLoading = false, listings = [] }) {
  const boothById = new Map(booths.map((booth) => [booth.id, booth]))
  const hasListings = listings.length > 0
  const productTypeRows = Array.from(
    listings.reduce((groups, listing) => {
      const type = getListingType(listing)
      const typeListings = groups.get(type) ?? []
      typeListings.push(listing)
      groups.set(type, typeListings)
      return groups
    }, new Map()),
    ([type, typeListings]) => ({
      listings: typeListings,
      type,
    }),
  )

  return (
    <section className="section" id="shop">
      <div className="section-heading">
        <p className="eyebrow">Browse by product type</p>
        <h2>Fresh rows from open booths</h2>
        <p>Live goods appear here only after sellers create items for that product type.</p>
      </div>

      {isLoading && (
        <article className="state-card homepage-state-card">
          <h3>Setting out the newest finds</h3>
          <p>Loading live listings from the market.</p>
        </article>
      )}

      {!isLoading && error && (
        <article className="state-card state-card-error homepage-state-card">
          <h3>Could not load featured goods</h3>
          <p>{error}</p>
        </article>
      )}

      {!isLoading && !error && !hasListings && (
        <article className="state-card homepage-state-card">
          <h3>No listed goods yet</h3>
          <p>As sellers add items, the newest market finds will appear here.</p>
          <Link to="/browse?market=handmade">Walk the market</Link>
        </article>
      )}

      {!isLoading && !error && hasListings && (
        <div className="featured-market-sections">
          {productTypeRows.map(({ listings: typeListings, type }) => (
            <FeaturedProductTypeRow
              boothById={boothById}
              key={type}
              listings={typeListings}
              type={type}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default FeaturedProducts

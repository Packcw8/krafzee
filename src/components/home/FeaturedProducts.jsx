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

function getListingCategory(listing) {
  return listing.category || listing.item_type || 'Market finds'
}

function FeaturedProductCard({ booth, listing }) {
  const category = listing.category || 'Original goods'

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
        <p className="eyebrow">{category}</p>
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

function FeaturedCategoryRow({ boothById, category, listings }) {
  const market = getMarketSection(listings[0]?.market_type || 'handmade')
  const visibleListings = listings.slice(0, 8)

  return (
    <section className="featured-market-row" aria-label={`${category} featured items`}>
      <div className="featured-row-heading">
        <h2>{category}</h2>
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
  const categoryRows = Array.from(
    listings.reduce((groups, listing) => {
      const category = getListingCategory(listing)
      const categoryListings = groups.get(category) ?? []
      categoryListings.push(listing)
      groups.set(category, categoryListings)
      return groups
    }, new Map()),
    ([category, categoryListings]) => ({
      category,
      listings: categoryListings,
    }),
  )

  return (
    <section className="section" id="shop">
      {isLoading && (
        <article className="state-card homepage-state-card">
          <h3>Loading market items</h3>
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
          <Link to="/browse?market=handmade">Walk the market</Link>
        </article>
      )}

      {!isLoading && !error && hasListings && (
        <div className="featured-market-sections">
          {categoryRows.map(({ category, listings: categoryListings }) => (
            <FeaturedCategoryRow
              boothById={boothById}
              category={category}
              key={category}
              listings={categoryListings}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default FeaturedProducts

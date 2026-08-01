import { Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { categoryVisuals } from '../../data/homepage.js'

function formatPrice(price) {
  if (price === null || price === undefined || price === '') {
    return 'Price not posted'
  }

  return `$${Number(price).toFixed(2)}`
}

function getVisual(category) {
  return categoryVisuals[category] || 'original'
}

function FeaturedProducts({ booths = [], error = '', isLoading = false, listings = [] }) {
  const boothById = new Map(booths.map((booth) => [booth.id, booth]))
  const visibleListings = listings.slice(0, 6)

  return (
    <section className="section" id="shop">
      <div className="section-heading">
        <p className="eyebrow">Featured handmade goods</p>
        <h2>Fresh finds from maker booths</h2>
        <p>Live goods from the KrafZee market tables.</p>
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

      {!isLoading && !error && visibleListings.length === 0 && (
        <article className="state-card homepage-state-card">
          <h3>No listed goods yet</h3>
          <p>As sellers add items, the newest market finds will appear here.</p>
          <Link to="/browse">Walk the market</Link>
        </article>
      )}

      {!isLoading && !error && visibleListings.length > 0 && (
        <div className="featured-product-grid">
          {visibleListings.map((listing) => {
            const booth = boothById.get(listing.booth_id)
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
                  <p>{booth?.name || 'Maker booth'}</p>
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
          })}
        </div>
      )}
    </section>
  )
}

export default FeaturedProducts

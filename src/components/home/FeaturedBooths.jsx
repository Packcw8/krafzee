import { Link } from 'react-router-dom'
import { categoryVisuals } from '../../data/homepage.js'

function getBoothVisual(booth, listings) {
  const boothListing = listings.find((listing) => listing.booth_id === booth.id)

  return categoryVisuals[boothListing?.category] || 'original'
}

function FeaturedBooths({ booths = [], error = '', isLoading = false, listings = [] }) {
  const visibleBooths = booths.slice(0, 3)

  return (
    <section className="section" id="booths">
      <div className="section-heading">
        <p className="eyebrow">Meet the makers</p>
        <h2>Featured maker booths</h2>
        <p>Step into live booths shaped around a craft, a place, and a maker story.</p>
      </div>

      {isLoading && (
        <article className="state-card homepage-state-card">
          <h3>Opening the booth row</h3>
          <p>Loading live seller booths.</p>
        </article>
      )}

      {!isLoading && error && (
        <article className="state-card state-card-error homepage-state-card">
          <h3>Could not load featured booths</h3>
          <p>{error}</p>
        </article>
      )}

      {!isLoading && !error && visibleBooths.length === 0 && (
        <article className="state-card homepage-state-card">
          <h3>No booths are open yet</h3>
          <p>New seller booths will show here once the market starts filling up.</p>
          <Link to="/open-your-booth">Open your booth</Link>
        </article>
      )}

      {!isLoading && !error && visibleBooths.length > 0 && (
        <div className="featured-booth-grid">
          {visibleBooths.map((booth) => (
            <article className="featured-booth-card" key={booth.id}>
              <div className={`booth-cover product-visual-${getBoothVisual(booth, listings)}`}>
                {booth.thumbnail_url && (
                  <img src={booth.thumbnail_url} alt="" className="featured-card-image" />
                )}
              </div>
              <div className="booth-card-body">
                <span className="maker-avatar">{booth.name?.charAt(0) || 'K'}</span>
                <p className="eyebrow">{booth.owner_name || 'Maker booth'}</p>
                <h3>{booth.name}</h3>
                <p>{booth.description}</p>
                <dl className="listing-meta">
                  <div>
                    <dt>Location</dt>
                    <dd>{booth.location || 'Location coming soon'}</dd>
                  </div>
                </dl>
                <Link to={`/booth/${booth.id}`}>Visit booth</Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default FeaturedBooths

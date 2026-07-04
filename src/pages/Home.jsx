import { Link } from 'react-router-dom'
import { categories, listings, marketSections } from '../data/marketplace.js'

function Home() {
  const featured = listings.slice(0, 3)

  return (
    <div className="page-stack">
      <section className="hero-section">
        <div>
          <p className="eyebrow">Online flea market and yard sale</p>
          <h1>One Krafzee market, two good aisles to wander.</h1>
          <p className="hero-copy">
            Shop USA handmade goods from maker booths, then cross the walkway
            into the Jumble Market for yard sale finds, tools, parts, furniture,
            electronics, collectibles, and useful odds and ends.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" to="/browse">
              Walk the market
            </Link>
            <Link className="button button-secondary" to="/fees">
              View booth fees
            </Link>
          </div>
        </div>
        <div className="market-note market-board" aria-label="Marketplace highlights">
          <strong>Market map</strong>
          <span>Handmade & Artisan Market</span>
          <span>Jumble Market</span>
          <span>Booths, project boards, and fresh finds</span>
        </div>
      </section>

      <section className="market-section-grid" aria-label="Krafzee market sections">
        {marketSections.map((section) => (
          <article
            className={`market-section-card market-section-${section.key}`}
            key={section.key}
          >
            <p className="eyebrow">{section.eyebrow}</p>
            <h2>{section.title}</h2>
            <p>{section.description}</p>
            <Link className="button button-secondary" to="/browse">
              {section.action}
            </Link>
          </article>
        ))}
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Market aisles</p>
          <h2>Tables worth wandering</h2>
        </div>
        <div className="category-grid">
          {categories.map((category) => (
            <Link className="category-tile" key={category} to="/browse">
              {category}
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Fresh from the booths</p>
          <h2>Recently tacked to the board</h2>
        </div>
        <div className="listing-grid">
          {featured.map((listing) => (
            <article className="listing-card" key={listing.id}>
              {listing.image_url ? (
                <img src={listing.image_url} alt="" className="card-image" />
              ) : (
                <span className="listing-image">{listing.category}</span>
              )}
              <div>
                <h3>{listing.title}</h3>
                <p>{listing.description}</p>
              </div>
              <div className="card-footer">
                <strong>{listing.price}</strong>
                <Link to={`/listing/${listing.id}`}>Visit listing</Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Home

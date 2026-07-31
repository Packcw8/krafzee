import { Link } from 'react-router-dom'
import { categories, listings, marketSections } from '../data/marketplace.js'

function Home() {
  const featured = listings.slice(0, 3)
  const primaryMarket = marketSections[0]

  return (
    <div className="page-stack">
      <section className="hero-section">
        <div>
          <p className="eyebrow">Modern handmade marketplace</p>
          <h1>Discover maker booths with goods worth keeping.</h1>
          <p className="hero-copy">
            Krafzee is a curated online market for USA hand-crafted products
            created in the USA. Walk clean, independent booths for ceramics,
            textiles, prints, candles, woodwork, soaps, jewelry, and original
            goods made by hand.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" to="/browse">
              Shop handmade booths
            </Link>
            <Link className="button button-secondary" to="/open-your-booth">
              Open your booth
            </Link>
          </div>
        </div>
        <div className="market-note market-board" aria-label="Marketplace highlights">
          <strong>Krafzee at a glance</strong>
          <span>Handmade & Artisan Market</span>
          <span>USA hand-crafted products</span>
          <span>Booths, project boards, and original goods</span>
        </div>
      </section>

      <section className="market-section-grid market-section-grid-single" aria-label="Krafzee market">
        <article className="market-section-card market-section-handmade">
          <p className="eyebrow">{primaryMarket.eyebrow}</p>
          <h2>{primaryMarket.title}</h2>
          <p>{primaryMarket.description}</p>
          <Link className="button button-secondary" to="/browse">
            {primaryMarket.action}
          </Link>
        </article>
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Shop by craft</p>
          <h2>Find the maker table that fits your style</h2>
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
          <p className="eyebrow">Featured work</p>
          <h2>Fresh from the booths</h2>
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

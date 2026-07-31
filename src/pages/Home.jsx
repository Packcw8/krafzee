import { Link } from 'react-router-dom'
import { categories, marketSections } from '../data/marketplace.js'

function Home() {
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
        <div className="market-note market-board hero-logo-board" aria-label="Krafzee marketplace sign">
          <img className="hero-logo" src="/KrafZeeLogo.png" alt="KrafZee.com USA" />
          <span>USA handmade booths, project boards, and original goods.</span>
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
          <p className="eyebrow">Open booths</p>
          <h2>See what makers are bringing to market</h2>
        </div>
        <article className="state-card">
          <h3>Fresh booths are setting up</h3>
          <p>Explore the market as makers open their tables and add new work.</p>
          <div className="hero-actions">
            <Link className="button button-primary" to="/browse">
              Browse booths
            </Link>
          </div>
        </article>
      </section>
    </div>
  )
}

export default Home

import { Link } from 'react-router-dom'

function HeroSection() {
  return (
    <section className="hero-section home-hero" id="home">
      <div className="hero-content">
        <p className="eyebrow">Modern local marketplace</p>
        <h1>Shop handcrafted goods and market-table finds.</h1>
        <p className="hero-copy">
          KrafZee keeps maker-made goods and jumble finds in separate lanes so
          shoppers can browse handcrafted work or hunt through resale tables
          without the two getting mixed together.
        </p>
        <div className="hero-actions">
          <Link className="button button-primary" to="/browse?market=handmade">
            Shop handcrafted
          </Link>
          <Link className="button button-secondary" to="/browse?market=jumble">
            Jumble market
          </Link>
        </div>
        <p className="hero-trust-line">
          Handcrafted booths &bull; Jumble tables &bull; Seller setup after signup
        </p>
      </div>

      <div className="product-collage" aria-label="Handmade product showcase">
        <div className="product-collage-tile product-collage-primary product-visual product-visual-ceramics">
          <span>Pottery</span>
        </div>
        <div className="product-collage-tile product-visual product-visual-candles">
          <span>Candles</span>
        </div>
        <div className="product-collage-tile product-visual product-visual-clothing">
          <span>Clothing</span>
        </div>
      </div>
    </section>
  )
}

export default HeroSection

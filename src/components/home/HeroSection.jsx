import { Link } from 'react-router-dom'

function HeroSection() {
  return (
    <section className="hero-section home-hero" id="home">
      <div className="hero-content">
        <p className="eyebrow">Modern handmade marketplace</p>
        <h1>Shop handmade goods from independent makers.</h1>
        <p className="hero-copy">
          KrafZee brings together independent American makers selling ceramics,
          textiles, artwork, candles, woodwork, jewelry, toys, and original
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
        <p className="hero-trust-line">
          Independent makers &bull; Made in the USA &bull; Free to list
        </p>
      </div>

      <div className="product-collage" aria-label="Handmade product showcase">
        <div className="product-collage-tile product-collage-primary product-visual product-visual-ceramics">
          <span>Pottery</span>
        </div>
        <div className="product-collage-tile product-visual product-visual-candles">
          <span>Candles</span>
        </div>
        <div className="product-collage-tile product-visual product-visual-textiles">
          <span>Textiles</span>
        </div>
      </div>
    </section>
  )
}

export default HeroSection

import { Link } from 'react-router-dom'

function SellerCTA() {
  return (
    <section className="seller-cta-section" id="sell">
      <div>
        <p className="eyebrow">Sell on KrafZee</p>
        <h2>Your craft deserves its own booth.</h2>
        <p>
          Create a KrafZee booth, list your handmade goods, and reach customers
          looking for original work.
        </p>
      </div>
      <div className="hero-actions">
        <Link className="button button-primary" to="/open-your-booth">
          Open your booth
        </Link>
        <Link className="button button-secondary" to="/fees">
          View seller fees
        </Link>
      </div>
    </section>
  )
}

export default SellerCTA

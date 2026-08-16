import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth.js'

function SellerCTA() {
  const { role, user } = useAuth()

  if (!user) {
    return (
      <section className="seller-cta-section" id="account">
        <div>
          <p className="eyebrow">Want to sell later?</p>
          <h2>Create an account first.</h2>
          <p>
            Seller setup opens after signup, so shoppers and booth owners each get
            the right next step.
          </p>
        </div>
        <div className="hero-actions">
          <Link className="button button-primary" to="/signup">
            Sign up
          </Link>
          <Link className="button button-secondary" to="/login">
            Log in
          </Link>
        </div>
      </section>
    )
  }

  if (role === 'seller' || role === 'admin') {
    return (
      <section className="seller-cta-section" id="account">
        <div>
          <p className="eyebrow">Seller Pro</p>
          <h2>Manage your booth.</h2>
          <p>Keep your booth details, product listings, and Stripe setup ready.</p>
        </div>
        <div className="hero-actions">
          <Link className="button button-primary" to="/seller-dashboard">
            Seller Dashboard
          </Link>
          <Link className="button button-secondary" to="/fees">
            View seller fees
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="seller-cta-section" id="account">
      <div>
        <p className="eyebrow">Open a booth</p>
        <h2>Choose handcrafted or jumble.</h2>
        <p>
          Open the right kind of table after signup: a maker booth for handcrafted
          goods or a jumble booth for resale finds.
        </p>
      </div>
      <div className="hero-actions">
        <Link className="button button-primary" to="/open-your-booth">
          Open a booth
        </Link>
        <Link className="button button-secondary" to="/fees">
          View seller fees
        </Link>
      </div>
    </section>
  )
}

export default SellerCTA

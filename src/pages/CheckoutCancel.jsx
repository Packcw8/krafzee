import { ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'

function CheckoutCancel() {
  return (
    <article className="state-card checkout-state-card">
      <ShoppingBag aria-hidden="true" size={42} />
      <h1>Checkout paused</h1>
      <p>Your cart is still saved. You can review the items and return to Stripe checkout when ready.</p>
      <div className="hero-actions">
        <Link className="button button-primary" to="/browse">
          Keep browsing
        </Link>
        <Link className="button button-secondary" to="/">
          Back home
        </Link>
      </div>
    </article>
  )
}

export default CheckoutCancel

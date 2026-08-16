import { CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { useCart } from '../contexts/useCart.js'

function CheckoutSuccess() {
  const { clearCart } = useCart()

  useEffect(() => {
    clearCart()
  }, [clearCart])

  return (
    <article className="state-card checkout-state-card">
      <CheckCircle2 aria-hidden="true" size={42} />
      <h1>Order confirmed</h1>
      <p>
        Your payment went through. Krafzee has sent the order through Stripe so the
        seller can be paid through their connected booth account.
      </p>
      <div className="hero-actions">
        <Link className="button button-primary" to="/browse">
          Keep shopping
        </Link>
        <Link className="button button-secondary" to="/">
          Back home
        </Link>
      </div>
    </article>
  )
}

export default CheckoutSuccess

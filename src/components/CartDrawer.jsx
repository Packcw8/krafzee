import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth.js'
import { useCart } from '../contexts/useCart.js'

function formatPrice(price) {
  if (price === null || price === undefined || price === '') {
    return 'Price not posted'
  }

  return `$${Number(price).toFixed(2)}`
}

function CartDrawer() {
  const { session } = useAuth()
  const {
    cartItems,
    cartTotal,
    clearCart,
    isCartOpen,
    removeFromCart,
    setIsCartOpen,
    updateCartQuantity,
  } = useCart()
  const [checkoutError, setCheckoutError] = useState('')
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false)

  const groupedCartItems = cartItems.reduce((groups, item) => {
    const boothKey = item.booth_id || 'unknown-booth'
    const boothGroup = groups.get(boothKey) ?? {
      boothId: boothKey,
      boothName: item.boothName || 'Maker booth',
      hasUnpricedItems: false,
      items: [],
      subtotal: 0,
    }

    boothGroup.items.push(item)
    if (item.price === null || item.price === undefined || item.price === '') {
      boothGroup.hasUnpricedItems = true
    } else {
      boothGroup.subtotal += Number(item.price) * item.cartQuantity
    }
    groups.set(boothKey, boothGroup)

    return groups
  }, new Map())

  const cartBoothGroups = Array.from(groupedCartItems.values())
  const hasUnpricedItems = cartBoothGroups.some((group) => group.hasUnpricedItems)

  async function handleCheckout() {
    setCheckoutError('')
    setIsCheckoutLoading(true)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(session?.access_token ? { authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            id: item.id,
            quantity: item.cartQuantity,
            selectedOption: item.selectedOption,
          })),
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Stripe checkout is not ready yet.')
      }

      window.location.assign(data.url)
    } catch (error) {
      setCheckoutError(error.message)
      setIsCheckoutLoading(false)
    }
  }

  if (!isCartOpen) {
    return null
  }

  return (
    <div className="cart-overlay" role="presentation">
      <aside aria-label="Shopping cart" className="cart-drawer">
        <div className="cart-drawer-header">
          <div>
            <p className="eyebrow">Cart</p>
            <h2>Market cart</h2>
          </div>
          <button aria-label="Close cart" className="icon-button" onClick={() => setIsCartOpen(false)} type="button">
            <X aria-hidden="true" size={20} />
          </button>
        </div>

        {cartItems.length === 0 ? (
          <div className="cart-empty">
            <ShoppingBag aria-hidden="true" size={34} />
            <h3>Your cart is empty</h3>
            <p>Choose handmade items from one booth or several booths while you browse.</p>
            <Link className="button button-primary" onClick={() => setIsCartOpen(false)} to="/browse">
              Browse items
            </Link>
          </div>
        ) : (
          <>
            <div className="cart-item-list">
              {cartBoothGroups.map((group) => (
                <section className="cart-booth-group" key={group.boothId}>
                  <div className="cart-booth-heading">
                    <span>{group.boothName}</span>
                    <strong>
                      {group.hasUnpricedItems ? `${formatPrice(group.subtotal)} known` : formatPrice(group.subtotal)}
                    </strong>
                  </div>
                  {group.items.map((item) => (
                    <article className="cart-item" key={`${item.id}:${item.selectedOption || 'default'}`}>
                      {item.image_url ? (
                        <img src={item.image_url} alt="" />
                      ) : (
                        <span>{item.category || 'Item'}</span>
                      )}
                      <div>
                        <h3>{item.title}</h3>
                        <p>{item.selectedOption || item.category || 'Handmade item'}</p>
                        <strong>{formatPrice(item.price)}</strong>
                        <div className="cart-quantity">
                          <button
                            aria-label={`Decrease quantity for ${item.title}`}
                            onClick={() => updateCartQuantity(item, item.cartQuantity - 1)}
                            type="button"
                          >
                            <Minus aria-hidden="true" size={15} />
                          </button>
                          <span>{item.cartQuantity}</span>
                          <button
                            aria-label={`Increase quantity for ${item.title}`}
                            onClick={() => updateCartQuantity(item, item.cartQuantity + 1)}
                            type="button"
                          >
                            <Plus aria-hidden="true" size={15} />
                          </button>
                          <button
                            aria-label={`Remove ${item.title}`}
                            onClick={() => removeFromCart(item)}
                            type="button"
                          >
                            <Trash2 aria-hidden="true" size={15} />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </section>
              ))}
            </div>
            <div className="cart-summary">
              <p>
                Stripe checkout will keep this as one cart while tracking each booth for seller payouts.
                {hasUnpricedItems ? ' Known total excludes items without a posted price.' : ''}
              </p>
              <div>
                <span>Known total</span>
                <strong>{`$${cartTotal.toFixed(2)}`}</strong>
              </div>
              {checkoutError && <p className="form-error">{checkoutError}</p>}
              <button
                className="button button-primary"
                disabled={hasUnpricedItems || isCheckoutLoading}
                onClick={handleCheckout}
                type="button"
              >
                {isCheckoutLoading ? 'Opening Stripe...' : 'Checkout with Stripe'}
              </button>
              {hasUnpricedItems && (
                <small>Remove unpriced items before opening checkout.</small>
              )}
              <button className="button button-secondary" onClick={clearCart} type="button">
                Clear cart
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}

export default CartDrawer

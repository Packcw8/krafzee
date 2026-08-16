import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
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
  const [isShippingLoading, setIsShippingLoading] = useState(false)
  const [selectedShippingRates, setSelectedShippingRates] = useState({})
  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    street1: '',
    street2: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
  })
  const [shippingGroups, setShippingGroups] = useState([])
  const [shippingQuoteId, setShippingQuoteId] = useState(null)

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
  const shippableGroups = cartBoothGroups.filter((group) =>
    group.items.some((item) => item.requires_shipping !== false),
  )
  const hasShippableItems = shippableGroups.length > 0
  const shippingTotal = useMemo(
    () =>
      shippingGroups.reduce((total, group) => {
        const selectedRateId = selectedShippingRates[group.boothId]
        const selectedRate = group.rates.find((rate) => rate.id === selectedRateId)
        return total + (selectedRate?.amount || 0)
      }, 0),
    [selectedShippingRates, shippingGroups],
  )
  const checkoutTotal = cartTotal + shippingTotal / 100

  function updateShippingAddress(key, value) {
    setShippingAddress((currentAddress) => ({
      ...currentAddress,
      [key]: value,
    }))
    setShippingGroups([])
    setShippingQuoteId(null)
    setSelectedShippingRates({})
  }

  async function handleCalculateShipping() {
    setCheckoutError('')
    setIsShippingLoading(true)
    setShippingGroups([])
    setShippingQuoteId(null)
    setSelectedShippingRates({})

    try {
      if (!session?.access_token) {
        throw new Error('Sign in to calculate shipping.')
      }

      const response = await fetch('/api/shipping/rates', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          shipTo: shippingAddress,
          items: cartItems.map((item) => ({
            id: item.id,
            quantity: item.cartQuantity,
            selectedOption: item.selectedOption,
          })),
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Shipping is not ready for this cart.')
      }

      setShippingQuoteId(data.quoteId)
      setShippingGroups(data.groups ?? [])
      setSelectedShippingRates(
        (data.groups ?? []).reduce((rates, group) => ({
          ...rates,
          [group.boothId]: group.rates[0]?.id,
        }), {}),
      )
    } catch (error) {
      setCheckoutError(error.message)
    } finally {
      setIsShippingLoading(false)
    }
  }

  async function handleCheckout() {
    setCheckoutError('')
    setIsCheckoutLoading(true)

    try {
      if (hasShippableItems && (!shippingQuoteId || Object.keys(selectedShippingRates).length !== shippableGroups.length)) {
        throw new Error('Choose shipping before checkout.')
      }

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
          selectedShippingRates,
          shippingQuoteId,
          shipTo: shippingAddress,
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
              {hasShippableItems && (
                <section className="cart-shipping-panel">
                  <h3>Delivery</h3>
                  <div className="cart-address-grid">
                    <input
                      onChange={(event) => updateShippingAddress('name', event.target.value)}
                      placeholder="Full name"
                      value={shippingAddress.name}
                    />
                    <input
                      onChange={(event) => updateShippingAddress('street1', event.target.value)}
                      placeholder="Street address"
                      value={shippingAddress.street1}
                    />
                    <input
                      onChange={(event) => updateShippingAddress('street2', event.target.value)}
                      placeholder="Apt, suite"
                      value={shippingAddress.street2}
                    />
                    <input
                      onChange={(event) => updateShippingAddress('city', event.target.value)}
                      placeholder="City"
                      value={shippingAddress.city}
                    />
                    <input
                      onChange={(event) => updateShippingAddress('state', event.target.value)}
                      placeholder="State"
                      value={shippingAddress.state}
                    />
                    <input
                      onChange={(event) => updateShippingAddress('zip', event.target.value)}
                      placeholder="ZIP"
                      value={shippingAddress.zip}
                    />
                  </div>
                  <button
                    className="button button-secondary"
                    disabled={isShippingLoading}
                    onClick={handleCalculateShipping}
                    type="button"
                  >
                    {isShippingLoading ? 'Checking shipping...' : 'Get shipping'}
                  </button>
                  {shippingGroups.map((group) => (
                    <div className="cart-shipping-group" key={group.boothId}>
                      <strong>{group.boothName}</strong>
                      {group.rates.map((rate) => (
                        <label className="shipping-rate-option" key={rate.id}>
                          <input
                            checked={selectedShippingRates[group.boothId] === rate.id}
                            onChange={() =>
                              setSelectedShippingRates((currentRates) => ({
                                ...currentRates,
                                [group.boothId]: rate.id,
                              }))
                            }
                            type="radio"
                          />
                          <span>
                            {rate.freeShipping ? 'FREE Shipping' : `${rate.carrier} ${rate.service}`}
                            {rate.estimatedDays ? `, ${rate.estimatedDays} business days` : ''}
                          </span>
                          <b>{rate.freeShipping ? 'Free' : `$${(rate.amount / 100).toFixed(2)}`}</b>
                        </label>
                      ))}
                    </div>
                  ))}
                </section>
              )}
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
              {hasShippableItems && (
                <div>
                  <span>Shipping</span>
                  <strong>{shippingTotal === 0 ? 'Free' : `$${(shippingTotal / 100).toFixed(2)}`}</strong>
                </div>
              )}
              <div>
                <span>Checkout total</span>
                <strong>{`$${checkoutTotal.toFixed(2)}`}</strong>
              </div>
              {checkoutError && <p className="form-error">{checkoutError}</p>}
              <button
                className="button button-primary"
                disabled={hasUnpricedItems || isCheckoutLoading || isShippingLoading}
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

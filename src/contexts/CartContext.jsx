import { useCallback, useEffect, useMemo, useState } from 'react'
import { CartContext } from './cart-context.js'

const CART_STORAGE_KEY = 'krafzee-cart'

function getCartKey(item) {
  return [item.id, item.selectedOption || 'default'].join(':')
}

function readStoredCart() {
  try {
    return JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => readStoredCart())
  const [isCartOpen, setIsCartOpen] = useState(false)

  useEffect(() => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems))
  }, [cartItems])

  const removeFromCart = useCallback((item) => {
    setCartItems((currentItems) =>
      currentItems.filter((cartItem) => getCartKey(cartItem) !== getCartKey(item)),
    )
  }, [])

  const addToCart = useCallback((item) => {
    setCartItems((currentItems) => {
      const itemKey = getCartKey(item)
      const existingItem = currentItems.find((cartItem) => getCartKey(cartItem) === itemKey)

      if (existingItem) {
        return currentItems.map((cartItem) =>
          getCartKey(cartItem) === itemKey
            ? { ...cartItem, cartQuantity: cartItem.cartQuantity + 1 }
            : cartItem,
        )
      }

      return [...currentItems, { ...item, cartQuantity: 1 }]
    })
    setIsCartOpen(true)
  }, [])

  const updateCartQuantity = useCallback((item, quantity) => {
    if (quantity <= 0) {
      removeFromCart(item)
      return
    }

    setCartItems((currentItems) =>
      currentItems.map((cartItem) =>
        getCartKey(cartItem) === getCartKey(item)
          ? { ...cartItem, cartQuantity: quantity }
          : cartItem,
      ),
    )
  }, [removeFromCart])

  const clearCart = useCallback(() => {
    setCartItems([])
  }, [])

  const cartCount = cartItems.reduce((total, item) => total + item.cartQuantity, 0)
  const cartTotal = cartItems.reduce(
    (total, item) => total + (Number(item.price) || 0) * item.cartQuantity,
    0,
  )

  const value = useMemo(
    () => ({
      addToCart,
      cartCount,
      cartItems,
      cartTotal,
      clearCart,
      isCartOpen,
      removeFromCart,
      setIsCartOpen,
      updateCartQuantity,
    }),
    [
      addToCart,
      cartCount,
      cartItems,
      cartTotal,
      clearCart,
      isCartOpen,
      removeFromCart,
      updateCartQuantity,
    ],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export default CartProvider

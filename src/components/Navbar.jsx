import { ShoppingBag } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth.js'
import { useCart } from '../contexts/useCart.js'

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/browse?market=handmade', label: 'Shop Handcrafted' },
  { to: '/browse?market=jumble', label: 'Jumble Market' },
]

function Navbar() {
  const { logout, role, user } = useAuth()
  const { cartCount, setIsCartOpen } = useCart()
  const location = useLocation()

  function isNavItemActive(item) {
    if (item.to.startsWith('/browse')) {
      const itemParams = new URLSearchParams(item.to.split('?')[1] || '')
      const itemMarket = itemParams.get('market') || 'handmade'
      const currentMarket = new URLSearchParams(location.search).get('market') || 'handmade'

      return location.pathname === '/browse' && currentMarket === itemMarket
    }

    return location.pathname === item.to
  }

  return (
    <header className="site-header">
      <NavLink className="brand" to="/" aria-label="Krafzee home">
        <span className="brand-compact">KrafZee<span>+</span></span>
      </NavLink>

      <nav className="nav-links" aria-label="Main navigation">
        {navItems.map((item) => (
          <NavLink
            className={() =>
              [
                'nav-link',
                item.highlight ? 'nav-link-sell' : '',
                isNavItemActive(item) ? 'nav-link-active' : '',
              ]
                .filter(Boolean)
                .join(' ')
            }
            key={item.to}
            to={item.to}
          >
            {item.label}
          </NavLink>
        ))}
        {user && role === 'buyer' && (
          <NavLink
            className={({ isActive }) =>
              [
                'nav-link',
                'nav-link-sell',
                isActive ? 'nav-link-active' : '',
              ]
                .filter(Boolean)
                .join(' ')
            }
            to="/open-your-booth"
          >
            Open a Booth
          </NavLink>
        )}
        {(role === 'seller' || role === 'admin') && (
          <NavLink
            className={({ isActive }) =>
              isActive ? 'nav-link nav-link-active' : 'nav-link'
            }
            to="/seller-dashboard"
          >
            Seller Dashboard
          </NavLink>
        )}
        {role === 'admin' && (
          <NavLink
            className={({ isActive }) =>
              isActive ? 'nav-link nav-link-active' : 'nav-link'
            }
            to="/admin"
          >
            Admin
          </NavLink>
        )}
        <button className="cart-nav-button" onClick={() => setIsCartOpen(true)} type="button">
          <ShoppingBag aria-hidden="true" size={18} />
          <span>Cart</span>
          {cartCount > 0 && <strong>{cartCount}</strong>}
        </button>
        {!user ? (
          <>
            <NavLink
              className={({ isActive }) =>
                isActive ? 'nav-link nav-link-active' : 'nav-link'
              }
              to="/login"
            >
              Log in
            </NavLink>
            <NavLink
              className={({ isActive }) =>
                isActive ? 'nav-link nav-link-active' : 'nav-link'
              }
              to="/signup"
            >
              Sign up
            </NavLink>
          </>
        ) : (
          <button className="logout-button" onClick={logout} type="button">
            Logout
          </button>
        )}
      </nav>
    </header>
  )
}

export default Navbar

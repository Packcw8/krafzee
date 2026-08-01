import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth.js'

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/browse', label: 'Shop' },
  { to: '/open-your-booth', label: 'Sell on KrafZee', highlight: true },
  { to: '/fees', label: 'Fees' },
]

function Navbar() {
  const { logout, role, user } = useAuth()

  return (
    <header className="site-header">
      <NavLink className="brand" to="/" aria-label="Krafzee home">
        <span className="brand-compact">KrafZee<span>+</span></span>
      </NavLink>

      <nav className="nav-links" aria-label="Main navigation">
        {navItems.map((item) => (
          <NavLink
            className={({ isActive }) =>
              [
                'nav-link',
                item.highlight ? 'nav-link-sell' : '',
                isActive ? 'nav-link-active' : '',
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

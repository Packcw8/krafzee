import { Outlet } from 'react-router-dom'
import CartDrawer from '../components/CartDrawer.jsx'
import Footer from '../components/Footer.jsx'
import Navbar from '../components/Navbar.jsx'

function AppLayout() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="page-shell">
        <Outlet />
      </main>
      <CartDrawer />
      <Footer />
    </div>
  )
}

export default AppLayout

import { Outlet } from 'react-router-dom'
import Footer from '../components/Footer.jsx'
import Navbar from '../components/Navbar.jsx'

function AppLayout() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="page-shell">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default AppLayout

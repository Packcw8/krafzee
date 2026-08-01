import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <img src="/KrafZeeLogo.png" alt="KrafZee.com USA" />
        <p>
          A modern handmade marketplace for independent makers and shoppers
          looking for original work.
        </p>
      </div>

      <div className="footer-link-grid">
        <div>
          <h2>Shop</h2>
          <Link to="/browse">Shop handmade booths</Link>
          <Link to="/">Craft categories</Link>
        </div>
        <div>
          <h2>Sellers</h2>
          <Link to="/open-your-booth">Open a booth</Link>
          <Link to="/fees">Seller fees</Link>
          <Link to="/seller-terms">Seller terms</Link>
        </div>
        <div>
          <h2>Policies</h2>
          <Link to="/terms">Terms</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/prohibited-items">Prohibited items</Link>
          <Link to="/refund-dispute-policy">Refunds & disputes</Link>
        </div>
      </div>

      <p className="footer-fine-print">
        &copy; {new Date().getFullYear()} KrafZee. Handmade marketplace pages are in preview.
      </p>
    </footer>
  )
}

export default Footer

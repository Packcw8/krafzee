import { Link } from 'react-router-dom'
import OnboardingShell from '../components/OnboardingShell.jsx'

function SellerPromise() {
  return (
    <OnboardingShell
      actions={
        <Link className="button button-primary" to="/fee-transparency">
          Continue to fee notes
        </Link>
      }
      currentStep="Seller Promise"
      intro="Krafzee should feel like a neighborly market table, not a mystery bin."
      title="Make the seller promise."
    >
      <div className="promise-list">
        <span>Describe every item honestly, including wear, repairs, and quirks.</span>
        <span>Use clear photos and fair categories so shoppers can find your table.</span>
        <span>Keep prohibited goods off the market.</span>
        <span>Reply with care when a shopper has a question.</span>
        <span>Do not list goods you cannot actually provide.</span>
      </div>
    </OnboardingShell>
  )
}

export default SellerPromise

import { Link } from 'react-router-dom'
import OnboardingShell from '../components/OnboardingShell.jsx'

function SellerProfileSetup() {
  return (
    <OnboardingShell
      actions={
        <Link className="button button-primary" to="/seller-promise">
          Continue to seller promise
        </Link>
      }
      currentStep="Seller Profile Setup"
      intro="A good booth sign helps shoppers know who they are buying from."
      title="Get your booth card ready."
    >
      <form className="auth-form onboarding-form">
        <label>
          Booth name
          <input placeholder="Example: Maple Street Tool Table" type="text" />
        </label>
        <label>
          Seller display name
          <input placeholder="Example: Sam R." type="text" />
        </label>
        <label>
          Location
          <input placeholder="Example: Lancaster, PA" type="text" />
        </label>
        <label>
          Short booth bio
          <textarea placeholder="Tell shoppers what you bring to the market." rows="5" />
        </label>
      </form>
      <p className="helper-note">
        Keep it simple and welcoming. Shoppers should know what you bring to
        the market and where your booth feels at home.
      </p>
    </OnboardingShell>
  )
}

export default SellerProfileSetup

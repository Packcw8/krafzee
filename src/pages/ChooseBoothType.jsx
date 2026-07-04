import { Link } from 'react-router-dom'
import OnboardingShell from '../components/OnboardingShell.jsx'

function ChooseBoothType() {
  return (
    <OnboardingShell
      actions={
        <Link className="button button-primary" to="/seller-profile-setup">
          Continue to profile setup
        </Link>
      }
      currentStep="Choose Booth Type"
      intro="Every good market has rows. Choose where your table belongs today."
      title="Choose your booth row."
    >
      <div className="choice-grid">
        <article className="choice-card">
          <p className="eyebrow">Maker row</p>
          <h2>Handmade & Artisan Market</h2>
          <p>
            Best for USA hand-crafted products created in the USA: ceramics,
            fiber goods, prints, woodwork, candles, soaps, jewelry, small
            batches, and goods made by hand.
          </p>
        </article>
        <article className="choice-card">
          <p className="eyebrow">Jumble row</p>
          <h2>Jumble Market</h2>
          <p>
            Best for tools, car parts, furniture, electronics, collectibles,
            garden goods, records, salvage, and yard sale finds.
          </p>
        </article>
      </div>
    </OnboardingShell>
  )
}

export default ChooseBoothType

const feeRows = [
  { label: 'Listing fee', value: '$0 while Krafzee is in preview' },
  { label: 'Seller booth', value: 'Free basic booth page' },
  { label: 'Payment processing', value: 'Not available yet' },
  { label: 'Final value fee', value: 'Not added yet' },
]

function Fees() {
  return (
    <div className="page-stack">
      <section className="page-intro">
        <p className="eyebrow">Seller fees</p>
        <h1>Simple marketplace pricing before payments arrive.</h1>
        <p>
          Krafzee can publish booth and listing pages now. Payment collection,
          transaction fees, and payout settings are intentionally out of scope
          for this build.
        </p>
      </section>

      <section className="fees-table" aria-label="Krafzee seller fees">
        {feeRows.map((row) => (
          <div className="fee-row" key={row.label}>
            <span>{row.label}</span>
            <strong>{row.value}</strong>
          </div>
        ))}
      </section>
    </div>
  )
}

export default Fees

const feeRows = [
  { label: 'Listing fee', value: '$0' },
  { label: 'Relisting fee', value: '$0' },
  { label: 'Seller booth', value: 'Free booth page' },
  { label: 'Krafzee commission', value: '7% when buyers pay' },
]

function Fees() {
  return (
    <div className="page-stack">
      <section className="page-intro">
        <p className="eyebrow">Seller fees</p>
        <h1>Free to list. Simple commission when payments arrive.</h1>
        <p>
          There are no fees to open a booth, list an item, or relist an item on
          Krafzee. When buyer payments are added, Krafzee will collect a 7%
          commission on paid orders.
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

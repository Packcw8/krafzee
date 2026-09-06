export function listingProgress({ photos, title, category, description, price, quantity, requiresShipping, weight, reviewed }) {
  return [
    photos.length > 0,
    Boolean(title.trim() && category && description.trim()),
    String(price).trim() !== '' && Number.isFinite(Number(price)) && Number(price) >= 0 && String(quantity).trim() !== '' && Number.isInteger(Number(quantity)) && Number(quantity) > 0,
    !requiresShipping || (Number.isFinite(Number(weight)) && Number(weight) > 0),
    reviewed,
  ]
}

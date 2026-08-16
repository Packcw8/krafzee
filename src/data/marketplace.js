export const marketSections = [
  {
    key: 'handmade',
    title: 'Shop Handcrafted',
    eyebrow: 'Curated maker booths',
    description:
      'USA hand-crafted products created in the USA. Shop maker booths for clothing, ceramics, textiles, prints, candles, woodwork, soaps, jewelry, and original goods made by hand.',
    action: 'Shop handmade booths',
  },
  {
    key: 'jumble',
    title: 'Jumble Market',
    eyebrow: 'Local finds and resale tables',
    description:
      'Browse resale finds, vintage pieces, supplies, collectibles, household goods, and one-off table items kept separate from handcrafted booths.',
    action: 'Shop jumble finds',
  },
]

export const handmadeCategories = [
  'Clothing',
  'Ceramics',
  'Textiles',
  'Prints',
  'Candles',
  'Woodwork',
  'Soaps',
  'Jewelry',
  'Toys',
  'Original goods',
]

export const jumbleCategories = [
  'Vintage',
  'Collectibles',
  'Supplies',
  'Home goods',
  'Books & media',
  'Tools',
  'Kids finds',
  'Other finds',
]

export const categories = handmadeCategories

export const listingSelectFields = [
  'id',
  'booth_id',
  'title',
  'description',
  'price',
  'image_url',
  'market_type',
  'category',
  'item_type',
  'attributes',
  'variants',
  'quantity',
  'processing_time',
  'materials',
].join(', ')

export const categoryDetails = {
  Clothing: {
    itemType: 'Clothing',
    optionLabel: 'Sizes, colors, or fits',
    optionPlaceholder: 'Example: small, medium, large, forest green, cream',
    fields: [
      { key: 'size', label: 'Size', placeholder: 'Example: medium, 2T, or custom measurements' },
      { key: 'color', label: 'Color', placeholder: 'Example: forest green' },
      { key: 'material', label: 'Material', placeholder: 'Example: organic cotton' },
      { key: 'fit', label: 'Fit', placeholder: 'Example: relaxed, fitted, oversized' },
      { key: 'care', label: 'Care instructions', placeholder: 'Example: wash cold, lay flat to dry' },
    ],
  },
  Ceramics: {
    itemType: 'Ceramic piece',
    optionLabel: 'Finish, size, or set options',
    optionPlaceholder: 'Example: blue glaze, white glaze, mug only, mug set',
    fields: [
      { key: 'dimensions', label: 'Dimensions', placeholder: 'Example: 6 in tall x 4 in wide' },
      { key: 'glaze', label: 'Glaze or finish', placeholder: 'Example: speckled blue glaze' },
      { key: 'foodSafe', label: 'Food safe?', type: 'select', options: ['Yes', 'No', 'Decorative only'] },
      { key: 'dishwasherSafe', label: 'Dishwasher safe?', type: 'select', options: ['Yes', 'No', 'Hand wash recommended'] },
    ],
  },
  Textiles: {
    itemType: 'Textile good',
    optionLabel: 'Sizes, colors, or patterns',
    optionPlaceholder: 'Example: throw blanket, queen, sage, cream stripe',
    fields: [
      { key: 'size', label: 'Size', placeholder: 'Example: 48 x 60 in' },
      { key: 'color', label: 'Color', placeholder: 'Example: sage green and cream' },
      { key: 'fiber', label: 'Fiber or material', placeholder: 'Example: cotton, wool, linen' },
      { key: 'care', label: 'Care instructions', placeholder: 'Example: machine wash cold' },
    ],
  },
  Prints: {
    itemType: 'Art print',
    optionLabel: 'Print sizes or paper choices',
    optionPlaceholder: 'Example: 5 x 7, 8 x 10, 11 x 14, matte paper',
    fields: [
      { key: 'dimensions', label: 'Print size', placeholder: 'Example: 8 x 10 in' },
      { key: 'medium', label: 'Medium', placeholder: 'Example: archival ink on matte paper' },
      { key: 'frameIncluded', label: 'Frame included?', type: 'select', options: ['No', 'Yes'] },
      { key: 'edition', label: 'Edition notes', placeholder: 'Example: signed open edition' },
    ],
  },
  Candles: {
    itemType: 'Candle',
    optionLabel: 'Scents or vessel sizes',
    optionPlaceholder: 'Example: lavender, citrus, unscented, 8 oz, 12 oz',
    fields: [
      { key: 'scent', label: 'Scent', placeholder: 'Example: lavender vanilla' },
      { key: 'waxType', label: 'Wax type', placeholder: 'Example: soy wax' },
      { key: 'burnTime', label: 'Burn time', placeholder: 'Example: 35 hours' },
      { key: 'vesselSize', label: 'Vessel size', placeholder: 'Example: 8 oz tin' },
    ],
  },
  Woodwork: {
    itemType: 'Woodwork',
    optionLabel: 'Finish, wood, or size options',
    optionPlaceholder: 'Example: walnut, maple, natural finish, dark stain',
    fields: [
      { key: 'dimensions', label: 'Dimensions', placeholder: 'Example: 12 x 8 x 1 in' },
      { key: 'woodType', label: 'Wood type', placeholder: 'Example: walnut' },
      { key: 'finish', label: 'Finish', placeholder: 'Example: food-safe mineral oil' },
      { key: 'care', label: 'Care instructions', placeholder: 'Example: wipe clean with damp cloth' },
    ],
  },
  Soaps: {
    itemType: 'Soap',
    optionLabel: 'Scents, skin types, or bundle choices',
    optionPlaceholder: 'Example: eucalyptus mint, lavender, unscented, 3 bar bundle',
    fields: [
      { key: 'scent', label: 'Scent', placeholder: 'Example: eucalyptus mint' },
      { key: 'weight', label: 'Weight', placeholder: 'Example: 4 oz bar' },
      { key: 'skinType', label: 'Best for', placeholder: 'Example: normal to dry skin' },
      { key: 'ingredients', label: 'Ingredients', placeholder: 'Example: olive oil, shea butter, essential oils' },
    ],
  },
  Jewelry: {
    itemType: 'Jewelry',
    optionLabel: 'Sizes, metals, or chain lengths',
    optionPlaceholder: 'Example: size 6, size 7, 16 in chain, sterling silver',
    fields: [
      { key: 'metal', label: 'Metal', placeholder: 'Example: sterling silver' },
      { key: 'stone', label: 'Stone or accent', placeholder: 'Example: turquoise' },
      { key: 'size', label: 'Size or length', placeholder: 'Example: 18 in chain or size 7 ring' },
      { key: 'hypoallergenic', label: 'Hypoallergenic?', type: 'select', options: ['Yes', 'No', 'Not sure'] },
    ],
  },
  Toys: {
    itemType: 'Toy',
    optionLabel: 'Colors, sizes, or styles',
    optionPlaceholder: 'Example: red, blue, small, large, plush only',
    fields: [
      { key: 'ageRange', label: 'Age range', placeholder: 'Example: 3 years and up' },
      { key: 'materials', label: 'Materials', placeholder: 'Example: cotton yarn, polyester fill' },
      { key: 'safetyNotes', label: 'Safety notes', placeholder: 'Example: contains small parts' },
      { key: 'care', label: 'Care instructions', placeholder: 'Example: spot clean only' },
    ],
  },
  'Original goods': {
    itemType: 'Original good',
    optionLabel: 'Styles, sizes, or custom choices',
    optionPlaceholder: 'Example: small, large, painted, natural, custom color',
    fields: [
      { key: 'primaryDetail', label: 'Main detail', placeholder: 'Example: custom hand-painted design' },
      { key: 'materials', label: 'Materials', placeholder: 'Example: reclaimed fabric and brass' },
      { key: 'dimensions', label: 'Size or dimensions', placeholder: 'Example: 10 in tall' },
      { key: 'care', label: 'Care or handling notes', placeholder: 'Example: keep dry' },
    ],
  },
  Vintage: {
    itemType: 'Vintage find',
    optionLabel: 'Era, color, size, or condition options',
    optionPlaceholder: 'Example: 1970s, blue, small, good condition',
    fields: [
      { key: 'era', label: 'Era or age', placeholder: 'Example: 1970s or about 20 years old' },
      { key: 'condition', label: 'Condition', type: 'select', options: ['New', 'Like new', 'Good', 'Fair', 'Needs repair'] },
      { key: 'brand', label: 'Brand or maker', placeholder: 'Example: Pyrex, Levi, unknown' },
      { key: 'dimensions', label: 'Size or dimensions', placeholder: 'Example: 10 in tall or size medium' },
    ],
  },
  Collectibles: {
    itemType: 'Collectible',
    optionLabel: 'Sets, editions, or condition choices',
    optionPlaceholder: 'Example: single, set of 3, boxed, unboxed',
    fields: [
      { key: 'condition', label: 'Condition', type: 'select', options: ['New', 'Like new', 'Good', 'Fair', 'Needs repair'] },
      { key: 'edition', label: 'Edition or series', placeholder: 'Example: first edition, limited run, series 2' },
      { key: 'included', label: 'What is included', placeholder: 'Example: box, certificate, stand' },
      { key: 'notes', label: 'Important notes', placeholder: 'Example: small scratch on back' },
    ],
  },
  Supplies: {
    itemType: 'Supply lot',
    optionLabel: 'Bundle, quantity, or color choices',
    optionPlaceholder: 'Example: fabric bundle, mixed beads, 10 pack',
    fields: [
      { key: 'quantity', label: 'Quantity or lot size', placeholder: 'Example: 20 pieces or 3 yards' },
      { key: 'condition', label: 'Condition', type: 'select', options: ['New', 'Unused', 'Partially used', 'Mixed'] },
      { key: 'material', label: 'Material or type', placeholder: 'Example: cotton fabric, glass beads' },
      { key: 'color', label: 'Color or pattern', placeholder: 'Example: mixed blues, floral' },
    ],
  },
  'Home goods': {
    itemType: 'Home good',
    optionLabel: 'Size, color, or condition options',
    optionPlaceholder: 'Example: small, white, good condition',
    fields: [
      { key: 'condition', label: 'Condition', type: 'select', options: ['New', 'Like new', 'Good', 'Fair', 'Needs repair'] },
      { key: 'dimensions', label: 'Dimensions', placeholder: 'Example: 18 x 24 in' },
      { key: 'material', label: 'Material', placeholder: 'Example: glass, wood, ceramic' },
      { key: 'pickupNotes', label: 'Pickup or handling notes', placeholder: 'Example: fragile, local pickup preferred' },
    ],
  },
  'Books & media': {
    itemType: 'Book or media item',
    optionLabel: 'Format or bundle choices',
    optionPlaceholder: 'Example: hardcover, paperback, DVD set, bundle',
    fields: [
      { key: 'format', label: 'Format', placeholder: 'Example: hardcover, DVD, vinyl' },
      { key: 'condition', label: 'Condition', type: 'select', options: ['New', 'Like new', 'Good', 'Fair'] },
      { key: 'authorArtist', label: 'Author or artist', placeholder: 'Example: Octavia Butler, The Beatles' },
      { key: 'included', label: 'What is included', placeholder: 'Example: full set, case, insert' },
    ],
  },
  Tools: {
    itemType: 'Tool',
    optionLabel: 'Size, type, or condition options',
    optionPlaceholder: 'Example: hand saw, drill bits, working, needs battery',
    fields: [
      { key: 'condition', label: 'Condition', type: 'select', options: ['New', 'Working', 'Good', 'Fair', 'For parts'] },
      { key: 'brand', label: 'Brand', placeholder: 'Example: DeWalt, Craftsman, unknown' },
      { key: 'powerType', label: 'Power or type', placeholder: 'Example: hand tool, battery, corded' },
      { key: 'included', label: 'Included parts', placeholder: 'Example: charger, case, bits' },
    ],
  },
  'Kids finds': {
    itemType: 'Kids find',
    optionLabel: 'Sizes, ages, or bundle choices',
    optionPlaceholder: 'Example: 3T, ages 4-6, toy bundle',
    fields: [
      { key: 'ageRange', label: 'Age range', placeholder: 'Example: 3 years and up' },
      { key: 'condition', label: 'Condition', type: 'select', options: ['New', 'Like new', 'Good', 'Fair'] },
      { key: 'safetyNotes', label: 'Safety notes', placeholder: 'Example: contains small parts' },
      { key: 'included', label: 'What is included', placeholder: 'Example: full set, missing box' },
    ],
  },
  'Other finds': {
    itemType: 'Jumble find',
    optionLabel: 'Styles, bundles, or condition choices',
    optionPlaceholder: 'Example: bundle, single item, good condition',
    fields: [
      { key: 'condition', label: 'Condition', type: 'select', options: ['New', 'Like new', 'Good', 'Fair', 'Needs repair'] },
      { key: 'mainDetail', label: 'Main detail', placeholder: 'Example: estate sale find, extra supplies' },
      { key: 'dimensions', label: 'Size or dimensions', placeholder: 'Example: 12 in wide' },
      { key: 'notes', label: 'Important notes', placeholder: 'Example: local pickup preferred' },
    ],
  },
}

export function getCategoryDetails(category) {
  return categoryDetails[category] ?? categoryDetails['Original goods']
}

export function getCategoriesForMarket(marketType = 'handmade') {
  return marketType === 'jumble' ? jumbleCategories : handmadeCategories
}

export function getMarketSection(marketType = 'handmade') {
  return marketSections.find((section) => section.key === marketType) ?? marketSections[0]
}

export function formatListingAttributes(attributes = {}) {
  return Object.entries(attributes)
    .filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== '')
    .map(([key, value]) => ({
      key,
      label: key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (letter) => letter.toUpperCase()),
      value,
    }))
}

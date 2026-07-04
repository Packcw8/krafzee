export const marketSections = [
  {
    key: 'handmade',
    title: 'Handmade & Artisan Market',
    eyebrow: 'USA handmade aisle',
    description:
      'USA hand-crafted products created in the USA. Shop maker booths for ceramics, textiles, prints, candles, woodwork, soaps, jewelry, and original goods made by hand.',
    action: 'Shop USA Handmade',
  },
  {
    key: 'trading_post',
    title: 'Jumble Market',
    eyebrow: 'Yard sale aisle',
    description:
      'An online yard sale aisle for tools, car parts, furniture, electronics, collectibles, records, garden items, salvage, and useful odds and ends.',
    action: 'Shop the Jumble Market',
  },
]

export const categories = [
  'Ceramics',
  'Textiles',
  'Tools',
  'Car parts',
  'Furniture',
  'Electronics',
  'Collectibles',
  'Garden',
]

export const booths = [
  {
    id: 'vintage-table',
    name: 'Vintage Table Finds',
    owner_name: 'Maya R.',
    bio: 'Maya keeps a small booth of practical pieces with a little age on them, picked from estate sales and Saturday markets.',
    location: 'Asheville, NC',
    description: 'Restored home goods, warm brass accents, crates, lamps, and other useful flea market finds.',
    market_type: 'trading_post',
  },
  {
    id: 'thread-and-tin',
    name: 'Thread & Tin',
    owner_name: 'Jon P.',
    bio: 'Jon repairs, cleans, and tags the kinds of goods that feel right at home in a garage, workshop, or porch.',
    location: 'Columbus, OH',
    description: 'Workwear, enamel signs, weekend salvage, hand tools, and booth-ready odds and ends.',
    market_type: 'trading_post',
  },
  {
    id: 'clay-and-thread',
    name: 'Clay & Thread',
    owner_name: 'Nora L.',
    bio: 'Nora makes small-batch ceramics and sewn goods for slow kitchens, entry tables, and market baskets.',
    location: 'Lancaster, PA',
    description: 'Hand-thrown mugs, quilted runners, stitched pouches, and cheerful everyday pieces.',
    market_type: 'handmade',
  },
]

export const listings = [
  {
    id: 'brass-desk-lamp',
    booth_id: 'vintage-table',
    title: 'Brass Desk Lamp',
    price: '$68',
    category: 'Vintage',
    market_type: 'trading_post',
    image_url: '',
    description:
      'A solid brass desk lamp with a soft patina, rewired cord, and a small pull chain shade.',
  },
  {
    id: 'oak-market-crate',
    booth_id: 'vintage-table',
    title: 'Oak Market Crate',
    price: '$34',
    category: 'Furniture',
    market_type: 'trading_post',
    image_url: '',
    description:
      'Stackable oak crate sized for records, linens, pantry overflow, or a booth display.',
  },
  {
    id: 'stitched-market-tote',
    booth_id: 'clay-and-thread',
    title: 'Stitched Market Tote',
    price: '$42',
    category: 'Textiles',
    market_type: 'handmade',
    image_url: '',
    description:
      'A sturdy canvas market tote with hand-stitched trim and roomy pockets for a Saturday walk.',
  },
]

export const projects = [
  {
    id: 'crate-restoration',
    booth_id: 'vintage-table',
    title: 'Apple crate cleanup',
    description:
      'Sanding, oiling, and replacing two loose slats before the next market drop.',
    progress_percent: 65,
    image_url: '',
  },
  {
    id: 'mug-run',
    booth_id: 'clay-and-thread',
    title: 'County fair mug run',
    description:
      'A dozen speckled mugs are trimmed, glazed, and waiting on the kiln shelf.',
    progress_percent: 80,
    image_url: '',
  },
]

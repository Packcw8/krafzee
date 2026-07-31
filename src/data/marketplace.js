export const marketSections = [
  {
    key: 'handmade',
    title: 'Handmade & Artisan Market',
    eyebrow: 'Curated maker booths',
    description:
      'USA hand-crafted products created in the USA. Shop maker booths for ceramics, textiles, prints, candles, woodwork, soaps, jewelry, and original goods made by hand.',
    action: 'Shop handmade booths',
  },
]

export const categories = [
  'Ceramics',
  'Textiles',
  'Prints',
  'Candles',
  'Woodwork',
  'Soaps',
  'Jewelry',
  'Original goods',
]

export const booths = [
  {
    id: 'vintage-table',
    name: 'Vintage Table Finds',
    owner_name: 'Maya R.',
    bio: 'Maya keeps a small booth of hand-finished home goods and warm studio pieces.',
    location: 'Asheville, NC',
    description: 'Hand-finished home goods, small wood pieces, and warm studio accents.',
    market_type: 'handmade',
  },
  {
    id: 'thread-and-tin',
    name: 'Thread & Tin',
    owner_name: 'Jon P.',
    bio: 'Jon creates durable textile goods with workshop-inspired details and practical finishes.',
    location: 'Columbus, OH',
    description: 'Canvas totes, stitched pouches, aprons, and practical handmade textile goods.',
    market_type: 'handmade',
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
    category: 'Woodwork',
    market_type: 'handmade',
    image_url: '',
    description:
      'A studio-built desk lamp with a warm finish, simple lines, and handmade details.',
  },
  {
    id: 'oak-market-crate',
    booth_id: 'vintage-table',
    title: 'Oak Market Crate',
    price: '$34',
    category: 'Woodwork',
    market_type: 'handmade',
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

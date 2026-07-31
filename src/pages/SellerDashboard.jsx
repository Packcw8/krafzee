import { useEffect, useState } from 'react'
import { Eye, LayoutDashboard, PackagePlus, Store } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth.js'
import { categories } from '../data/marketplace.js'
import { supabase } from '../lib/supabase.js'

function splitLocation(location = '') {
  const [city = '', state = ''] = location.split(',').map((item) => item.trim())

  return { city, state }
}

const sellerTabs = [
  { key: 'booth', label: 'Booth Details', Icon: Store },
  { key: 'list', label: 'List an Item', Icon: PackagePlus },
  { key: 'items', label: 'Listed Items', Icon: LayoutDashboard },
  { key: 'view', label: 'View Booth', Icon: Eye },
]

function SellerDashboard() {
  const { profile, user } = useAuth()
  const [activeTab, setActiveTab] = useState('booth')
  const [booth, setBooth] = useState(null)
  const [boothDescription, setBoothDescription] = useState('')
  const [boothName, setBoothName] = useState('')
  const [city, setCity] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isListingSaving, setIsListingSaving] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false)
  const [listingCategory, setListingCategory] = useState(categories[0] ?? '')
  const [listingDescription, setListingDescription] = useState('')
  const [listingImageFile, setListingImageFile] = useState(null)
  const [listingPrice, setListingPrice] = useState('')
  const [listings, setListings] = useState([])
  const [listingTitle, setListingTitle] = useState('')
  const [sellerBio, setSellerBio] = useState('')
  const [stateName, setStateName] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadBooth() {
      if (!user) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError('')

      const { data, error: boothError } = await supabase
        .from('booths')
        .select('id, owner_id, name, description, owner_name, bio, location, market_type, thumbnail_url')
        .eq('owner_id', user.id)
        .maybeSingle()

      if (!isMounted) {
        return
      }

      if (boothError) {
        setError(boothError.message)
        setBooth(null)
      } else if (data) {
        const locationParts = splitLocation(data.location)
        const { data: listingData, error: listingError } = await supabase
          .from('listings')
          .select('id, booth_id, title, description, price, image_url, market_type, category')
          .eq('booth_id', data.id)
          .order('title', { ascending: true })

        if (listingError) {
          setError(listingError.message)
        }

        setBooth(data)
        setListings(listingData ?? [])
        setBoothName(data.name ?? '')
        setBoothDescription(data.description ?? '')
        setSellerBio(data.bio ?? '')
        setCity(locationParts.city)
        setStateName(locationParts.state)
        setThumbnailUrl(data.thumbnail_url ?? '')
      } else {
        setBooth(null)
        setListings([])
      }

      setIsLoading(false)
    }

    loadBooth()

    return () => {
      isMounted = false
    }
  }, [user])

  async function handleSave(event) {
    event.preventDefault()
    setError('')
    setSuccessMessage('')
    setIsSaving(true)

    const ownerName =
      profile?.display_name ||
      user.user_metadata?.display_name ||
      user.email?.split('@')[0] ||
      'Krafzee seller'

    const updates = {
      name: boothName.trim(),
      description: boothDescription.trim(),
      owner_name: ownerName,
      bio: sellerBio.trim(),
      location: `${city.trim()}, ${stateName.trim()}`,
      market_type: 'handmade',
      thumbnail_url: thumbnailUrl,
    }

    const { data, error: saveError } = await supabase
      .from('booths')
      .update(updates)
      .eq('owner_id', user.id)
      .select('id, owner_id, name, description, owner_name, bio, location, market_type, thumbnail_url')
      .single()

    if (saveError) {
      setError(saveError.message)
      setIsSaving(false)
      return
    }

    setBooth(data)
    setSuccessMessage('Booth details saved. Your table is looking tidy.')
    setIsSaving(false)
  }

  async function handleThumbnailUpload(event) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      setError('Choose an image file for your booth thumbnail.')
      return
    }

    setError('')
    setSuccessMessage('')
    setIsUploadingThumbnail(true)

    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const filePath = `${user.id}/${Date.now()}.${fileExtension}`

    const { error: uploadError } = await supabase.storage
      .from('booth-thumbnails')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) {
      setError(uploadError.message)
      setIsUploadingThumbnail(false)
      return
    }

    const { data } = supabase.storage
      .from('booth-thumbnails')
      .getPublicUrl(filePath)

    const publicUrl = data.publicUrl

    const { error: updateError } = await supabase
      .from('booths')
      .update({ thumbnail_url: publicUrl })
      .eq('owner_id', user.id)

    if (updateError) {
      setError(updateError.message)
      setIsUploadingThumbnail(false)
      return
    }

    setThumbnailUrl(publicUrl)
    setBooth((currentBooth) =>
      currentBooth ? { ...currentBooth, thumbnail_url: publicUrl } : currentBooth,
    )
    setSuccessMessage('Booth thumbnail uploaded.')
    setIsUploadingThumbnail(false)
  }

  async function handleCreateListing(event) {
    event.preventDefault()
    setError('')
    setSuccessMessage('')
    setIsListingSaving(true)

    let imageUrl = ''

    if (listingImageFile) {
      if (!listingImageFile.type.startsWith('image/')) {
        setError('Choose an image file for your item photo.')
        setIsListingSaving(false)
        return
      }

      const fileExtension = listingImageFile.name.split('.').pop()?.toLowerCase() || 'jpg'
      const filePath = `${user.id}/${booth.id}/${Date.now()}.${fileExtension}`

      const { error: uploadError } = await supabase.storage
        .from('listing-images')
        .upload(filePath, listingImageFile, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) {
        setError(uploadError.message)
        setIsListingSaving(false)
        return
      }

      const { data } = supabase.storage
        .from('listing-images')
        .getPublicUrl(filePath)

      imageUrl = data.publicUrl
    }

    const priceValue = listingPrice ? Number(listingPrice) : null

    if (listingPrice && Number.isNaN(priceValue)) {
      setError('Add a valid price or leave the price blank.')
      setIsListingSaving(false)
      return
    }

    const listingPayload = {
      booth_id: booth.id,
      title: listingTitle.trim(),
      description: listingDescription.trim(),
      price: priceValue,
      image_url: imageUrl,
      market_type: 'handmade',
      category: listingCategory,
    }

    const { data, error: listingError } = await supabase
      .from('listings')
      .insert(listingPayload)
      .select('id, booth_id, title, description, price, image_url, market_type, category')
      .single()

    if (listingError) {
      setError(listingError.message)
      setIsListingSaving(false)
      return
    }

    setListings((currentListings) => [data, ...currentListings])
    setListingTitle('')
    setListingDescription('')
    setListingPrice('')
    setListingCategory(categories[0] ?? '')
    setListingImageFile(null)
    event.currentTarget.reset()
    setSuccessMessage('Item listed on your booth table.')
    setIsListingSaving(false)
  }

  if (isLoading) {
    return (
      <article className="state-card">
        <h1>Opening your seller table</h1>
        <p>Loading your booth details.</p>
      </article>
    )
  }

  if (!booth) {
    return (
      <article className="state-card">
        <h1>No booth found yet</h1>
        <p>Open your booth first, then come back here to manage the table.</p>
        <div className="hero-actions">
          <Link className="button button-primary" to="/open-your-booth">
            Open Your Booth
          </Link>
        </div>
      </article>
    )
  }

  return (
    <div className="page-stack">
      <section className="page-intro">
        <p className="eyebrow">Seller dashboard</p>
        <h1>Your booth table is ready.</h1>
        <p>
          Welcome {profile?.display_name ?? 'seller'}. Keep your booth details
          fresh so shoppers know what kind of table they are walking up to.
        </p>
      </section>

      {activeTab === 'booth' && (
      <section className="onboarding-card seller-manage-card">
        <p className="eyebrow">Manage booth</p>
        <h2>Update your booth card</h2>

        <form className="auth-form booth-onboarding-form" onSubmit={handleSave}>
          <div className="thumbnail-manager">
            <div className="thumbnail-preview">
              {thumbnailUrl ? (
                <img src={thumbnailUrl} alt="" />
              ) : (
                <span>{booth.name.charAt(0)}</span>
              )}
            </div>
            <label>
              Booth thumbnail
              <input
                accept="image/png,image/jpeg,image/webp"
                disabled={isUploadingThumbnail}
                onChange={handleThumbnailUpload}
                type="file"
              />
              <small>
                {isUploadingThumbnail
                  ? 'Uploading thumbnail...'
                  : 'Use a clear square or landscape photo of your booth or product style.'}
              </small>
            </label>
          </div>

          <div className="form-grid">
            <label>
              Booth name
              <input
                onChange={(event) => setBoothName(event.target.value)}
                required
                type="text"
                value={boothName}
              />
            </label>
            <label>
              City
              <input
                onChange={(event) => setCity(event.target.value)}
                required
                type="text"
                value={city}
              />
            </label>
            <label>
              State
              <input
                onChange={(event) => setStateName(event.target.value)}
                required
                type="text"
                value={stateName}
              />
            </label>
          </div>

          <label>
            Booth description
            <textarea
              onChange={(event) => setBoothDescription(event.target.value)}
              required
              rows="4"
              value={boothDescription}
            />
          </label>

          <label>
            Seller bio
            <textarea
              onChange={(event) => setSellerBio(event.target.value)}
              required
              rows="4"
              value={sellerBio}
            />
          </label>

          <article className="market-choice-card market-choice-static">
            <span>
              <strong>Handmade & Artisan Market</strong>
              <small>USA hand-crafted products created in the USA.</small>
            </span>
          </article>

          {error && <p className="form-error">{error}</p>}
          {successMessage && <p className="form-success">{successMessage}</p>}

          <button className="button button-primary" disabled={isSaving} type="submit">
            {isSaving ? 'Saving booth...' : 'Save booth details'}
          </button>
        </form>
      </section>
      )}

      {activeTab === 'list' && (
      <section className="onboarding-card seller-manage-card">
        <p className="eyebrow">List items</p>
        <h2>Add an item to your booth table</h2>
        <p className="helper-note">
          Add handmade goods for shoppers to browse. Payments are not enabled yet.
        </p>

        <form className="auth-form booth-onboarding-form" onSubmit={handleCreateListing}>
          <div className="form-grid">
            <label>
              Item title
              <input
                onChange={(event) => setListingTitle(event.target.value)}
                placeholder="Example: Hand-poured soy candle"
                required
                type="text"
                value={listingTitle}
              />
            </label>
            <label>
              Price
              <input
                min="0"
                onChange={(event) => setListingPrice(event.target.value)}
                placeholder="24.00"
                step="0.01"
                type="number"
                value={listingPrice}
              />
            </label>
            <label>
              Category
              <select
                onChange={(event) => setListingCategory(event.target.value)}
                required
                value={listingCategory}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            Item description
            <textarea
              onChange={(event) => setListingDescription(event.target.value)}
              placeholder="Tell shoppers what it is, how it is made, sizing, materials, or condition notes."
              required
              rows="4"
              value={listingDescription}
            />
          </label>

          <label>
            Item photo
            <input
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => setListingImageFile(event.target.files?.[0] ?? null)}
              type="file"
            />
            <small>Use a clear photo. JPG, PNG, and WebP are supported.</small>
          </label>

          <button className="button button-primary" disabled={isListingSaving} type="submit">
            {isListingSaving ? 'Listing item...' : 'List item'}
          </button>
        </form>
      </section>
      )}

      {activeTab === 'items' && (
      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Your table</p>
          <h2>Listed items</h2>
        </div>

        {listings.length === 0 ? (
          <article className="state-card">
            <h3>No items listed yet</h3>
            <p>Add your first handmade good so shoppers have something to pick up from the table.</p>
          </article>
        ) : (
          <div className="seller-listing-grid">
            {listings.map((listing) => (
              <article className="seller-listing-card" key={listing.id}>
                {listing.image_url ? (
                  <img src={listing.image_url} alt="" className="seller-listing-image" />
                ) : (
                  <span className="seller-listing-image">{listing.category || 'Item'}</span>
                )}
                <div>
                  <h3>{listing.title}</h3>
                  <p>{listing.description}</p>
                  <dl className="listing-meta">
                    <div>
                      <dt>Price</dt>
                      <dd>{listing.price ? `$${Number(listing.price).toFixed(2)}` : 'Not posted'}</dd>
                    </div>
                    <div>
                      <dt>Category</dt>
                      <dd>{listing.category || 'Original goods'}</dd>
                    </div>
                  </dl>
                  <Link to={`/listing/${listing.id}`}>View listing</Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      )}

      {activeTab === 'view' && (
        <section className="onboarding-card seller-manage-card view-booth-panel">
          <p className="eyebrow">Public booth</p>
          <h2>See what shoppers see</h2>
          <div className="view-booth-card">
            {thumbnailUrl ? (
              <img src={thumbnailUrl} alt="" className="booth-thumbnail" />
            ) : (
              <span className="booth-avatar">{booth.name.charAt(0)}</span>
            )}
            <div>
              <h3>{booth.name}</h3>
              <p>{booth.description}</p>
              <dl className="listing-meta">
                <div>
                  <dt>Location</dt>
                  <dd>{booth.location || 'Location notes coming soon'}</dd>
                </div>
                <div>
                  <dt>Listed items</dt>
                  <dd>{listings.length}</dd>
                </div>
              </dl>
              <div className="hero-actions">
                <Link className="button button-primary" to={`/booth/${booth.id}`}>
                  Open public booth
                </Link>
                <button
                  className="button button-secondary"
                  onClick={() => setActiveTab('booth')}
                  type="button"
                >
                  Edit booth details
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      <nav className="seller-bottom-tabs" aria-label="Seller dashboard sections">
        {sellerTabs.map(({ Icon, key, label }) => (
          <button
            className={activeTab === key ? 'seller-bottom-tab seller-bottom-tab-active' : 'seller-bottom-tab'}
            key={key}
            onClick={() => setActiveTab(key)}
            type="button"
          >
            <Icon aria-hidden="true" size={21} strokeWidth={2.4} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

export default SellerDashboard

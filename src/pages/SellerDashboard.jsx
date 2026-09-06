import { listingProgress } from '../data/listingProgress.js'
import { useEffect, useRef, useState } from 'react'
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Eye,
  LayoutDashboard,
  Package,
  PackagePlus,
  Pencil,
  RefreshCw,
  Save,
  Store,
  Trash2,
  Truck,
  X,
} from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth.js'
import {
  categories,
  formatListingAttributes,
  getCategoriesForMarket,
  getCategoryDetails,
  getMarketSection,
  listingSelectFields,
} from '../data/marketplace.js'
import { supabase } from '../lib/supabase.js'

function splitLocation(location = '') {
  const [city = '', state = ''] = location.split(',').map((item) => item.trim())

  return { city, state }
}

const sellerTabs = [
  { key: 'booth', label: 'Booth Details', Icon: Store },
  { key: 'list', label: 'List an Item', Icon: PackagePlus },
  { key: 'items', label: 'Listed Items', Icon: LayoutDashboard },
  { key: 'shipping', label: 'Shipping', Icon: Truck },
  { key: 'view', label: 'View Booth', Icon: Eye },
]

const listingSteps = ['Add photos', 'Item details', 'Price and quantity', 'Shipping or pickup', 'Review and publish']
const boothSelectFields = [
  'id',
  'owner_id',
  'name',
  'description',
  'owner_name',
  'bio',
  'location',
  'market_type',
  'thumbnail_url',
  'stripe_account_id',
  'stripe_onboarding_complete',
  'stripe_charges_enabled',
  'stripe_payouts_enabled',
  'stripe_requirements',
].join(', ')

function parseList(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseVariants(value) {
  return parseList(value).map((name) => ({ name }))
}

function variantsToText(variants = []) {
  return variants.map((variant) => variant.name).filter(Boolean).join(', ')
}

function getFriendlyError(action) {
  return `We could not ${action} right now. Please check the details and try again.`
}

const shippingSchemaSetupMessage =
  'Shipping setup is not finished yet. The production database needs the shipping migration applied before ship-from addresses, packages, or shipping fields can be saved.'
const shippingListingFields = new Set([
  'requires_shipping',
  'free_shipping',
  'weight',
  'weight_unit',
  'package_length',
  'package_width',
  'package_height',
  'dimension_unit',
  'shipping_profile_id',
  'handling_time_min_days',
  'handling_time_max_days',
])
const legacyListingSelectFields = listingSelectFields
  .split(', ')
  .filter((field) => !shippingListingFields.has(field))
  .join(', ')

function isShippingSchemaError(error) {
  if (!error) {
    return false
  }

  const message = error.message ?? ''

  return (
    error.code === 'PGRST205' ||
    (error.code === '42703' && [...shippingListingFields].some((field) => message.includes(field))) ||
    message.includes('seller_shipping_settings') ||
    message.includes('seller_packages')
  )
}

async function readApiResponse(response) {
  const text = await response.text()

  if (!text) {
    return {}
  }

  try {
    return JSON.parse(text)
  } catch {
    return {
      error: response.ok
        ? ''
        : 'A server error stopped Stripe setup. Please try again after the Stripe platform profile is complete.',
    }
  }
}

function SellerDashboard() {
  const { profile, session, user } = useAuth()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') === 'list' ? 'list' : 'booth')
  const [booth, setBooth] = useState(null)
  const [boothDescription, setBoothDescription] = useState('')
  const [boothName, setBoothName] = useState('')
  const [city, setCity] = useState('')
  const [editingListingId, setEditingListingId] = useState('')
  const [editingListingValues, setEditingListingValues] = useState({})
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isListingSaving, setIsListingSaving] = useState(false)
  const [isListingUpdating, setIsListingUpdating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false)
  const [isStripeLoading, setIsStripeLoading] = useState(false)
  const [listingAttributes, setListingAttributes] = useState({})
  const [listingCategory, setListingCategory] = useState(categories[0] ?? '')
  const [listingDescription, setListingDescription] = useState('')
  const [listingPhotos, setListingPhotos] = useState([])
  const [drafts, setDrafts] = useState([])
  const [draftId, setDraftId] = useState(() => crypto.randomUUID())
  const [isDraftSaving, setIsDraftSaving] = useState(false)
  const [reviewed, setReviewed] = useState(false)
  const [listingMaterials, setListingMaterials] = useState('')
  const [listingPrice, setListingPrice] = useState('')
  const [listingProcessingTime, setListingProcessingTime] = useState('')
  const [listingQuantity, setListingQuantity] = useState('1')
  const [listingRequiresShipping, setListingRequiresShipping] = useState(true)
  const [listingFreeShipping, setListingFreeShipping] = useState(false)
  const [listingWeight, setListingWeight] = useState('')
  const [listingPackageLength, setListingPackageLength] = useState('')
  const [listingPackageWidth, setListingPackageWidth] = useState('')
  const [listingPackageHeight, setListingPackageHeight] = useState('')
  const [listingStep, setListingStep] = useState(0)
  const [listings, setListings] = useState([])
  const [listingTitle, setListingTitle] = useState('')
  const [listingVariants, setListingVariants] = useState('')
  const [newPackage, setNewPackage] = useState({
    empty_weight: '0',
    height: '',
    length: '',
    name: '',
    width: '',
  })
  const [sellerBio, setSellerBio] = useState('')
  const [sellerPackages, setSellerPackages] = useState([])
  const [sellerStats, setSellerStats] = useState(null)
  const [shippingSchemaReady, setShippingSchemaReady] = useState(true)
  const [shippingSettings, setShippingSettings] = useState({
    ship_from_city: '',
    ship_from_country: 'US',
    ship_from_name: '',
    ship_from_phone: '',
    ship_from_state: '',
    ship_from_street1: '',
    ship_from_street2: '',
    ship_from_zip: '',
  })
  const [stateName, setStateName] = useState('')
  const [stripeError, setStripeError] = useState('')
  const [stripeMessage, setStripeMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const listingFormRef = useRef(null)

  function resetListingForMarket(marketType) {
    setListingCategory(getCategoriesForMarket(marketType)[0] ?? categories[0] ?? '')
    setListingAttributes({})
    setListingMaterials('')
    setListingVariants('')
    setListingStep(0)
  }

  useEffect(() => {
    let isMounted = true

    async function loadBooth() {
      if (!user) {
        setIsLoading(false)
        setSellerStats(null)
        return
      }

      setIsLoading(true)
      setError('')
      setShippingSchemaReady(true)

      const { data, error: boothError } = await supabase
        .from('booths')
          .select(boothSelectFields)
        .eq('owner_id', user.id)
        .maybeSingle()

      if (!isMounted) {
        return
      }

      if (boothError) {
        setError(getFriendlyError('load your booth'))
        setBooth(null)
        setSellerStats(null)
      } else if (data) {
        const locationParts = splitLocation(data.location)
        let { data: listingData, error: listingError } = await supabase
          .from('listings')
          .select(listingSelectFields)
          .eq('booth_id', data.id)
          .order('title', { ascending: true })
        let shippingSchemaMissing = false

        if (isShippingSchemaError(listingError)) {
          shippingSchemaMissing = true
          const fallbackListingResponse = await supabase
            .from('listings')
            .select(legacyListingSelectFields)
            .eq('booth_id', data.id)
            .order('title', { ascending: true })

          listingData = fallbackListingResponse.data
          listingError = fallbackListingResponse.error
        }

        const { data: shippingData, error: shippingError } = await supabase
          .from('seller_shipping_settings')
          .select('*')
          .eq('booth_id', data.id)
          .maybeSingle()
        const { data: packageData, error: packageError } = await supabase
          .from('seller_packages')
          .select('*')
          .eq('booth_id', data.id)
          .order('is_default', { ascending: false })

        if (isShippingSchemaError(shippingError) || isShippingSchemaError(packageError)) {
          shippingSchemaMissing = true
        }

        if (listingError) {
          setError(getFriendlyError('load your listed items'))
        } else if (shippingSchemaMissing) {
          setShippingSchemaReady(false)
          setError(shippingSchemaSetupMessage)
        }

        setBooth(data)
        setListings(listingData ?? [])
        setBoothName(data.name ?? '')
        setBoothDescription(data.description ?? '')
        setSellerBio(data.bio ?? '')
        setCity(locationParts.city)
        setStateName(locationParts.state)
        setThumbnailUrl(data.thumbnail_url ?? '')
        setShippingSettings({
          ship_from_city: shippingData?.ship_from_city ?? locationParts.city,
          ship_from_country: shippingData?.ship_from_country ?? 'US',
          ship_from_name: shippingData?.ship_from_name ?? data.name ?? '',
          ship_from_phone: shippingData?.ship_from_phone ?? '',
          ship_from_state: shippingData?.ship_from_state ?? locationParts.state,
          ship_from_street1: shippingData?.ship_from_street1 ?? '',
          ship_from_street2: shippingData?.ship_from_street2 ?? '',
          ship_from_zip: shippingData?.ship_from_zip ?? '',
        })
        setSellerPackages(shippingSchemaMissing ? [] : packageData ?? [])
        resetListingForMarket(data.market_type)

        if (session?.access_token) {
          fetch('/api/seller/stats', {
            headers: {
              authorization: `Bearer ${session.access_token}`,
            },
          })
            .then((response) => (response.ok ? response.json() : null))
            .then((statsPayload) => {
              if (isMounted) {
                setSellerStats(statsPayload)
              }
            })
            .catch(() => {
              if (isMounted) {
                setSellerStats(null)
              }
            })
        }
      } else {
        setBooth(null)
        setListings([])
        setSellerPackages([])
        setSellerStats(null)
      }

      setIsLoading(false)
    }

    loadBooth()

    return () => {
      isMounted = false
    }
  }, [session?.access_token, user])

  useEffect(() => {
    if (!user) return
    let active = true
    supabase.from('listing_drafts').select('id, payload, updated_at').eq('owner_id', user.id)
      .order('updated_at', { ascending: false }).then(({ data, error: draftError }) => {
        if (!active) return
        if (draftError) setError('Saved drafts are unavailable right now. Please try again later.')
        else setDrafts(data || [])
      })
    return () => { active = false }
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
      thumbnail_url: thumbnailUrl,
      market_type: booth.market_type || 'handmade',
    }

    const { data, error: saveError } = await supabase
      .from('booths')
      .update(updates)
      .eq('owner_id', user.id)
        .select(boothSelectFields)
      .single()

    if (saveError) {
      setError(getFriendlyError('save your booth details'))
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
      setError(getFriendlyError('upload your booth thumbnail'))
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
      setError(getFriendlyError('save your booth thumbnail'))
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

  function handleCreateListing(event) {
    event.preventDefault()
    const incomplete = stepComplete.findIndex((complete) => !complete)
    if (incomplete !== -1) {
      setListingStep(incomplete)
      setError(`Complete “${listingSteps[incomplete]}” before publishing.`)
      return
    }
    confirmCreateListing()
  }

  function startEditingListing(listing) {
    setError('')
    setSuccessMessage('')
    setEditingListingId(listing.id)
    setEditingListingValues({
      title: listing.title ?? '',
      category: listing.category ?? getCategoriesForMarket(booth.market_type)[0] ?? categories[0] ?? '',
      description: listing.description ?? '',
      price: listing.price ?? '',
      quantity: listing.quantity ?? 1,
      processing_time: listing.processing_time ?? '',
      materials: (listing.materials ?? []).join(', '),
      variants: variantsToText(listing.variants ?? []),
      attributes: listing.attributes ?? {},
      requires_shipping: listing.requires_shipping !== false,
      free_shipping: Boolean(listing.free_shipping),
      weight: listing.weight ?? '',
      package_length: listing.package_length ?? '',
      package_width: listing.package_width ?? '',
      package_height: listing.package_height ?? '',
    })
  }

  function cancelEditingListing() {
    setEditingListingId('')
    setEditingListingValues({})
  }

  function updateEditingListingValue(key, value) {
    setEditingListingValues((currentValues) => ({
      ...currentValues,
      [key]: value,
    }))
  }

  function updateEditingListingAttribute(key, value) {
    setEditingListingValues((currentValues) => ({
      ...currentValues,
      attributes: {
        ...(currentValues.attributes ?? {}),
        [key]: value,
      },
    }))
  }

  async function saveListingEdits(listing) {
    setError('')
    setSuccessMessage('')
    setIsListingUpdating(true)

    if (!shippingSchemaReady) {
      setError(shippingSchemaSetupMessage)
      setIsListingUpdating(false)
      return
    }

    const priceValue =
      editingListingValues.price === '' || editingListingValues.price === null
        ? null
        : Number(editingListingValues.price)
    const quantityValue = Number(editingListingValues.quantity)

    if (!editingListingValues.title?.trim()) {
      setError('Add an item title before saving.')
      setIsListingUpdating(false)
      return
    }

    if (!editingListingValues.description?.trim()) {
      setError('Add an item description before saving.')
      setIsListingUpdating(false)
      return
    }

    if (priceValue !== null && Number.isNaN(priceValue)) {
      setError('Add a valid price or leave the price blank.')
      setIsListingUpdating(false)
      return
    }

    if (!Number.isInteger(quantityValue) || quantityValue < 0) {
      setError('Add a whole number for quantity.')
      setIsListingUpdating(false)
      return
    }

    if (editingListingValues.requires_shipping !== false && !Number(editingListingValues.weight)) {
      setError('Add a shipping weight before saving this item.')
      setIsListingUpdating(false)
      return
    }

    const category = editingListingValues.category
    const categoryDetailsForEdit = getCategoryDetails(category)
    const updates = {
      title: editingListingValues.title.trim(),
      description: editingListingValues.description.trim(),
      price: priceValue,
      category,
      item_type: categoryDetailsForEdit.itemType,
      attributes: editingListingValues.attributes ?? {},
      variants: parseVariants(editingListingValues.variants ?? ''),
      quantity: quantityValue,
      processing_time: editingListingValues.processing_time?.trim() || null,
      materials: parseList(editingListingValues.materials ?? ''),
      requires_shipping: editingListingValues.requires_shipping !== false,
      free_shipping: Boolean(editingListingValues.free_shipping),
      weight: editingListingValues.requires_shipping === false ? null : Number(editingListingValues.weight),
      weight_unit: 'oz',
      package_length: editingListingValues.package_length ? Number(editingListingValues.package_length) : null,
      package_width: editingListingValues.package_width ? Number(editingListingValues.package_width) : null,
      package_height: editingListingValues.package_height ? Number(editingListingValues.package_height) : null,
      dimension_unit: 'in',
    }

    const { data, error: updateError } = await supabase
      .from('listings')
      .update(updates)
      .eq('id', listing.id)
      .eq('booth_id', booth.id)
      .select(listingSelectFields)
      .single()

    if (updateError) {
      setError(getFriendlyError('save this item'))
      setIsListingUpdating(false)
      return
    }

    setListings((currentListings) =>
      currentListings.map((currentListing) => (currentListing.id === data.id ? data : currentListing)),
    )
    cancelEditingListing()
    setSuccessMessage('Item updated.')
    setIsListingUpdating(false)
  }

  async function deleteListing(listing) {
    const shouldDelete = window.confirm(`Delete "${listing.title}" from your booth?`)

    if (!shouldDelete) {
      return
    }

    setError('')
    setSuccessMessage('')
    setIsListingUpdating(true)

    const { error: deleteError } = await supabase
      .from('listings')
      .delete()
      .eq('id', listing.id)
      .eq('booth_id', booth.id)

    if (deleteError) {
      setError(getFriendlyError('delete this item'))
      setIsListingUpdating(false)
      return
    }

    setListings((currentListings) => currentListings.filter((currentListing) => currentListing.id !== listing.id))
    if (editingListingId === listing.id) {
      cancelEditingListing()
    }
    setSuccessMessage('Item removed from your booth.')
    setIsListingUpdating(false)
  }

  async function refreshStripeStatus() {
    if (!session?.access_token) {
      setStripeError('')
      setStripeMessage('Sign in again before checking payout status.')
      return
    }

    setIsStripeLoading(true)
    setStripeMessage('')
    setStripeError('')
    setError('')

    try {
      const response = await fetch('/api/stripe/connect/status', {
        headers: {
          authorization: `Bearer ${session.access_token}`,
        },
      })
      const data = await readApiResponse(response)

      if (!response.ok) {
        throw new Error(data.error || 'We could not check payout status right now.')
      }

      if (data.booth) {
        setBooth((currentBooth) => ({ ...currentBooth, ...data.booth }))
      }

      setStripeMessage(
        data.booth?.stripe_charges_enabled
          ? 'Stripe payouts are ready for this booth.'
          : 'Stripe is still waiting on seller onboarding details.',
      )
    } catch (statusError) {
      setStripeError(statusError.message)
    } finally {
      setIsStripeLoading(false)
    }
  }

  async function handleStartStripeOnboarding() {
    if (!session?.access_token) {
      setStripeError('')
      setStripeMessage('Sign in again before setting up payouts.')
      return
    }

    setIsStripeLoading(true)
    setStripeMessage('')
    setStripeError('')
    setError('')

    try {
      const response = await fetch('/api/stripe/connect/start', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${session.access_token}`,
        },
      })
      const data = await readApiResponse(response)

      if (!response.ok) {
        throw new Error(data.error || 'We could not open Stripe onboarding right now.')
      }

      window.location.assign(data.url)
    } catch (onboardingError) {
      setStripeError(onboardingError.message)
      setIsStripeLoading(false)
    }
  }

  async function confirmCreateListing() {
    setError('')
    setSuccessMessage('')
    setIsListingSaving(true)

    if (!shippingSchemaReady) {
      setError(shippingSchemaSetupMessage)
      setIsListingSaving(false)
      return
    }

    let photoUrls
    try { photoUrls = await uploadListingPhotos() }
    catch (uploadError) { setError(uploadError.message); setIsListingSaving(false); return }
    const imageUrl = photoUrls[0] || ''

    const priceValue = listingPrice ? Number(listingPrice) : null
    const quantityValue = listingQuantity ? Number(listingQuantity) : 1

    if (listingPrice && Number.isNaN(priceValue)) {
      setError('Add a valid price or leave the price blank.')
      setIsListingSaving(false)
      return
    }

    if (!Number.isInteger(quantityValue) || quantityValue < 0) {
      setError('Add a whole number for quantity.')
      setIsListingSaving(false)
      return
    }

    if (listingRequiresShipping && !Number(listingWeight)) {
      setError('Add a shipping weight before publishing.')
      setIsListingSaving(false)
      return
    }

    const selectedCategoryDetails = getCategoryDetails(listingCategory)
    const listingPayload = {
      id: draftId,
      booth_id: booth.id,
      title: listingTitle.trim(),
      description: listingDescription.trim(),
      price: priceValue,
      image_url: imageUrl,
      image_urls: photoUrls,
      market_type: booth.market_type || 'handmade',
      category: listingCategory,
      item_type: selectedCategoryDetails.itemType,
      attributes: listingAttributes,
      variants: parseVariants(listingVariants),
      quantity: quantityValue,
      processing_time: listingProcessingTime.trim() || null,
      materials: parseList(listingMaterials),
      requires_shipping: listingRequiresShipping,
      free_shipping: listingRequiresShipping ? listingFreeShipping : false,
      weight: listingRequiresShipping ? Number(listingWeight) : null,
      weight_unit: 'oz',
      package_length: listingPackageLength ? Number(listingPackageLength) : null,
      package_width: listingPackageWidth ? Number(listingPackageWidth) : null,
      package_height: listingPackageHeight ? Number(listingPackageHeight) : null,
      dimension_unit: 'in',
    }

    let { data, error: listingError } = await supabase
      .from('listings')
      .insert(listingPayload)
      .select(listingSelectFields)
      .single()

    const galleryUnavailable = listingError && ['PGRST204', '42703'].includes(listingError.code) && listingError.message?.includes('image_urls')
    if (galleryUnavailable && photoUrls.length === 1) {
      const legacyPayload = { ...listingPayload }
      delete legacyPayload.image_urls
      const retry = await supabase.from('listings').insert(legacyPayload).select(listingSelectFields).single()
      data = retry.data
      listingError = retry.error
    }

    if (listingError) {
      setError(galleryUnavailable && photoUrls.length > 1 ? 'Multiple-photo publishing is temporarily unavailable. Your photos and details are still here; please try again later.' : getFriendlyError('list this item'))
      setIsListingSaving(false)
      return
    }

    setListings((currentListings) => [data, ...currentListings])
    setListingTitle('')
    setListingDescription('')
    setListingPrice('')
    setListingCategory(getCategoriesForMarket(booth.market_type)[0] ?? categories[0] ?? '')
    setListingPhotos([])
    setReviewed(false)
    setListingAttributes({})
    setListingMaterials('')
    setListingProcessingTime('')
    setListingQuantity('1')
    setListingRequiresShipping(true)
    setListingFreeShipping(false)
    setListingWeight('')
    setListingPackageLength('')
    setListingPackageWidth('')
    setListingPackageHeight('')
    setListingStep(0)
    setListingVariants('')
    listingFormRef.current?.reset()
    const { error: draftDeleteError } = await supabase.from('listing_drafts').delete().eq('id', draftId).eq('owner_id', user.id)
    setDrafts((current) => current.filter((draft) => draft.id !== draftId))
    setDraftId(crypto.randomUUID())
    setSuccessMessage(draftDeleteError ? 'Item published. The old draft could not be removed; do not publish that draft again.' : 'Item listed on your booth table.')
    setIsListingSaving(false)
  }

  async function uploadListingPhotos() {
    const uploaded = []
    for (const photo of listingPhotos) {
      if (photo.url) { uploaded.push(photo.url); continue }
      const filePath = `${user.id}/${booth.id}/${photo.id}.${photo.file.name.split('.').pop().toLowerCase()}`
      const { error: uploadError } = await supabase.storage.from('listing-images').upload(filePath, photo.file, { upsert: true })
      if (uploadError) throw new Error('A photo could not be uploaded. Your changes are still here; please retry.')
      const { data } = supabase.storage.from('listing-images').getPublicUrl(filePath)
      uploaded.push(data.publicUrl)
      setListingPhotos((current) => current.map((entry) => entry.id === photo.id ? { ...entry, url: data.publicUrl } : entry))
    }
    return uploaded
  }

  async function saveListingDraft() {
    setIsDraftSaving(true)
    setError('')
    setSuccessMessage('')
    try {
      const urls = await uploadListingPhotos()
      const payload = { listingTitle, listingCategory, listingDescription, listingPrice, listingQuantity, listingProcessingTime, listingMaterials, listingVariants, listingAttributes, listingRequiresShipping, listingFreeShipping, listingWeight, listingPackageLength, listingPackageWidth, listingPackageHeight, listingStep, photos: urls }
      const { data, error: draftError } = await supabase.from('listing_drafts').upsert({ id: draftId, owner_id: user.id, payload, updated_at: new Date().toISOString() }).select().single()
      if (draftError) throw new Error('Your draft could not be saved. Please retry; your changes are still here.')
      setDrafts((current) => [data, ...current.filter((draft) => draft.id !== data.id)])
      setSuccessMessage('Draft saved. You can return to it from Saved drafts.')
      return true
    } catch (draftError) { setError(draftError.message); return false }
    finally { setIsDraftSaving(false) }
  }

  async function startNewItem() {
    if ((listingTitle || listingPhotos.length || listingDescription || listingPrice || listingMaterials || listingVariants || listingWeight || listingProcessingTime) && !(await saveListingDraft())) return
    setDraftId(crypto.randomUUID())
    setListingTitle('')
    setListingDescription('')
    setListingPhotos([])
    setListingPrice('')
    setListingQuantity('1')
    setListingProcessingTime('')
    setListingWeight('')
    setListingRequiresShipping(true)
    setListingFreeShipping(false)
    setListingPackageLength('')
    setListingPackageWidth('')
    setListingPackageHeight('')
    resetListingForMarket(booth.market_type)
    setReviewed(false)
    setActiveTab('list')
    setSuccessMessage('Start your next item. Your saved drafts are in Listed Items.')
  }

  async function resumeDraft(draft) {
    if (draft.id !== draftId && (listingTitle || listingPhotos.length || listingDescription || listingPrice || listingMaterials || listingVariants || listingWeight || listingProcessingTime) && !(await saveListingDraft())) return
    const { payload } = draft
    setListingTitle(payload.listingTitle ?? '')
    setListingCategory(payload.listingCategory ?? '')
    setListingDescription(payload.listingDescription ?? '')
    setListingPrice(payload.listingPrice ?? '')
    setListingQuantity(payload.listingQuantity ?? '1')
    setListingProcessingTime(payload.listingProcessingTime ?? '')
    setListingMaterials(payload.listingMaterials ?? '')
    setListingVariants(payload.listingVariants ?? '')
    setListingAttributes(payload.listingAttributes ?? {})
    setListingRequiresShipping(payload.listingRequiresShipping ?? true)
    setListingFreeShipping(payload.listingFreeShipping ?? false)
    setListingWeight(payload.listingWeight ?? '')
    setListingPackageLength(payload.listingPackageLength ?? '')
    setListingPackageWidth(payload.listingPackageWidth ?? '')
    setListingPackageHeight(payload.listingPackageHeight ?? '')
    setListingPhotos((payload.photos || []).map((url) => ({ id: crypto.randomUUID(), url })))
    setListingStep(payload.listingStep || 0)
    setDraftId(draft.id)
    setReviewed(false)
    setError('')
    setSuccessMessage('Draft opened.')
    setActiveTab('list')
  }

  async function handleListingImageChange(event) {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    if (listingPhotos.length + files.length > 10) { setError('Choose up to 10 photos per item.'); return }
    if (files.some((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10485760)) {
      setError('Use JPG, PNG, or WebP photos, up to 10 MB each.'); return
    }
    setIsDraftSaving(true)
    try {
      const photos = await Promise.all(files.map((file) => new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve({ id: crypto.randomUUID(), file, preview: reader.result })
        reader.onerror = () => reject(new Error('Photo could not be read. Please try again.'))
        reader.readAsDataURL(file)
      })))
      setListingPhotos((current) => [...current, ...photos])
      setError('')
    } catch (photoError) { setError(photoError.message) }
    finally { setIsDraftSaving(false) }
  }

  function movePhoto(index, delta) {
    setReviewed(false)
    setListingPhotos((current) => {
      const next = [...current]
      ;[next[index], next[index + delta]] = [next[index + delta], next[index]]
      return next
    })
  }

  function handleCategoryChange(nextCategory) {
    setListingCategory(nextCategory)
    setListingAttributes({})
  }

  function handleBoothMarketChange(nextMarketType) {
    setBooth((currentBooth) =>
      currentBooth ? { ...currentBooth, market_type: nextMarketType } : currentBooth,
    )
    resetListingForMarket(nextMarketType)
    setSuccessMessage('')
    setError('')
  }

  function updateListingAttribute(key, value) {
    setListingAttributes((currentAttributes) => ({
      ...currentAttributes,
      [key]: value,
    }))
  }

  function updateShippingSetting(key, value) {
    setShippingSettings((currentSettings) => ({
      ...currentSettings,
      [key]: value,
    }))
  }

  function updateNewPackageValue(key, value) {
    setNewPackage((currentPackage) => ({
      ...currentPackage,
      [key]: value,
    }))
  }

  async function saveShippingSettings(event) {
    event.preventDefault()
    setError('')
    setSuccessMessage('')

    if (!shippingSchemaReady) {
      setError(shippingSchemaSetupMessage)
      return
    }

    const payload = {
      booth_id: booth.id,
      ...shippingSettings,
      ship_from_country: shippingSettings.ship_from_country || 'US',
      updated_at: new Date().toISOString(),
    }

    const { data, error: shippingError } = await supabase
      .from('seller_shipping_settings')
      .upsert(payload, { onConflict: 'booth_id' })
      .select('*')
      .single()

    if (shippingError) {
      setError(getFriendlyError('save shipping settings'))
      return
    }

    setShippingSettings({
      ship_from_city: data.ship_from_city ?? '',
      ship_from_country: data.ship_from_country ?? 'US',
      ship_from_name: data.ship_from_name ?? '',
      ship_from_phone: data.ship_from_phone ?? '',
      ship_from_state: data.ship_from_state ?? '',
      ship_from_street1: data.ship_from_street1 ?? '',
      ship_from_street2: data.ship_from_street2 ?? '',
      ship_from_zip: data.ship_from_zip ?? '',
    })
    setSuccessMessage('Shipping settings saved.')
  }

  async function addSellerPackage(event) {
    event.preventDefault()
    setError('')
    setSuccessMessage('')

    if (!shippingSchemaReady) {
      setError(shippingSchemaSetupMessage)
      return
    }

    if (!newPackage.name.trim() || !Number(newPackage.length) || !Number(newPackage.width) || !Number(newPackage.height)) {
      setError('Add a package name and dimensions.')
      return
    }

    const { data, error: packageError } = await supabase
      .from('seller_packages')
      .insert({
        booth_id: booth.id,
        name: newPackage.name.trim(),
        length: Number(newPackage.length),
        width: Number(newPackage.width),
        height: Number(newPackage.height),
        empty_weight: Number(newPackage.empty_weight) || 0,
        dimension_unit: 'in',
        weight_unit: 'oz',
        is_default: sellerPackages.length === 0,
      })
      .select('*')
      .single()

    if (packageError) {
      setError(getFriendlyError('save this package'))
      return
    }

    setSellerPackages((currentPackages) => [data, ...currentPackages])
    setNewPackage({ empty_weight: '0', height: '', length: '', name: '', width: '' })
    setSuccessMessage('Package saved.')
  }

  async function setDefaultPackage(packageId) {
    setError('')
    setSuccessMessage('')

    if (!shippingSchemaReady) {
      setError(shippingSchemaSetupMessage)
      return
    }

    await supabase
      .from('seller_packages')
      .update({ is_default: false })
      .eq('booth_id', booth.id)

    const { data, error: packageError } = await supabase
      .from('seller_packages')
      .update({ is_default: true })
      .eq('id', packageId)
      .eq('booth_id', booth.id)
      .select('*')
      .single()

    if (packageError) {
      setError(getFriendlyError('set the default package'))
      return
    }

    await supabase
      .from('seller_shipping_settings')
      .upsert({ booth_id: booth.id, default_package_id: packageId }, { onConflict: 'booth_id' })

    setSellerPackages((currentPackages) =>
      currentPackages.map((sellerPackage) => ({
        ...sellerPackage,
        is_default: sellerPackage.id === data.id,
      })),
    )
    setSuccessMessage('Default package updated.')
  }

  async function deleteSellerPackage(packageId) {
    setError('')
    setSuccessMessage('')

    if (!shippingSchemaReady) {
      setError(shippingSchemaSetupMessage)
      return
    }

    const { error: packageError } = await supabase
      .from('seller_packages')
      .delete()
      .eq('id', packageId)
      .eq('booth_id', booth.id)

    if (packageError) {
      setError(getFriendlyError('delete this package'))
      return
    }

    setSellerPackages((currentPackages) =>
      currentPackages.filter((sellerPackage) => sellerPackage.id !== packageId),
    )
    setSuccessMessage('Package deleted.')
  }

  function goToNextListingStep() {
    setError('')
    setListingStep((currentStep) => Math.min(listingSteps.length - 1, currentStep + 1))
  }

  function goToPreviousListingStep() {
    setError('')
    setListingStep((currentStep) => Math.max(0, currentStep - 1))
  }

  const stepComplete = listingProgress({ photos: listingPhotos, title: listingTitle, category: listingCategory, description: listingDescription, price: listingPrice, quantity: listingQuantity, requiresShipping: listingRequiresShipping, weight: listingWeight, reviewed })

  const activeCategoryDetails = getCategoryDetails(listingCategory)
  const sellerCategories = getCategoriesForMarket(booth?.market_type)
  const sellerMarket = getMarketSection(booth?.market_type)
  const isJumbleBooth = booth?.market_type === 'jumble'
  const sellerReadinessItems = [
    { label: 'Booth profile', ready: Boolean(boothName && city && stateName) },
    { label: 'Booth photo', ready: Boolean(thumbnailUrl) },
    { label: 'Listed items', ready: listings.length > 0 },
    { label: 'Stripe Connect', ready: Boolean(booth?.stripe_charges_enabled) },
  ]
  const stripeRequirements = booth?.stripe_requirements?.currently_due ?? []
  const stripeConnectReady = Boolean(booth?.stripe_charges_enabled)
  const sellerStatsByListingId = new Map((sellerStats?.listings ?? []).map((listing) => [listing.id, listing]))
  const estimatedShippingCost = listingWeight ? Math.max(4.5, 3.95 + Number(listingWeight) * 0.18) : 0
  const suggestedFreeShippingPrice =
    listingPrice && estimatedShippingCost
      ? (Number(listingPrice) + estimatedShippingCost).toFixed(2)
      : ''

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
    <div className="page-stack seller-dashboard-stack">
      <section className="page-intro">
        <p className="eyebrow">Seller dashboard</p>
        <h1>{activeTab === 'list' ? 'Let’s list your item.' : 'Your booth table is ready.'}</h1>
        <p>
          {activeTab === 'list' ? 'Add your photos, fill in the details, and publish when you are ready.' : `Welcome ${profile?.display_name ?? 'seller'}. Manage your booth and items here.`}
        </p>
      </section>

      {activeTab !== 'list' && <section className="seller-pro-panel" aria-label="Seller Pro setup">
        <div>
          <p className="eyebrow">Seller Pro</p>
          <h2>Booth readiness</h2>
          <p>
            {sellerMarket.title} booth. Keep these pieces tidy before checkout goes live.
            Stripe Connect handles seller identity, tax details, bank setup, and payouts.
          </p>
        </div>
        <div className="seller-readiness-grid">
          {sellerReadinessItems.map((item) => (
            <span className={item.ready ? 'readiness-pill readiness-pill-ready' : 'readiness-pill'} key={item.label}>
              {item.ready ? 'Ready' : 'Next'}: {item.label}
            </span>
          ))}
        </div>
        <div className="stripe-connect-card">
          <div>
            <CreditCard aria-hidden="true" size={24} />
            <span>
              <strong>{stripeConnectReady ? 'Payouts ready' : 'Set up seller payouts'}</strong>
              <small>
                {stripeConnectReady
                  ? 'This booth can be included in Stripe checkout.'
                  : 'Stripe Express will collect payout and tax details from the seller.'}
              </small>
            </span>
          </div>
          {stripeRequirements.length > 0 && (
            <p className="helper-note">
              Stripe still needs: {stripeRequirements.slice(0, 3).join(', ')}
              {stripeRequirements.length > 3 ? ', and more' : ''}.
            </p>
          )}
          {searchParams.get('stripe') === 'success' && (
            <p className="form-success">Stripe sent you back to Krafzee. Refresh payout status to confirm the booth is ready.</p>
          )}
          {searchParams.get('stripe') === 'refresh' && (
            <p className="helper-note">Stripe needs this seller to continue payout setup. Open onboarding again or refresh status after finishing.</p>
          )}
          {stripeError && <p className="form-error">{stripeError}</p>}
          {stripeMessage && <p className="form-success">{stripeMessage}</p>}
          <div className="stripe-connect-actions">
            <button
              className="button button-primary"
              disabled={isStripeLoading}
              onClick={handleStartStripeOnboarding}
              type="button"
            >
              {isStripeLoading ? 'Opening Stripe...' : stripeConnectReady ? 'Manage payouts' : 'Set up payouts'}
            </button>
            {booth?.stripe_account_id && (
              <button
                className="button button-secondary"
                disabled={isStripeLoading}
                onClick={refreshStripeStatus}
                type="button"
              >
                <RefreshCw aria-hidden="true" size={17} />
                Refresh status
              </button>
            )}
          </div>
        </div>
      </section>}

      {activeTab === 'booth' && (
      <section className="onboarding-card seller-manage-card">
        <p className="eyebrow">Manage {sellerMarket.title}</p>
        <h2>Update your booth card</h2>

        <form className="auth-form booth-onboarding-form" onSubmit={handleSave}>
          <aside className="required-field-guide" aria-label="Required booth fields"><strong>Required booth details</strong><ul><li>Market lane</li><li>Booth name</li><li>City and state</li></ul></aside>
          <fieldset className="market-choice-fieldset">
            <legend>Booth market lane</legend>
            <label className="market-choice-card">
              <input
                checked={!isJumbleBooth}
                onChange={() => handleBoothMarketChange('handmade')}
                type="radio"
              />
              <span>
                <strong>Shop Handcrafted</strong>
                <small>Use this for maker-made clothing, soaps, candles, woodwork, jewelry, art, and original goods.</small>
              </span>
            </label>
            <label className="market-choice-card">
              <input
                checked={isJumbleBooth}
                onChange={() => handleBoothMarketChange('jumble')}
                type="radio"
              />
              <span>
                <strong>Jumble Market</strong>
                <small>Use this for resale finds, vintage goods, supplies, tools, books, collectibles, and table items.</small>
              </span>
            </label>
            <small>
              Save booth details after changing lanes. New listings will use the selected lane.
            </small>
          </fieldset>

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
              <span className="field-label-row">Booth name <span className="required-badge">Required</span></span>
              <input
                onChange={(event) => setBoothName(event.target.value)}
                required
                type="text"
                value={boothName}
              />
            </label>
            <label>
              <span className="field-label-row">City <span className="required-badge">Required</span></span>
              <input
                onChange={(event) => setCity(event.target.value)}
                required
                type="text"
                value={city}
              />
            </label>
            <label>
              <span className="field-label-row">State <span className="required-badge">Required</span></span>
              <input
                onChange={(event) => setStateName(event.target.value)}
                required
                type="text"
                value={stateName}
              />
            </label>
          </div>

          <label>
            <span className="field-label-row">Booth description <span className="optional-badge">Optional</span></span>
            <textarea
              onChange={(event) => setBoothDescription(event.target.value)}
              rows="4"
              value={boothDescription}
            />
          </label>

          <label>
            <span className="field-label-row">Seller bio <span className="optional-badge">Optional</span></span>
            <textarea
              onChange={(event) => setSellerBio(event.target.value)}
              rows="4"
              value={sellerBio}
            />
          </label>

          <article className="market-choice-card market-choice-static">
            <span>
            <strong>{sellerMarket.title}</strong>
            <small>{sellerMarket.description}</small>
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

      {activeTab === 'items' && drafts.length > 0 && <section className="onboarding-card">
        <h2>Saved drafts</h2><p>Only you can see these unfinished items.</p><button type="button" className="button button-secondary" disabled={isDraftSaving || isListingSaving} onClick={startNewItem}>New item</button>
        {drafts.map((draft) => <div className="draft-row" key={draft.id}><span>{draft.payload.listingTitle || 'Untitled item'}</span>
          <button className="button button-secondary" type="button" disabled={isDraftSaving || isListingSaving} onClick={() => resumeDraft(draft)}>Resume draft</button></div>)}
      </section>}
      {activeTab === 'list' && (
      <section className="onboarding-card seller-manage-card">
        <p className="eyebrow">List items</p>
        <h2>Add an item to your booth table</h2>
        <p className="helper-note">
          Listing in {sellerMarket.title}. Complete the checklist below; green checks show which steps are ready.
        </p>

        <form className="auth-form booth-onboarding-form" noValidate onChange={(event) => { if (event.target.name !== 'reviewed') setReviewed(false) }} onSubmit={handleCreateListing} ref={listingFormRef}>
          <fieldset className="listing-editor-fields" disabled={isListingSaving || isDraftSaving}>
          <div className="listing-stepper" aria-label="Listing checklist">
            {listingSteps.map((step, index) => <button type="button" onClick={() => setListingStep(index)}
              className={`listing-step ${index === listingStep ? 'listing-step-active' : ''} ${stepComplete[index] ? 'listing-step-complete' : ''}`}
              aria-current={index === listingStep ? 'step' : undefined} key={step}>
              {stepComplete[index] ? <CheckCircle2 aria-label="Complete" size={20} /> : <span className="listing-step-number">{index + 1}</span>}{step}
            </button>)}
          </div>
          <p className="helper-note" aria-live="polite">{stepComplete.filter(Boolean).length} of 5 steps complete. You can save a draft at any time.</p>
          {listingStep === 0 && <div className="listing-slide">
            <label>Add photos (up to 10)<input type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={handleListingImageChange} /></label>
            <small>JPG, PNG, or WebP, up to 10 MB each. The first photo is your cover.</small>
            <div className="photo-editor">{listingPhotos.map((photo, index) => <figure key={photo.id}>
              <img src={photo.url || photo.preview} alt={`Item photo ${index + 1}`} />
              <figcaption>{index === 0 ? 'Cover photo' : `Photo ${index + 1}`}</figcaption>
              <div><button type="button" disabled={index === 0} aria-label={`Move photo ${index + 1} earlier`} onClick={() => movePhoto(index, -1)}>←</button>
              <button type="button" disabled={index === listingPhotos.length - 1} aria-label={`Move photo ${index + 1} later`} onClick={() => movePhoto(index, 1)}>→</button>
              <button type="button" onClick={() => { setReviewed(false); setListingPhotos((current) => current.filter((entry) => entry.id !== photo.id)) }}>Remove</button></div>
            </figure>)}</div>
          </div>}
          {listingStep === 1 && (
            <div className="listing-slide">
                <label>
                  <span className="field-label-row">Item title <span className="required-badge">Required</span></span>
                  <input
                    onChange={(event) => setListingTitle(event.target.value)}
                    placeholder={isJumbleBooth ? 'Example: Vintage Pyrex mixing bowl' : 'Example: Hand-poured soy candle'}
                    required
                    type="text"
                    value={listingTitle}
                  />
                </label>
                <label>
                  <span className="field-label-row">Category <span className="required-badge">Required</span></span>
                  <select
                    onChange={(event) => handleCategoryChange(event.target.value)}
                    required
                    value={listingCategory}
                  >
                    {sellerCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>
              <label>
                <span className="field-label-row">Item description <span className="required-badge">Required</span></span>
                <textarea
                  onChange={(event) => setListingDescription(event.target.value)}
                  placeholder={isJumbleBooth ? 'Tell shoppers what it is, condition, what is included, pickup notes, and any flaws.' : 'Tell shoppers what it is, how it is made, sizing, materials, or care notes.'}
                  required
                  rows="4"
                  value={listingDescription}
                />
              </label>
<details><summary>More details (optional)</summary>
              <div className="section-heading">
                <p className="eyebrow">{listingCategory}</p>
                <h3>{activeCategoryDetails.itemType} details</h3>
                <p className="helper-note">
                  These fields change by category so shoppers see the details they expect.
                </p>
              </div>
              <div className="form-grid form-grid-two">
                {activeCategoryDetails.fields.map((field) => (
                  <label key={field.key}>
                    {field.label}
                    {field.type === 'select' ? (
                      <select
                        onChange={(event) => updateListingAttribute(field.key, event.target.value)}
                        value={listingAttributes[field.key] ?? ''}
                      >
                        <option value="">Select one</option>
                        {field.options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        onChange={(event) => updateListingAttribute(field.key, event.target.value)}
                        placeholder={field.placeholder}
                        type="text"
                        value={listingAttributes[field.key] ?? ''}
                      />
                    )}
                  </label>
                ))}
              </div>
              <label>
                Materials
                <input
                  onChange={(event) => setListingMaterials(event.target.value)}
                  placeholder={isJumbleBooth ? 'Example: glass, metal, mixed craft supplies' : 'Example: soy wax, cotton wick, glass jar'}
                  type="text"
                  value={listingMaterials}
                />
              </label>
              <small>
                {isJumbleBooth ? 'Separate materials, included pieces, or lot notes with commas.' : 'Separate multiple materials with commas.'}
              </small>
</details>
            </div>
          )}

          {listingStep === 2 && (
            <div className="listing-slide">
              <div className="form-grid">
                <label>
                  <span className="field-label-row">Price <span className="required-badge">Required</span></span>
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
                  <span className="field-label-row">Quantity available <span className="required-badge">Required</span></span>
                  <input
                    min="0"
                    onChange={(event) => setListingQuantity(event.target.value)}
                    required
                    step="1"
                    type="number"
                    value={listingQuantity}
                  />
                </label>
                <label>
                  <span className="field-label-row">Processing time <span className="optional-badge">Optional</span></span>
                  <input
                    onChange={(event) => setListingProcessingTime(event.target.value)}
                    placeholder={isJumbleBooth ? 'Example: ready for pickup this week' : 'Example: ready in 3 business days'}
                    type="text"
                    value={listingProcessingTime}
                  />
                </label>
              </div>
              <label>
                {activeCategoryDetails.optionLabel || 'Options or variants'}
                <input
                  onChange={(event) => setListingVariants(event.target.value)}
                  placeholder={activeCategoryDetails.optionPlaceholder || 'Example: small, medium, large'}
                  type="text"
                  value={listingVariants}
                />
              </label>
              <small>Separate sizes, colors, scents, or options with commas.</small>


            </div>
          )}

          {listingStep === 3 && <div className="listing-slide">              <section className="shipping-editor-panel">
                <h3>Shipping</h3>
                <label className="checkbox-row">
                  <input
                    checked={listingRequiresShipping}
                    onChange={(event) => {
                      setListingRequiresShipping(event.target.checked)
                      if (!event.target.checked) {
                        setListingFreeShipping(false)
                      }
                    }}
                    type="checkbox"
                  />
                  This item ships to the buyer
                </label>
                {listingRequiresShipping && (
                  <>
                    <fieldset className="shipping-method-options">
                      <legend>Shipping Method</legend>
                      <label>
                        <input
                          checked={!listingFreeShipping}
                          onChange={() => setListingFreeShipping(false)}
                          type="radio"
                        />
                        Buyer pays calculated shipping
                      </label>
                      <label>
                        <input
                          checked={listingFreeShipping}
                          onChange={() => setListingFreeShipping(true)}
                          type="radio"
                        />
                        Free shipping
                      </label>
                    </fieldset>
                    {listingFreeShipping && (
                      <article className="helper-panel">
                        <p>
                          Free shipping can make listings more attractive to buyers. Shipping costs will be deducted from your proceeds, so consider including estimated shipping costs in your item price.
                        </p>
                        {suggestedFreeShippingPrice && (
                          <div className="suggested-price-row">
                            <span>Suggested price with shipping included</span>
                            <strong>{`$${suggestedFreeShippingPrice}`}</strong>
                            <button
                              className="button button-secondary"
                              onClick={() => { setReviewed(false); setListingPrice(suggestedFreeShippingPrice) }}
                              type="button"
                            >
                              Use Suggested Price
                            </button>
                          </div>
                        )}
                      </article>
                    )}
                    <div className="form-grid form-grid-two">
                      <label>
                        Weight
                        <input
                          min="0"
                          onChange={(event) => setListingWeight(event.target.value)}
                          placeholder="8"
                          step="0.1"
                          type="number"
                          value={listingWeight}
                        />
                      </label>
                      <label>
                        Package size
                        <span className="inline-input-row">
                          <input
                            min="0"
                            onChange={(event) => setListingPackageLength(event.target.value)}
                            placeholder="L"
                            step="0.1"
                            type="number"
                            value={listingPackageLength}
                          />
                          <input
                            min="0"
                            onChange={(event) => setListingPackageWidth(event.target.value)}
                            placeholder="W"
                            step="0.1"
                            type="number"
                            value={listingPackageWidth}
                          />
                          <input
                            min="0"
                            onChange={(event) => setListingPackageHeight(event.target.value)}
                            placeholder="H"
                            step="0.1"
                            type="number"
                            value={listingPackageHeight}
                          />
                        </span>
                      </label>
                    </div>
                  </>
                )}
              </section><p className="helper-note">Turn shipping off for local pickup.</p></div>}

          {listingStep === 4 && (
            <div className="listing-slide listing-review">
              <div className="photo-editor">{listingPhotos.map((photo) => <img key={photo.id} src={photo.url || photo.preview} alt="Listing preview" />)}</div>
              <label className="checkbox-row"><input type="checkbox" name="reviewed" checked={reviewed} onChange={(event) => setReviewed(event.target.checked)} />I have reviewed this item and it is ready to publish.</label>
              <article className="listing-review-card">
                <p className="eyebrow">{listingCategory}</p>
                <h3>{listingTitle || 'Untitled item'}</h3>
                <p>{listingDescription || 'No description added yet.'}</p>
                <p>{listingRequiresShipping ? (listingFreeShipping ? 'Free shipping' : 'Buyer pays calculated shipping') : 'Local pickup'}</p>
                <dl className="listing-meta">
                  <div>
                    <dt>Price</dt>
                    <dd>{listingPrice ? `$${Number(listingPrice).toFixed(2)}` : 'Not posted'}</dd>
                  </div>
                  <div>
                    <dt>Quantity</dt>
                    <dd>{listingQuantity || '1'}</dd>
                  </div>
                  <div>
                    <dt>Processing</dt>
                    <dd>{listingProcessingTime || 'Not posted'}</dd>
                  </div>
                </dl>
                {formatListingAttributes(listingAttributes).length > 0 && (
                  <div className="attribute-chip-list">
                    {formatListingAttributes(listingAttributes).map((attribute) => (
                      <span className="attribute-chip" key={attribute.key}>
                        {attribute.label}: {attribute.value}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            </div>
          )}

          {error && <p className="form-error">{error}</p>}
          {successMessage && <p className="form-success">{successMessage}</p>}

          <div className="listing-step-actions">
            <button className="button button-secondary" type="button" onClick={saveListingDraft}>{isDraftSaving ? 'Saving draft…' : 'Save as draft'}</button>
            <button
              className="button button-secondary"
              disabled={listingStep === 0 || isListingSaving}
              onClick={goToPreviousListingStep}
              type="button"
            >
              <ChevronLeft aria-hidden="true" size={18} />
              Back
            </button>
            {listingStep < listingSteps.length - 1 && (
              <button
                className="button button-secondary"
                disabled={isListingSaving}
                onClick={goToNextListingStep}
                type="button"
              >
                Next
                <ChevronRight aria-hidden="true" size={18} />
              </button>
            )}
            {listingStep === listingSteps.length - 1 && (
              <button className="button button-primary" disabled={isListingSaving} type="submit">
                {isListingSaving ? 'Publishing...' : 'Publish item'}
              </button>
            )}
          </div>

          </fieldset>
        </form>
      </section>
      )}

      {activeTab === 'items' && (
      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Your table</p>
          <h2>Listed items</h2>
          {!stripeConnectReady && (
            <p className="helper-note">
              Shoppers can browse these items, but checkout stays locked until Stripe Connect payouts are ready for this booth.
            </p>
          )}
        </div>

        {sellerStats && (
          <div className="seller-stats-grid">
            <article>
              <span>Booth views</span>
              <strong>{sellerStats.totals.boothViews}</strong>
            </article>
            <article>
              <span>Item views</span>
              <strong>{sellerStats.totals.listingViews}</strong>
            </article>
            <article>
              <span>Listed items</span>
              <strong>{sellerStats.totals.listings}</strong>
            </article>
            <article>
              <span>Booth status</span>
              <strong>{sellerStats.booth?.is_verified ? 'Verified' : 'Reviewing'}</strong>
            </article>
          </div>
        )}

        {listings.length === 0 ? (
          <article className="state-card">
            <h3>No items listed yet</h3>
            <p>
              {isJumbleBooth
                ? 'Add your first jumble find so shoppers can browse your resale table.'
                : 'Add your first handcrafted good so shoppers have something to pick up from the table.'}
            </p>
          </article>
        ) : (
          <div className="seller-listing-grid">
            {listings.map((listing) => {
              const isEditingListing = editingListingId === listing.id
              const editCategoryDetails = getCategoryDetails(
                editingListingValues.category || listing.category,
              )

              return (
                <article className="seller-listing-card" key={listing.id}>
                  {listing.image_url ? (
                    <img src={listing.image_url} alt="" className="seller-listing-image" />
                  ) : (
                    <span className="seller-listing-image">{listing.category || 'Item'}</span>
                  )}
                  <div>
                    {isEditingListing ? (
                      <div className="seller-listing-edit-form">
                        <div className="form-grid form-grid-two">
                          <label>
                            <span className="field-label-row">Item title <span className="required-badge">Required</span></span>
                            <input
                              onChange={(event) => updateEditingListingValue('title', event.target.value)}
                              type="text"
                              value={editingListingValues.title ?? ''}
                            />
                          </label>
                          <label>
                            <span className="field-label-row">Category <span className="required-badge">Required</span></span>
                            <select
                              onChange={(event) => {
                                updateEditingListingValue('category', event.target.value)
                                updateEditingListingValue('attributes', {})
                              }}
                              value={editingListingValues.category ?? ''}
                            >
                              {sellerCategories.map((category) => (
                                <option key={category} value={category}>
                                  {category}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            <span className="field-label-row">Price <span className="optional-badge">Optional</span></span>
                            <input
                              min="0"
                              onChange={(event) => updateEditingListingValue('price', event.target.value)}
                              step="0.01"
                              type="number"
                              value={editingListingValues.price ?? ''}
                            />
                          </label>
                          <label>
                            Quantity
                            <input
                              min="0"
                              onChange={(event) => updateEditingListingValue('quantity', event.target.value)}
                              step="1"
                              type="number"
                              value={editingListingValues.quantity ?? 1}
                            />
                          </label>
                        </div>
                        <label>
                          <span className="field-label-row">Item description <span className="required-badge">Required</span></span>
                          <textarea
                            onChange={(event) => updateEditingListingValue('description', event.target.value)}
                            rows="3"
                            value={editingListingValues.description ?? ''}
                          />
                        </label>
                        <div className="form-grid form-grid-two">
                          {editCategoryDetails.fields.map((field) => (
                            <label key={field.key}>
                              {field.label}
                              {field.type === 'select' ? (
                                <select
                                  onChange={(event) => updateEditingListingAttribute(field.key, event.target.value)}
                                  value={editingListingValues.attributes?.[field.key] ?? ''}
                                >
                                  <option value="">Select one</option>
                                  {field.options.map((option) => (
                                    <option key={option} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  onChange={(event) => updateEditingListingAttribute(field.key, event.target.value)}
                                  placeholder={field.placeholder}
                                  type="text"
                                  value={editingListingValues.attributes?.[field.key] ?? ''}
                                />
                              )}
                            </label>
                          ))}
                        </div>
                        <div className="form-grid form-grid-two">
                          <label>
                            Materials
                            <input
                              onChange={(event) => updateEditingListingValue('materials', event.target.value)}
                              placeholder="Separate with commas"
                              type="text"
                              value={editingListingValues.materials ?? ''}
                            />
                          </label>
                          <label>
                            {editCategoryDetails.optionLabel || 'Options or variants'}
                            <input
                              onChange={(event) => updateEditingListingValue('variants', event.target.value)}
                              placeholder={editCategoryDetails.optionPlaceholder}
                              type="text"
                              value={editingListingValues.variants ?? ''}
                            />
                          </label>
                        </div>
                        <label>
                          <span className="field-label-row">Processing time <span className="optional-badge">Optional</span></span>
                          <input
                            onChange={(event) => updateEditingListingValue('processing_time', event.target.value)}
                            type="text"
                            value={editingListingValues.processing_time ?? ''}
                          />
                        </label>
                        <section className="shipping-editor-panel">
                          <h3>Shipping</h3>
                          <label className="checkbox-row">
                            <input
                              checked={editingListingValues.requires_shipping !== false}
                              onChange={(event) =>
                                updateEditingListingValue('requires_shipping', event.target.checked)
                              }
                              type="checkbox"
                            />
                            This item ships to the buyer
                          </label>
                          {editingListingValues.requires_shipping !== false && (
                            <>
                              <fieldset className="shipping-method-options">
                                <legend>Shipping Method</legend>
                                <label>
                                  <input
                                    checked={!editingListingValues.free_shipping}
                                    onChange={() => updateEditingListingValue('free_shipping', false)}
                                    type="radio"
                                  />
                                  Buyer pays calculated shipping
                                </label>
                                <label>
                                  <input
                                    checked={Boolean(editingListingValues.free_shipping)}
                                    onChange={() => updateEditingListingValue('free_shipping', true)}
                                    type="radio"
                                  />
                                  Free shipping
                                </label>
                              </fieldset>
                              <div className="form-grid form-grid-two">
                                <label>
                                  Weight
                                  <input
                                    min="0"
                                    onChange={(event) => updateEditingListingValue('weight', event.target.value)}
                                    step="0.1"
                                    type="number"
                                    value={editingListingValues.weight ?? ''}
                                  />
                                </label>
                                <label>
                                  Package size
                                  <span className="inline-input-row">
                                    <input
                                      min="0"
                                      onChange={(event) => updateEditingListingValue('package_length', event.target.value)}
                                      placeholder="L"
                                      step="0.1"
                                      type="number"
                                      value={editingListingValues.package_length ?? ''}
                                    />
                                    <input
                                      min="0"
                                      onChange={(event) => updateEditingListingValue('package_width', event.target.value)}
                                      placeholder="W"
                                      step="0.1"
                                      type="number"
                                      value={editingListingValues.package_width ?? ''}
                                    />
                                    <input
                                      min="0"
                                      onChange={(event) => updateEditingListingValue('package_height', event.target.value)}
                                      placeholder="H"
                                      step="0.1"
                                      type="number"
                                      value={editingListingValues.package_height ?? ''}
                                    />
                                  </span>
                                </label>
                              </div>
                            </>
                          )}
                        </section>
                        <div className="seller-listing-actions">
                          <button
                            className="button button-primary"
                            disabled={isListingUpdating}
                            onClick={() => saveListingEdits(listing)}
                            type="button"
                          >
                            <Save aria-hidden="true" size={17} />
                            {isListingUpdating ? 'Saving...' : 'Save changes'}
                          </button>
                          <button
                            className="button button-secondary"
                            disabled={isListingUpdating}
                            onClick={cancelEditingListing}
                            type="button"
                          >
                            <X aria-hidden="true" size={17} />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="seller-listing-header">
                          <h3>{listing.title}</h3>
                          <div className="seller-listing-actions">
                            <button
                              className="button button-secondary"
                              disabled={isListingUpdating}
                              onClick={() => startEditingListing(listing)}
                              type="button"
                            >
                              <Pencil aria-hidden="true" size={17} />
                              Edit
                            </button>
                            <button
                              className="button button-secondary seller-danger-button"
                              disabled={isListingUpdating}
                              onClick={() => deleteListing(listing)}
                              type="button"
                            >
                              <Trash2 aria-hidden="true" size={17} />
                              Delete
                            </button>
                          </div>
                        </div>
                        <p>{listing.description}</p>
                        <div className="seller-listing-insights">
                          <span>{sellerStatsByListingId.get(listing.id)?.view_count ?? listing.view_count ?? 0} views</span>
                          <span>{listing.is_verified ? 'Verified' : 'Reviewing'}</span>
                          {listing.is_hidden && <span>Hidden by admin</span>}
                        </div>
                        <dl className="listing-meta">
                          <div>
                            <dt>Price</dt>
                            <dd>{listing.price ? `$${Number(listing.price).toFixed(2)}` : 'Not posted'}</dd>
                          </div>
                          <div>
                            <dt>Category</dt>
                            <dd>{listing.category || 'Original goods'}</dd>
                          </div>
                          <div>
                            <dt>Quantity</dt>
                            <dd>{listing.quantity ?? 1}</dd>
                          </div>
                          <div>
                            <dt>Shipping</dt>
                            <dd>
                              {listing.requires_shipping === false
                                ? 'No shipping'
                                : listing.free_shipping
                                  ? 'Free shipping'
                                  : 'Buyer paid'}
                            </dd>
                          </div>
                        </dl>
                        {formatListingAttributes(listing.attributes).length > 0 && (
                          <div className="attribute-chip-list">
                            {formatListingAttributes(listing.attributes).slice(0, 4).map((attribute) => (
                              <span className="attribute-chip" key={attribute.key}>
                                {attribute.label}: {attribute.value}
                              </span>
                            ))}
                          </div>
                        )}
                        <Link to={`/listing/${listing.id}`}>View listing</Link>
                      </>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
      )}

      {activeTab === 'shipping' && (
      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Shipping</p>
          <h2>Ship-from address and packages</h2>
          {!shippingSchemaReady && <p className="form-error">{shippingSchemaSetupMessage}</p>}
        </div>
        <div className="shipping-dashboard-grid">
          <form className="onboarding-card seller-manage-card auth-form" onSubmit={saveShippingSettings}>
            <h3>Ship From Address</h3>
            <div className="form-grid form-grid-two">
              <label>
                Name or business
                <input
                  onChange={(event) => updateShippingSetting('ship_from_name', event.target.value)}
                  required
                  type="text"
                  value={shippingSettings.ship_from_name}
                />
              </label>
              <label>
                Phone
                <input
                  onChange={(event) => updateShippingSetting('ship_from_phone', event.target.value)}
                  type="text"
                  value={shippingSettings.ship_from_phone}
                />
              </label>
              <label>
                Street
                <input
                  onChange={(event) => updateShippingSetting('ship_from_street1', event.target.value)}
                  required
                  type="text"
                  value={shippingSettings.ship_from_street1}
                />
              </label>
              <label>
                Apt or suite
                <input
                  onChange={(event) => updateShippingSetting('ship_from_street2', event.target.value)}
                  type="text"
                  value={shippingSettings.ship_from_street2}
                />
              </label>
              <label>
                <span className="field-label-row">City <span className="required-badge">Required</span></span>
                <input
                  onChange={(event) => updateShippingSetting('ship_from_city', event.target.value)}
                  required
                  type="text"
                  value={shippingSettings.ship_from_city}
                />
              </label>
              <label>
                <span className="field-label-row">State <span className="required-badge">Required</span></span>
                <input
                  onChange={(event) => updateShippingSetting('ship_from_state', event.target.value)}
                  required
                  type="text"
                  value={shippingSettings.ship_from_state}
                />
              </label>
              <label>
                ZIP
                <input
                  onChange={(event) => updateShippingSetting('ship_from_zip', event.target.value)}
                  required
                  type="text"
                  value={shippingSettings.ship_from_zip}
                />
              </label>
              <label>
                Country
                <input
                  onChange={(event) => updateShippingSetting('ship_from_country', event.target.value)}
                  required
                  type="text"
                  value={shippingSettings.ship_from_country}
                />
              </label>
            </div>
            {error && <p className="form-error">{error}</p>}
            {successMessage && <p className="form-success">{successMessage}</p>}
            <button className="button button-primary" disabled={!shippingSchemaReady} type="submit">
              Save shipping
            </button>
          </form>
          <section className="onboarding-card seller-manage-card">
            <h3>Saved Packages</h3>
            <form className="seller-listing-edit-form" onSubmit={addSellerPackage}>
              <div className="form-grid form-grid-two">
                <label>
                  Package name
                  <input
                    onChange={(event) => updateNewPackageValue('name', event.target.value)}
                    placeholder="Small Jewelry Box"
                    type="text"
                    value={newPackage.name}
                  />
                </label>
                <label>
                  Empty weight
                  <input
                    min="0"
                    onChange={(event) => updateNewPackageValue('empty_weight', event.target.value)}
                    step="0.1"
                    type="number"
                    value={newPackage.empty_weight}
                  />
                </label>
                <label>
                  Dimensions
                  <span className="inline-input-row">
                    <input
                      min="0"
                      onChange={(event) => updateNewPackageValue('length', event.target.value)}
                      placeholder="L"
                      step="0.1"
                      type="number"
                      value={newPackage.length}
                    />
                    <input
                      min="0"
                      onChange={(event) => updateNewPackageValue('width', event.target.value)}
                      placeholder="W"
                      step="0.1"
                      type="number"
                      value={newPackage.width}
                    />
                    <input
                      min="0"
                      onChange={(event) => updateNewPackageValue('height', event.target.value)}
                      placeholder="H"
                      step="0.1"
                      type="number"
                      value={newPackage.height}
                    />
                  </span>
                </label>
              </div>
              <button className="button button-primary" disabled={!shippingSchemaReady} type="submit">
                <Package aria-hidden="true" size={17} />
                Save package
              </button>
            </form>
            <div className="seller-package-list">
              {sellerPackages.map((sellerPackage) => (
                <article className="seller-package-card" key={sellerPackage.id}>
                  <div>
                    <strong>{sellerPackage.name}</strong>
                    <p>
                      {sellerPackage.length} x {sellerPackage.width} x {sellerPackage.height} in,{' '}
                      {sellerPackage.empty_weight} oz
                    </p>
                    {sellerPackage.is_default && <span className="attribute-chip">Default</span>}
                  </div>
                  <div className="seller-listing-actions">
                    {!sellerPackage.is_default && (
                      <button
                        className="button button-secondary"
                        onClick={() => setDefaultPackage(sellerPackage.id)}
                        type="button"
                      >
                        Set default
                      </button>
                    )}
                    <button
                      className="button button-secondary seller-danger-button"
                      onClick={() => deleteSellerPackage(sellerPackage.id)}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
              {sellerPackages.length === 0 && (
                <article className="state-card">
                  <h3>No packages saved yet</h3>
                </article>
              )}
            </div>
          </section>
        </div>
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
            disabled={isDraftSaving || isListingSaving}
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

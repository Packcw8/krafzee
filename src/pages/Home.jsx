import { useEffect, useState } from 'react'
import BottomSectionNav from '../components/home/BottomSectionNav.jsx'
import FeaturedBooths from '../components/home/FeaturedBooths.jsx'
import FeaturedProducts from '../components/home/FeaturedProducts.jsx'
import HeroSection from '../components/home/HeroSection.jsx'
import MarketLanes from '../components/home/MarketLanes.jsx'
import SellerCTA from '../components/home/SellerCTA.jsx'
import { listingSelectFields } from '../data/marketplace.js'
import { supabase } from '../lib/supabase.js'

function Home() {
  const [booths, setBooths] = useState([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [listings, setListings] = useState([])

  useEffect(() => {
    let isMounted = true

    async function loadHomepageMarket() {
      setIsLoading(true)
      setError('')

      const [
        { data: boothData, error: boothError },
        { data: listingData, error: listingError },
      ] = await Promise.all([
        supabase
          .from('booths')
          .select('id, name, description, owner_name, bio, location, market_type, thumbnail_url, is_verified, is_hidden, view_count'),
        supabase
          .from('listings')
          .select(listingSelectFields),
      ])

      if (!isMounted) {
        return
      }

      const loadError = boothError || listingError

      if (loadError) {
        setError('We could not load the latest market items right now.')
        setBooths([])
        setListings([])
      } else {
        setBooths((boothData ?? []).filter((booth) => !booth.is_hidden))
        setListings((listingData ?? []).filter((listing) => !listing.is_hidden))
      }

      setIsLoading(false)
    }

    loadHomepageMarket()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="page-stack home-page-stack">
      <HeroSection />
      <MarketLanes />
      <FeaturedProducts
        booths={booths}
        error={error}
        isLoading={isLoading}
        listings={listings}
      />
      <FeaturedBooths
        booths={booths}
        error={error}
        isLoading={isLoading}
        listings={listings}
      />
      <SellerCTA />
      <BottomSectionNav />
    </div>
  )
}

export default Home

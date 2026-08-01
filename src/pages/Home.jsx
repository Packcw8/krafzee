import { useEffect, useState } from 'react'
import BottomSectionNav from '../components/home/BottomSectionNav.jsx'
import CraftCategories from '../components/home/CraftCategories.jsx'
import FeaturedBooths from '../components/home/FeaturedBooths.jsx'
import FeaturedProducts from '../components/home/FeaturedProducts.jsx'
import HeroSection from '../components/home/HeroSection.jsx'
import SellerCTA from '../components/home/SellerCTA.jsx'
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
          .select('id, name, description, owner_name, bio, location, market_type, thumbnail_url'),
        supabase
          .from('listings')
          .select('id, booth_id, title, description, price, image_url, market_type, category'),
      ])

      if (!isMounted) {
        return
      }

      const loadError = boothError || listingError

      if (loadError) {
        setError(loadError.message)
        setBooths([])
        setListings([])
      } else {
        setBooths(boothData ?? [])
        setListings(listingData ?? [])
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
      <FeaturedProducts
        booths={booths}
        error={error}
        isLoading={isLoading}
        listings={listings}
      />
      <CraftCategories />
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

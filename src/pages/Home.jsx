import BottomSectionNav from '../components/home/BottomSectionNav.jsx'
import CraftCategories from '../components/home/CraftCategories.jsx'
import FeaturedBooths from '../components/home/FeaturedBooths.jsx'
import FeaturedProducts from '../components/home/FeaturedProducts.jsx'
import HeroSection from '../components/home/HeroSection.jsx'
import SellerCTA from '../components/home/SellerCTA.jsx'

function Home() {
  return (
    <div className="page-stack home-page-stack">
      <HeroSection />
      <FeaturedProducts />
      <CraftCategories />
      <FeaturedBooths />
      <SellerCTA />
      <BottomSectionNav />
    </div>
  )
}

export default Home

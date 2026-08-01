import { useEffect, useState } from 'react'
import { ArrowUp, Home, Palette, PackagePlus, ShoppingBag, Store } from 'lucide-react'

const sectionItems = [
  { id: 'home', label: 'Home', Icon: Home },
  { id: 'shop', label: 'Shop', Icon: ShoppingBag },
  { id: 'crafts', label: 'Crafts', Icon: Palette },
  { id: 'booths', label: 'Booths', Icon: Store },
  { id: 'sell', label: 'Sell', Icon: PackagePlus },
]

function scrollToSection(id) {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const target = document.getElementById(id)

  if (!target) {
    return
  }

  target.scrollIntoView({
    behavior: prefersReducedMotion ? 'auto' : 'smooth',
    block: 'start',
  })
}

function BottomSectionNav() {
  const [activeSection, setActiveSection] = useState('home')

  useEffect(() => {
    const sections = sectionItems
      .map((item) => document.getElementById(item.id))
      .filter(Boolean)

    if (sections.length === 0) {
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]

        if (visibleEntry?.target.id) {
          setActiveSection(visibleEntry.target.id)
        }
      },
      {
        rootMargin: '-25% 0px -55% 0px',
        threshold: [0.15, 0.35, 0.55],
      },
    )

    sections.forEach((section) => observer.observe(section))

    return () => {
      observer.disconnect()
    }
  }, [])

  return (
    <nav className="home-bottom-nav" aria-label="Homepage section navigation">
      {sectionItems.map(({ Icon, id, label }) => (
        <button
          aria-current={activeSection === id ? 'true' : undefined}
          className={activeSection === id ? 'home-bottom-nav-item home-bottom-nav-active' : 'home-bottom-nav-item'}
          key={id}
          onClick={() => scrollToSection(id)}
          type="button"
        >
          <Icon aria-hidden="true" size={19} strokeWidth={2.4} />
          <span>{label}</span>
        </button>
      ))}
      <button
        className="home-bottom-nav-item home-bottom-nav-top"
        onClick={() => scrollToSection('home')}
        type="button"
      >
        <ArrowUp aria-hidden="true" size={19} strokeWidth={2.4} />
        <span>Top</span>
      </button>
    </nav>
  )
}

export default BottomSectionNav

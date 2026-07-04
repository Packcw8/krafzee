import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ProjectCard from '../components/ProjectCard.jsx'
import { supabase } from '../lib/supabase.js'

function Booth() {
  const { boothId } = useParams()
  const [booth, setBooth] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [listings, setListings] = useState([])
  const [projects, setProjects] = useState([])
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      boothId ?? '',
    )

  useEffect(() => {
    let isMounted = true

    async function loadBooth() {
      if (!isUuid) {
        setError('')
        setBooth(null)
        setListings([])
        setProjects([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError('')

      const [
        { data: boothData, error: boothError },
        { data: listingData, error: listingError },
        { data: projectData, error: projectError },
      ] = await Promise.all([
        supabase
          .from('booths')
          .select('id, name, description, owner_name, bio, location, market_type')
          .eq('id', boothId)
          .single(),
        supabase
          .from('listings')
          .select('id, booth_id, title, description, price, image_url, market_type, category')
          .eq('booth_id', boothId),
        supabase
          .from('projects')
          .select('id, booth_id, title, description, progress_percent, image_url')
          .eq('booth_id', boothId),
      ])

      if (!isMounted) {
        return
      }

      const loadError = boothError || listingError || projectError

      if (loadError) {
        setError(loadError.message)
        setBooth(null)
        setListings([])
        setProjects([])
      } else {
        setBooth(boothData)
        setListings(listingData ?? [])
        setProjects(projectData ?? [])
      }

      setIsLoading(false)
    }

    loadBooth()

    return () => {
      isMounted = false
    }
  }, [boothId, isUuid])

  if (isLoading) {
    return (
      <article className="state-card">
        <h1>Opening the booth</h1>
        <p>Loading seller details, listings, and project board notes.</p>
      </article>
    )
  }

  if (error) {
    return (
      <article className="state-card state-card-error">
        <h1>Could not open this booth</h1>
        <p>{error}</p>
      </article>
    )
  }

  if (!booth) {
    return (
      <article className="state-card">
        <h1>Booth not found</h1>
        <p>This booth may have packed up for the day. Head back to Browse to pick a booth from the market.</p>
        <div className="hero-actions">
          <Link className="button button-primary" to="/browse">
            Browse booths
          </Link>
        </div>
      </article>
    )
  }

  return (
    <div className="page-stack">
      <section className="page-intro">
        <p className="eyebrow">{booth.market_type === 'handmade' ? 'Handmade booth' : 'Jumble Market booth'}</p>
        <h1>{booth.name}</h1>
        <p>{booth.description}</p>
      </section>

      <section className="booth-panel">
        <div>
          <span className="booth-avatar">{booth.name.charAt(0)}</span>
        </div>
        <div>
          <h2>Run by {booth.owner_name}</h2>
          <dl className="detail-list">
            <div>
              <dt>Location</dt>
              <dd>{booth.location || 'Location notes coming soon'}</dd>
            </div>
            <div>
              <dt>Seller bio</dt>
              <dd>{booth.bio || 'This seller has not added a bio yet.'}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">From this booth</p>
          <h2>Listings on the table</h2>
        </div>
        {listings.length === 0 ? (
          <article className="state-card">
            <h3>No listings on this table yet</h3>
            <p>Check back after the seller finishes setting up the booth.</p>
          </article>
        ) : (
          <div className="listing-grid">
            {listings.map((listing) => (
              <article className="listing-card" key={listing.id}>
                {listing.image_url ? (
                  <img src={listing.image_url} alt="" className="card-image" />
                ) : (
                  <span className="listing-image">{listing.category || 'Find'}</span>
                )}
                <div>
                  <h3>{listing.title}</h3>
                  <p>{listing.description}</p>
                </div>
                <div className="card-footer">
                  <strong>{listing.price}</strong>
                  <Link to={`/listing/${listing.id}`}>View listing</Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Project board</p>
          <h2>Works in progress</h2>
        </div>
        {projects.length === 0 ? (
          <article className="state-card">
            <h3>No project board notes yet</h3>
            <p>This booth has not pinned up any works in progress.</p>
          </article>
        ) : (
          <div className="project-grid">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default Booth

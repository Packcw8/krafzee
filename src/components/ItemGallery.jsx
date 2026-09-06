import { useRef, useState } from 'react'

export default function ItemGallery({ listing, compact = false }) {
  const photos = listing.image_urls?.length ? listing.image_urls : listing.image_url ? [listing.image_url] : []
  const [index, setIndex] = useState(0)
  const dialog = useRef(null)
  const start = useRef(null)
  const current = Math.min(index, Math.max(0, photos.length - 1))
  const move = (delta) => setIndex((current + delta + photos.length) % photos.length)
  if (!photos.length) return <span className="listing-image">{listing.category || 'Item photo'}</span>
  const controls = photos.length > 1 && <div className="gallery-controls">
    <button type="button" aria-label="Previous photo" onClick={() => move(-1)}>‹</button>
    <span aria-live="polite">{current + 1} / {photos.length}</span>
    <button type="button" aria-label="Next photo" onClick={() => move(1)}>›</button>
  </div>
  const gestures = {
    onTouchStart: (event) => { start.current = event.touches[0].clientX },
    onTouchEnd: (event) => {
      if (start.current !== null && Math.abs(event.changedTouches[0].clientX - start.current) > 45) move(event.changedTouches[0].clientX < start.current ? 1 : -1)
      start.current = null
    },
    onKeyDown: (event) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1) }
    },
  }
  return <div className={`item-gallery ${compact ? 'item-gallery-compact' : ''}`} {...gestures}>
    <button type="button" className="gallery-open" aria-label={`Enlarge photo of ${listing.title}`} onClick={() => dialog.current.showModal()}>
      <img className="card-image" src={photos[current]} alt={`${listing.title}, photo ${current + 1}`} loading={compact ? 'lazy' : 'eager'} />
    </button>
    {controls}
    {!compact && photos.length > 1 && <div className="gallery-thumbnails">{photos.map((url, i) => <button type="button" key={`${url}-${i}`} aria-label={`Show photo ${i + 1}`} aria-pressed={current === i} onClick={() => setIndex(i)}><img src={url} alt="" /></button>)}</div>}
    <dialog ref={dialog} className="gallery-dialog" aria-label={`${listing.title} photos`}>
      <button type="button" className="gallery-close" onClick={() => dialog.current.close()} autoFocus>Close ✕</button>
      <img src={photos[current]} alt={`${listing.title}, photo ${current + 1}`} />
      {controls}
    </dialog>
  </div>
}

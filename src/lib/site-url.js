export const publicSiteUrl = (import.meta.env.VITE_SITE_URL || 'https://krafzee.com').replace(/\/$/, '')

export function getPublicUrl(path = '/') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  return `${publicSiteUrl}${normalizedPath}`
}

export function redirectToPublicHost() {
  if (typeof window === 'undefined') {
    return
  }

  const publicHost = new URL(publicSiteUrl).host
  const currentHost = window.location.host

  if (currentHost === publicHost || currentHost.includes('localhost')) {
    return
  }

  window.location.replace(`${publicSiteUrl}${window.location.pathname}${window.location.search}${window.location.hash}`)
}

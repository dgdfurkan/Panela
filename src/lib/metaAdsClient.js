const GRAPH_API_VERSION = 'v19.0'
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

function getProxyUrl() {
  try {
    if (typeof localStorage !== 'undefined') {
      const override = localStorage.getItem('meta_proxy_override')
      if (override) return override
    }
  } catch (e) {
    // ignore storage errors
  }
  return import.meta.env.VITE_META_PROXY_URL || ''
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// CTA tespiti için basit regex
const CTA_REGEX = /(shop\s*now|şimdi\s*alışveriş\s*yap)/i

export function detectCtaHit(ad) {
  const fields = [
    ad.ad_creative_body,
    ad.ad_creative_link_title,
    ad.ad_creative_link_caption,
    ad.ad_creative_link_description,
    ad.link_caption,
    ad.link_description
  ].filter(Boolean)
  return fields.some((f) => CTA_REGEX.test(f))
}

function buildHeaders(token) {
  return {
    Authorization: token ? `Bearer ${token}` : undefined
  }
}

async function graphFetch(url, token, retry = 1) {
  const res = await fetch(url, { headers: buildHeaders(token) })
  if (!res.ok) {
    if (retry > 0 && res.status >= 500) {
      await sleep(400)
      return graphFetch(url, token, retry - 1)
    }
    const txt = await res.text()
    throw new Error(`Graph error ${res.status}: ${txt}`)
  }
  return res.json()
}

/**
 * Ads Archive araması
 * opts: { countries[], search_terms[], ad_active_status, media_type, publisher_platforms[], since, until, limit, accessToken }
 */
export async function searchAdsArchive(opts) {
  const {
    countries = [],
    search_terms = [],
    ad_active_status = 'ALL',
    media_type = 'ALL',
    publisher_platforms = [],
    since,
    until,
    limit = 25,
    accessToken,
    after
  } = opts

  const params = new URLSearchParams()
  params.set('search_type', 'KEYWORD_UNORDERED')
  params.set('ad_type', 'ALL')
  params.set('ad_active_status', ad_active_status.toLowerCase())
  params.set('media_type', media_type.toLowerCase())
  params.set('limit', String(limit))
  params.set('fields', [
    'ad_snapshot_url',
    'page_name',
    'page_id',
    'ad_creative_body',
    'ad_creative_link_title',
    'ad_creative_link_caption',
    'ad_creative_link_description',
    'link_caption',
    'link_description',
    'publisher_platforms',
    'impressions',
    'delivery_by_region'
  ].join(','))

  if (countries.length) countries.forEach((c, i) => params.set(`ad_reached_countries[${i}]`, c))
  if (search_terms.length) params.set('search_terms', search_terms.join(' '))
  if (publisher_platforms.length) publisher_platforms.forEach((p, i) => params.set(`publisher_platforms[${i}]`, p.toLowerCase()))
  if (since) params.set('ad_delivery_date_min', since)
  if (until) params.set('ad_delivery_date_max', until)
  if (after) params.set('after', after)

  const url = `${GRAPH_BASE}/ads_archive?${params.toString()}`

  // Proxy kullan (token’ı client’a sızdırmamak için)
  const PROXY_URL = getProxyUrl()
  if (PROXY_URL) {
    const res = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(SUPABASE_ANON_KEY
          ? {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`
            }
          : {})
      },
      body: JSON.stringify({
        action: 'search',
        query: Object.fromEntries(params),
        after,
        countries,
        search_terms,
        publisher_platforms,
        since,
        until
      })
    })
    if (!res.ok) {
      const txt = await res.text()
      throw new Error(`Proxy error ${res.status}: ${txt}`)
    }
    return res.json()
  }

  return graphFetch(url, accessToken)
}

/**
 * Belirli page_id için 14 gün sayım
 */
export async function countPageAds({ page_id, since, until, accessToken, limit = 50 }) {
  const params = new URLSearchParams()
  params.set('search_type', 'PAGE')
  params.set('page_ids[0]', page_id)
  params.set('ad_active_status', 'all')
  params.set('limit', String(limit))
  params.set('fields', 'id')
  if (since) params.set('ad_delivery_date_min', since)
  if (until) params.set('ad_delivery_date_max', until)

  const url = `${GRAPH_BASE}/ads_archive?${params.toString()}`

  const PROXY_URL = getProxyUrl()
  if (PROXY_URL) {
    const res = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(SUPABASE_ANON_KEY
          ? {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`
            }
          : {})
      },
      body: JSON.stringify({
        action: 'count',
        query: Object.fromEntries(params)
      })
    })
    if (!res.ok) {
      const txt = await res.text()
      throw new Error(`Proxy error ${res.status}: ${txt}`)
    }
    const data = await res.json()
    let count = (data.data || []).length
    return count
  }

  const data = await graphFetch(url, accessToken)
  // Tahmini count: data length + varsa paging cursors (basit yaklaşım)
  let count = (data.data || []).length
  // Not: tam count için paginate etmek gerekir; burada ilk sayfa üstünden işaret ediyoruz
  return count
}


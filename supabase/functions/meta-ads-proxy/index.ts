// Supabase Edge Function – Meta Ads Proxy
// Çalıştırma: supabase functions serve --env-file .env
// Deploy:     supabase functions deploy meta-ads-proxy --env-file .env
// Gerekli env: META_ADS_TOKEN

import type { ServeHandler } from 'https://deno.land/std@0.177.0/http/server.ts'

const GRAPH_VERSION = 'v19.0'
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*, content-type, authorization, apikey, x-client-info, x-requested-with',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Credentials': 'false',
  'Access-Control-Max-Age': '86400'
}

// Token validasyon fonksiyonu
function validateToken(token: string | undefined): { valid: boolean; error?: string } {
  if (!token) {
    return { valid: false, error: 'META_ADS_TOKEN missing' }
  }
  
  const trimmed = token.trim()
  if (!trimmed) {
    return { valid: false, error: 'META_ADS_TOKEN is empty' }
  }
  
  // Meta token'ları genellikle en az 20 karakter uzunluğundadır
  if (trimmed.length < 20) {
    return { valid: false, error: 'Invalid token format: token too short' }
  }
  
  // Meta token'ları genellikle alfanumerik karakterler ve bazı özel karakterler içerir
  if (!/^[A-Za-z0-9_\-\.]+$/.test(trimmed)) {
    return { valid: false, error: 'Invalid token format: contains invalid characters' }
  }
  
  return { valid: true }
}

// OAuthException kodlarını anlamlı mesajlara çevir
function mapOAuthError(error: any): { message: string; code?: number; type?: string; originalMessage?: string } {
  if (!error) {
    return { message: 'Unknown error occurred' }
  }
  
  const code = error.code || error.error_code
  const type = error.type || error.error_subcode
  const message = error.message || error.error_message || 'Unknown error'
  
  // OAuthException kodları mapping
  const codeMap: Record<number, string> = {
    1: 'Invalid or expired access token',
    2: 'Session key invalid or no longer valid',
    4: 'Application request limit reached',
    10: 'Permission denied',
    17: 'User request limit reached',
    190: 'Access token has expired',
    200: 'Permissions error',
    368: 'Temporarily blocked due to too many API calls',
  }
  
  const mappedMessage = codeMap[code] || message
  
  return {
    message: mappedMessage,
    code,
    type,
    originalMessage: message
  }
}

// Meta API hata response'unu parse et
function parseMetaError(response: any, status: number): { error: string; details?: any; code?: number } {
  if (response.error) {
    const mapped = mapOAuthError(response.error)
    return {
      error: mapped.message,
      details: {
        code: mapped.code,
        type: mapped.type,
        originalMessage: mapped.originalMessage,
        fullError: response.error
      },
      code: mapped.code
    }
  }
  
  if (status >= 400 && status < 500) {
    return {
      error: 'Client error: Invalid request',
      details: response
    }
  }
  
  if (status >= 500) {
    return {
      error: 'Meta API server error',
      details: response
    }
  }
  
  return {
    error: 'Unknown error occurred',
    details: response
  }
}

const handler: ServeHandler = async (req) => {
  try {
    // CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS
      })
    }

    // Authorization kontrolü - Supabase anon key kontrolü (opsiyonel, public function için)
    // Not: Supabase Edge Function'ları varsayılan olarak anon key gerektirir
    // Ama biz public bir proxy yapıyoruz, bu yüzden authorization kontrolünü esnek tutuyoruz
    const authHeader = req.headers.get('authorization')
    const apiKeyHeader = req.headers.get('apikey')
    
    // Eğer authorization header yoksa ve Supabase anon key de yoksa, yine de devam et
    // (Public function olarak çalışacak)

    // Debug endpoint (opsiyonel)
    const urlPath = new URL(req.url).pathname
    if (urlPath.includes('/debug') && req.method === 'GET') {
      const token = Deno.env.get('META_ADS_TOKEN')
      const validation = validateToken(token)
      
      // Token'ı Meta API'ye test et - /me endpoint
      let metaMeTest = null
      // Token'ı Ads Archive API'ye test et - /ads_archive endpoint
      let metaAdsArchiveTest = null
      
      if (token && validation.valid) {
        const trimmedToken = token.trim()
        
        // Test 1: /me endpoint (genel erişim)
        try {
          const meUrl = `https://graph.facebook.com/v19.0/me?access_token=${trimmedToken}`
          const meRes = await fetch(meUrl, { method: 'GET' })
          const meData = await meRes.json()
          metaMeTest = {
            status: meRes.status,
            success: meRes.ok,
            error: meData.error || null,
            data: meData
          }
        } catch (e) {
          metaMeTest = {
            error: e.message
          }
        }
        
        // Test 2: /ads_archive endpoint (ads_read izni gerektirir)
        try {
          const adsArchiveUrl = `https://graph.facebook.com/v19.0/ads_archive?search_type=KEYWORD_UNORDERED&ad_type=ALL&ad_active_status=all&limit=1&access_token=${trimmedToken}`
          const adsRes = await fetch(adsArchiveUrl, { method: 'GET' })
          const adsData = await adsRes.json()
          metaAdsArchiveTest = {
            status: adsRes.status,
            success: adsRes.ok,
            error: adsData.error || null,
            hasData: !!adsData.data,
            dataCount: adsData.data?.length || 0,
            fullResponse: adsData
          }
        } catch (e) {
          metaAdsArchiveTest = {
            error: e.message
          }
        }
      }
      
      return new Response(JSON.stringify({
        tokenPresent: !!token,
        tokenValid: validation.valid,
        tokenError: validation.error,
        tokenLength: token ? token.length : 0,
        tokenPreview: token ? `${token.substring(0, 10)}...${token.substring(token.length - 5)}` : null,
        metaMeTest: metaMeTest,
        metaAdsArchiveTest: metaAdsArchiveTest,
        diagnosis: metaAdsArchiveTest?.error 
          ? `Token Ads Archive API'ye erisemiyor: ${metaAdsArchiveTest.error.message || metaAdsArchiveTest.error}`
          : metaAdsArchiveTest?.success 
            ? 'Token Ads Archive API\'ye erisebiliyor'
            : 'Token test edilemedi'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...CORS_HEADERS
        }
      })
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'POST only' }), {
        status: 405,
        headers: CORS_HEADERS
      })
    }

    // Token validasyonu
    const token = Deno.env.get('META_ADS_TOKEN')
    
    // Debug: Token'ı logla (maskelenmiş)
    console.log('Token check:', {
      tokenPresent: !!token,
      tokenLength: token ? token.length : 0,
      tokenPreview: token ? `${token.substring(0, 10)}...${token.substring(token.length - 5)}` : null,
      tokenStart: token ? token.substring(0, 20) : null
    })
    
    const tokenValidation = validateToken(token)
    if (!tokenValidation.valid) {
      console.error('Token validation failed:', tokenValidation.error)
      return new Response(JSON.stringify({ 
        error: tokenValidation.error,
        code: 'TOKEN_VALIDATION_ERROR',
        debug: {
          tokenPresent: !!token,
          tokenLength: token ? token.length : 0
        }
      }), {
        status: 500,
        headers: CORS_HEADERS
      })
    }

    let body: any = {}
    try {
      body = await req.json()
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON', details: e?.message }), { status: 400, headers: CORS_HEADERS })
    }

    const { action, query = {}, countries, search_terms, publisher_platforms, since, until } = body

    const params = new URLSearchParams()
    
    // Meta API'nin beklediği formata göre parametreleri ekle
    // search_type ve ad_type her zaman eklenir
    params.set('search_type', query.search_type || 'KEYWORD_UNORDERED')
    params.set('ad_type', query.ad_type || 'ALL')
    
    // ad_active_status
    if (query.ad_active_status) {
      params.set('ad_active_status', String(query.ad_active_status).toUpperCase())
    } else {
      params.set('ad_active_status', 'ALL')
    }
    
    // media_type
    if (query.media_type) {
      params.set('media_type', String(query.media_type).toUpperCase())
    }
    
    // limit
    if (query.limit) {
      params.set('limit', String(query.limit))
    }
    
    // fields
    if (query.fields) {
      params.set('fields', String(query.fields))
    }
    
    // ad_reached_countries - array formatında: ad_reached_countries[0]=TR
    if (countries && Array.isArray(countries) && countries.length > 0) {
      countries.forEach((country, idx) => {
        params.set(`ad_reached_countries[${idx}]`, String(country).toUpperCase())
      })
    } else if (query['ad_reached_countries[0]']) {
      // Eğer query'den geliyorsa (eski format için backward compatibility)
      Object.keys(query).forEach(key => {
        if (key.startsWith('ad_reached_countries[')) {
          params.set(key, String(query[key]))
        }
      })
    }
    
    // search_terms - Meta API tek string bekliyor, array ise birleştir
    if (search_terms && Array.isArray(search_terms) && search_terms.length > 0) {
      params.set('search_terms', search_terms.join(' '))
    } else if (search_terms && typeof search_terms === 'string') {
      params.set('search_terms', search_terms)
    } else if (query.search_terms) {
      params.set('search_terms', String(query.search_terms))
    }
    
    // publisher_platforms - array formatında: publisher_platforms[0]=facebook
    if (publisher_platforms && Array.isArray(publisher_platforms) && publisher_platforms.length > 0) {
      publisher_platforms.forEach((platform, idx) => {
        params.set(`publisher_platforms[${idx}]`, String(platform).toLowerCase())
      })
    } else if (query['publisher_platforms[0]']) {
      // Eğer query'den geliyorsa (eski format için backward compatibility)
      Object.keys(query).forEach(key => {
        if (key.startsWith('publisher_platforms[')) {
          params.set(key, String(query[key]))
        }
      })
    }
    
    // Tarih parametreleri
    if (since) {
      params.set('ad_delivery_date_min', String(since))
    } else if (query.ad_delivery_date_min) {
      params.set('ad_delivery_date_min', String(query.ad_delivery_date_min))
    }
    
    if (until) {
      params.set('ad_delivery_date_max', String(until))
    } else if (query.ad_delivery_date_max) {
      params.set('ad_delivery_date_max', String(query.ad_delivery_date_max))
    }
    
    // after (pagination)
    if (query.after) {
      params.set('after', String(query.after))
    }
    
    // Diğer query parametrelerini ekle (backward compatibility için)
    Object.entries(query).forEach(([k, v]) => {
      if (v === undefined || v === null) return
      // Zaten işlediğimiz parametreleri atla
      if (['search_type', 'ad_type', 'ad_active_status', 'media_type', 'limit', 'fields', 
           'ad_delivery_date_min', 'ad_delivery_date_max', 'after', 'search_terms'].includes(k)) {
        return
      }
      // Array parametrelerini zaten işledik
      if (k.startsWith('ad_reached_countries[') || k.startsWith('publisher_platforms[')) {
        return
      }
      // Diğer parametreleri ekle
      if (Array.isArray(v)) {
        v.forEach((item, idx) => params.set(`${k}[${idx}]`, String(item)))
      } else {
        params.set(k, String(v))
      }
    })
    
    // Token'ı URL'e ekle
    const tokenToUse = token!.trim() // Trim yaparak boşlukları temizle
    params.set('access_token', tokenToUse)

    const url = `${GRAPH_BASE}/ads_archive?${params.toString()}`
    
    // Debug: URL'i logla (token maskelenmiş)
    console.log('Meta API Request:', {
      url: url.replace(/access_token=[^&]+/, 'access_token=***'),
      tokenLength: tokenToUse.length,
      tokenStart: tokenToUse.substring(0, 20)
    })

    if (action !== 'search' && action !== 'count') {
      return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: CORS_HEADERS })
    }

    // Meta API'ye istek at
    const fbRes = await fetch(url, { method: 'GET' })
    const data = await fbRes.json()
    const status = fbRes.status

    // Hata durumunda detaylı parse et
    if (status >= 400) {
      const errorInfo = parseMetaError(data, status)
      
      // Debug için: Meta'nın tam hata mesajını logla
      console.error('Meta API Error:', {
        status,
        error: data.error,
        fullResponse: data,
        url: url.replace(/access_token=[^&]+/, 'access_token=***'),
        tokenInfo: {
          tokenLength: tokenToUse.length,
          tokenStart: tokenToUse.substring(0, 20),
          tokenEnd: tokenToUse.substring(tokenToUse.length - 10)
        }
      })
      
      return new Response(JSON.stringify({
        error: errorInfo.error,
        details: errorInfo.details,
        code: errorInfo.code,
        metaResponse: data,
        debug: {
          errorCode: data.error?.code,
          errorType: data.error?.type,
          errorMessage: data.error?.message,
          errorSubcode: data.error?.error_subcode
        }
      }), {
        status: status,
        headers: {
          'Content-Type': 'application/json',
          ...CORS_HEADERS
        }
      })
    }

    // Başarılı response
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...CORS_HEADERS
      }
    })
  } catch (e: any) {
    return new Response(JSON.stringify({ 
      error: 'Unhandled error', 
      details: e?.message,
      stack: e?.stack 
    }), {
      status: 500,
      headers: CORS_HEADERS
    })
  }
}

Deno.serve(handler)


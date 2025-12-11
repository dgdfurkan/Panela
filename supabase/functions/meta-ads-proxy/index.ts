// Supabase Edge Function – Meta Ads Proxy
// Çalıştırma: supabase functions serve --env-file .env
// Deploy:     supabase functions deploy meta-ads-proxy --env-file .env
// Gerekli env: META_ADS_TOKEN

import type { ServeHandler } from 'https://deno.land/std@0.177.0/http/server.ts'

const GRAPH_VERSION = 'v19.0'
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, X-Client-Info, X-Requested-With',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
}

const handler: ServeHandler = async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 204,
      headers: CORS_HEADERS
    })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST only' }), {
      status: 405,
      headers: CORS_HEADERS
    })
  }

  const token = Deno.env.get('META_ADS_TOKEN')
  if (!token) {
    return new Response(JSON.stringify({ error: 'META_ADS_TOKEN missing' }), {
      status: 500,
      headers: CORS_HEADERS
    })
  }

  let body: any = {}
  try {
    body = await req.json()
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON', details: e?.message }), { status: 400 })
  }

  const { action, query = {} } = body

  const params = new URLSearchParams()
  Object.entries(query).forEach(([k, v]) => {
    if (v === undefined || v === null) return
    if (Array.isArray(v)) {
      v.forEach((item, idx) => params.set(`${k}[${idx}]`, String(item)))
    } else {
      params.set(k, String(v))
    }
  })
  params.set('access_token', token)

  let url = `${GRAPH_BASE}/ads_archive?${params.toString()}`

  // action 'search' veya 'count' ikisi de ads_archive kullanıyor; sadece parametre setleri farklı
  if (action !== 'search' && action !== 'count') {
    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 })
  }

  const fbRes = await fetch(url, { method: 'GET' })
  const data = await fbRes.json()
  const status = fbRes.status

  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS
    }
  })
}

Deno.serve(handler)


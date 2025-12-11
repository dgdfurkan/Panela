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

const handler: ServeHandler = async (req) => {
  try {
    // CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
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
      return new Response(JSON.stringify({ error: 'Invalid JSON', details: e?.message }), { status: 400, headers: CORS_HEADERS })
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

    const url = `${GRAPH_BASE}/ads_archive?${params.toString()}`

    if (action !== 'search' && action !== 'count') {
      return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: CORS_HEADERS })
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
  } catch (e: any) {
    return new Response(JSON.stringify({ error: 'Unhandled', details: e?.message }), {
      status: 500,
      headers: CORS_HEADERS
    })
  }
}

Deno.serve(handler)


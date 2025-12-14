# 🚀 Supabase Dashboard'dan Edge Function Deploy Rehberi

CLI kurulumu sorunlu olduğu için, Edge Function'ı **Supabase Dashboard'dan manuel olarak** deploy edeceğiz.

---

## 📋 Adımlar

### 1. Supabase Dashboard'a Giriş

1. Tarayıcınızda [https://supabase.com](https://supabase.com) adresine gidin
2. Giriş yapın ve projenizi seçin

### 2. Edge Functions Sayfasına Gitme

1. Sol menüden **Edge Functions** seçeneğine tıklayın
2. Eğer ilk kez kullanıyorsanız, **"Create your first function"** butonuna tıklayın
3. Eğer zaten function varsa, **"New Function"** veya **"Create Function"** butonuna tıklayın

### 3. Function Oluşturma

1. **Function Name:** `meta-ads-proxy` (tam olarak bu şekilde)
2. **Region:** Size en yakın region'ı seçin (örn: `us-east-1`)
3. **"Create Function"** butonuna tıklayın

### 4. Kodu Yapıştırma

Aşağıdaki kodu kopyalayıp, Supabase Dashboard'daki kod editörüne yapıştırın:

```typescript
// Supabase Edge Function – Meta Ads Proxy
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

    // Debug endpoint (opsiyonel)
    const urlPath = new URL(req.url).pathname
    if (urlPath.includes('/debug') && req.method === 'GET') {
      const token = Deno.env.get('META_ADS_TOKEN')
      const validation = validateToken(token)
      return new Response(JSON.stringify({
        tokenPresent: !!token,
        tokenValid: validation.valid,
        tokenError: validation.error,
        tokenLength: token ? token.length : 0,
        tokenPreview: token ? `${token.substring(0, 10)}...${token.substring(token.length - 5)}` : null
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
    const tokenValidation = validateToken(token)
    if (!tokenValidation.valid) {
      return new Response(JSON.stringify({ 
        error: tokenValidation.error,
        code: 'TOKEN_VALIDATION_ERROR'
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
    params.set('access_token', token!)

    const url = `${GRAPH_BASE}/ads_archive?${params.toString()}`

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
      return new Response(JSON.stringify({
        error: errorInfo.error,
        details: errorInfo.details,
        code: errorInfo.code,
        metaResponse: data
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
```

### 5. Deploy Etme

1. Kodu yapıştırdıktan sonra, **"Deploy"** veya **"Save"** butonuna tıklayın
2. Deploy işlemi birkaç dakika sürebilir
3. Başarılı mesajı görünce tamamlandı!

### 6. Token'ı Secrets'a Ekleme

1. Sol menüden **Settings** → **Edge Functions** → **Secrets** seçeneğine gidin
2. **"Add Secret"** butonuna tıklayın
3. **Name:** `META_ADS_TOKEN` (tam olarak bu şekilde)
4. **Value:** Meta'dan aldığınız token'ı yapıştırın
5. **"Save"** butonuna tıklayın

### 7. Function URL'ini Bulma

1. **Edge Functions** sayfasına geri dönün
2. `meta-ads-proxy` function'ınızı bulun
3. Function URL'i şu formatta olacak:
   ```
   https://YOUR_PROJECT_REF.functions.supabase.co/meta-ads-proxy
   ```
4. Bu URL'yi kopyalayın

### 8. Test Etme

Tarayıcıda şu URL'yi açın (kendi Project Reference'ınızla değiştirin):
```
https://YOUR_PROJECT_REF.functions.supabase.co/meta-ads-proxy/debug
```

Başarılı çıktı:
```json
{
  "tokenPresent": true,
  "tokenValid": true,
  "tokenError": null,
  "tokenLength": 200,
  "tokenPreview": "EAABsbCS1...xyz12"
}
```

---

## ✅ Tamamlandı!

Artık Edge Function deploy edildi! Şimdi:

1. Proxy URL'ini GitHub Secrets'a ekleyin (`VITE_META_PROXY_URL`)
2. Siteyi GitHub Pages'te deploy edin
3. Test edin!

---

## 🆘 Sorun mu var?

- **Function deploy olmuyor:** Kodu tekrar kontrol edin, syntax hatası olabilir
- **Token hatası:** Secrets'a `META_ADS_TOKEN` eklendiğinden emin olun
- **URL çalışmıyor:** Function URL'ini kontrol edin


import { supabase } from './supabaseClient'

const MODEL = 'gemini-2.5-flash'
const GEMINI_URL = (key) => `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`

export async function getAiTokens() {
  const { data, error } = await supabase
    .from('ai_tokens')
    .select('id,label,token,priority')
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

export async function analyzeCreativeWithGemini(payload) {
  const tokens = await getAiTokens()
  if (!tokens.length) {
    throw new Error('AI token bulunamadı. Ayarlar > Gemini Token bölümüne ekleyin.')
  }

  const prompt = buildPrompt(payload)
  let lastError

  for (const t of tokens) {
    try {
      const res = await fetch(GEMINI_URL(t.token), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            response_mime_type: 'application/json'
          }
        })
      })

      if (!res.ok) {
        lastError = new Error(`Gemini hata: ${res.status}`)
        continue
      }

      const json = await res.json()
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || ''
      const suggestions = safeParseSuggestions(text)
      if (suggestions) return suggestions
      lastError = new Error('Gemini yanıtı okunamadı')
    } catch (err) {
      lastError = err
      continue
    }
  }

  throw lastError || new Error('Gemini çağrısı başarısız')
}

function buildPrompt(payload) {
  const {
    product_name,
    platform,
    strategy_angle,
    target_audience,
    ad_headline,
    hook,
    body,
    cta,
    visual_idea,
    tags,
    budget_note
  } = payload

  return `
Sen üst düzey e-ticaret pazarlama asistanısın. Reklam kreatifini değerlendir ve geliştir. Yalnızca aşağıdaki JSON şemasını döndür.

Şema:
{
  "strategy_angle": "string",
  "target_age_min": "number",
  "target_age_max": "number",
  "target_age_notes": "string",
  "target_location": "string",
  "target_interests": ["string"],
  "hook": "string",
  "ad_headline": "string",
  "body": "string",
  "cta": "string",
  "visual_idea": "string",
  "tags": ["string"],
  "budget_note": "string"
}

Kontekst:
- Ürün: ${product_name || 'Bilinmiyor'}
- Platform: ${platform}
- Strateji: ${strategy_angle || 'Belirtilmedi'}
- Hedef kitle: yaş ${target_audience?.min || ''}-${target_audience?.max || ''}, ilgi: ${(target_audience?.interests || []).join(', ')} lokasyon: ${target_audience?.location || ''}
- Metinler: hook="${hook}", headline="${ad_headline}", body="${body}", cta="${cta}"
- Görsel fikir: ${visual_idea}
- Etiketler: ${(tags || []).join(', ')}
- Bütçe: ${budget_note || ''}

Çıktıyı yalnızca geçerli JSON olarak ver.`
}

function safeParseSuggestions(text) {
  try {
    const cleaned = text.trim().replace(/^```json/i, '').replace(/```$/, '')
    const parsed = JSON.parse(cleaned)
    return parsed
  } catch (err) {
    return null
  }
}


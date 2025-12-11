import { useEffect, useMemo, useState } from 'react'
import { Play, X, Loader2, ExternalLink, CheckCircle2, Shield, Link2 } from 'lucide-react'
import { detectCtaHit, searchAdsArchive, countPageAds } from '../../lib/metaAdsClient'

const CTA_HINT = /shop\s*now|şimdi\s*alışveriş\s*yap/i

const DEFAULT_COUNTRIES = ['US', 'CA', 'GB', 'AU', 'NZ']
const DEFAULT_PLATFORMS = ['facebook', 'instagram']

const today = () => new Date().toISOString().slice(0, 10)
const fourteenDaysAgo = () => {
  const d = new Date()
  d.setDate(d.getDate() - 14)
  return d.toISOString().slice(0, 10)
}

export default function AutoMetaScanner({ onPrefill }) {
  const hasEnvToken = Boolean(import.meta.env.VITE_META_TOKEN)
  const envProxy = import.meta.env.VITE_META_PROXY_URL || ''
  const [token, setToken] = useState('')
  const [proxyOverride, setProxyOverride] = useState('')
  const hasProxy = Boolean(proxyOverride || envProxy)
  const [countries, setCountries] = useState(DEFAULT_COUNTRIES.join(','))
  const [keywords, setKeywords] = useState('')
  const [mediaType, setMediaType] = useState('ALL')
  const [platforms, setPlatforms] = useState(DEFAULT_PLATFORMS.join(','))
  const [status, setStatus] = useState('ACTIVE')
  const [since, setSince] = useState(fourteenDaysAgo())
  const [until, setUntil] = useState(today())
  const [targetCount, setTargetCount] = useState(50)
  const [pageLimit, setPageLimit] = useState(25)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState([])
  const [log, setLog] = useState([])

  const parsedCountries = useMemo(
    () => countries.split(',').map(s => s.trim().toUpperCase()).filter(Boolean),
    [countries]
  )
  const parsedKeywords = useMemo(
    () => keywords.split(',').map(s => s.trim()).filter(Boolean),
    [keywords]
  )
  const parsedPlatforms = useMemo(
    () => platforms.split(',').map(s => s.trim().toLowerCase()).filter(Boolean),
    [platforms]
  )

  const appendLog = (msg) => setLog(prev => [`${new Date().toLocaleTimeString()}: ${msg}`, ...prev].slice(0, 30))

  const handleRun = async () => {
    setLoading(true)
    setItems([])
    try {
      let collected = []
      let after = undefined
      while (collected.length < targetCount) {
        const res = await searchAdsArchive({
          countries: parsedCountries,
          search_terms: parsedKeywords,
          ad_active_status: status,
          media_type: mediaType,
          publisher_platforms: parsedPlatforms,
          since,
          until,
          limit: pageLimit,
          accessToken: token || import.meta.env.VITE_META_TOKEN,
          after
        })
        const data = res.data || []
        appendLog(`Çekilen: ${data.length}, toplanan: ${collected.length + data.length}`)

        // CTA filtresi
        const filtered = await Promise.all(
          data.map(async (ad) => {
            const ctaHit = detectCtaHit(ad) || CTA_HINT.test(ad.ad_creative_body || '')
            let pageCount = null
            try {
              pageCount = await countPageAds({
                page_id: ad.page_id,
                since,
                until,
                accessToken: token || import.meta.env.VITE_META_TOKEN,
                limit: 50
              })
            } catch (e) {
              // ignore count errors
            }
            return {
              ...ad,
              ctaHit,
              pageCount,
              keywordUsed: parsedKeywords.join(', '),
              countriesUsed: parsedCountries.join(', ')
            }
          })
        )

        collected = [...collected, ...filtered]

        // pagination
        after = res.paging?.cursors?.after
        if (!after || data.length === 0) break
        if (collected.length >= targetCount) break
      }

      // Branding eşiği
      const finalized = collected.filter(it => (it.pageCount ?? 0) >= 30 && it.ctaHit)
      setItems(finalized)
      appendLog(`Tamamlandı. Toplam uygun: ${finalized.length}`)
    } catch (err) {
      console.error(err)
      const errorMsg = err.message || 'Bilinmeyen hata'
      
      // Token hataları için özel mesaj
      if (errorMsg.includes('token') || errorMsg.includes('Token') || errorMsg.includes('TOKEN')) {
        appendLog(`❌ Token Hatası: ${errorMsg}`)
        appendLog(`💡 Çözüm: Supabase secrets'da META_ADS_TOKEN'in doğru şekilde set edildiğinden emin olun.`)
        appendLog(`💡 Token'ın ads_read veya ads_management izinlerine sahip olduğunu kontrol edin.`)
      } else {
        appendLog(`❌ Hata: ${errorMsg}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = (id) => {
    setItems(prev => prev.filter(x => x.id !== id))
  }

  const handlePrefill = (ad) => {
    if (onPrefill) {
      onPrefill({
        product_name: ad.page_name || '',
        meta_link: ad.ad_snapshot_url || '',
        country_code: parsedCountries[0] || '',
        search_keyword: parsedKeywords.join(', '),
        proof_link: ad.ad_snapshot_url || '',
        notes: ad.ad_creative_body || ''
      })
    }
    try {
      localStorage.setItem('meta_prefill_product', JSON.stringify({
        product_name: ad.page_name || '',
        meta_link: ad.ad_snapshot_url || '',
        country_code: parsedCountries[0] || '',
        search_keyword: parsedKeywords.join(', '),
        proof_link: ad.ad_snapshot_url || '',
        notes: ad.ad_creative_body || ''
      }))
    } catch (e) {
      // ignore
    }
  }

  useEffect(() => {
    try {
      const saved = localStorage.getItem('meta_proxy_override')
      if (saved) setProxyOverride(saved)
    } catch (e) {
      // ignore
    }
  }, [])

  const handleProxySave = (val) => {
    setProxyOverride(val)
    try {
      if (val) localStorage.setItem('meta_proxy_override', val)
      else localStorage.removeItem('meta_proxy_override')
    } catch (e) {
      // ignore
    }
  }

  return (
    <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '16px', background: 'white', border: '1px solid var(--color-border)' }}>
      <div
        style={{
          marginBottom: '1rem',
          padding: '1rem',
          borderRadius: '16px',
          background: 'white',
          border: '1px solid var(--color-border)',
          boxShadow: '0 14px 28px rgba(15,23,42,0.06)',
          color: 'var(--color-text-main)',
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: '1rem',
          alignItems: 'center'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ background: 'var(--color-surface-muted, #f8fafc)', border: '1px solid var(--color-border)', padding: '0.25rem 0.55rem', borderRadius: '10px', fontSize: '12px', letterSpacing: '0.3px', color: 'var(--color-text-main)' }}>
              Otomatik Meta Tarayıcı
            </span>
            <span style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#0f766e', padding: '0.25rem 0.55rem', borderRadius: '10px', fontSize: '12px', fontWeight: 700 }}>
              CTA + 30+ reklam filtresi
            </span>
          </div>
          <h3 style={{ margin: 0, fontSize: '1.18rem', fontWeight: 800, letterSpacing: '-0.2px', color: 'var(--color-text-main)' }}>
            14 günde “Shop now/Şimdi alışveriş yap” CTA’sını yakalayan sayfaları bul
          </h3>
          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '13px', lineHeight: 1.5 }}>
            Ülke + keyword kombinasyonlarını sırayla tarar; CTA yakalayan ve son 14 günde 30+ reklam verenleri öne çıkarır. Listeyi taslağa tek tıkla aktar.
          </p>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
            <span style={{ background: '#eef2ff', border: '1px solid #e0e7ff', color: '#4338ca', padding: '0.22rem 0.55rem', borderRadius: '999px', fontSize: '12px' }}>Kombine tarama</span>
            <span style={{ background: '#f3e8ff', border: '1px solid #e9d5ff', color: '#6b21a8', padding: '0.22rem 0.55rem', borderRadius: '999px', fontSize: '12px' }}>CTA denetimi</span>
            <span style={{ background: '#ecfdf3', border: '1px solid #d1fae5', color: '#0f766e', padding: '0.22rem 0.55rem', borderRadius: '999px', fontSize: '12px' }}>30+ branding sinyali</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {hasProxy && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '12px', color: '#0f766e', background: '#ecfdf3', padding: '0.35rem 0.6rem', borderRadius: '12px', border: '1px solid #d1fae5' }}>
                <Shield size={14} />
                Proxy aktif
              </span>
            )}
            {hasEnvToken && !hasProxy && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '12px', color: '#1d4ed8', background: '#eef2ff', padding: '0.35rem 0.6rem', borderRadius: '12px', border: '1px solid #e0e7ff' }}>
                <Shield size={14} />
                Env token
              </span>
            )}
          </div>
          <button
            onClick={() => { setItems([]); setLog([]); }}
            style={{
              padding: '0.6rem 1rem',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              background: 'white',
              color: 'var(--color-text-main)',
              fontWeight: 700,
              boxShadow: '0 10px 24px rgba(15,23,42,0.08)'
            }}
          >
            Temizle
          </button>
        </div>
      </div>

      {/* Form */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.9rem', marginBottom: '1rem' }}>
        <div className="glass-panel" style={{ padding: '0.85rem', borderRadius: '14px', border: '1px solid var(--color-border)', background: 'white' }}>
          <label className="eyebrow">Ülkeler (virgülle)</label>
          <input className="input" style={{ borderRadius: '12px' }} value={countries} onChange={e => setCountries(e.target.value)} />
        </div>
        <div className="glass-panel" style={{ padding: '0.85rem', borderRadius: '14px', border: '1px solid var(--color-border)', background: 'white' }}>
          <label className="eyebrow">Keywords (virgülle)</label>
          <input className="input" style={{ borderRadius: '12px' }} value={keywords} onChange={e => setKeywords(e.target.value)} />
        </div>
        <div className="glass-panel" style={{ padding: '0.85rem', borderRadius: '14px', border: '1px solid var(--color-border)', background: 'white' }}>
          <label className="eyebrow">Platformlar</label>
          <input className="input" style={{ borderRadius: '12px' }} value={platforms} onChange={e => setPlatforms(e.target.value)} placeholder="facebook,instagram" />
        </div>
        <div className="glass-panel" style={{ padding: '0.85rem', borderRadius: '14px', border: '1px solid var(--color-border)', background: 'white' }}>
          <label className="eyebrow">Media Type</label>
          <select className="input" style={{ borderRadius: '12px' }} value={mediaType} onChange={e => setMediaType(e.target.value)}>
            <option value="ALL">ALL</option>
            <option value="VIDEO">VIDEO</option>
            <option value="IMAGE">IMAGE</option>
          </select>
        </div>
        <div className="glass-panel" style={{ padding: '0.85rem', borderRadius: '14px', border: '1px solid var(--color-border)', background: 'white' }}>
          <label className="eyebrow">Status</label>
          <select className="input" style={{ borderRadius: '12px' }} value={status} onChange={e => setStatus(e.target.value)}>
            <option value="ALL">ALL</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>
        <div className="glass-panel" style={{ padding: '0.85rem', borderRadius: '14px', border: '1px solid var(--color-border)', background: 'white' }}>
          <label className="eyebrow">Tarih (Min)</label>
          <input className="input" style={{ borderRadius: '12px' }} type="date" value={since} onChange={e => setSince(e.target.value)} />
        </div>
        <div className="glass-panel" style={{ padding: '0.85rem', borderRadius: '14px', border: '1px solid var(--color-border)', background: 'white' }}>
          <label className="eyebrow">Tarih (Max)</label>
          <input className="input" style={{ borderRadius: '12px' }} type="date" value={until} onChange={e => setUntil(e.target.value)} />
        </div>
        <div className="glass-panel" style={{ padding: '0.85rem', borderRadius: '14px', border: '1px solid var(--color-border)', background: 'white' }}>
          <label className="eyebrow">Hedef Adet</label>
          <input className="input" style={{ borderRadius: '12px' }} type="number" value={targetCount} onChange={e => setTargetCount(parseInt(e.target.value) || 0)} />
        </div>
        <div className="glass-panel" style={{ padding: '0.85rem', borderRadius: '14px', border: '1px solid var(--color-border)', background: 'white' }}>
          <label className="eyebrow">Sayfa Başına Limit</label>
          <input className="input" style={{ borderRadius: '12px' }} type="number" value={pageLimit} onChange={e => setPageLimit(parseInt(e.target.value) || 25)} />
        </div>
        {!hasEnvToken && !hasProxy && (
          <div className="glass-panel" style={{ padding: '0.85rem', borderRadius: '14px', border: '1px solid var(--color-border)', background: 'white' }}>
            <label className="eyebrow">Access Token (POC)</label>
            <input className="input" style={{ borderRadius: '12px' }} value={token} onChange={e => setToken(e.target.value)} placeholder="Prod’da proxy kullan" />
          </div>
        )}
        <div className="glass-panel" style={{ padding: '0.85rem', borderRadius: '14px', border: '1px solid var(--color-border)', background: 'white' }}>
          <label className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Link2 size={14} />
            Proxy URL (isteğe bağlı)
          </label>
          <input
            className="input"
            style={{ borderRadius: '12px' }}
            value={proxyOverride}
            onChange={e => handleProxySave(e.target.value)}
            placeholder={envProxy || 'https://<ref>.functions.supabase.co/meta-ads-proxy'}
          />
          <small style={{ color: 'var(--color-text-muted)' }}>
            Boş bırakırsan env’deki `VITE_META_PROXY_URL` kullanılır.
          </small>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
        <button
          onClick={handleRun}
          className="primary"
          disabled={loading || (!hasProxy && !hasEnvToken && !token)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.1rem' }}
        >
          {loading ? <Loader2 size={16} className="spin" /> : <Play size={16} />}
          Taramayı Başlat
        </button>
      </div>

      {/* Results */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
        {items.map(ad => (
          <div key={ad.id} className="glass-panel" style={{ padding: '0.85rem', borderRadius: '14px', border: '1px solid var(--color-border)', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
              <div>
                <div style={{ fontWeight: '700', fontSize: '15px' }}>{ad.page_name || 'Bilinmeyen Sayfa'}</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Page ID: {ad.page_id}</div>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.35rem', fontSize: '11px' }}>
                  <span style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--color-success)', padding: '0.2rem 0.4rem', borderRadius: '8px', fontWeight: 700 }}>
                    {ad.pageCount ?? '?'} ads /14g
                  </span>
                  {ad.ctaHit ? (
                    <span style={{ background: 'rgba(139,92,246,0.12)', color: 'var(--color-primary)', padding: '0.2rem 0.4rem', borderRadius: '8px', fontWeight: 700 }}>
                      CTA bulundu
                    </span>
                  ) : (
                    <span style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-error)', padding: '0.2rem 0.4rem', borderRadius: '8px', fontWeight: 700 }}>
                      CTA yok
                    </span>
                  )}
                  <span style={{ background: 'rgba(59,130,246,0.1)', color: '#2563eb', padding: '0.2rem 0.4rem', borderRadius: '8px', fontWeight: 700 }}>
                    {ad.countriesUsed}
                  </span>
                  <span style={{ background: 'rgba(16,185,129,0.1)', color: '#0f766e', padding: '0.2rem 0.4rem', borderRadius: '8px', fontWeight: 700 }}>
                    {ad.keywordUsed}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <a href={ad.ad_snapshot_url} target="_blank" rel="noreferrer" title="Snapshot" style={{ padding: '0.35rem', borderRadius: '10px', border: '1px solid var(--color-border)', background: 'white' }}>
                  <ExternalLink size={14} />
                </a>
                <button onClick={() => handleRemove(ad.id)} style={{ padding: '0.35rem', borderRadius: '10px', border: '1px solid var(--color-border)', background: 'white' }}>
                  <X size={14} />
                </button>
              </div>
            </div>

            <div style={{ marginTop: '0.5rem', fontSize: '12px', color: 'var(--color-text-muted)', maxHeight: '70px', overflow: 'auto' }}>
              {ad.ad_creative_body || 'Metin yok'}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.65rem' }}>
              <button
                onClick={() => handlePrefill(ad)}
                className="primary"
                style={{ flex: 1, padding: '0.55rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
              >
                <CheckCircle2 size={14} />
                Taslağa ekle
              </button>
              <button
                onClick={() => handleRemove(ad.id)}
                style={{ padding: '0.55rem', border: '1px solid var(--color-border)', borderRadius: '10px', background: 'white', fontWeight: '600' }}
              >
                Sil
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Log */}
      <div style={{ marginTop: '1rem' }}>
        <div className="eyebrow">Log</div>
        <div style={{ maxHeight: '120px', overflow: 'auto', fontSize: '12px', color: 'var(--color-text-muted)', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '10px', background: 'white' }}>
          {log.length === 0 ? 'Henüz log yok' : log.map((l, idx) => <div key={idx}>{l}</div>)}
        </div>
      </div>
    </div>
  )
}


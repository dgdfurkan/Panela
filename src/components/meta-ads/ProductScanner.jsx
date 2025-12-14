import { useEffect, useMemo, useState } from 'react'
import { Save } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import StarRating from './StarRating'

const CRITERIA = [
  { key: 'innovative', label: 'İnovatif mi?' },
  { key: 'lightweight', label: 'Hafif mi?' },
  { key: 'low_variation', label: 'Varyasyonu Az mı?' },
  { key: 'problem_solving', label: 'Sorun Çözüyor mu?' },
  { key: 'visual_sellable', label: 'Göstererek Satılabilir mi?' }
]

export default function ProductScanner({ userId, onProductsChange }) {
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    product_name: '',
    meta_link: '',
    proof_link: '',
    trendyol_link: '',
    amazon_link: '',
    image_url: '',
    ad_count: '',
    country_code: '',
    search_keyword: '',
    scores: {
      innovative: 0,
      lightweight: 0,
      low_variation: 0,
      problem_solving: 0,
      visual_sellable: 0
    },
    notes: ''
  })

  const potentialScore = useMemo(() => {
    const scores = Object.values(formData.scores)
    if (scores.length === 0) return 0
    return scores.reduce((a, b) => a + b, 0) / scores.length
  }, [formData.scores])


  // Prefill from last search stored by KeywordLauncher - anlık güncelleme
  useEffect(() => {
    const updateFromStorage = () => {
      try {
        const raw = localStorage.getItem('meta_last_search')
        if (!raw) return
        const parsed = JSON.parse(raw)
        if (parsed?.keyword) {
          setFormData(prev => ({
            ...prev,
            search_keyword: parsed.keyword,
            country_code: parsed.country_code || prev.country_code,
            meta_link: parsed.url || prev.meta_link
          }))
        }
      } catch (e) {
        // ignore
      }
    }

    // İlk yükleme
    updateFromStorage()

    // Storage değişikliklerini dinle (diğer tab'lardan gelen güncellemeler için)
    const handleStorageChange = (e) => {
      if (e.key === 'meta_last_search') {
        updateFromStorage()
      }
    }

    // Custom event dinle (aynı tab içindeki güncellemeler için)
    const handleCustomStorage = () => {
      updateFromStorage()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('meta_last_search_updated', handleCustomStorage)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('meta_last_search_updated', handleCustomStorage)
    }
  }, [])

  const handleScoreChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      scores: { ...prev.scores, [key]: value }
    }))
  }

  const adCount = parseInt(formData.ad_count || '0') || 0
  const hasBrandingSignal = adCount > 30

  const handleSave = async () => {
    setSaving(true)
    try {
      // Ürün adı zorunlu - kontrol et
      const productName = formData.product_name.trim()
      if (!productName) {
        alert('Lütfen ürün adını girin')
        setSaving(false)
        return
      }

      // user_id kontrolü
      if (!userId) {
        alert('Kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.')
        setSaving(false)
        return
      }

      const scores = formData.scores
      const potential_score = Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length

      const productData = {
        user_id: userId,
        product_name: productName, // Zorunlu alan, null olamaz
        meta_link: formData.meta_link.trim() || null,
        proof_link: formData.proof_link.trim() || null,
        trendyol_link: formData.trendyol_link.trim() || null,
        amazon_link: formData.amazon_link.trim() || null,
        image_url: formData.image_url.trim() || null,
        ad_count: formData.ad_count ? parseInt(formData.ad_count) : 0, // Default 0
        country_code: formData.country_code.trim() || null,
        search_keyword: formData.search_keyword.trim() || null,
        scores,
        potential_score: parseFloat((isFinite(potential_score) ? potential_score : 0).toFixed(2)),
        notes: formData.notes.trim() || null
      }

      const { data, error } = await supabase
        .from('discovered_products')
        .insert([productData])
        .select() // Response'u al

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      if (!data || data.length === 0) {
        throw new Error('Ürün kaydedildi ama yanıt alınamadı')
      }

      setFormData({
        product_name: '',
        meta_link: '',
        proof_link: '',
        trendyol_link: '',
        amazon_link: '',
        image_url: '',
        ad_count: '',
        country_code: '',
        search_keyword: '',
        scores: {
          innovative: 0,
          lightweight: 0,
          low_variation: 0,
          problem_solving: 0,
          visual_sellable: 0
        },
        notes: ''
      })
      // Başarılı kayıt sonrası formu temizle
      setFormData({
        product_name: '',
        meta_link: '',
        proof_link: '',
        trendyol_link: '',
        amazon_link: '',
        image_url: '',
        ad_count: '',
        country_code: '',
        search_keyword: '',
        scores: {
          innovative: 0,
          lightweight: 0,
          low_variation: 0,
          problem_solving: 0,
          visual_sellable: 0
        },
        notes: ''
      })
      
      if (onProductsChange) onProductsChange()
      
      // Başarı mesajı
      console.log('Ürün başarıyla kaydedildi:', data[0])
    } catch (error) {
      console.error('Error saving product:', error)
      const errorMessage = error.message || 'Ürün kaydedilirken hata oluştu'
      alert(`Ürün kaydedilemedi: ${errorMessage}`)
    } finally {
      setSaving(false)
    }
  }


  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header - Fixed */}
      <div style={{ flexShrink: 0, marginBottom: '0.75rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.75rem' }}>Hızlı Analiz ve Kayıt</h2>
      </div>

      {/* Quick Add Form - Scrollable */}
      <div
        id="product-form"
        style={{
          padding: '1rem',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          background: 'white',
          overflowY: 'auto',
          flex: 1,
          minHeight: 0
        }}
      >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '12px', fontWeight: '500' }}>Görsel URL</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={formData.image_url}
                    onChange={e => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                    placeholder="https://..."
                    style={{ flex: 1, padding: '0.5rem 0.65rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}
                  />
                  {formData.image_url && (
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                      onError={e => { e.target.style.display = 'none' }}
                    />
                  )}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '12px', fontWeight: '500' }}>Ürün Adı</label>
                <input
                  type="text"
                  value={formData.product_name}
                  onChange={e => setFormData(prev => ({ ...prev, product_name: e.target.value }))}
                  placeholder="Ürün adı"
                  style={{ width: '100%', padding: '0.5rem 0.65rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '12px', fontWeight: '500' }}>Meta Linki</label>
                <input
                  type="text"
                  value={formData.meta_link}
                  onChange={e => setFormData(prev => ({ ...prev, meta_link: e.target.value }))}
                  placeholder="https://www.facebook.com/ads/library/..."
                  style={{ width: '100%', padding: '0.5rem 0.65rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '12px', fontWeight: '500' }}>Trendyol Linki</label>
                <input
                  type="text"
                  value={formData.trendyol_link}
                  onChange={e => setFormData(prev => ({ ...prev, trendyol_link: e.target.value }))}
                  placeholder="https://www.trendyol.com/..."
                  style={{ width: '100%', padding: '0.5rem 0.65rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '12px', fontWeight: '500' }}>Amazon Linki</label>
                <input
                  type="text"
                  value={formData.amazon_link}
                  onChange={e => setFormData(prev => ({ ...prev, amazon_link: e.target.value }))}
                  placeholder="https://www.amazon.com/..."
                  style={{ width: '100%', padding: '0.5rem 0.65rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '12px', fontWeight: '500' }}>Reklam Sayısı</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    value={formData.ad_count}
                    onChange={e => setFormData(prev => ({ ...prev, ad_count: e.target.value }))}
                    placeholder="0"
                    min="0"
                    style={{ width: '100%', padding: '0.5rem 0.65rem', border: `1px solid ${hasBrandingSignal ? 'var(--color-success)' : 'var(--color-border)'}`, borderRadius: 'var(--radius-sm)', fontSize: '13px', transition: 'border var(--transition-fast)' }}
                  />
                  {hasBrandingSignal && (
                    <span style={{ position: 'absolute', top: '-8px', right: '8px', padding: '0.2rem 0.4rem', background: 'var(--color-success)', color: 'white', borderRadius: 'var(--radius-sm)', fontSize: '10px', fontWeight: '700' }}>
                      🔥 Markalaşma
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {CRITERIA.map(criterion => (
                <StarRating
                  key={criterion.key}
                  label={`${criterion.label}`}
                  value={formData.scores[criterion.key]}
                  onChange={value => handleScoreChange(criterion.key, value)}
                />
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '12px', fontWeight: '500' }}>Ülke Kodu (US/CA/GB/AU/NZ)</label>
                <input
                  type="text"
                  value={formData.country_code}
                  onChange={e => setFormData(prev => ({ ...prev, country_code: e.target.value }))}
                  placeholder="US"
                  style={{ width: '100%', padding: '0.5rem 0.65rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '12px', fontWeight: '500' }}>Anahtar Kelime</label>
                <input
                  type="text"
                  value={formData.search_keyword}
                  onChange={e => setFormData(prev => ({ ...prev, search_keyword: e.target.value }))}
                  placeholder="örn: free shipping"
                  style={{ width: '100%', padding: '0.5rem 0.65rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '12px', fontWeight: '500' }}>Meta Linki (Kanıt)</label>
                <input
                  type="text"
                  value={formData.proof_link}
                  onChange={e => setFormData(prev => ({ ...prev, proof_link: e.target.value }))}
                  placeholder="Meta Ads Library linki (search_type=page&view_all_page_id=...)"
                  style={{ width: '100%', padding: '0.5rem 0.65rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '12px', fontWeight: '500' }}>Not</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  style={{ width: '100%', padding: '0.55rem 0.65rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: '13px', resize: 'vertical' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', alignItems: 'end' }}>
              {potentialScore > 0 && (
                <div style={{ padding: '0.75rem', background: 'var(--color-background)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Potansiyel Skoru</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: potentialScore >= 4 ? 'var(--color-success)' : potentialScore >= 3 ? 'var(--color-warning)' : 'var(--color-error)' }}>
                    {potentialScore.toFixed(1)}/5
                  </div>
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={saving}
                className="primary"
                style={{ padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: '600', fontSize: '13px', background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', boxShadow: 'var(--shadow-glow)', opacity: saving ? 0.5 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}
              >
                <Save size={16} />
                Kaydet
              </button>
            </div>
          </div>
        </div>
    </div>
  )
}


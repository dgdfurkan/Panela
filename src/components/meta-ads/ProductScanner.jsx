import { useState, useEffect } from 'react'
import { Save, List, Grid, X, Image as ImageIcon } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import StarRating from './StarRating'
import ProductCard from './ProductCard'
import ProductList from './ProductList'

const CRITERIA = [
  { key: 'innovative', label: 'İnovatif mi?' },
  { key: 'lightweight', label: 'Hafif mi?' },
  { key: 'low_variation', label: 'Varyasyonu Az mı?' },
  { key: 'problem_solving', label: 'Sorun Çözüyor mu?' },
  { key: 'visual_sellable', label: 'Göstererek Satılabilir mi?' }
]

export default function ProductScanner({ userId }) {
  const [viewMode, setViewMode] = useState('card') // 'card' or 'list'
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    product_name: '',
    meta_link: '',
    image_url: '',
    ad_count: '',
    scores: {
      innovative: 0,
      lightweight: 0,
      low_variation: 0,
      problem_solving: 0,
      visual_sellable: 0
    },
    notes: ''
  })
  const [editingProduct, setEditingProduct] = useState(null)

  useEffect(() => {
    if (userId) {
      loadProducts()
    }
  }, [userId])

  useEffect(() => {
    // Calculate potential score
    const scores = Object.values(formData.scores)
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length
    setFormData(prev => ({ ...prev, potential_score: avg }))
  }, [formData.scores])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('discovered_products')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    // Validation: Meta Link, Ad Count, and all 5 criteria are required
    if (!formData.meta_link.trim()) {
      alert('Meta Linki gereklidir')
      return
    }

    if (!formData.ad_count || parseInt(formData.ad_count) < 0) {
      alert('Reklam Sayısı gereklidir')
      return
    }

    // Check if all 5 criteria are filled (must be > 0)
    const allCriteriaFilled = Object.values(formData.scores).every(score => score > 0)
    if (!allCriteriaFilled) {
      alert('Tüm kriterler (İnovatif, Hafif, Varyasyon, Sorun Çözme, Görsel Satış) doldurulmalıdır')
      return
    }

    setSaving(true)
    try {
      const scores = formData.scores
      const potential_score = Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length

      const productData = {
        user_id: userId,
        product_name: formData.product_name.trim() || null,
        meta_link: formData.meta_link.trim(),
        image_url: formData.image_url.trim() || null,
        ad_count: parseInt(formData.ad_count),
        scores,
        potential_score: parseFloat(potential_score.toFixed(2)),
        notes: formData.notes.trim() || null
      }

      if (editingProduct) {
        // Update
        const { error } = await supabase
          .from('discovered_products')
          .update(productData)
          .eq('id', editingProduct.id)

        if (error) throw error
      } else {
        // Insert
        const { error } = await supabase
          .from('discovered_products')
          .insert([productData])

        if (error) throw error
      }

      // Reset form
      setFormData({
        product_name: '',
        meta_link: '',
        image_url: '',
        ad_count: '',
        scores: {
          innovative: 0,
          lightweight: 0,
          low_variation: 0,
          problem_solving: 0,
          visual_sellable: 0
        },
        notes: ''
      })
      setEditingProduct(null)
      loadProducts()
    } catch (error) {
      console.error('Error saving product:', error)
      alert('Ürün kaydedilirken bir hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      product_name: product.product_name || '',
      meta_link: product.meta_link || '',
      image_url: product.image_url || '',
      ad_count: product.ad_count?.toString() || '',
      scores: typeof product.scores === 'string' 
        ? JSON.parse(product.scores) 
        : product.scores || {
            innovative: 0,
            lightweight: 0,
            low_variation: 0,
            problem_solving: 0,
            visual_sellable: 0
          },
      notes: product.notes || ''
    })
    // Scroll to form
    document.getElementById('product-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleScoreChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      scores: {
        ...prev.scores,
        [key]: value
      }
    }))
  }

  const adCount = parseInt(formData.ad_count) || 0
  const hasBrandingSignal = adCount > 30
  const potentialScore = Object.values(formData.scores).reduce((a, b) => a + b, 0) / Object.values(formData.scores).length

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header - Fixed */}
      <div style={{ flexShrink: 0, marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>Hızlı Analiz ve Kayıt</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '0.5rem',
                border: `1px solid ${viewMode === 'list' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-sm)',
                background: viewMode === 'list' ? 'rgba(139, 92, 246, 0.1)' : 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <List size={18} />
            </button>
            <button
              onClick={() => setViewMode('card')}
              style={{
                padding: '0.5rem',
                border: `1px solid ${viewMode === 'card' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-sm)',
                background: viewMode === 'card' ? 'rgba(139, 92, 246, 0.1)' : 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Grid size={18} />
            </button>
          </div>
        </div>

        {/* Quick Add Form - Compact and Scrollable */}
        <div
          id="product-form"
          style={{
            padding: '1rem',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            background: 'white',
            marginBottom: '0.75rem',
            maxHeight: '35vh',
            overflowY: 'auto'
          }}
        >
          {editingProduct && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ fontWeight: '600', color: 'var(--color-primary)', fontSize: '13px' }}>Düzenleniyor: {editingProduct.product_name || 'İsimsiz Ürün'}</span>
              <button
                onClick={() => {
                  setEditingProduct(null)
                  setFormData({
                    product_name: '',
                    meta_link: '',
                    image_url: '',
                    ad_count: '',
                    scores: {
                      innovative: 0,
                      lightweight: 0,
                      low_variation: 0,
                      problem_solving: 0,
                      visual_sellable: 0
                    },
                    notes: ''
                  })
                }}
                style={{
                  padding: '0.25rem 0.5rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '11px'
                }}
              >
                <X size={12} />
                İptal
              </button>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Compact Grid Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {/* Image URL */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '12px', fontWeight: '500' }}>
                  Görsel URL
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={formData.image_url}
                    onChange={e => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                    placeholder="https://..."
                    style={{
                      flex: 1,
                      padding: '0.5rem 0.65rem',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '13px'
                    }}
                  />
                  {formData.image_url && (
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      style={{
                        width: '40px',
                        height: '40px',
                        objectFit: 'cover',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--color-border)'
                      }}
                      onError={e => {
                        e.target.style.display = 'none'
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Product Name */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '12px', fontWeight: '500' }}>
                  Ürün Adı
                </label>
                <input
                  type="text"
                  value={formData.product_name}
                  onChange={e => setFormData(prev => ({ ...prev, product_name: e.target.value }))}
                  placeholder="Ürün adı"
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.65rem',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '13px'
                  }}
                />
              </div>
            </div>

            {/* Meta Link */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '12px', fontWeight: '500' }}>
                Meta Linki *
              </label>
              <input
                type="text"
                value={formData.meta_link}
                onChange={e => setFormData(prev => ({ ...prev, meta_link: e.target.value }))}
                placeholder="https://www.facebook.com/ads/library/..."
                required
                style={{
                  width: '100%',
                  padding: '0.5rem 0.65rem',
                  border: `1px solid ${!formData.meta_link.trim() ? 'var(--color-error)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px'
                }}
              />
            </div>

            {/* Ad Count */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '12px', fontWeight: '500' }}>
                Reklam Sayısı *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  value={formData.ad_count}
                  onChange={e => setFormData(prev => ({ ...prev, ad_count: e.target.value }))}
                  placeholder="0"
                  required
                  min="0"
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.65rem',
                    border: `1px solid ${hasBrandingSignal ? 'var(--color-success)' : (!formData.ad_count || parseInt(formData.ad_count) < 0) ? 'var(--color-error)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '13px',
                    transition: 'border var(--transition-fast)'
                  }}
                />
                {hasBrandingSignal && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '8px',
                      padding: '0.2rem 0.4rem',
                      background: 'var(--color-success)',
                      color: 'white',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '10px',
                      fontWeight: '700'
                    }}
                  >
                    🔥 Markalaşma
                  </span>
                )}
              </div>
            </div>

            {/* Star Ratings - Compact Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {CRITERIA.map(criterion => (
                <StarRating
                  key={criterion.key}
                  label={`${criterion.label} *`}
                  value={formData.scores[criterion.key]}
                  onChange={value => handleScoreChange(criterion.key, value)}
                />
              ))}
            </div>

            {/* Potential Score and Save Button - Side by Side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', alignItems: 'end' }}>
              {/* Potential Score */}
              {potentialScore > 0 && (
                <div
                  style={{
                    padding: '0.75rem',
                    background: 'var(--color-background)',
                    borderRadius: 'var(--radius-sm)',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                    Potansiyel Skoru
                  </div>
                  <div
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      color: potentialScore >= 4 ? 'var(--color-success)' : potentialScore >= 3 ? 'var(--color-warning)' : 'var(--color-error)'
                    }}
                  >
                    {potentialScore.toFixed(1)}/5
                  </div>
                </div>
              )}

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={saving || !formData.meta_link.trim() || !formData.ad_count || !Object.values(formData.scores).every(s => s > 0)}
                className="primary"
                style={{
                  padding: '0.6rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontWeight: '600',
                  fontSize: '13px',
                  background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                  boxShadow: 'var(--shadow-glow)',
                  opacity: (!formData.meta_link.trim() || !formData.ad_count || !Object.values(formData.scores).every(s => s > 0)) ? 0.5 : 1,
                  cursor: (!formData.meta_link.trim() || !formData.ad_count || !Object.values(formData.scores).every(s => s > 0)) ? 'not-allowed' : 'pointer'
                }}
              >
                <Save size={16} />
                {editingProduct ? 'Güncelle' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Products List - Scrollable */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
            Yükleniyor...
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
            Henüz ürün eklenmedi
          </div>
        ) : viewMode === 'card' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {products.map(product => (
              <ProductCard key={product.id} product={product} onEdit={handleEdit} />
            ))}
          </div>
        ) : (
          <ProductList products={products} onEdit={handleEdit} />
        )}
      </div>
    </div>
  )
}


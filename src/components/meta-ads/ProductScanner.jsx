import { useEffect, useMemo, useState } from 'react'
import { Save, List, Grid, Trash2, MessageSquare } from 'lucide-react'
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
  const [viewMode, setViewMode] = useState('card')
  const [products, setProducts] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filterUser, setFilterUser] = useState('all')

  const [formData, setFormData] = useState({
    product_name: '',
    meta_link: '',
    trendyol_link: '',
    amazon_link: '',
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

  const [selectedProduct, setSelectedProduct] = useState(null)
  const [comments, setComments] = useState([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [unreadCounts, setUnreadCounts] = useState({})

  const potentialScore = useMemo(() => {
    const scores = Object.values(formData.scores)
    if (scores.length === 0) return 0
    return scores.reduce((a, b) => a + b, 0) / scores.length
  }, [formData.scores])

  useEffect(() => {
    if (userId) {
      loadProducts()
      loadCommentsMeta()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, filterUser])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const { data: usersData } = await supabase
        .from('app_users')
        .select('id, username, full_name')
        .order('username', { ascending: true })
      if (usersData) setAllUsers(usersData)

      let query = supabase
        .from('discovered_products')
        .select('*, app_users(id, username, full_name)')
        .order('created_at', { ascending: false })

      if (filterUser === 'me') {
        query = query.eq('user_id', userId)
      } else if (filterUser !== 'all') {
        query = query.eq('user_id', filterUser)
      }

      const { data, error } = await query
      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error loading products:', error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const loadCommentsMeta = async () => {
    if (!userId) return
    try {
      const { data: commentsData } = await supabase
        .from('product_comments')
        .select('id, product_id')
      const { data: readsData } = await supabase
        .from('comment_reads')
        .select('comment_id')
        .eq('user_id', userId)

      const readSet = new Set(readsData?.map(r => r.comment_id) || [])
      const unreadMap = {}
      commentsData?.forEach(c => {
        unreadMap[c.product_id] = (unreadMap[c.product_id] || 0) + (readSet.has(c.id) ? 0 : 1)
      })
      setUnreadCounts(unreadMap)
    } catch (error) {
      console.error('Error loading comments meta:', error)
    }
  }

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
      const scores = formData.scores
      const potential_score = Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length

      const productData = {
        user_id: userId,
        product_name: formData.product_name.trim() || null,
        meta_link: formData.meta_link.trim() || null,
        trendyol_link: formData.trendyol_link.trim() || null,
        amazon_link: formData.amazon_link.trim() || null,
        image_url: formData.image_url.trim() || null,
        ad_count: formData.ad_count ? parseInt(formData.ad_count) : null,
        scores,
        potential_score: parseFloat((isFinite(potential_score) ? potential_score : 0).toFixed(2)),
        notes: formData.notes.trim() || null
      }

      const { error } = await supabase
        .from('discovered_products')
        .insert([productData])

      if (error) throw error

      setFormData({
        product_name: '',
        meta_link: '',
        trendyol_link: '',
        amazon_link: '',
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
      await loadProducts()
      await loadCommentsMeta()
    } catch (error) {
      console.error('Error saving product:', error)
      alert('Ürün kaydedilirken hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  const handleOpenProduct = async (product) => {
    setSelectedProduct(product)
    await loadProductComments(product.id)
  }

  const loadProductComments = async (productId) => {
    setCommentsLoading(true)
    try {
      const { data, error } = await supabase
        .from('product_comments')
        .select('id, user_id, content, created_at, app_users(id, username, full_name)')
        .eq('product_id', productId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setComments(data || [])

      if (data && data.length > 0 && userId) {
        const upserts = data.map(c => ({
          comment_id: c.id,
          user_id: userId,
          seen_at: new Date().toISOString()
        }))
        await supabase.from('comment_reads').upsert(upserts, { onConflict: 'comment_id,user_id' })
        setUnreadCounts(prev => ({ ...prev, [productId]: 0 }))
      }
    } catch (error) {
      console.error('Error loading comments:', error)
    } finally {
      setCommentsLoading(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedProduct) return
    try {
      const { error } = await supabase
        .from('product_comments')
        .insert({
          product_id: selectedProduct.id,
          user_id: userId,
          content: newComment.trim()
        })
      if (error) throw error
      setNewComment('')
      await loadProductComments(selectedProduct.id)
      await loadCommentsMeta()
    } catch (error) {
      console.error('Error adding comment:', error)
      alert('Yorum eklenirken hata oluştu')
    }
  }

  const handleUpdateProduct = async (fields) => {
    if (!selectedProduct || selectedProduct.user_id !== userId) return
    try {
      const payload = { ...fields }
      const { error } = await supabase
        .from('discovered_products')
        .update(payload)
        .eq('id', selectedProduct.id)
        .eq('user_id', userId)
      if (error) throw error
      await loadProducts()
      const refreshed = (await supabase
        .from('discovered_products')
        .select('*, app_users(id, username, full_name)')
        .eq('id', selectedProduct.id)
        .single()).data
      setSelectedProduct(refreshed || null)
    } catch (error) {
      console.error('Error updating product:', error)
      alert('Ürün güncellenemedi')
    }
  }

  const handleDeleteProduct = async () => {
    if (!selectedProduct || selectedProduct.user_id !== userId) return
    if (!confirm('Bu ürünü silmek istediğine emin misin?')) return
    try {
      const { error } = await supabase
        .from('discovered_products')
        .delete()
        .eq('id', selectedProduct.id)
        .eq('user_id', userId)
      if (error) throw error
      setSelectedProduct(null)
      await loadProducts()
      await loadCommentsMeta()
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Ürün silinemedi')
    }
  }

  const renderModal = () => {
    if (!selectedProduct) return null
    const isOwner = selectedProduct.user_id === userId
    const userInfo = selectedProduct.app_users || {}
    const createdAtText = selectedProduct.created_at
      ? new Date(selectedProduct.created_at).toLocaleString('tr-TR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : ''

    const handleFieldChange = (key, value) => {
      if (!isOwner) return
      setSelectedProduct(prev => ({ ...prev, [key]: value }))
    }

    const handleSaveModal = async () => {
      if (!isOwner) return
      await handleUpdateProduct({
        product_name: selectedProduct.product_name || null,
        meta_link: selectedProduct.meta_link || null,
        trendyol_link: selectedProduct.trendyol_link || null,
        amazon_link: selectedProduct.amazon_link || null,
        image_url: selectedProduct.image_url || null,
        ad_count: selectedProduct.ad_count ?? null,
        notes: selectedProduct.notes || null,
        scores: selectedProduct.scores,
        potential_score: selectedProduct.potential_score
      })
    }

    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 1100
        }}
        onClick={() => setSelectedProduct(null)}
      >
        <div
          style={{
            background: 'white',
            borderRadius: '16px',
            maxWidth: '900px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'hidden',
            display: 'grid',
            gridTemplateColumns: '1.2fr 0.8fr'
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Left: product info */}
          <div style={{ padding: '1.25rem', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  Ekleyen: {userInfo.username || userInfo.full_name || 'Bilinmeyen'}
                </div>
                {createdAtText && (
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    Eklenme: {createdAtText}
                  </div>
                )}
                <h3 style={{ margin: '0.25rem 0', fontSize: '18px' }}>
                  {selectedProduct.product_name || 'İsimsiz Ürün'}
                </h3>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {isOwner && (
                  <button
                    onClick={handleDeleteProduct}
                    style={{
                      border: '1px solid var(--color-error)',
                      color: 'var(--color-error)',
                      background: 'white',
                      borderRadius: '10px',
                      padding: '0.4rem 0.7rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontWeight: '600'
                    }}
                  >
                    <Trash2 size={14} />
                    Sil
                  </button>
                )}
                <button
                  onClick={() => setSelectedProduct(null)}
                  style={{
                    border: '1px solid var(--color-border)',
                    background: 'white',
                    borderRadius: '10px',
                    padding: '0.4rem 0.7rem',
                    fontWeight: '600'
                  }}
                >
                  Kapat
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Meta Link</label>
                <input
                  type="text"
                  value={selectedProduct.meta_link || ''}
                  onChange={e => handleFieldChange('meta_link', e.target.value)}
                  disabled={!isOwner}
                  style={{ width: '100%', padding: '0.55rem 0.65rem', border: '1px solid var(--color-border)', borderRadius: '10px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Trendyol Link</label>
                <input
                  type="text"
                  value={selectedProduct.trendyol_link || ''}
                  onChange={e => handleFieldChange('trendyol_link', e.target.value)}
                  disabled={!isOwner}
                  style={{ width: '100%', padding: '0.55rem 0.65rem', border: '1px solid var(--color-border)', borderRadius: '10px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Amazon Link</label>
                <input
                  type="text"
                  value={selectedProduct.amazon_link || ''}
                  onChange={e => handleFieldChange('amazon_link', e.target.value)}
                  disabled={!isOwner}
                  style={{ width: '100%', padding: '0.55rem 0.65rem', border: '1px solid var(--color-border)', borderRadius: '10px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Reklam Sayısı</label>
                <input
                  type="number"
                  value={selectedProduct.ad_count ?? ''}
                  onChange={e => handleFieldChange('ad_count', e.target.value)}
                  disabled={!isOwner}
                  style={{ width: '100%', padding: '0.55rem 0.65rem', border: '1px solid var(--color-border)', borderRadius: '10px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {CRITERIA.map(c => {
                const value = (selectedProduct.scores && selectedProduct.scores[c.key]) || 0
                return (
                  <div key={c.key} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: '10px', background: 'var(--color-background)' }}>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: '700' }}>{c.label}</span>
                    <span style={{ fontWeight: '700', fontSize: '13px' }}>{value || 0}/5</span>
                  </div>
                )
              })}
            </div>

            <div>
              <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Not</label>
              <textarea
                value={selectedProduct.notes || ''}
                onChange={e => handleFieldChange('notes', e.target.value)}
                disabled={!isOwner}
                rows={3}
                style={{ width: '100%', padding: '0.55rem 0.65rem', border: '1px solid var(--color-border)', borderRadius: '10px', resize: 'vertical' }}
              />
            </div>

            {isOwner && (
              <div>
                <button
                  onClick={handleSaveModal}
                  style={{
                    padding: '0.6rem 1rem',
                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                    color: 'white',
                    borderRadius: '12px',
                    fontWeight: '700',
                    border: 'none',
                    width: '100%'
                  }}
                >
                  Güncelle
                </button>
              </div>
            )}
          </div>

          {/* Right: comments */}
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <MessageSquare size={16} color="var(--color-primary)" />
              <span style={{ fontWeight: '700' }}>Yorumlar</span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '0.75rem', marginBottom: '0.75rem', background: 'var(--color-background)' }}>
              {commentsLoading ? (
                <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>Yükleniyor...</div>
              ) : comments.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>Henüz yorum yok</div>
              ) : (
                comments.map(c => {
                  const u = c.app_users || {}
                  return (
                    <div key={c.id} style={{ padding: '0.65rem', borderRadius: '8px', background: 'white', marginBottom: '0.5rem', border: '1px solid var(--color-border)' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700' }}>{u.username || u.full_name || 'Bilinmeyen'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{new Date(c.created_at).toLocaleString('tr-TR')}</div>
                      <div style={{ marginTop: '0.35rem', fontSize: '13px' }}>{c.content}</div>
                    </div>
                  )
                })
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Yorum yaz..."
                style={{ flex: 1, padding: '0.65rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: '10px' }}
              />
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                style={{
                  padding: '0.65rem 1rem',
                  background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                  color: 'white',
                  borderRadius: '10px',
                  border: 'none',
                  fontWeight: '700',
                  opacity: !newComment.trim() ? 0.5 : 1,
                  cursor: !newComment.trim() ? 'not-allowed' : 'pointer'
                }}
              >
                Gönder
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header - Fixed */}
      <div style={{ flexShrink: 0, marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>Hızlı Analiz ve Kayıt</h2>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <select
              value={filterUser}
              onChange={e => setFilterUser(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                background: 'white',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              <option value="all">Tüm Kullanıcılar</option>
              <option value="me">Sadece Benim</option>
              {allUsers.filter(u => u.id !== userId).map(user => (
                <option key={user.id} value={user.id}>
                  {user.username || user.full_name || 'Bilinmeyen'}
                </option>
              ))}
            </select>
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

        {/* Quick Add Form */}
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

            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '12px', fontWeight: '500' }}>Not</label>
              <textarea
                value={formData.notes}
                onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                style={{ width: '100%', padding: '0.55rem 0.65rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: '13px', resize: 'vertical' }}
              />
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

      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>Yükleniyor...</div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>Henüz ürün eklenmedi</div>
        ) : viewMode === 'card' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {products.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={() => handleOpenProduct(product)}
                currentUserId={userId}
                unreadCount={unreadCounts[product.id] || 0}
              />
            ))}
          </div>
        ) : (
          <ProductList
            products={products}
            onEdit={handleOpenProduct}
            currentUserId={userId}
            unreadCounts={unreadCounts}
          />
        )}
      </div>

      {renderModal()}
    </div>
  )
}


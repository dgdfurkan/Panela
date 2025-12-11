import { useAuth } from '../context/AuthContext'
import KeywordLauncher from '../components/meta-ads/KeywordLauncher'
import ProductScanner from '../components/meta-ads/ProductScanner'
import { Search, Zap, Rocket, Package, MessageSquare, Trash2, Filter, X } from 'lucide-react'
import AutoMetaScanner from '../components/meta-ads/AutoMetaScanner'
import { useState, useEffect, useMemo } from 'react'
import ProductCard from '../components/meta-ads/ProductCard'
import { supabase } from '../lib/supabaseClient'

const CRITERIA = [
  { key: 'innovative', label: 'İnovatif mi?' },
  { key: 'lightweight', label: 'Hafif mi?' },
  { key: 'low_variation', label: 'Varyasyonu Az mı?' },
  { key: 'problem_solving', label: 'Sorun Çözüyor mu?' },
  { key: 'visual_sellable', label: 'Göstererek Satılabilir mi?' }
]

export default function Research() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('classic') // classic | products | auto
  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [unreadCounts, setUnreadCounts] = useState({})
  const [allUsers, setAllUsers] = useState([])
  
  // Filters
  const [filterUser, setFilterUser] = useState('all')
  const [filterAdCountMin, setFilterAdCountMin] = useState('')
  const [filterAdCountMax, setFilterAdCountMax] = useState('')
  const [filterCountry, setFilterCountry] = useState('')
  const [filterKeyword, setFilterKeyword] = useState('')
  
  // Modal state
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [comments, setComments] = useState([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [newComment, setNewComment] = useState('')

  useEffect(() => {
    if (user?.id) {
      loadUsers()
      loadProducts()
      loadUnreadCounts()
    }
  }, [user?.id])

  // Modal açıldığında body scroll'unu engelle ve sayfa kaymasını önle
  useEffect(() => {
    if (selectedProduct) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      document.body.style.overflow = 'hidden'
      document.body.style.paddingRight = `${scrollbarWidth}px`
    } else {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
  }, [selectedProduct])

  useEffect(() => {
    if (user?.id) {
      loadProducts()
    }
  }, [filterUser, filterAdCountMin, filterAdCountMax, filterCountry, filterKeyword, user?.id])

  const loadUsers = async () => {
    try {
      const { data } = await supabase
        .from('app_users')
        .select('id, username, full_name')
        .order('username', { ascending: true })
      if (data) setAllUsers(data)
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const loadProducts = async () => {
    setProductsLoading(true)
    try {
      let query = supabase
        .from('discovered_products')
        .select('*, app_users(id, username, full_name)')
        .order('created_at', { ascending: false })

      if (filterUser === 'me') {
        query = query.eq('user_id', user.id)
      } else if (filterUser !== 'all') {
        query = query.eq('user_id', filterUser)
      }

      if (filterAdCountMin) {
        query = query.gte('ad_count', parseInt(filterAdCountMin) || 0)
      }
      if (filterAdCountMax) {
        query = query.lte('ad_count', parseInt(filterAdCountMax) || 999999)
      }
      if (filterCountry) {
        query = query.eq('country_code', filterCountry.toUpperCase())
      }
      if (filterKeyword) {
        query = query.ilike('search_keyword', `%${filterKeyword}%`)
      }

      const { data, error } = await query
      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error loading products:', error)
      setProducts([])
    } finally {
      setProductsLoading(false)
    }
  }

  const loadUnreadCounts = async () => {
    if (!user?.id) return
    try {
      // Tüm yorumları al
      const { data: allComments } = await supabase
        .from('product_comments')
        .select('id, product_id')
      
      // Bu kullanıcının okuduğu yorumları al
      const { data: readComments } = await supabase
        .from('comment_reads')
        .select('comment_id')
        .eq('user_id', user.id)
      
      const readSet = new Set(readComments?.map(r => r.comment_id) || [])
      const counts = {}
      
      if (allComments) {
        allComments.forEach(comment => {
          if (!readSet.has(comment.id)) {
            counts[comment.product_id] = (counts[comment.product_id] || 0) + 1
          }
        })
      }
      
      setUnreadCounts(counts)
    } catch (error) {
      console.error('Error loading unread counts:', error)
    }
  }

  const handleOpenProduct = async (product) => {
    setSelectedProduct(product)
    await loadProductComments(product.id)
    await loadUnreadCounts() // Badge'leri güncelle
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

      if (data && data.length > 0 && user?.id) {
        const upserts = data.map(c => ({
          comment_id: c.id,
          user_id: user.id,
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
          user_id: user.id,
          content: newComment.trim()
        })
      if (error) throw error
      setNewComment('')
      await loadProductComments(selectedProduct.id)
      await loadUnreadCounts()
    } catch (error) {
      console.error('Error adding comment:', error)
      alert('Yorum eklenirken hata oluştu')
    }
  }

  const handleUpdateProduct = async (fields) => {
    if (!selectedProduct || selectedProduct.user_id !== user?.id) return
    try {
      const { error } = await supabase
        .from('discovered_products')
        .update(fields)
        .eq('id', selectedProduct.id)
        .eq('user_id', user.id)
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
    if (!selectedProduct || selectedProduct.user_id !== user?.id) return
    if (!confirm('Bu ürünü silmek istediğine emin misin?')) return
    try {
      const { data: commentIds } = await supabase
        .from('product_comments')
        .select('id')
        .eq('product_id', selectedProduct.id)

      const ids = (commentIds || []).map(c => c.id)
      if (ids.length > 0) {
        await supabase
          .from('comment_reads')
          .delete()
          .in('comment_id', ids)
      }

      await supabase
        .from('product_comments')
        .delete()
        .eq('product_id', selectedProduct.id)

      const { error } = await supabase
        .from('discovered_products')
        .delete()
        .eq('id', selectedProduct.id)
        .eq('user_id', user.id)
      if (error) throw error
      setSelectedProduct(null)
      await loadProducts()
      await loadUnreadCounts()
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Ürün silinemedi')
    }
  }

  const renderModal = () => {
    if (!selectedProduct) return null
    const isOwner = selectedProduct.user_id === user?.id
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
        proof_link: selectedProduct.proof_link || null,
        trendyol_link: selectedProduct.trendyol_link || null,
        amazon_link: selectedProduct.amazon_link || null,
        image_url: selectedProduct.image_url || null,
        ad_count: selectedProduct.ad_count ?? null,
        country_code: selectedProduct.country_code || null,
        search_keyword: selectedProduct.search_keyword || null,
        notes: selectedProduct.notes || null,
        scores: selectedProduct.scores,
        potential_score: selectedProduct.potential_score
      })
    }

    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 1100,
          overflowY: 'auto',
          overflowX: 'hidden'
        }}
        onClick={async () => {
          setSelectedProduct(null)
          await loadUnreadCounts() // Modal kapandığında badge'leri güncelle
        }}
      >
        <div
          style={{
            background: 'white',
            borderRadius: '16px',
            width: 'min(95vw, 1000px)',
            maxWidth: '1000px',
            minHeight: 'min(85vh, 700px)',
            maxHeight: '85vh',
            overflow: 'hidden',
            display: 'grid',
            gridTemplateColumns: '1.2fr 0.8fr',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            margin: 'auto',
            marginTop: '2rem',
            marginBottom: '2rem'
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Left: product info */}
          <div style={{ 
            padding: '1.5rem', 
            borderRight: '1px solid var(--color-border)', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '1rem', 
            overflowY: 'auto',
            overflowX: 'hidden',
            minHeight: 0,
            maxHeight: '85vh'
          }}>
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
                  onClick={async () => {
                    setSelectedProduct(null)
                    await loadUnreadCounts() // Modal kapandığında badge'leri güncelle
                  }}
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Ülke Kodu (US/CA/GB/AU/NZ)</label>
                <input
                  type="text"
                  value={selectedProduct.country_code || ''}
                  onChange={e => handleFieldChange('country_code', e.target.value)}
                  disabled={!isOwner}
                  style={{ width: '100%', padding: '0.55rem 0.65rem', border: '1px solid var(--color-border)', borderRadius: '10px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Anahtar Kelime</label>
                <input
                  type="text"
                  value={selectedProduct.search_keyword || ''}
                  onChange={e => handleFieldChange('search_keyword', e.target.value)}
                  disabled={!isOwner}
                  style={{ width: '100%', padding: '0.55rem 0.65rem', border: '1px solid var(--color-border)', borderRadius: '10px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Reklam Sayısı Kanıt Linki</label>
              <input
                type="text"
                value={selectedProduct.proof_link || ''}
                onChange={e => handleFieldChange('proof_link', e.target.value)}
                disabled={!isOwner}
                style={{ width: '100%', padding: '0.55rem 0.65rem', border: '1px solid var(--color-border)', borderRadius: '10px' }}
              />
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
          <div style={{ 
            padding: '1.5rem', 
            display: 'flex', 
            flexDirection: 'column', 
            minHeight: 0,
            maxHeight: '85vh',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', flexShrink: 0 }}>
              <MessageSquare size={16} color="var(--color-primary)" />
              <span style={{ fontWeight: '700' }}>Yorumlar</span>
            </div>

            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              border: '1px solid var(--color-border)', 
              borderRadius: '10px', 
              padding: '0.75rem', 
              marginBottom: '0.75rem', 
              background: 'var(--color-background)',
              minHeight: 0
            }}>
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

            <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
              <input
                type="text"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Yorum yaz..."
                style={{ flex: 1, padding: '0.65rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: '10px' }}
                onKeyPress={e => e.key === 'Enter' && handleAddComment()}
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

  const hasActiveFilters = filterUser !== 'all' || filterAdCountMin || filterAdCountMax || filterCountry || filterKeyword
  const availableCountries = useMemo(() => {
    const countries = new Set()
    products.forEach(p => {
      if (p.country_code) countries.add(p.country_code)
    })
    return Array.from(countries).sort()
  }, [products])

  return (
    <div className="page-container fade-in">
      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '0 1rem' }}>
        {/* Header */}
        <div className="page-head" style={{ marginBottom: '2rem' }}>
          <div>
            <div className="eyebrow">Meta Ads Discovery Hub</div>
            <h1 style={{ margin: '0.5rem 0', fontSize: '2rem', fontWeight: '700' }}>
              Hızlı Ürün Araştırma Merkezi
            </h1>
            <p style={{ margin: '0.5rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
              "Vur-Kaç" taktiği ile Meta Ads Library'de seri üretim araştırma yap. Anahtar kelimeler ve ülkeler ile hızlıca link oluştur, bulduğun ürünleri anında analiz et ve kaydet.
            </p>
          </div>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-md)'
          }}>
            <Search size={32} color="white" />
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
          <button
            onClick={() => setActiveTab('classic')}
            className="primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1rem',
              background: activeTab === 'classic' ? 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' : 'white',
              color: activeTab === 'classic' ? 'white' : 'var(--color-text-main)',
              border: activeTab === 'classic' ? 'none' : '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              boxShadow: activeTab === 'classic' ? 'var(--shadow-glow)' : 'none'
            }}
          >
            <Zap size={16} />
            Hızlı Başlatıcı
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className="primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1rem',
              background: activeTab === 'products' ? 'linear-gradient(135deg, #10b981, #059669)' : 'white',
              color: activeTab === 'products' ? 'white' : 'var(--color-text-main)',
              border: activeTab === 'products' ? 'none' : '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              boxShadow: activeTab === 'products' ? 'var(--shadow-glow)' : 'none'
            }}
          >
            <Package size={16} />
            Ürünler
          </button>
          <button
            onClick={() => setActiveTab('auto')}
            className="primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1rem',
              background: activeTab === 'auto' ? 'linear-gradient(135deg, #0ea5e9, #6366f1)' : 'white',
              color: activeTab === 'auto' ? 'white' : 'var(--color-text-main)',
              border: activeTab === 'auto' ? 'none' : '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              boxShadow: activeTab === 'auto' ? 'var(--shadow-glow)' : 'none'
            }}
          >
            <Rocket size={16} />
            Otomatik Meta Tarayıcı
          </button>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'products' ? (
          <div>
            {/* Filters */}
            <div
              style={{
                padding: '1rem',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                background: 'white',
                marginBottom: '1rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Filter size={16} color="var(--color-primary)" />
                <span style={{ fontWeight: '600', fontSize: '14px' }}>Filtrele</span>
                {hasActiveFilters && (
                  <button
                    onClick={() => {
                      setFilterUser('all')
                      setFilterAdCountMin('')
                      setFilterAdCountMax('')
                      setFilterCountry('')
                      setFilterKeyword('')
                    }}
                    style={{
                      marginLeft: 'auto',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.35rem 0.65rem',
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: 'var(--color-error)',
                      border: '1px solid var(--color-error)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    <X size={12} />
                    Temizle
                  </button>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '12px', fontWeight: '500', color: 'var(--color-text-muted)' }}>Ürünleri Bulan</label>
                  <select
                    value={filterUser}
                    onChange={e => setFilterUser(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.65rem',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      background: 'white',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="all">Tüm Kullanıcılar</option>
                    <option value="me">Sadece Benim</option>
                    {allUsers.filter(u => u.id !== user?.id).map(u => (
                      <option key={u.id} value={u.id}>
                        {u.username || u.full_name || 'Bilinmeyen'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '12px', fontWeight: '500', color: 'var(--color-text-muted)' }}>Reklam Sayısı (Min)</label>
                  <input
                    type="number"
                    value={filterAdCountMin}
                    onChange={e => setFilterAdCountMin(e.target.value)}
                    placeholder="0"
                    min="0"
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.65rem',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '13px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '12px', fontWeight: '500', color: 'var(--color-text-muted)' }}>Reklam Sayısı (Max)</label>
                  <input
                    type="number"
                    value={filterAdCountMax}
                    onChange={e => setFilterAdCountMax(e.target.value)}
                    placeholder="999"
                    min="0"
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.65rem',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '13px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '12px', fontWeight: '500', color: 'var(--color-text-muted)' }}>Ülke Kodu</label>
                  <select
                    value={filterCountry}
                    onChange={e => setFilterCountry(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.65rem',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      background: 'white',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Tüm Ülkeler</option>
                    {availableCountries.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '12px', fontWeight: '500', color: 'var(--color-text-muted)' }}>Anahtar Kelime</label>
                  <input
                    type="text"
                    value={filterKeyword}
                    onChange={e => setFilterKeyword(e.target.value)}
                    placeholder="Ara..."
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
            </div>

            {/* Products Grid */}
            {productsLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>Yükleniyor...</div>
            ) : products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                {hasActiveFilters ? 'Filtrelere uygun ürün bulunamadı' : 'Henüz ürün eklenmedi'}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {products.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onEdit={() => handleOpenProduct(product)}
                    currentUserId={user?.id}
                    unreadCount={unreadCounts[product.id] || 0}
                  />
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'auto' ? (
          <AutoMetaScanner />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '40% 1px 60%',
              gap: '1.5rem',
              height: 'calc(100vh - 250px)',
              minHeight: '600px'
            }}
          >
            {/* Left Panel: Keyword Launcher */}
            <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <KeywordLauncher userId={user?.id} />
            </div>

            {/* Divider */}
            <div style={{ background: 'var(--color-border)', width: '1px' }} />

            {/* Right Panel: Product Scanner */}
            <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <ProductScanner userId={user?.id} onProductsChange={loadProducts} />
            </div>
          </div>
        )}
      </div>

      {renderModal()}

      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 1024px) {
          .page-container > div > div:last-child {
            grid-template-columns: 1fr !important;
            grid-template-rows: auto 1px auto !important;
            height: auto !important;
            min-height: auto !important;
          }
          .page-container > div > div:last-child > div:first-child {
            height: 500px !important;
          }
          .page-container > div > div:last-child > div:last-child {
            height: 600px !important;
          }
        }
      `}</style>
    </div>
  )
}

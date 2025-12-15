import { useAuth } from '../context/AuthContext'
import KeywordLauncher from '../components/meta-ads/KeywordLauncher'
import ProductScanner from '../components/meta-ads/ProductScanner'
import { Search, Zap, Rocket, Package, MessageSquare, Trash2, Filter, X, FileSpreadsheet, ExternalLink, Hand, Sparkles } from 'lucide-react'
import AutoMetaScanner from '../components/meta-ads/AutoMetaScanner'
import { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import ProductCard from '../components/meta-ads/ProductCard'
import StarRating from '../components/meta-ads/StarRating'
import { supabase } from '../lib/supabaseClient'
import * as XLSX from 'xlsx'

const CRITERIA = [
  { key: 'innovative', label: 'İnovatif mi?' },
  { key: 'lightweight', label: 'Hafif mi?' },
  { key: 'low_variation', label: 'Varyasyonu Az mı?' },
  { key: 'problem_solving', label: 'Sorun Çözüyor mu?' },
  { key: 'visual_sellable', label: 'Göstererek Satılabilir mi?' }
]

export default function Research() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('classic') // classic | products | swipe | auto
  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [unreadCounts, setUnreadCounts] = useState({})
  const [allUsers, setAllUsers] = useState([])
  const [readyUsers, setReadyUsers] = useState([])
  const [isReady, setIsReady] = useState(false)
  const [swipeQueue, setSwipeQueue] = useState([])
  const [swipeIndex, setSwipeIndex] = useState(0)
  const [swipeSessionId, setSwipeSessionId] = useState(null)
  const [swipeSessionCode, setSwipeSessionCode] = useState(null)
  const [swipeFinished, setSwipeFinished] = useState(false)
  const [historySessions, setHistorySessions] = useState([])
  const [exportingSession, setExportingSession] = useState(null)
  const [swipeStart, setSwipeStart] = useState(null)
  const [swipeDelta, setSwipeDelta] = useState({ x: 0, y: 0 })
  const [swipeAnimating, setSwipeAnimating] = useState(false)
  const swipeRestoredRef = useRef(false)
  const SWIPE_STORAGE_KEY = 'panela_swipe_state_v1'

  const shuffleArray = (arr) => {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }
  const [productViews, setProductViews] = useState({}) // product_id -> first_seen_at
  
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
  
  // Textarea ref (otomatik genişleme için)
  const notesTextareaRef = useRef(null)

  useEffect(() => {
    if (user?.id) {
      loadUsers()
      loadProducts()
      loadUnreadCounts()
      loadProductViews()
      migrateProofLinksToMetaLinks()
    }
  }, [user?.id])

  // Proof link'leri meta link'lere taşı (otomatik düzenleme)
  const migrateProofLinksToMetaLinks = async () => {
    try {
      // Tüm ürünleri getir
      const { data: products, error } = await supabase
        .from('discovered_products')
        .select('id, proof_link, meta_link')
        .not('proof_link', 'is', null)
        .neq('proof_link', '')

      if (error) {
        console.error('[Panela] Proof link migration error:', error)
        return
      }

      if (!products || products.length === 0) return

      // Meta link formatını kontrol et
      const isValidMetaLink = (url) => {
        if (!url || typeof url !== 'string') return false
        if (!url.includes('facebook.com/ads/library')) return false
        // Sadece ?id= içeren linkler meta linki değil
        if (url.includes('?id=') && !url.includes('search_type=page')) return false
        // search_type=page ve view_all_page_id içermeli
        return url.includes('search_type=page') && url.includes('view_all_page_id')
      }

      // Düzenlenecek ürünleri bul
      const updates = []
      for (const product of products) {
        const proofLink = product.proof_link?.trim()
        if (!proofLink) continue

        // Eğer proof_link geçerli bir meta link ise ve meta_link boşsa, taşı
        if (isValidMetaLink(proofLink)) {
          // meta_link boşsa veya farklıysa taşı
          if (!product.meta_link || product.meta_link !== proofLink) {
            updates.push({
              id: product.id,
              meta_link: proofLink,
              proof_link: null // proof_link'i temizle (artık meta_link'te)
            })
          } else {
            // meta_link zaten aynıysa, sadece proof_link'i temizle
            updates.push({
              id: product.id,
              proof_link: null
            })
          }
        }
      }

      // Toplu güncelleme
      if (updates.length > 0) {
        console.log(`[Panela] ${updates.length} ürün için proof_link -> meta_link migration başlatılıyor...`)
        
        for (const update of updates) {
          const { error: updateError } = await supabase
            .from('discovered_products')
            .update({
              meta_link: update.meta_link || undefined,
              proof_link: update.proof_link
            })
            .eq('id', update.id)

          if (updateError) {
            console.error(`[Panela] Migration error for product ${update.id}:`, updateError)
          }
        }

        console.log(`[Panela] Migration tamamlandı: ${updates.length} ürün güncellendi`)
        
        // Ürünleri yeniden yükle
        await loadProducts()
      }
    } catch (error) {
      console.error('[Panela] Proof link migration error:', error)
    }
  }

  // Modal açıldığında veya notes değiştiğinde textarea yüksekliğini ayarla
  useEffect(() => {
    if (notesTextareaRef.current && selectedProduct?.notes) {
      notesTextareaRef.current.style.height = 'auto'
      notesTextareaRef.current.style.height = `${notesTextareaRef.current.scrollHeight}px`
    }
  }, [selectedProduct?.notes])

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

  // Ready durumunu yükle
  const loadReadyStatus = async () => {
    if (!user?.id) return
    try {
      const { data, error } = await supabase
        .from('swipe_ready')
        .select('user_id, ready_at, app_users(id, username, full_name)')
        .order('ready_at', { ascending: true })
      if (error) throw error
      setReadyUsers(data || [])
      setIsReady(!!data?.find(r => r.user_id === user.id))
    } catch (err) {
      console.error('Ready durum yüklenemedi:', err)
    }
  }

  const handleReadyClick = async () => {
    if (!user?.id) return
    try {
      await supabase.from('swipe_ready').upsert({ user_id: user.id, ready_at: new Date().toISOString() })
      await loadReadyStatus()
    } catch (err) {
      console.error('Hazır işareti eklenemedi:', err)
    }
  }

  const clearReadyRecords = async () => {
    try {
      await supabase.from('swipe_ready').delete().neq('user_id', '')
      setReadyUsers([])
      setIsReady(false)
    } catch (err) {
      console.error('Ready kayıtları temizlenemedi:', err)
    }
  }

  const [swipeMessage, setSwipeMessage] = useState('')

  const persistSwipeState = (state) => {
    try {
      localStorage.setItem(SWIPE_STORAGE_KEY, JSON.stringify(state))
    } catch (_) {}
  }

  const clearSwipeState = () => {
    try {
      localStorage.removeItem(SWIPE_STORAGE_KEY)
    } catch (_) {}
  }

  const restoreSwipeState = (allProducts) => {
    if (swipeRestoredRef.current) return
    swipeRestoredRef.current = true
    try {
      const raw = localStorage.getItem(SWIPE_STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (!parsed?.sessionId || !Array.isArray(parsed.queueIds)) return
      const queueProducts = parsed.queueIds
        .map(id => allProducts.find(p => p.id === id))
        .filter(Boolean)
      if (!queueProducts.length) {
        clearSwipeState()
        return
      }
      const idx = Math.min(parsed.index ?? 0, queueProducts.length)
      setSwipeSessionId(parsed.sessionId)
      setSwipeSessionCode(parsed.sessionCode || null)
      setSwipeQueue(queueProducts)
      setSwipeIndex(idx)
      const finished = idx >= queueProducts.length
      setSwipeFinished(finished)
      if (finished) {
        clearSwipeState()
      }
      setSwipeDelta({ x: 0, y: 0 })
      setSwipeStart(null)
    } catch (_) {
      // ignore
    }
  }

  const fetchNextSessionCode = async () => {
    try {
      const { data, error } = await supabase
        .from('swipe_selections')
        .select('session_code')
        .not('session_code', 'is', null)
        .order('session_code', { ascending: false })
        .limit(1)
      if (error) throw error
      const last = data?.[0]?.session_code
      const num = last ? parseInt(last, 10) + 1 : 1
      return String(num).padStart(3, '0')
    } catch (_) {
      return '001'
    }
  }

  // Swipe oturumu başlat
  const startSwipeSession = async () => {
    if (!user?.id) return
    if (readyUsers.length < 2) {
      setSwipeMessage('İki kullanıcı da hazır olmalı.')
      return
    }
    const sessionId = crypto.randomUUID()
    const code = await fetchNextSessionCode()
    const shuffled = shuffleArray(products)
    setSwipeSessionId(sessionId)
    setSwipeSessionCode(code)
    setSwipeQueue(shuffled)
    setSwipeIndex(0)
    setSwipeFinished(false)
    setSwipeMessage('')
    persistSwipeState({
      sessionId,
      sessionCode: code,
      queueIds: shuffled.map(p => p.id),
      index: 0
    })
  }

  const insertSelection = async (sessionId, sessionCode, productId, isSelected) => {
    await supabase.from('swipe_selections').insert({
      session_id: sessionId,
      session_code: sessionCode || null,
      product_id: productId,
      selected_by: user?.id || null,
      is_selected: isSelected,
      selected_at: new Date().toISOString()
    })
  }

  const handleSwipeDecision = async (direction) => {
    if (!swipeQueue.length || swipeFinished || swipeAnimating) return
    const current = swipeQueue[swipeIndex]
    const selected = direction === 'right'
    let sessionId = swipeSessionId
    let sessionCode = swipeSessionCode
    if (!sessionId) {
      sessionId = crypto.randomUUID()
      sessionCode = await fetchNextSessionCode()
      setSwipeSessionId(sessionId)
      setSwipeSessionCode(sessionCode)
    }
    setSwipeAnimating(true)
    const exitX = direction === 'right' ? window.innerWidth : -window.innerWidth
    setSwipeDelta({ x: exitX, y: swipeDelta.y })
    setTimeout(async () => {
      try {
        await insertSelection(sessionId, sessionCode, current.id, selected)
        const nextIndex = swipeIndex + 1
        const finished = nextIndex >= swipeQueue.length
        if (finished) {
          setSwipeFinished(true)
          clearSwipeState()
          await clearReadyRecords()
          await loadHistorySessions()
        }
        setSwipeIndex(nextIndex)
        setSwipeStart(null)
        setSwipeDelta({ x: 0, y: 0 })
        setSwipeAnimating(false)
        persistSwipeState({
          sessionId,
          sessionCode,
          queueIds: swipeQueue.map(p => p.id),
          index: nextIndex
        })
      } catch (err) {
        console.error('Swipe kaydedilemedi:', err)
        setSwipeMessage('Swipe kaydedilemedi, tekrar deneyin.')
        setSwipeDelta({ x: 0, y: 0 })
        setSwipeAnimating(false)
      }
    }, 220)
  }

  const loadHistorySessions = async () => {
    try {
      const { data, error } = await supabase
        .from('swipe_selections')
        .select('session_id, session_code, selected_at, is_selected')
        .order('selected_at', { ascending: false })
      if (error) throw error
      const map = new Map()
      data?.forEach(row => {
        if (!map.has(row.session_id)) {
          map.set(row.session_id, {
            session_id: row.session_id,
            session_code: row.session_code,
            first_at: row.selected_at,
            total: 0,
            selected: 0
          })
        }
        const entry = map.get(row.session_id)
        entry.total += 1
        if (row.is_selected) entry.selected += 1
        if (row.selected_at && entry.first_at && new Date(row.selected_at) < new Date(entry.first_at)) {
          entry.first_at = row.selected_at
        }
      })
      setHistorySessions(Array.from(map.values()))
    } catch (err) {
      console.error('Geçmiş oturumlar yüklenemedi:', err)
    }
  }

  const exportSessionToExcel = async (sessionId) => {
    try {
      setExportingSession(sessionId)
      const { data, error } = await supabase
        .from('swipe_selections')
        .select('product_id, is_selected, discovered_products(*)')
        .eq('session_id', sessionId)
        .eq('is_selected', true)
      if (error) throw error
      const selectedProducts = (data || []).map(d => d.discovered_products).filter(Boolean)
      if (!selectedProducts.length) {
        alert('Bu oturumda seçili ürün yok.')
        setExportingSession(null)
        return
      }
      const rows = selectedProducts.map(p => ({
        'Adı': p.product_name || '',
        'Satış Sayfası': p.image_url || '',
        'Meta Linki': p.meta_link || '',
        'Reklam Sayısı': p.ad_count ?? '',
        'Ülke': p.country_code || '',
        'Anahtar Kelime': p.search_keyword || '',
        'Not': p.notes || '',
        'Eklenme Tarihi': p.created_at ? new Date(p.created_at).toLocaleString('tr-TR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }) : ''
      }))

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(rows)
      XLSX.utils.book_append_sheet(wb, ws, 'Seçilenler')
      const dateStr = new Date().toISOString().split('T')[0]
      XLSX.writeFile(wb, `panela-swipe-${sessionId}-${dateStr}.xlsx`)
    } catch (err) {
      console.error('Excel export hatası:', err)
      alert('Excel indirilemedi.')
    } finally {
      setExportingSession(null)
    }
  }

  useEffect(() => {
    if (activeTab === 'swipe' && user?.id) {
      loadReadyStatus()
      loadHistorySessions()
    }
  }, [activeTab, user?.id])

  useEffect(() => {
    if (activeTab === 'swipe' && !productsLoading && products.length > 0) {
      restoreSwipeState(products)
    }
  }, [activeTab, productsLoading, products])

  const loadProductViews = async () => {
    if (!user?.id) return
    try {
      const { data, error } = await supabase
        .from('product_views')
        .select('product_id, first_seen_at')
        .eq('user_id', user.id)
      
      if (error) throw error
      
      const viewsMap = {}
      if (data) {
        data.forEach(view => {
          viewsMap[view.product_id] = view.first_seen_at
        })
      }
      
      setProductViews(viewsMap)
    } catch (error) {
      console.error('Error loading product views:', error)
    }
  }

  const markProductAsSeen = async (productId) => {
    if (!user?.id || !productId) return
    
    // Eğer zaten görüldüyse, tekrar kayıt oluşturma (unique constraint sayesinde)
    if (productViews[productId]) {
      return
    }
    
    try {
      const { data, error } = await supabase
        .from('product_views')
        .insert({
          product_id: productId,
          user_id: user.id,
          first_seen_at: new Date().toISOString()
        })
        .select('first_seen_at')
        .single()
      
      if (error) {
        // Unique constraint hatası olabilir (başka bir sekmede zaten görüldü işaretlenmiş olabilir)
        if (error.code === '23505') {
          // Zaten var, tekrar yükle
          await loadProductViews()
          return
        }
        throw error
      }
      
      // State'i güncelle
      setProductViews(prev => ({
        ...prev,
        [productId]: data.first_seen_at
      }))
    } catch (error) {
      console.error('Error marking product as seen:', error)
    }
  }

  const handleOpenProduct = async (product, event) => {
    // Modal her zaman ekranın tam ortasında açılacak
    setSelectedProduct(product)
    await loadProductComments(product.id)
    await loadUnreadCounts() // Badge'leri güncelle
    // Ürünü "görüldü" olarak işaretle (sadece kendi ürünü değilse)
    if (product.user_id !== user?.id) {
      await markProductAsSeen(product.id)
    }
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

  // Excel'e Aktar fonksiyonu
  const handleExportToExcel = () => {
    try {
      if (products.length === 0) {
        alert('Export edilecek ürün bulunamadı')
        return
      }

      // Ürünleri en güncel tarihten en eskiye sırala (zaten created_at DESC ile geliyor ama yine de sırala)
      const sortedProducts = [...products].sort((a, b) => {
        const dateA = new Date(a.created_at || 0)
        const dateB = new Date(b.created_at || 0)
        return dateB - dateA // En güncel → en eski
      })

      // Excel verisi hazırla - eksik veriler boş bırakılacak
      const excelData = sortedProducts.map(product => {
        // Satış sayfası: image_url (Görsel URL - hızlı analiz ve kayıt kısmındaki)
        const salesPage = product.image_url || ''
        
        // Tarih ve saat formatı: DD.MM.YYYY HH:MM
        const createdAtFormatted = product.created_at
          ? new Date(product.created_at).toLocaleString('tr-TR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : ''
        
        return {
          'Adı': product.product_name || '',
          'Satış Sayfası': salesPage,
          'Meta Linki': product.meta_link || '',
          'Reklam Sayısı': product.ad_count ?? '',
          'Ürün Fiyatı': '', // Tabloda yok, boş bırakılacak
          'Eklenme Tarihi': createdAtFormatted
        }
      })

      // Workbook oluştur
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(excelData)

      // Köprüleri ekle (xlsx kütüphanesi link property'si ile) - ESKİ ÇALIŞAN VERSİYON
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
      
      // Satış Sayfası sütunu (B sütunu, index 1)
      for (let row = 1; row <= range.e.r; row++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: 1 })
        const cell = ws[cellAddress]
        if (cell && cell.v && typeof cell.v === 'string' && cell.v.startsWith('http')) {
          // Link property'si ekle (çalışan versiyon)
          cell.l = { Target: cell.v, Tooltip: cell.v }
        }
      }

      // Meta Linki sütunu (C sütunu, index 2)
      for (let row = 1; row <= range.e.r; row++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: 2 })
        const cell = ws[cellAddress]
        if (cell && cell.v && typeof cell.v === 'string' && cell.v.startsWith('http')) {
          // Link property'si ekle (çalışan versiyon)
          cell.l = { Target: cell.v, Tooltip: cell.v }
        }
      }

      // Sütun genişliklerini ayarla (%50 artırılmış)
      ws['!cols'] = [
        { wch: 45 }, // Adı (30 * 1.5)
        { wch: 60 }, // Satış Sayfası (40 * 1.5)
        { wch: 75 }, // Meta Linki (50 * 1.5)
        { wch: 22 }, // Reklam Sayısı (15 * 1.5)
        { wch: 22 }, // Ürün Fiyatı (15 * 1.5)
        { wch: 20 }  // Eklenme Tarihi
      ]

      // Header stilleri (kalın)
      const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1')
      for (let col = 0; col <= headerRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
        if (!ws[cellAddress]) continue
        ws[cellAddress].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: 'E7E6E6' } } // Açık gri arka plan
        }
      }

      // Zebra striping: Tek satırlar açık gök mavisi, çift satırlar beyaz
      // xlsx'te fill için doğru format: fill.patternType ve fill.fgColor
      for (let row = 1; row <= range.e.r; row++) {
        const isOddRow = row % 2 === 1 // Tek satırlar (1, 3, 5...)
        
        for (let col = 0; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
          if (!ws[cellAddress]) {
            // Eğer hücre yoksa oluştur
            ws[cellAddress] = { t: 's', v: '' }
          }
          
          // Stil objesi oluştur veya mevcut stili al
          if (!ws[cellAddress].s) {
            ws[cellAddress].s = {}
          }
          
          // Tek satırlar için açık gök mavisi, çift satırlar için beyaz
          if (isOddRow) {
            // Açık gök mavisi: #E3F2FD -> RGB: 227, 242, 253
            ws[cellAddress].s.fill = {
              patternType: 'solid',
              fgColor: { rgb: 'E3F2FD' }
            }
          } else {
            // Beyaz: #FFFFFF
            ws[cellAddress].s.fill = {
              patternType: 'solid',
              fgColor: { rgb: 'FFFFFF' }
            }
          }
        }
      }

      // Worksheet'i workbook'a ekle
      XLSX.utils.book_append_sheet(wb, ws, 'Ürünler')

      // Dosya adı: panela-urunler-YYYY-MM-DD.xlsx
      const today = new Date()
      const dateStr = today.toISOString().split('T')[0] // YYYY-MM-DD
      const fileName = `panela-urunler-${dateStr}.xlsx`

      // Excel dosyasını indir
      XLSX.writeFile(wb, fileName)

      console.log(`Excel dosyası oluşturuldu: ${fileName}, ${excelData.length} ürün export edildi`)
    } catch (error) {
      console.error('Excel export hatası:', error)
      alert('Excel dosyası oluşturulurken hata oluştu: ' + error.message)
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
      
      // Not alanı değiştiğinde textarea yüksekliğini ayarla
      if (key === 'notes' && notesTextareaRef.current) {
        notesTextareaRef.current.style.height = 'auto'
        notesTextareaRef.current.style.height = `${notesTextareaRef.current.scrollHeight}px`
      }
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

    // Link kopyala ve aç fonksiyonu
    const handleLinkClick = async (url) => {
      if (!url || !url.trim()) return
      
      try {
        // Linki kopyala
        await navigator.clipboard.writeText(url.trim())
        
        // Yeni sekmede aç
        window.open(url.trim(), '_blank', 'noopener,noreferrer')
        
        // Kısa bir feedback göster (opsiyonel)
        console.log('Link kopyalandı ve açıldı:', url.trim())
      } catch (error) {
        console.error('Link kopyalama/açma hatası:', error)
        // Fallback: Sadece aç
        window.open(url.trim(), '_blank', 'noopener,noreferrer')
      }
    }

    return createPortal(
      <div
        className="product-modal-overlay"
        onClick={async () => {
          setSelectedProduct(null)
          await loadUnreadCounts() // Modal kapandığında badge'leri güncelle
        }}
      >
        <div
          className="product-modal-container"
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
            height: '100%'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  Ekleyen: {userInfo.username || userInfo.full_name || 'Bilinmeyen'}
                </div>
                {productViews[selectedProduct.id] && (
                  <div style={{ fontSize: '11px', color: 'var(--color-primary)', marginTop: '0.25rem', fontWeight: '500' }}>
                    İlk görüldü: {new Date(productViews[selectedProduct.id]).toLocaleString('tr-TR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                )}
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

            {/* Linkler - Görsel gösterim */}
            {(selectedProduct.meta_link || selectedProduct.image_url || selectedProduct.trendyol_link || selectedProduct.amazon_link) && (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '12px', padding: '0.75rem', background: 'var(--color-background)', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
                {selectedProduct.meta_link && (
                  <a
                    href={selectedProduct.meta_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: '600' }}
                  >
                    <ExternalLink size={14} />
                    Meta
                  </a>
                )}
                {selectedProduct.image_url && (
                  <a
                    href={selectedProduct.image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: '600' }}
                  >
                    <ExternalLink size={14} />
                    Ürün Satış Linki
                  </a>
                )}
                {selectedProduct.trendyol_link && (
                  <a
                    href={selectedProduct.trendyol_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: '600' }}
                  >
                    <ExternalLink size={14} />
                    Trendyol
                  </a>
                )}
                {selectedProduct.amazon_link && (
                  <a
                    href={selectedProduct.amazon_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: '600' }}
                  >
                    <ExternalLink size={14} />
                    Amazon
                  </a>
                )}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label 
                  onClick={() => handleLinkClick(selectedProduct.meta_link)}
                  style={{ 
                    fontSize: '12px', 
                    color: selectedProduct.meta_link ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    cursor: selectedProduct.meta_link ? 'pointer' : 'default',
                    textDecoration: selectedProduct.meta_link ? 'underline' : 'none',
                    userSelect: 'none'
                  }}
                  title={selectedProduct.meta_link ? 'Tıkla: Linki kopyala ve aç' : ''}
                >
                  Meta Link {selectedProduct.meta_link && '🔗'}
                </label>
                <input
                  type="text"
                  value={selectedProduct.meta_link || ''}
                  onChange={e => handleFieldChange('meta_link', e.target.value)}
                  disabled={!isOwner}
                  style={{ width: '100%', padding: '0.55rem 0.65rem', border: '1px solid var(--color-border)', borderRadius: '10px' }}
                />
              </div>
              <div>
                <label 
                  onClick={() => handleLinkClick(selectedProduct.image_url)}
                  style={{ 
                    fontSize: '12px', 
                    color: selectedProduct.image_url ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    cursor: selectedProduct.image_url ? 'pointer' : 'default',
                    textDecoration: selectedProduct.image_url ? 'underline' : 'none',
                    userSelect: 'none'
                  }}
                  title={selectedProduct.image_url ? 'Tıkla: Linki kopyala ve aç' : ''}
                >
                  Ürün Satış Linki (Görsel URL) {selectedProduct.image_url && '🔗'}
                </label>
                <input
                  type="text"
                  value={selectedProduct.image_url || ''}
                  onChange={e => handleFieldChange('image_url', e.target.value)}
                  disabled={!isOwner}
                  style={{ width: '100%', padding: '0.55rem 0.65rem', border: '1px solid var(--color-border)', borderRadius: '10px' }}
                />
              </div>
              <div>
                <label 
                  onClick={() => handleLinkClick(selectedProduct.trendyol_link)}
                  style={{ 
                    fontSize: '12px', 
                    color: selectedProduct.trendyol_link ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    cursor: selectedProduct.trendyol_link ? 'pointer' : 'default',
                    textDecoration: selectedProduct.trendyol_link ? 'underline' : 'none',
                    userSelect: 'none'
                  }}
                  title={selectedProduct.trendyol_link ? 'Tıkla: Linki kopyala ve aç' : ''}
                >
                  Trendyol Link {selectedProduct.trendyol_link && '🔗'}
                </label>
                <input
                  type="text"
                  value={selectedProduct.trendyol_link || ''}
                  onChange={e => handleFieldChange('trendyol_link', e.target.value)}
                  disabled={!isOwner}
                  style={{ width: '100%', padding: '0.55rem 0.65rem', border: '1px solid var(--color-border)', borderRadius: '10px' }}
                />
              </div>
              <div>
                <label 
                  onClick={() => handleLinkClick(selectedProduct.amazon_link)}
                  style={{ 
                    fontSize: '12px', 
                    color: selectedProduct.amazon_link ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    cursor: selectedProduct.amazon_link ? 'pointer' : 'default',
                    textDecoration: selectedProduct.amazon_link ? 'underline' : 'none',
                    userSelect: 'none'
                  }}
                  title={selectedProduct.amazon_link ? 'Tıkla: Linki kopyala ve aç' : ''}
                >
                  Amazon Link {selectedProduct.amazon_link && '🔗'}
                </label>
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
              <label 
                onClick={() => handleLinkClick(selectedProduct.proof_link)}
                style={{ 
                  fontSize: '12px', 
                  color: selectedProduct.proof_link ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  cursor: selectedProduct.proof_link ? 'pointer' : 'default',
                  textDecoration: selectedProduct.proof_link ? 'underline' : 'none',
                  userSelect: 'none'
                }}
                title={selectedProduct.proof_link ? 'Tıkla: Linki kopyala ve aç' : ''}
              >
                Meta Linki (Kanıt) {selectedProduct.proof_link && '🔗'}
              </label>
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
                  <StarRating
                    key={c.key}
                    label={c.label}
                    value={value}
                    disabled={true}
                  />
                )
              })}
            </div>

            <div>
              <label style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Not</label>
              <textarea
                ref={notesTextareaRef}
                value={selectedProduct.notes || ''}
                onChange={e => handleFieldChange('notes', e.target.value)}
                disabled={!isOwner}
                style={{ 
                  width: '100%', 
                  padding: '0.55rem 0.65rem', 
                  border: '1px solid var(--color-border)', 
                  borderRadius: '10px', 
                  resize: 'none',
                  minHeight: '60px',
                  overflow: 'hidden',
                  lineHeight: '1.5'
                }}
                onInput={(e) => {
                  // Otomatik yükseklik ayarlama
                  e.target.style.height = 'auto'
                  e.target.style.height = `${e.target.scrollHeight}px`
                }}
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
            height: '100%',
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
        <style>{`
          .product-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: transparent;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 99999;
            animation: fadeIn 0.3s ease-out;
          }
          
          .product-modal-container {
            position: relative;
            background: white;
            border-radius: 16px;
            width: min(95vw, 1000px);
            max-width: 1000px;
            height: min(85vh, 700px);
            max-height: 85vh;
            overflow: hidden;
            display: grid;
            grid-template-columns: 1.2fr 0.8fr;
            box-shadow: 0 25px 80px -12px rgba(0, 0, 0, 0.4);
            pointer-events: auto;
            animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          }
          
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes slideUp {
            from { transform: translateY(20px) scale(0.98); opacity: 0; }
            to { transform: translateY(0) scale(1); opacity: 1; }
          }
          
          @media (max-width: 768px) {
            .product-modal-container {
              grid-template-columns: 1fr;
              grid-template-rows: auto auto;
              height: min(90vh, 600px);
              max-height: 90vh;
              width: min(95vw, 100%);
            }
            .product-modal-container > div:first-child {
              border-right: none;
              border-bottom: 1px solid var(--color-border);
              max-height: 50%;
            }
            .product-modal-container > div:last-child {
              max-height: 50%;
            }
          }
        `}</style>
      </div>,
      document.body
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
            onClick={() => setActiveTab('swipe')}
            className="primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1rem',
              background: activeTab === 'swipe' ? 'linear-gradient(135deg, #a855f7, #6366f1)' : 'white',
              color: activeTab === 'swipe' ? 'white' : 'var(--color-text-main)',
              border: activeTab === 'swipe' ? 'none' : '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              boxShadow: activeTab === 'swipe' ? 'var(--shadow-glow)' : 'none'
            }}
          >
            <Hand size={16} />
            Eleme
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
                <button
                  onClick={handleExportToExcel}
                  disabled={products.length === 0}
                  style={{
                    marginLeft: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.65rem 1rem',
                    background: products.length === 0 ? '#94a3b8' : '#107C41',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: products.length === 0 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: products.length === 0 ? 'none' : '0 2px 8px rgba(16, 124, 65, 0.2)'
                  }}
                  onMouseEnter={(e) => {
                    if (products.length > 0) {
                      e.target.style.background = '#059669'
                      e.target.style.transform = 'translateY(-1px)'
                      e.target.style.boxShadow = '0 4px 12px rgba(16, 124, 65, 0.3)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (products.length > 0) {
                      e.target.style.background = '#107C41'
                      e.target.style.transform = 'translateY(0)'
                      e.target.style.boxShadow = '0 2px 8px rgba(16, 124, 65, 0.2)'
                    }
                  }}
                >
                  <FileSpreadsheet size={16} />
                  Excel'e Aktar
                </button>
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
                {products.map(product => {
                  // Ürün yeni mi? (kendi ürünü değilse ve daha önce görülmemişse)
                  const isNew = product.user_id !== user?.id && !productViews[product.id]
                  const firstSeenAt = productViews[product.id] || null
                  
                  return (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onEdit={() => handleOpenProduct(product)}
                      currentUserId={user?.id}
                      unreadCount={unreadCounts[product.id] || 0}
                      isNew={isNew}
                      firstSeenAt={firstSeenAt}
                    />
                  )
                })}
              </div>
            )}
          </div>
        ) : activeTab === 'swipe' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Left: Ready ve kontrol paneli */}
            <div
              style={{
                padding: '1rem',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                background: 'white',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} color="var(--color-primary)" />
                <div>
                  <div style={{ fontWeight: 700 }}>Eleme / Swipe Hazırlık</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    İki kullanıcı da "Hazırım" dedikten sonra swipe başlayabilir. Sayfayı yenileyerek karşı tarafın durumunu görürsünüz.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  onClick={handleReadyClick}
                  disabled={isReady}
                  style={{
                    padding: '0.6rem 1rem',
                    background: isReady ? '#94a3b8' : 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 700,
                    cursor: isReady ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)'
                  }}
                >
                  {isReady ? 'Hazırsın' : 'Hazırım'}
                </button>
                <button
                  onClick={startSwipeSession}
                  disabled={readyUsers.length < 2 || products.length === 0}
                  style={{
                    padding: '0.6rem 1rem',
                    background: readyUsers.length < 2 ? '#cbd5e1' : 'linear-gradient(135deg, #a855f7, #6366f1)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 700,
                    cursor: readyUsers.length < 2 ? 'not-allowed' : 'pointer',
                    boxShadow: readyUsers.length < 2 ? 'none' : '0 4px 14px rgba(99, 102, 241, 0.25)'
                  }}
                >
                  Swipe'i Başlat
                </button>
              </div>

              <div style={{ padding: '0.75rem', border: '1px dashed var(--color-border)', borderRadius: '12px', background: 'var(--color-background)' }}>
                <div style={{ fontWeight: 700, marginBottom: '0.35rem' }}>Hazır Olanlar</div>
                {readyUsers.length === 0 ? (
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Henüz kimse hazır değil.</div>
                ) : (
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {readyUsers.map(u => (
                      <span
                        key={u.user_id}
                        style={{
                          padding: '0.35rem 0.55rem',
                          borderRadius: '999px',
                          background: 'rgba(99,102,241,0.08)',
                          color: 'var(--color-primary)',
                          fontSize: '12px',
                          fontWeight: 700
                        }}
                      >
                        {u.app_users?.username || u.app_users?.full_name || u.user_id.slice(0, 6)}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {swipeMessage && (
                <div style={{ fontSize: '12px', color: 'var(--color-error)', fontWeight: 600 }}>
                  {swipeMessage}
                </div>
              )}

              {/* Geçmiş oturumlar */}
              <div
                style={{
                  marginTop: '0.5rem',
                  padding: '0.75rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  background: 'white',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}
              >
                <div style={{ fontWeight: 700 }}>Geçmiş Oturumlar</div>
                {historySessions.length === 0 && (
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Henüz kayıtlı oturum yok.</div>
                )}
                {historySessions.map(session => (
                  <div
                    key={session.session_id}
                    style={{
                      border: '1px solid var(--color-border)',
                      borderRadius: '10px',
                      padding: '0.65rem 0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700 }}>Oturum: {session.session_code || session.session_id?.slice(0, 6) || '-'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        Tarih: {session.first_at ? new Date(session.first_at).toLocaleString('tr-TR') : '-'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        Seçilen: {session.selected} / {session.total}
                      </div>
                    </div>
                    <button
                      onClick={() => exportSessionToExcel(session.session_id)}
                      disabled={exportingSession === session.session_id}
                      style={{
                        padding: '0.5rem 0.75rem',
                        background: '#107C41',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: 700,
                        cursor: exportingSession === session.session_id ? 'wait' : 'pointer'
                      }}
                    >
                      {exportingSession === session.session_id ? 'İndiriliyor...' : 'Excel İndir'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Swipe alanı */}
            <div
              style={{
                padding: '1rem',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                background: 'white',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                minHeight: '540px',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Hand size={18} color="var(--color-primary)" />
                <div>
                  <div style={{ fontWeight: 700 }}>Swipe Alanı</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Sola: Pas | Sağa: Seç</div>
                </div>
                <div style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  {swipeQueue.length > 0 ? `${Math.min(swipeIndex + 1, swipeQueue.length)} / ${swipeQueue.length}` : ''}
                </div>
              </div>

              {(!swipeQueue.length || swipeIndex >= swipeQueue.length) && !swipeFinished && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                  Swipe için başlat butonuna basın. Ürünler rastgele sıralanır. (Kısıt: iki kullanıcı hazır olmalı)
                </div>
              )}

              {swipeQueue.length > 0 && swipeIndex < swipeQueue.length && (
                (() => {
                  const p = swipeQueue[swipeIndex]
                  const rotation = swipeDelta.x / 15
                  return (
                    <div
                      style={{
                        border: '1px solid var(--color-border)',
                        borderRadius: '16px',
                        padding: '1rem',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                        background: 'linear-gradient(135deg, rgba(248,250,252,0.8), rgba(255,255,255,0.95))',
                        transform: `translateX(${swipeDelta.x}px) translateY(${swipeDelta.y}px) rotate(${rotation}deg)`,
                        transition: swipeStart ? 'none' : 'transform 0.25s ease, box-shadow 0.25s ease',
                        userSelect: 'none',
                        touchAction: 'none'
                      }}
                      onPointerDown={(e) => {
                        if (swipeAnimating) return
                        // Linke tıklama ise swipe başlatma
                        const tag = (e.target?.tagName || '').toLowerCase()
                        if (tag === 'a' || e.target?.closest('a')) return
                        setSwipeStart({ x: e.clientX, y: e.clientY })
                        setSwipeDelta({ x: 0, y: 0 })
                      }}
                      onPointerMove={(e) => {
                        if (swipeAnimating) return
                        if (!swipeStart) return
                        setSwipeDelta({
                          x: e.clientX - swipeStart.x,
                          y: e.clientY - swipeStart.y
                        })
                      }}
                      onPointerUp={(e) => {
                        if (swipeAnimating) return
                        if (!swipeStart) return
                        const dx = e.clientX - swipeStart.x
                        const threshold = 120
                        if (dx > threshold) {
                          handleSwipeDecision('right')
                        } else if (dx < -threshold) {
                          handleSwipeDecision('left')
                        } else {
                          setSwipeDelta({ x: 0, y: 0 })
                        }
                        setSwipeStart(null)
                      }}
                      onPointerLeave={() => {
                        if (swipeAnimating) return
                        if (!swipeStart) return
                        setSwipeDelta({ x: 0, y: 0 })
                        setSwipeStart(null)
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <h3 style={{ margin: 0, fontSize: '18px' }}>{p.product_name || 'İsimsiz Ürün'}</h3>
                        {p.ad_count > 30 && (
                          <span style={{ padding: '0.2rem 0.5rem', background: 'rgba(16,185,129,0.1)', color: 'var(--color-success)', borderRadius: '8px', fontSize: '12px', fontWeight: 700 }}>
                            🔥 Markalaşma
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        {p.country_code && <span style={{ padding: '0.25rem 0.4rem', background: 'rgba(59,130,246,0.08)', borderRadius: '8px' }}>{p.country_code}</span>}
                        {p.search_keyword && <span style={{ padding: '0.25rem 0.4rem', background: 'rgba(16,185,129,0.08)', borderRadius: '8px' }}>{p.search_keyword}</span>}
                        <span>Reklam: {p.ad_count ?? '-'}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '13px' }}>
                        {p.meta_link && (
                          <a href={p.meta_link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 700 }}>
                            Meta Link
                          </a>
                        )}
                        {p.image_url && (
                          <a href={p.image_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 700 }}>
                            Satış Linki
                          </a>
                        )}
                        {p.trendyol_link && (
                          <a href={p.trendyol_link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 700 }}>
                            Trendyol
                          </a>
                        )}
                        {p.amazon_link && (
                          <a href={p.amazon_link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 700 }}>
                            Amazon
                          </a>
                        )}
                      </div>
                      {p.notes && (
                        <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', background: 'rgba(148,163,184,0.12)', padding: '0.65rem', borderRadius: '10px', userSelect: 'none' }}>
                          {p.notes}
                        </div>
                      )}
                    </div>
                  )
                })()
              )}

              {swipeFinished && (
                <div
                  style={{
                    padding: '1rem',
                    border: '1px dashed var(--color-border)',
                    borderRadius: '14px',
                    background: 'rgba(16,185,129,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: 'var(--color-success)' }}>Oturum tamamlandı.</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      Seçilen ürünler için Excel indirebilirsiniz. Ready kayıtları sıfırlandı.
                    </div>
                  </div>
                  {swipeSessionId && (
                    <button
                      onClick={() => exportSessionToExcel(swipeSessionId)}
                      style={{
                        padding: '0.65rem 1rem',
                        background: '#107C41',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Excel İndir
                    </button>
                  )}
                </div>
              )}
            </div>
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

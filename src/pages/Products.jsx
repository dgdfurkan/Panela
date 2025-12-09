
import { useEffect, useState } from 'react'
import { Plus, Search, Filter, ExternalLink, Trash2, Edit2, Star, Smartphone } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/ui/StatusBadge'
import Modal from '../components/ui/Modal'

export default function Products() {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [wideView, setWideView] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        link: '',
        status: 'Idea',
        priority: 'Medium',
        thoughts: ''
    })
    const [editingId, setEditingId] = useState(null)

    useEffect(() => {
        fetchProducts()
    }, [])

    const fetchProducts = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setProducts(data)
        } catch (error) {
            console.error('Error fetching products:', error.message)
        } finally {
            setLoading(false)
        }
    }

    const { user } = useAuth()

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            // Validate User
            if (!user || !user.id) throw new Error('Kullanıcı oturumu bulunamadı. Lütfen tekrar giriş yapın.')

            const productData = {
                ...formData,
                user_id: user.id // Use ID from simple auth context
            }

            if (editingId) {
                const { error } = await supabase
                    .from('products')
                    .update(productData)
                    .eq('id', editingId)
                if (error) throw error
            } else {
                const { error } = await supabase
                    .from('products')
                    .insert([productData])
                if (error) throw error
            }

            setIsModalOpen(false)
            fetchProducts()
            resetForm()
        } catch (error) {
            alert('Hata: ' + error.message)
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Bu ürünü silmek istediğine emin misin?')) return
        try {
            const { error } = await supabase.from('products').delete().eq('id', id)
            if (error) throw error
            setProducts(products.filter(p => p.id !== id))
        } catch (error) {
            console.error('Error deleting:', error.message)
        }
    }

    const handleEdit = (product) => {
        setFormData({
            name: product.name,
            price: product.price,
            link: product.link,
            status: product.status,
            priority: product.priority,
            thoughts: product.thoughts
        })
        setEditingId(product.id)
        setIsModalOpen(true)
    }

    const resetForm = () => {
        setFormData({
            name: '',
            price: '',
            link: '',
            status: 'Idea',
            priority: 'Medium',
            thoughts: ''
        })
        setEditingId(null)
    }

    const toggleFavorite = async (product) => {
        const newStatus = !product.is_favorite
        setProducts(products.map(p => p.id === product.id ? { ...p, is_favorite: newStatus } : p))
        await supabase.from('products').update({ is_favorite: newStatus }).eq('id', product.id)
    }

    return (
        <div className="page-container fade-in">
            <div className="page-header">
                <div>
                    <h1 className="text-2xl font-bold">Ürün Paneli</h1>
                    <p className="text-muted">Fikirlerini ve bulduğun ürünleri buradan yönet.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true) }}
                    className="btn-cta"
                >
                    <Plus size={18} />
                    <span>Yeni Ürün Ekle</span>
                </button>
            </div>

            {/* ... Filters & Table Code ... */}

            <div className="table-card glass-panel">
                <div className="table-topbar">
                    <div className="table-title">Ürün Listesi</div>
                    <button className="toggle-wide" onClick={() => setWideView(!wideView)}>
                        <Smartphone size={16} />
                        {wideView ? 'Standart Görünüm' : '🔄 Görünümü Çevir'}
                    </button>
                </div>

                {loading ? (
                    <div className="skeleton-grid">
                        {[1,2,3].map((i) => (
                            <div key={i} className="skeleton-row">
                                <div className="skeleton-cell wide"></div>
                                <div className="skeleton-cell"></div>
                                <div className="skeleton-cell"></div>
                            </div>
                        ))}
                    </div>
                ) : products.length === 0 ? (
                    <div className="p-12 text-center text-muted">Hiç ürün yok. Yukarıdan ekleyebilirsin!</div>
                ) : (
                    <div className={`table-container ${wideView ? 'wide-mode' : ''}`}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th width="50">Fav</th>
                                    <th>Ürün İsmi</th>
                                    <th>Tahmini Fiyat</th>
                                    <th>Durum</th>
                                    <th>Öncelik</th>
                                    <th>Notlar</th>
                                    <th width="100">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product) => (
                                    <tr key={product.id}>
                                        <td className="text-center">
                                            <button onClick={() => toggleFavorite(product)} className={`star-btn ${product.is_favorite ? 'active' : ''}`}>
                                                <Star size={18} fill={product.is_favorite ? "orange" : "none"} color={product.is_favorite ? "orange" : "currentColor"} />
                                            </button>
                                        </td>
                                        <td>
                                            <div className="product-name">
                                                <span className="truncate-line">{product.name}</span>
                                                {product.link && (
                                                    <a href={product.link} target="_blank" rel="noopener noreferrer" className="link-icon">
                                                        <ExternalLink size={14} />
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                        <td className="truncate-line">{product.price}</td>
                                        <td><StatusBadge value={product.status} /></td>
                                        <td><StatusBadge value={product.priority} /></td>
                                        <td className="truncate-cell">{product.thoughts}</td>
                                        <td>
                                            <div className="actions-cell">
                                                <button onClick={() => handleEdit(product)} className="action-btn edit">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(product.id)} className="action-btn delete">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            <Modal
                title={editingId ? "Ürünü Düzenle" : "Yeni Ürün Ekle"}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            >
                <form onSubmit={handleSubmit} className="form-grid">
                    <div className="form-group">
                        <label>Ürün Adı</label>
                        <input
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Örn: Galaxy Projektör"
                            className="input-premium"
                        />
                    </div>

                    <div className="form-group">
                        <label>Ürün Linki</label>
                        <input
                            value={formData.link}
                            onChange={e => setFormData({ ...formData, link: e.target.value })}
                            placeholder="https://trendyol.com/..."
                            className="input-premium"
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Satış Fiyatı (Tahmini)</label>
                            <input
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                                placeholder="Örn: 450 TL"
                                className="input-premium"
                            />
                        </div>

                        <div className="form-group">
                            <label>Öncelik Seviyesi</label>
                            <select
                                value={formData.priority}
                                onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                className="input-premium"
                            >
                                <option value="Low">Düşük</option>
                                <option value="Medium">Orta</option>
                                <option value="High">Yüksek</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Mevcut Durum</label>
                        <select
                            value={formData.status}
                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                            className="input-premium"
                        >
                            <option value="Idea">Fikir Aşaması</option>
                            <option value="Researching">Araştırılıyor</option>
                            <option value="Sourcing">Tedarik Aranıyor</option>
                            <option value="Live">Yayında</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Notlar & Strateji</label>
                        <textarea
                            rows={4}
                            value={formData.thoughts}
                            onChange={e => setFormData({ ...formData, thoughts: e.target.value })}
                            placeholder="Rakip analizi, kar marjı tahmini vb."
                            className="input-premium"
                        />
                    </div>

                    <button type="submit" className="btn-primary full-width">
                        {editingId ? 'Kaydet' : 'Ekle'}
                    </button>
                </form>
            </Modal>

            <style>{`
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .btn-cta {
          background: linear-gradient(135deg, #8B5CF6, #F472B6);
          color: white;
          padding: 0.85rem 1.4rem;
          border-radius: var(--radius-lg);
          font-weight: 700;
          display: inline-flex;
          gap: 0.6rem;
          align-items: center;
          box-shadow: 0 12px 30px rgba(139,92,246,0.25);
          transition: transform 0.2s, box-shadow 0.2s;
          border: none;
        }
        .btn-cta:hover { transform: translateY(-1px); box-shadow: 0 16px 40px rgba(139,92,246,0.3); }
        .btn-cta:active { transform: scale(0.98); }

        .filters-bar {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          border-radius: var(--radius-lg);
          margin-bottom: 1.5rem;
          align-items: center;
        }

        .search-wrapper {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: rgba(255,255,255,0.5);
          padding: 0.5rem 1rem;
          border-radius: var(--radius-md);
          border: 1px solid transparent;
          transition: all 0.2s;
        }

        .search-wrapper:focus-within {
          background: white;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(139,92,246,0.1);
        }

        .search-wrapper input {
          width: 100%;
          border: none;
          background: none;
          font-size: 0.95rem;
        }

        .table-card { padding: 1rem; }
        .table-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        .table-title { font-weight: 700; color: var(--color-text-main); }
        .toggle-wide {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 0.75rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border);
          background: white;
          font-weight: 600;
          color: var(--color-text-main);
          cursor: pointer;
        }
        .toggle-wide:hover { background: rgba(var(--color-primary-rgb),0.05); }

        .table-container {
          overflow-x: auto;
          border-radius: var(--radius-lg);
          background: white;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 800px;
        }
        .wide-mode .data-table { min-width: 1100px; }

        .data-table th {
          text-align: left;
          padding: 1rem 1.5rem;
          background: rgba(248, 250, 252, 0.8);
          color: var(--color-text-muted);
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid var(--color-border);
        }

        .data-table td {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--color-border);
          color: var(--color-text-main);
          font-size: 0.95rem;
        }
        
        .data-table tr:hover {
          background: rgba(241, 245, 249, 0.5);
        }

        .product-name {
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          max-width: 260px;
        }
        .truncate-line {
          display: inline-block;
          max-width: 220px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .link-icon {
          color: var(--color-text-muted);
          transition: color 0.2s;
        }
        .link-icon:hover { color: var(--color-primary); }

        .truncate-cell {
          max-width: 250px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: var(--color-text-muted);
        }

        .actions-cell {
          display: flex;
          gap: 0.5rem;
        }

        .action-btn {
          padding: 0.4rem;
          border-radius: var(--radius-sm);
          color: var(--color-text-muted);
          transition: all 0.2s;
        }

        .edit:hover { background: rgba(59, 130, 246, 0.1); color: var(--color-info); }
        .delete:hover { background: rgba(239, 68, 68, 0.1); color: var(--color-error); }

        .star-btn {
          color: var(--color-border);
          transition: transform 0.2s;
        }
        .star-btn:hover { transform: scale(1.1); }
        .star-btn.active { color: orange; }

        .form-grid {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.4rem;
          font-size: 0.9rem;
          color: var(--color-text-muted);
          font-weight: 500;
        }

        .form-group input, 
        .form-group select, 
        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border);
          background: var(--color-background);
          transition: border-color 0.2s;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          border-color: var(--color-primary);
          outline: none;
        }

        .full-width { width: 100%; margin-top: 1rem; }

        .skeleton-grid {
          display: grid;
          gap: 0.75rem;
        }
        .skeleton-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 0.5rem;
        }
        .skeleton-cell {
          height: 14px;
          background: linear-gradient(90deg, rgba(226,232,240,0.6), rgba(226,232,240,0.9), rgba(226,232,240,0.6));
          border-radius: 6px;
          animation: shimmer 1.2s infinite;
        }
        .skeleton-cell.wide { grid-column: span 2; height: 16px; }
        @keyframes shimmer {
          0% { background-position: -200px 0; }
          100% { background-position: 200px 0; }
        }

        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }
          .table-card { padding: 0.75rem; }
          .data-table { min-width: 720px; }
          .toggle-wide { width: 100%; justify-content: center; }
        }
      `}</style>
        </div>
    )
}

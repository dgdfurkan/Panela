
import { useEffect, useState } from 'react'
import { Plus, Search, Filter, ExternalLink, Trash2, Edit2, Star } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import StatusBadge from '../components/ui/StatusBadge'
import Modal from '../components/ui/Modal'

export default function Products() {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
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
                .select('*, profiles(username)')
                .order('created_at', { ascending: false })

            if (error) throw error
            setProducts(data)
        } catch (error) {
            console.error('Error fetching products:', error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (editingId) {
                const { error } = await supabase
                    .from('products')
                    .update({ ...formData })
                    .eq('id', editingId)
                if (error) throw error
            } else {
                const { error } = await supabase
                    .from('products')
                    .insert([{ ...formData, user_id: user.id }])
                if (error) throw error
            }

            setIsModalOpen(false)
            fetchProducts()
            resetForm()
        } catch (error) {
            alert(error.message)
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
        // Optimistic update
        const newStatus = !product.is_favorite
        setProducts(products.map(p => p.id === product.id ? { ...p, is_favorite: newStatus } : p))

        await supabase.from('products').update({ is_favorite: newStatus }).eq('id', product.id)
    }

    return (
        <div className="page-container fade-in">
            <div className="page-header">
                <div>
                    <h1 className="text-2xl font-bold text-gradient">Ürün Listesi</h1>
                    <p className="text-muted">Bulduğumuz potansiyel ürünler ve fikirler havuzu.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true) }}
                    className="btn-primary"
                >
                    <Plus size={18} />
                    <span>Yeni Ürün Ekle</span>
                </button>
            </div>

            <div className="filters-bar glass-panel">
                <div className="search-wrapper">
                    <Search size={18} color="var(--color-text-muted)" />
                    <input type="text" placeholder="Ürünlerde ara..." />
                </div>
                <button className="btn-ghost">
                    <Filter size={18} />
                    <span>Filtrele</span>
                </button>
            </div>

            <div className="table-container glass-panel">
                {loading ? (
                    <div className="p-8 text-center text-muted">Yükleniyor...</div>
                ) : products.length === 0 ? (
                    <div className="p-12 text-center text-muted">Hiç ürün yok. Yukarıdan ekleyebilirsin!</div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th width="50">Fav</th>
                                <th>Ürün Adı</th>
                                <th>Fiyat</th>
                                <th>Durum</th>
                                <th>Öncelik</th>
                                <th>Düşünceler</th>
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
                                            {product.name}
                                            {product.link && (
                                                <a href={product.link} target="_blank" rel="noopener noreferrer" className="link-icon">
                                                    <ExternalLink size={14} />
                                                </a>
                                            )}
                                        </div>
                                    </td>
                                    <td>{product.price}</td>
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
                            placeholder="Örn: Akıllı Kedi Tarağı"
                        />
                    </div>

                    <div className="form-group">
                        <label>Link (Opsiyonel)</label>
                        <input
                            value={formData.link}
                            onChange={e => setFormData({ ...formData, link: e.target.value })}
                            placeholder="https://..."
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Fiyat Tahmini</label>
                            <input
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                                placeholder="Örn: 200-300 TL"
                            />
                        </div>

                        <div className="form-group">
                            <label>Öncelik</label>
                            <select
                                value={formData.priority}
                                onChange={e => setFormData({ ...formData, priority: e.target.value })}
                            >
                                <option value="Low">Düşük</option>
                                <option value="Medium">Orta</option>
                                <option value="High">Yüksek</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Durum</label>
                        <select
                            value={formData.status}
                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                        >
                            <option value="Idea">Fikir Aşaması</option>
                            <option value="Researching">Araştırılıyor</option>
                            <option value="Sourcing">Tedarik Aranıyor</option>
                            <option value="Live">Yayında</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Düşünceler / Notlar</label>
                        <textarea
                            rows={4}
                            value={formData.thoughts}
                            onChange={e => setFormData({ ...formData, thoughts: e.target.value })}
                            placeholder="Bu ürün neden satar? Eksileri neler?"
                        />
                    </div>

                    <button type="submit" className="btn-primary full-width">
                        {editingId ? 'Değişiklikleri Kaydet' : 'Listeye Ekle'}
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

        .btn-primary {
          background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
          color: white;
          padding: 0.75rem 1.25rem;
          border-radius: var(--radius-md);
          font-weight: 600;
          display: flex;
          gap: 0.5rem;
          align-items: center;
          box-shadow: var(--shadow-glow);
          transition: transform 0.2s;
        }

        .btn-primary:active { transform: scale(0.98); }

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
      `}</style>
        </div>
    )
}


import { useEffect, useState, useRef } from 'react'
import { Package, ExternalLink, ArrowRight, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function DiscoveredProductsWidget() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [products, setProducts] = useState([])
    const [settings, setSettings] = useState({
        product_view_mode: 'latest',
        product_count: 3,
        animation_duration: 5
    })
    const [currentIndex, setCurrentIndex] = useState(0)

    // Real-time Subscription & Initial Fetch
    useEffect(() => {
        if (!user?.id) return

        const fetchSettings = async () => {
            try {
                // 1. Fetch Settings
                const { data: settingsData, error } = await supabase
                    .from('user_settings')
                    .select('*')
                    .eq('user_id', user.id)
                    .maybeSingle()

                if (error) {
                    console.error('Widget Settings Fetch Error:', error)
                }

                if (settingsData) {
                    console.log('Widget Settings Loaded:', settingsData)
                    setSettings(settingsData)
                } else {
                    console.log('Widget: No settings found, using defaults.')
                }
            } catch (error) {
                console.error('Widget Error:', error)
            }
        }

        const fetchProducts = async () => {
            try {
                // 2. Fetch Products
                const { data: productsData, error: productsError } = await supabase
                    .from('products')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })

                if (productsError) throw productsError
                setProducts(productsData || [])
                setLoading(false)
            } catch (error) {
                console.error('Products Fetch Error:', error)
                setLoading(false)
            }
        }

        fetchSettings()
        fetchProducts()

        // Real-time Subscription
        const channel = supabase
            .channel('settings_changes')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'user_settings',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    console.log('Real-time Settings Update:', payload.new)
                    setSettings(payload.new)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }

    }, [user])

    // Re-process products when Settings or Products change
    // We need a separate state for "displayed/sorted products" to avoid mutating the source or infinite loops
    // But for simplicity, we can process on the fly or use a memo. 
    // BUT random needs to be stable until mode changes.
    const [processedProducts, setProcessedProducts] = useState([])

    useEffect(() => {
        if (products.length === 0) return

        let temp = [...products]

        if (settings.product_view_mode === 'random') {
            // Shuffle
            for (let i = temp.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [temp[i], temp[j]] = [temp[j], temp[i]];
            }
        } else if (settings.product_view_mode === 'latest') {
            // Ensure sorted by date (products is already fetched sorted, but just in case)
            temp.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        }
        // 'loop' also uses the list as is (sorted or likely sorted), logic is in render slicer

        setProcessedProducts(temp)
    }, [settings.product_view_mode, products])

    // Animation / Loop Logic
    useEffect(() => {
        // Clear interval if not loop or items not enough
        if (settings.product_view_mode !== 'loop' || processedProducts.length <= settings.product_count) {
            setCurrentIndex(0) // Reset to start
            return
        }

        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => prevIndex + 1)
        }, settings.animation_duration * 1000)

        return () => clearInterval(interval)
    }, [settings.product_view_mode, settings.animation_duration, settings.product_count, processedProducts.length])


    if (loading) {
        return (
            <div className="glass-panel" style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}>
                <Loader2 className="animate-spin text-primary" />
            </div>
        )
    }

    if (products.length === 0) { // Keep using products for empty check as processed depends on it
        return (
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
                <Package size={32} className="text-muted" style={{ margin: '0 auto 1rem' }} />
                <p className="text-muted">Henüz keşfedilmiş ürün yok.</p>
            </div>
        )
    }

    // Determine which products to show
    let displayProducts = []

    // Use processedProducts for the pool
    const pool = processedProducts

    if (pool.length === 0) {
        // Should be caught by loading or empty check above, but purely safe
        return null
    }

    if (settings.product_view_mode === 'loop' && pool.length > settings.product_count) {
        // Sliding Window Logic
        for (let i = 0; i < settings.product_count; i++) {
            const index = (currentIndex + i) % pool.length
            displayProducts.push(pool[index])
        }
    } else {
        // Static display (Latest or Random, sliced)
        displayProducts = pool.slice(0, settings.product_count)
    }

    return (
        <div className="discovered-products-widget">
            <div className="section-header">
                <h3 className="section-title">
                    <Package size={20} className="text-primary" />
                    Keşfedilen Ürünler
                    {settings.product_view_mode === 'loop' && (
                        <span className="live-badge">Canlı Akış</span>
                    )}
                </h3>
            </div>

            <div className="products-grid" style={{
                gridTemplateColumns: `repeat(auto-fit, minmax(280px, 1fr))`
            }}>
                {displayProducts.map((product, idx) => (
                    <div key={`${product.id}-${idx}`} className="product-card glass-panel fade-in">
                        <div className="product-header">
                            <span className={`priority-dot ${product.priority?.toLowerCase()}`}></span>
                            <h4 className="product-name">{product.name}</h4>
                        </div>

                        {product.thoughts && (
                            <p className="product-thoughts line-clamp-2">
                                {product.thoughts}
                            </p>
                        )}

                        <div className="product-footer">
                            <span className="status-tag">{product.status}</span>
                            <button className="btn-icon">
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
               .discovered-products-widget {
                   margin-bottom: 2rem;
               }

               .section-header {
                   display: flex;
                   align-items: center;
                   margin-bottom: 1rem;
                   gap: 1rem;
               }

               .section-title {
                   font-size: 1.1rem;
                   font-weight: 600;
                   display: flex;
                   align-items: center;
                   gap: 0.5rem;
                   color: var(--color-text-main);
               }

               .live-badge {
                   font-size: 0.7rem;
                   background: rgba(var(--color-primary-rgb), 0.1);
                   color: var(--color-primary);
                   padding: 0.2rem 0.6rem;
                   border-radius: 20px;
                   font-weight: 600;
                   display: flex;
                   align-items: center;
                   gap: 4px;
               }

               .live-badge::before {
                   content: '';
                   width: 6px;
                   height: 6px;
                   border-radius: 50%;
                   background: var(--color-primary);
                   animation: pulse 1.5s infinite;
               }

               .products-grid {
                   display: grid;
                   gap: 1.5rem;
               }

               .product-card {
                   padding: 1.25rem;
                   transition: transform 0.3s ease, box-shadow 0.3s ease;
                   border: 1px solid rgba(255,255,255,0.4);
               }

               .product-card:hover {
                   transform: translateY(-4px);
                   box-shadow: var(--shadow-md);
               }

               .product-header {
                   display: flex;
                   align-items: center;
                   gap: 0.5rem;
                   margin-bottom: 0.75rem;
               }

               .priority-dot {
                   width: 8px;
                   height: 8px;
                   border-radius: 50%;
                   background: #cbd5e1;
               }
               .priority-dot.high { background: #ef4444; box-shadow: 0 0 8px rgba(239,68,68,0.4); }
               .priority-dot.medium { background: #f59e0b; }
               .priority-dot.low { background: #10b981; }

               .product-name {
                   font-weight: 600;
                   font-size: 1rem;
                   margin: 0;
                   width: 100%;
                   overflow: hidden;
                   text-overflow: ellipsis;
                   white-space: nowrap;
               }

               .product-thoughts {
                   font-size: 0.85rem;
                   color: var(--color-text-muted);
                   margin-bottom: 1.25rem;
                   line-height: 1.5;
                   height: 2.6rem; /* fixed height for alignment */
               }

               .line-clamp-2 {
                   display: -webkit-box;
                   -webkit-line-clamp: 2;
                   -webkit-box-orient: vertical;
                   overflow: hidden;
               }

               .product-footer {
                   display: flex;
                   justify-content: space-between;
                   align-items: center;
                   border-top: 1px solid rgba(0,0,0,0.05);
                   padding-top: 0.75rem;
               }

               .status-tag {
                   font-size: 0.75rem;
                   padding: 0.25rem 0.75rem;
                   border-radius: 6px;
                   background: rgba(0,0,0,0.05);
                   color: var(--color-text-muted);
                   font-weight: 500;
               }

               .btn-icon {
                   background: none;
                   border: none;
                   color: var(--color-primary);
                   cursor: pointer;
                   padding: 0.25rem;
                   border-radius: 50%;
                   transition: background 0.2s;
                   display: flex;
                   align-items: center;
                   justify-content: center;
               }

               .btn-icon:hover {
                   background: rgba(var(--color-primary-rgb), 0.1);
               }
           `}</style>
        </div>
    )
}

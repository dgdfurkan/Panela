
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

    // Fetch Settings and Products
    useEffect(() => {
        const fetchData = async () => {
            if (!user?.id) return

            try {
                // 1. Fetch Settings
                const { data: settingsData } = await supabase
                    .from('user_settings')
                    .select('*')
                    .eq('user_id', user.id)
                    .maybeSingle()

                const currentSettings = settingsData || {
                    product_view_mode: 'latest',
                    product_count: 3,
                    animation_duration: 5
                }
                setSettings(currentSettings)

                // 2. Fetch Products (All products for this user to handle sorting/slicing client-side)
                // If the dataset grows huge, we might want to limit this, but for now client-side sorting is safer/easier for "Random"
                const { data: productsData, error: productsError } = await supabase
                    .from('products')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })

                if (productsError) throw productsError

                // 3. Process Data based on View Mode
                let textProcessedProducts = productsData || []

                if (currentSettings.product_view_mode === 'random') {
                    // Fisher-Yates Shuffle
                    for (let i = textProcessedProducts.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [textProcessedProducts[i], textProcessedProducts[j]] = [textProcessedProducts[j], textProcessedProducts[i]];
                    }
                }

                // If NOT looping, just slice the top N
                // If looping, we keep all to cycle through
                setProducts(textProcessedProducts)

            } catch (error) {
                console.error('Error fetching widget data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [user])

    // Animation / Loop Logic
    useEffect(() => {
        if (settings.product_view_mode !== 'loop' || products.length <= settings.product_count) return

        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => {
                // Return to 0 if we reached the end + 1 (infinite logic handling below)
                // Actually, let's just increment and use modulo in rendering
                return prevIndex + 1
            })
        }, settings.animation_duration * 1000)

        return () => clearInterval(interval)
    }, [settings, products.length])


    if (loading) {
        return (
            <div className="glass-panel" style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}>
                <Loader2 className="animate-spin text-primary" />
            </div>
        )
    }

    if (products.length === 0) {
        return (
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
                <Package size={32} className="text-muted" style={{ margin: '0 auto 1rem' }} />
                <p className="text-muted">Henüz keşfedilmiş ürün yok.</p>
            </div>
        )
    }

    // Determine which products to show
    let displayProducts = []

    if (settings.product_view_mode === 'loop' && products.length > settings.product_count) {
        // Sliding Window Logic
        // We use modulo to wrap around array indices
        // Example: products [A, B, C, D, E], count 3
        // Index 0: [A, B, C]
        // Index 1: [B, C, D]
        // Index 2: [C, D, E]
        // Index 3: [D, E, A]
        for (let i = 0; i < settings.product_count; i++) {
            const index = (currentIndex + i) % products.length
            displayProducts.push(products[index])
        }
    } else {
        // Static display (Latest or Random, sliced)
        displayProducts = products.slice(0, settings.product_count)
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

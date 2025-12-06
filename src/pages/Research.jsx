import { useState } from 'react'
import { Search, ExternalLink, BarChart2, PlusCircle, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function Research() {
    const [url, setUrl] = useState('https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=TR&media_type=all')
    const [researchData, setResearchData] = useState({
        productName: '',
        competitorName: '',
        adCount: '',
        notes: ''
    })

    const { user } = useAuth()

    const openAdLibrary = () => {
        window.open(url, '_blank')
    }

    const handleAddProduct = async (e) => {
        e.preventDefault()
        try {
            if (!user || !user.id) throw new Error('Oturum kapalı. Lütfen tekrar giriş yapın.')

            const { error } = await supabase
                .from('products')
                .insert([{
                    name: researchData.productName,
                    status: 'Researching',
                    priority: 'High',
                    thoughts: `Rakip: ${researchData.competitorName}\nReklam Sayısı: ${researchData.adCount}\nNotlar: ${researchData.notes}`,
                    user_id: user.id
                }])

            if (error) throw error

            alert('Ürün fikirlerine eklendi!')
            setResearchData({
                productName: '',
                competitorName: '',
                adCount: '',
                notes: ''
            })
        } catch (error) {
            alert('Hata: ' + error.message)
        }
    }

    return (
        <div className="page-container fade-in">
            <div className="page-header">
                <div>
                    <h1 className="text-2xl font-bold">Pazar Araştırma Merkezi</h1>
                    <p className="text-muted">Rakip analizi ve ürün avı.</p>
                </div>
            </div>

            <div className="grid-container">
                {/* Left Column: Tools */}
                <div className="research-sidebar">
                    <div className="tool-card glass-panel">
                        <div className="tool-header">
                            <div className="icon-box bg-blue">
                                <Search size={24} color="#3B82F6" />
                            </div>
                            <h3>Meta Reklam Kütüphanesi</h3>
                        </div>
                        <p className="tool-desc">
                            Rakiplerin hangi reklamları çıktığını canlı izle.
                        </p>
                        <button onClick={openAdLibrary} className="btn-tool">
                            Kütüphaneyi Aç <ExternalLink size={16} />
                        </button>
                    </div>

                    <div className="tool-card glass-panel">
                        <div className="tool-header">
                            <div className="icon-box bg-purple">
                                <BarChart2 size={24} color="#8B5CF6" />
                            </div>
                            <h3>Google Trends</h3>
                        </div>
                        <p className="tool-desc">
                            Ürün hacimlerini ve sezonluk durumları kontrol et.
                        </p>
                        <a href="https://trends.google.com/trends/" target="_blank" rel="noreferrer" className="btn-tool secondary">
                            Trendlere Bak <ArrowRight size={16} />
                        </a>
                    </div>
                </div>

                {/* Right Column: Record Findings */}
                <div className="findings-panel glass-panel">
                    <div className="panel-header">
                        <h3>📝 Bulgu Kaydet</h3>
                        <p className="text-muted text-sm">Bulduğun potansiyel ürünü analiz et ve listene ekle.</p>
                    </div>

                    <form onSubmit={handleAddProduct} className="research-form">
                        <div className="form-group">
                            <label>Bulunan Ürün İsmi</label>
                            <input
                                required
                                value={researchData.productName}
                                onChange={e => setResearchData({ ...researchData, productName: e.target.value })}
                                placeholder="Örn: Galaxy Projektör"
                            />
                        </div>

                        <div className="form-group">
                            <label>Rakip / Mağaza Adı</label>
                            <input
                                value={researchData.competitorName}
                                onChange={e => setResearchData({ ...researchData, competitorName: e.target.value })}
                                placeholder="Örn: Trendyol / X Mağazası"
                            />
                        </div>

                        <div className="form-group">
                            <label>Aktif Reklam Sayısı (Tahmini)</label>
                            <input
                                type="number"
                                value={researchData.adCount}
                                onChange={e => setResearchData({ ...researchData, adCount: e.target.value })}
                                placeholder="Örn: 15"
                            />
                        </div>

                        <div className="form-group">
                            <label>Analiz Notları</label>
                            <textarea
                                rows={4}
                                value={researchData.notes}
                                onChange={e => setResearchData({ ...researchData, notes: e.target.value })}
                                placeholder="Video reklam kullanıyorlar mı? Fiyat avantajımız var mı?"
                            />
                        </div>

                        <button type="submit" className="btn-primary full-width">
                            <PlusCircle size={18} />
                            <span>Ürünlere Ekle ve Takip Et</span>
                        </button>
                    </form>
                </div>
            </div>

            <style>{`
        .grid-container {
          display: grid;
          grid-template-columns: 1fr 1.5fr;
          gap: 2rem;
        }

        .research-sidebar {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .tool-card {
          padding: 1.5rem;
          border-radius: var(--radius-lg);
          transition: transform 0.2s;
        }
        
        .tool-card:hover { transform: translateY(-3px); }

        .tool-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .tool-header h3 {
          font-weight: 700;
          font-size: 1.1rem;
        }

        .icon-box {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .bg-blue { background: rgba(59, 130, 246, 0.1); }
        .bg-purple { background: rgba(139, 92, 246, 0.1); }

        .tool-desc {
          color: var(--color-text-muted);
          font-size: 0.9rem;
          margin-bottom: 1.5rem;
          line-height: 1.5;
        }

        .btn-tool {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.75rem;
          border-radius: var(--radius-md);
          background: var(--color-text-main);
          color: white;
          font-weight: 600;
          transition: opacity 0.2s;
        }

        .btn-tool.secondary {
          background: var(--color-background);
          color: var(--color-text-main);
          border: 1px solid var(--color-border);
        }
        
        .btn-tool:hover { opacity: 0.9; }

        .findings-panel {
          padding: 2rem;
          border-radius: var(--radius-lg);
        }

        .panel-header { margin-bottom: 1.5rem; }

        .research-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .btn-primary {
          background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
          color: white;
          padding: 0.875rem;
          border-radius: var(--radius-md);
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          box-shadow: var(--shadow-glow);
        }
        
        /* Premium Input Styling Update for Research Form as well */
        .form-group label {
            display: block;
            margin-bottom: 0.4rem;
            font-size: 0.9rem;
            color: var(--color-text-muted);
            font-weight: 500;
        }

        .form-group input, .form-group textarea {
            width: 100%; 
            padding: 1rem; 
            border-radius: var(--radius-md); 
            border: 1px solid var(--color-border); 
            background: var(--color-background); 
            font-size: 1rem;
            transition: all 0.2s;
            color: var(--color-text-main);
        }

        .form-group input:focus, .form-group textarea:focus {
            border-color: var(--color-primary);
            background: white;
            box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
            outline: none;
        }

        .full-width { width: 100%; margin-top: 0.5rem; }

        @media (max-width: 768px) {
          .grid-container {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
        </div>
    )
}

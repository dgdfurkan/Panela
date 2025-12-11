import { useAuth } from '../context/AuthContext'
import KeywordLauncher from '../components/meta-ads/KeywordLauncher'
import ProductScanner from '../components/meta-ads/ProductScanner'
import { Search, Zap, Rocket } from 'lucide-react'
import AutoMetaScanner from '../components/meta-ads/AutoMetaScanner'
import { useState } from 'react'

export default function Research() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('classic') // classic | auto

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
              boxShadow: activeTab === 'classic' ? 'var(--shadow-glow)' : 'none'
            }}
          >
            <Zap size={16} />
            Hızlı Başlatıcı
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
              boxShadow: activeTab === 'auto' ? 'var(--shadow-glow)' : 'none'
            }}
          >
            <Rocket size={16} />
            Otomatik Meta Tarayıcı
          </button>
        </div>

        {activeTab === 'auto' ? (
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
              <ProductScanner userId={user?.id} />
            </div>
          </div>
        )}
      </div>

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

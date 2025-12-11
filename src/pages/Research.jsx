import { useAuth } from '../context/AuthContext'
import KeywordLauncher from '../components/meta-ads/KeywordLauncher'
import ProductScanner from '../components/meta-ads/ProductScanner'
import { Search } from 'lucide-react'

export default function Research() {
  const { user } = useAuth()

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

        {/* Two Panel Layout */}
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

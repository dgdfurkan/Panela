import { useState } from 'react'
import { AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import MarkQuoteTooltip from './MarkQuoteTooltip'

const trendOptions = [
  { value: 'Stable', label: 'Stabil', icon: Minus },
  { value: 'Exploding', label: 'Yükselen', icon: TrendingUp },
  { value: 'Dying', label: 'Sönme', icon: TrendingDown }
]

export default function ValidationDeskStep({ onComplete, initialData = {} }) {
  const [searchVolume, setSearchVolume] = useState(initialData.search_volume?.toString() || '')
  const [siteTraffic, setSiteTraffic] = useState(initialData.site_traffic?.toString() || '')
  const [trendStatus, setTrendStatus] = useState(initialData.trend_status || '')

  const searchVolumeNum = searchVolume ? parseInt(searchVolume) : 0
  const siteTrafficNum = siteTraffic ? parseInt(siteTraffic) : 0
  const isLowSearchVolume = searchVolumeNum > 0 && searchVolumeNum < 30000
  const isLowTraffic = siteTrafficNum > 0 && siteTrafficNum < 300000

  const handleNext = () => {
    onComplete({
      search_volume: searchVolumeNum,
      site_traffic: siteTrafficNum,
      trend_status: trendStatus
    })
  }

  const canProceed = searchVolume && siteTraffic && trendStatus

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: '700',
            fontSize: '20px'
          }}>
            4
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', marginBottom: '0.5rem' }}>
              Doğrulama Masası
            </h2>
            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '14px' }}>
              Son Karar Noktası
            </p>
          </div>
          <MarkQuoteTooltip quoteKey="searchVolume" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Search Volume */}
          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', fontSize: '15px' }}>
              Aranma Hacmi (Keywords Everywhere)
            </label>
            <input
              type="number"
              value={searchVolume}
              onChange={e => setSearchVolume(e.target.value)}
              placeholder="30000"
              className="input"
              style={{
                width: '100%',
                borderColor: isLowSearchVolume ? 'var(--color-error)' : undefined
              }}
            />
            {isLowSearchVolume && (
              <div className="toast error" style={{ marginTop: '0.75rem' }}>
                <AlertCircle size={18} />
                <span>Hacim çok düşük. Yeterli talep yoksa ürün satmaz.</span>
              </div>
            )}
          </div>

          {/* Site Traffic */}
          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', fontSize: '15px' }}>
              Rakip Trafiği (SimilarWeb)
            </label>
            <input
              type="number"
              value={siteTraffic}
              onChange={e => setSiteTraffic(e.target.value)}
              placeholder="300000"
              className="input"
              style={{
                width: '100%',
                borderColor: isLowTraffic ? 'var(--color-error)' : undefined
              }}
            />
            {isLowTraffic && (
              <div className="toast error" style={{ marginTop: '0.75rem' }}>
                <AlertCircle size={18} />
                <span>Yeterli talep yok. Tekerleği yeniden icat etme. Dönen tekerleğe bin.</span>
              </div>
            )}
          </div>

          {/* Trend Status */}
          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.75rem', fontSize: '15px' }}>
              Trend Analizi
            </label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {trendOptions.map(option => {
                const Icon = option.icon
                const isSelected = trendStatus === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTrendStatus(option.value)}
                    className="glass-panel"
                    style={{
                      flex: 1,
                      padding: '1rem',
                      border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Icon size={24} color={isSelected ? 'var(--color-primary)' : 'var(--color-text-muted)'} />
                    <span>{option.label}</span>
                  </button>
                )
              })}
            </div>
            {trendStatus && (
              <div className="toast" style={{
                marginTop: '0.75rem',
                background: 'rgba(59, 130, 246, 0.08)',
                borderColor: 'rgba(59, 130, 246, 0.25)'
              }}>
                <div style={{ fontSize: '14px' }}>
                  {trendStatus === 'Stable' && 'Stabil trendler güvenilirdir. Tekerleği yeniden icat etme.'}
                  {trendStatus === 'Exploding' && 'Yükselen trend! İyi bir zamanlama olabilir ama dikkatli ol.'}
                  {trendStatus === 'Dying' && 'Sönme trendi risklidir. Bu ürün için dikkatli ol.'}
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleNext}
          disabled={!canProceed}
          className={canProceed ? 'primary-btn' : 'ghost-btn'}
          style={{ width: '100%', marginTop: '2rem' }}
        >
          Sonuçları Gör →
        </button>
      </div>
    </div>
  )
}


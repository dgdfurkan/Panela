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
      <div style={{
        background: 'rgba(30, 41, 59, 0.5)',
        borderRadius: 'var(--radius-lg)',
        padding: '2rem',
        border: '1px solid rgba(139, 92, 246, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
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
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#F1F5F9', marginBottom: '0.5rem' }}>
              Validation Desk
            </h2>
            <p style={{ margin: 0, color: '#94A3B8', fontSize: '14px' }}>
              Doğrulama Masası - Son Karar Noktası
            </p>
          </div>
          <MarkQuoteTooltip quoteKey="searchVolume" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Search Volume */}
          <div>
            <label style={{ display: 'block', color: '#F1F5F9', fontWeight: '600', marginBottom: '0.5rem', fontSize: '15px' }}>
              Aranma Hacmi (Keywords Everywhere)
            </label>
            <input
              type="number"
              value={searchVolume}
              onChange={e => setSearchVolume(e.target.value)}
              placeholder="30000"
              style={{
                width: '100%',
                padding: '0.875rem',
                background: 'rgba(30, 41, 59, 0.5)',
                border: `1px solid ${isLowSearchVolume ? 'rgba(239, 68, 68, 0.5)' : 'rgba(139, 92, 246, 0.3)'}`,
                borderRadius: 'var(--radius-md)',
                color: '#F1F5F9',
                fontSize: '15px'
              }}
            />
            {isLowSearchVolume && (
              <div style={{
                marginTop: '0.75rem',
                padding: '1rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <AlertCircle size={20} color="#EF4444" />
                <span style={{ color: '#FCA5A5', fontSize: '14px' }}>
                  Hacim çok düşük. Yeterli talep yoksa ürün satmaz.
                </span>
              </div>
            )}
          </div>

          {/* Site Traffic */}
          <div>
            <label style={{ display: 'block', color: '#F1F5F9', fontWeight: '600', marginBottom: '0.5rem', fontSize: '15px' }}>
              Rakip Trafiği (SimilarWeb)
            </label>
            <input
              type="number"
              value={siteTraffic}
              onChange={e => setSiteTraffic(e.target.value)}
              placeholder="300000"
              style={{
                width: '100%',
                padding: '0.875rem',
                background: 'rgba(30, 41, 59, 0.5)',
                border: `1px solid ${isLowTraffic ? 'rgba(239, 68, 68, 0.5)' : 'rgba(139, 92, 246, 0.3)'}`,
                borderRadius: 'var(--radius-md)',
                color: '#F1F5F9',
                fontSize: '15px'
              }}
            />
            {isLowTraffic && (
              <div style={{
                marginTop: '0.75rem',
                padding: '1rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <AlertCircle size={20} color="#EF4444" />
                <span style={{ color: '#FCA5A5', fontSize: '14px' }}>
                  Yeterli talep yok. Tekerleği yeniden icat etme. Dönen tekerleğe bin.
                </span>
              </div>
            )}
          </div>

          {/* Trend Status */}
          <div>
            <label style={{ display: 'block', color: '#F1F5F9', fontWeight: '600', marginBottom: '0.75rem', fontSize: '15px' }}>
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
                    style={{
                      flex: 1,
                      padding: '1rem',
                      background: isSelected
                        ? 'rgba(59, 130, 246, 0.2)'
                        : 'rgba(30, 41, 59, 0.5)',
                      border: `2px solid ${isSelected ? '#3B82F6' : 'rgba(139, 92, 246, 0.3)'}`,
                      borderRadius: 'var(--radius-md)',
                      color: '#F1F5F9',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Icon size={24} color={isSelected ? '#3B82F6' : '#64748B'} />
                    <span>{option.label}</span>
                  </button>
                )
              })}
            </div>
            {trendStatus && (
              <div style={{
                marginTop: '0.75rem',
                padding: '1rem',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: 'var(--radius-md)'
              }}>
                <div style={{ color: '#93C5FD', fontSize: '14px' }}>
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
          style={{
            width: '100%',
            marginTop: '2rem',
            padding: '1rem',
            background: canProceed
              ? 'linear-gradient(135deg, #3B82F6, #2563EB)'
              : 'rgba(100, 116, 139, 0.3)',
            color: canProceed ? 'white' : '#64748B',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontWeight: '700',
            fontSize: '16px',
            cursor: canProceed ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
            boxShadow: canProceed ? '0 4px 12px rgba(59, 130, 246, 0.4)' : 'none'
          }}
        >
          Sonuçları Gör →
        </button>
      </div>
    </div>
  )
}


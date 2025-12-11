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
    <>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-xl)' }}>
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
              <label>Aranma Hacmi (Keywords Everywhere)</label>
              <input
                type="number"
                value={searchVolume}
                onChange={e => setSearchVolume(e.target.value)}
                placeholder="30000"
                style={{
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
              <label>Rakip Trafiği (SimilarWeb)</label>
              <input
                type="number"
                value={siteTraffic}
                onChange={e => setSiteTraffic(e.target.value)}
                placeholder="300000"
                style={{
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
              <label>Trend Analizi</label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {trendOptions.map(option => {
                  const Icon = option.icon
                  const isSelected = trendStatus === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTrendStatus(option.value)}
                      className={`trend-btn ${isSelected ? 'active' : ''}`}
                    >
                      <Icon size={24} />
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
            className={canProceed ? 'primary' : 'ghost'}
            style={{ width: '100%', marginTop: '2rem' }}
          >
            Sonuçları Gör →
          </button>
        </div>
      </div>

      <style>{`
        label {
          font-weight: 600;
          color: var(--color-text-main);
          display: block;
          margin-bottom: 0.35rem;
          font-size: 15px;
        }
        input {
          width: 100%;
          padding: 0.65rem 0.75rem;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          background: white;
          transition: border var(--transition-fast), box-shadow var(--transition-fast);
          font-size: 15px;
        }
        input:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(139,92,246,0.15);
          outline: none;
        }
        .trend-btn {
          flex: 1;
          padding: 1rem;
          border: 2px solid var(--color-border);
          border-radius: var(--radius-md);
          background: white;
          cursor: pointer;
          transition: all var(--transition-fast);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
        }
        .trend-btn.active {
          border-color: var(--color-primary);
          background: rgba(139, 92, 246, 0.05);
        }
        .trend-btn:hover {
          border-color: var(--color-primary);
        }
        .ghost {
          padding: 0.65rem 1.1rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border);
          background: white;
          font-weight: 600;
          color: var(--color-text-main);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .ghost:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .primary {
          padding: 0.65rem 1.1rem;
          border-radius: var(--radius-md);
          border: none;
          background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
          color: white;
          font-weight: 600;
          cursor: pointer;
          box-shadow: var(--shadow-sm);
          transition: all var(--transition-fast);
        }
        .primary:hover {
          box-shadow: var(--shadow-md);
          transform: translateY(-1px);
        }
        .primary:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          transform: none;
        }
      `}</style>
    </>
  )
}

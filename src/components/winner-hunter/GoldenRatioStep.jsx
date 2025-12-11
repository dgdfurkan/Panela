import { useState, useEffect } from 'react'
import { Flame, AlertTriangle } from 'lucide-react'
import MarkQuoteTooltip from './MarkQuoteTooltip'

export default function GoldenRatioStep({ onComplete, initialData = {} }) {
  const [likes, setLikes] = useState(initialData.likes_count?.toString() || '')
  const [shares, setShares] = useState(initialData.shares_count?.toString() || '')

  const calculateRatio = () => {
    if (!likes || !shares) return null
    const likesNum = parseFloat(likes)
    const sharesNum = parseFloat(shares)
    if (sharesNum > 0) {
      return (likesNum / sharesNum).toFixed(2)
    }
    return null
  }

  const ratio = calculateRatio()
  const isGoldenRatio = ratio && parseFloat(ratio) <= 2
  const isLowEngagement = ratio && parseFloat(ratio) > 5

  const handleNext = () => {
    const likesNum = likes ? parseInt(likes) : 0
    const sharesNum = shares ? parseInt(shares) : 0
    const ratioNum = ratio ? parseFloat(ratio) : null

    onComplete({
      likes_count: likesNum,
      shares_count: sharesNum,
      engagement_ratio: ratioNum
    })
  }

  const canProceed = likes && shares && parseFloat(shares) > 0

  return (
    <>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-xl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '700',
              fontSize: '20px'
            }}>
              3
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', marginBottom: '0.5rem' }}>
                Altın Oran Analizi
              </h2>
              <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '14px' }}>
                Viral Matematik - X Faktörü
              </p>
            </div>
            <MarkQuoteTooltip quoteKey="goldenRatio" />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '15px', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              Reklamın beğeni ve paylaşım sayılarını gir. Sistem otomatik olarak Altın Oran'ı hesaplayacak.
            </p>

            <div className="two-col" style={{ marginBottom: '1.5rem' }}>
              <div>
                <label>Beğeni Sayısı</label>
                <input
                  type="number"
                  value={likes}
                  onChange={e => setLikes(e.target.value)}
                  placeholder="10000"
                />
              </div>
              <div>
                <label>Paylaşım Sayısı</label>
                <input
                  type="number"
                  value={shares}
                  onChange={e => setShares(e.target.value)}
                  placeholder="5000"
                />
              </div>
            </div>

            {ratio && (
              <div className={`toast ${isGoldenRatio ? '' : isLowEngagement ? '' : 'glass-panel'}`} style={{
                padding: '1.5rem',
                background: isGoldenRatio
                  ? 'rgba(16, 185, 129, 0.08)'
                  : isLowEngagement
                  ? 'rgba(245, 158, 11, 0.08)'
                  : undefined,
                borderColor: isGoldenRatio ? 'rgba(16, 185, 129, 0.25)' : isLowEngagement ? 'rgba(245, 158, 11, 0.25)' : undefined,
                textAlign: 'center'
              }}>
                {isGoldenRatio ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <Flame size={32} color="var(--color-success)" />
                      <div style={{
                        fontSize: '28px',
                        fontWeight: '700',
                        color: 'var(--color-success)'
                      }}>
                        ALTIN ORAN!
                      </div>
                    </div>
                    <div style={{ color: 'var(--color-success)', fontSize: '18px', fontWeight: '600', marginBottom: '0.5rem' }}>
                      Bu ürün Viral!
                    </div>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
                      İnsanlar bunu deliler gibi paylaşıyor. Reklam maliyetin çok ucuz olacak.
                    </div>
                    <div style={{
                      marginTop: '1rem',
                      fontSize: '36px',
                      fontWeight: '700',
                      color: 'var(--color-success)'
                    }}>
                      {ratio}x
                    </div>
                  </>
                ) : isLowEngagement ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <AlertTriangle size={32} color="#F59E0B" />
                      <div style={{ fontSize: '20px', fontWeight: '700', color: '#F59E0B' }}>
                        Düşük Etkileşim
                      </div>
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '0.5rem' }}>
                      Sadece para basılmış, kimse paylaşmamış.
                    </div>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
                      Dikkatli ol. Bu ürün viral olmayabilir.
                    </div>
                    <div style={{
                      marginTop: '1rem',
                      fontSize: '28px',
                      fontWeight: '700',
                      color: '#F59E0B'
                    }}>
                      {ratio}x
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
                      Orta Seviye Etkileşim
                    </div>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
                      Oran: {ratio}x - İyi ama mükemmel değil.
                    </div>
                    <div style={{
                      marginTop: '1rem',
                      fontSize: '28px',
                      fontWeight: '700',
                      color: 'var(--color-primary)'
                    }}>
                      {ratio}x
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleNext}
            disabled={!canProceed}
            className={canProceed ? 'primary' : 'ghost'}
            style={{ width: '100%' }}
          >
            Devam Et →
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
        .two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
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

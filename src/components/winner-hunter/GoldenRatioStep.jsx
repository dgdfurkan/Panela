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
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#F1F5F9', marginBottom: '0.5rem' }}>
              Golden Ratio Analysis
            </h2>
            <p style={{ margin: 0, color: '#94A3B8', fontSize: '14px' }}>
              Viral Matematik - X Faktörü
            </p>
          </div>
          <MarkQuoteTooltip quoteKey="goldenRatio" />
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <p style={{ color: '#94A3B8', fontSize: '15px', lineHeight: '1.6', marginBottom: '1.5rem' }}>
            Reklamın beğeni ve paylaşım sayılarını gir. Sistem otomatik olarak Golden Ratio'yu hesaplayacak.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', color: '#F1F5F9', fontWeight: '600', marginBottom: '0.5rem', fontSize: '15px' }}>
                Beğeni Sayısı
              </label>
              <input
                type="number"
                value={likes}
                onChange={e => setLikes(e.target.value)}
                placeholder="10000"
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  background: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  color: '#F1F5F9',
                  fontSize: '15px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: '#F1F5F9', fontWeight: '600', marginBottom: '0.5rem', fontSize: '15px' }}>
                Paylaşım Sayısı
              </label>
              <input
                type="number"
                value={shares}
                onChange={e => setShares(e.target.value)}
                placeholder="5000"
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  background: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  color: '#F1F5F9',
                  fontSize: '15px'
                }}
              />
            </div>
          </div>

          {ratio && (
            <div style={{
              padding: '1.5rem',
              background: isGoldenRatio
                ? 'rgba(16, 185, 129, 0.1)'
                : isLowEngagement
                ? 'rgba(245, 158, 11, 0.1)'
                : 'rgba(59, 130, 246, 0.1)',
              border: `2px solid ${isGoldenRatio ? '#10B981' : isLowEngagement ? '#F59E0B' : '#3B82F6'}`,
              borderRadius: 'var(--radius-md)',
              textAlign: 'center'
            }}>
              {isGoldenRatio ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <Flame size={32} color="#10B981" />
                    <div style={{
                      fontSize: '28px',
                      fontWeight: '700',
                      color: '#10B981',
                      textShadow: '0 0 15px rgba(16, 185, 129, 0.5)'
                    }}>
                      ALTIN ORAN!
                    </div>
                  </div>
                  <div style={{ color: '#6EE7B7', fontSize: '18px', fontWeight: '600', marginBottom: '0.5rem' }}>
                    Bu ürün Viral!
                  </div>
                  <div style={{ color: '#94A3B8', fontSize: '14px' }}>
                    İnsanlar bunu deliler gibi paylaşıyor. Reklam maliyetin çok ucuz olacak.
                  </div>
                  <div style={{
                    marginTop: '1rem',
                    fontSize: '36px',
                    fontWeight: '700',
                    color: '#10B981',
                    textShadow: '0 0 20px rgba(16, 185, 129, 0.6)'
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
                  <div style={{ color: '#FCD34D', fontSize: '16px', fontWeight: '600', marginBottom: '0.5rem' }}>
                    Sadece para basılmış, kimse paylaşmamış.
                  </div>
                  <div style={{ color: '#94A3B8', fontSize: '14px' }}>
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
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#3B82F6', marginBottom: '0.5rem' }}>
                    Orta Seviye Etkileşim
                  </div>
                  <div style={{ color: '#94A3B8', fontSize: '14px' }}>
                    Oran: {ratio}x - İyi ama mükemmel değil.
                  </div>
                  <div style={{
                    marginTop: '1rem',
                    fontSize: '28px',
                    fontWeight: '700',
                    color: '#3B82F6'
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
          style={{
            width: '100%',
            padding: '1rem',
            background: canProceed
              ? 'linear-gradient(135deg, #F59E0B, #D97706)'
              : 'rgba(100, 116, 139, 0.3)',
            color: canProceed ? 'white' : '#64748B',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontWeight: '700',
            fontSize: '16px',
            cursor: canProceed ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
            boxShadow: canProceed ? '0 4px 12px rgba(245, 158, 11, 0.4)' : 'none'
          }}
        >
          Devam Et →
        </button>
      </div>
    </div>
  )
}


import { useEffect } from 'react'
import confetti from 'canvas-confetti'
import { Trophy, Trash2, CheckCircle, XCircle } from 'lucide-react'
import { calculateWinnerScore, getScoreStatus, getScoreColor } from '../../lib/WinnerScoreCalculator'

export default function VerdictScreen({ data, onSave, onReset }) {
  const score = calculateWinnerScore(data)
  const status = getScoreStatus(score)
  const color = getScoreColor(score)
  const isWinner = status === 'WINNER'
  const isTrash = status === 'Trash'

  useEffect(() => {
    if (isWinner) {
      // Konfeti animasyonu
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      })
      // Ekstra patlamalar
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        })
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        })
      }, 250)
    }
  }, [isWinner])

  const handleSave = async () => {
    const finalData = {
      ...data,
      winner_score: score,
      status: isWinner ? 'WINNER' : isTrash ? 'Trash' : 'Validation'
    }
    await onSave(finalData)
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{
        background: 'rgba(30, 41, 59, 0.5)',
        borderRadius: 'var(--radius-lg)',
        padding: '3rem',
        border: `2px solid ${color}`,
        textAlign: 'center'
      }}>
        {/* Score Display */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{
            fontSize: '72px',
            fontWeight: '800',
            color: color,
            textShadow: `0 0 30px ${color}40`,
            marginBottom: '1rem',
            lineHeight: '1'
          }}>
            {score}
          </div>
          <div style={{
            fontSize: '32px',
            fontWeight: '700',
            color: color,
            marginBottom: '0.5rem'
          }}>
            {isWinner && '🏆 WINNER!'}
            {isTrash && '🗑️ TRASH'}
            {status === 'Validation' && '✅ VALIDATION'}
          </div>
        </div>

        {/* Status Icon */}
        <div style={{ marginBottom: '2rem' }}>
          {isWinner && (
            <div style={{
              width: '120px',
              height: '120px',
              margin: '0 auto',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${color}, ${color}80)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 0 40px ${color}60`
            }}>
              <Trophy size={64} color="white" />
            </div>
          )}
          {isTrash && (
            <div style={{
              width: '120px',
              height: '120px',
              margin: '0 auto',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${color}, ${color}80)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Trash2 size={64} color="white" />
            </div>
          )}
          {status === 'Validation' && (
            <div style={{
              width: '120px',
              height: '120px',
              margin: '0 auto',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${color}, ${color}80)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCircle size={64} color="white" />
            </div>
          )}
        </div>

        {/* Message */}
        <div style={{ marginBottom: '2rem' }}>
          {isWinner && (
            <div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#F1F5F9', marginBottom: '1rem' }}>
                🎉 TEBRİKLER! Bu ürün WINNER listesine eklendi!
              </div>
              <div style={{ color: '#94A3B8', fontSize: '15px', lineHeight: '1.6' }}>
                Tüm kriterleri geçtin. Bu ürünle ilerlemeye değer.
              </div>
            </div>
          )}
          {isTrash && (
            <div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#F1F5F9', marginBottom: '1rem' }}>
                Bu ürünü çöpe at ve sıradakine geç.
              </div>
              <div style={{ color: '#94A3B8', fontSize: '15px', lineHeight: '1.6' }}>
                Skor çok düşük. Zamanını daha iyi ürünlere harca.
              </div>
            </div>
          )}
          {status === 'Validation' && (
            <div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#F1F5F9', marginBottom: '1rem' }}>
                Daha fazla analiz gerekiyor.
              </div>
              <div style={{ color: '#94A3B8', fontSize: '15px', lineHeight: '1.6' }}>
                Bu ürün Validation aşamasında. Daha fazla test et.
              </div>
            </div>
          )}
        </div>

        {/* Product Summary */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '1.5rem',
          marginBottom: '2rem',
          textAlign: 'left'
        }}>
          <div style={{ color: '#F1F5F9', fontWeight: '600', marginBottom: '1rem', fontSize: '16px' }}>
            Ürün Özeti
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '14px' }}>
            <div>
              <span style={{ color: '#94A3B8' }}>Ürün:</span>
              <span style={{ color: '#F1F5F9', marginLeft: '0.5rem', fontWeight: '600' }}>
                {data.product_name || 'Belirtilmemiş'}
              </span>
            </div>
            <div>
              <span style={{ color: '#94A3B8' }}>Niş:</span>
              <span style={{ color: '#F1F5F9', marginLeft: '0.5rem', fontWeight: '600' }}>
                {data.niche || 'Belirtilmemiş'}
              </span>
            </div>
            {data.profit_margin && (
              <div>
                <span style={{ color: '#94A3B8' }}>Kâr Marjı:</span>
                <span style={{ color: '#10B981', marginLeft: '0.5rem', fontWeight: '600' }}>
                  {data.profit_margin}x
                </span>
              </div>
            )}
            {data.engagement_ratio && (
              <div>
                <span style={{ color: '#94A3B8' }}>Golden Ratio:</span>
                <span style={{ color: '#F59E0B', marginLeft: '0.5rem', fontWeight: '600' }}>
                  {data.engagement_ratio}x
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={onReset}
            style={{
              flex: 1,
              padding: '1rem',
              background: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: '#F1F5F9',
              fontWeight: '600',
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Yeni Ürün Analizi
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              padding: '1rem',
              background: `linear-gradient(135deg, ${color}, ${color}80)`,
              border: 'none',
              borderRadius: 'var(--radius-md)',
              color: 'white',
              fontWeight: '700',
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: `0 4px 12px ${color}40`
            }}
          >
            {isWinner ? 'WINNER Listesine Ekle' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  )
}


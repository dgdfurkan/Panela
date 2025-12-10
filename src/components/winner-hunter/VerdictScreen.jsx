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
      <div className="glass-panel" style={{
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
            {isWinner && '🏆 KAZANAN!'}
            {isTrash && '🗑️ ÇÖP'}
            {status === 'Validation' && '✅ DOĞRULAMA'}
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
              <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '1rem' }}>
                🎉 TEBRİKLER! Bu ürün Kazanan listesine eklendi!
              </div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '15px', lineHeight: '1.6' }}>
                Tüm kriterleri geçtin. Bu ürünle ilerlemeye değer.
              </div>
            </div>
          )}
          {isTrash && (
            <div>
              <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '1rem' }}>
                Bu ürünü çöpe at ve sıradakine geç.
              </div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '15px', lineHeight: '1.6' }}>
                Skor çok düşük. Zamanını daha iyi ürünlere harca.
              </div>
            </div>
          )}
          {status === 'Validation' && (
            <div>
              <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '1rem' }}>
                Daha fazla analiz gerekiyor.
              </div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '15px', lineHeight: '1.6' }}>
                Bu ürün Doğrulama aşamasında. Daha fazla test et.
              </div>
            </div>
          )}
        </div>

        {/* Product Summary */}
        <div className="glass-panel" style={{
          padding: '1.5rem',
          marginBottom: '2rem',
          textAlign: 'left'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '1rem', fontSize: '16px' }}>
            Ürün Özeti
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '14px' }}>
            <div>
              <span style={{ color: 'var(--color-text-muted)' }}>Ürün:</span>
              <span style={{ marginLeft: '0.5rem', fontWeight: '600' }}>
                {data.product_name || 'Belirtilmemiş'}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)' }}>Niş:</span>
              <span style={{ marginLeft: '0.5rem', fontWeight: '600' }}>
                {data.niche || 'Belirtilmemiş'}
              </span>
            </div>
            {data.profit_margin && (
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Kâr Marjı:</span>
                <span style={{ color: 'var(--color-success)', marginLeft: '0.5rem', fontWeight: '600' }}>
                  {data.profit_margin}x
                </span>
              </div>
            )}
            {data.engagement_ratio && (
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Altın Oran:</span>
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
            className="ghost-btn"
            style={{ flex: 1 }}
          >
            Yeni Ürün Analizi
          </button>
          <button
            onClick={handleSave}
            className="primary-btn"
            style={{
              flex: 1,
              background: `linear-gradient(135deg, ${color}, ${color}80)`
            }}
          >
            {isWinner ? 'Kazanan Listesine Ekle' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  )
}


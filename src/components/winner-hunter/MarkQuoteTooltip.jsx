import { useState } from 'react'
import { MessageCircle } from 'lucide-react'

const markQuotes = {
  problemSolving: "Paranız olmasa bile iyi hissetmek için harcama yaparsınız. İnsanlar zevk kazanmaktan çok acıdan kaçınır. Acıya odaklan.",
  profitMargin: "3x markup olmadan reklam maliyetini kurtaramazsın. Matematik yalan söylemez.",
  lightweight: "Ayakkabı kutusuna sığmayan ürünler lojistik maliyetini artırır.",
  evergreen: "Kışın elinde patlayabilir. Mevsimsel ürünler risklidir.",
  goldenRatio: "İnsanlar bunu deliler gibi paylaşıyor. Reklam maliyetin çok ucuz olacak. Sadece para basılmış, kimse paylaşmamış. Dikkatli ol.",
  searchVolume: "Tekerleği yeniden icat etme. Dönen tekerleğe bin. Yeterli talep yoksa ürün satmaz.",
  trendStatus: "Stabil trendler güvenilirdir. Ani patlamalar risklidir.",
  niche: "Rastgele gadget satma! Gerçek problemler milyar dolarlık pazardır."
}

export default function MarkQuoteTooltip({ quoteKey, position = 'top-right' }) {
  const [isVisible, setIsVisible] = useState(false)
  const quote = markQuotes[quoteKey] || markQuotes.niche

  const positionClasses = {
    'top-right': { top: '-10px', right: '-10px' },
    'top-left': { top: '-10px', left: '-10px' },
    'bottom-right': { bottom: '-10px', right: '-10px' },
    'bottom-left': { bottom: '-10px', left: '-10px' }
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        style={{
          cursor: 'help',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: 'rgba(139, 92, 246, 0.1)',
          color: 'var(--color-primary)',
          transition: 'all 0.2s'
        }}
      >
        <MessageCircle size={14} />
      </div>
      {isVisible && (
        <div
          style={{
            position: 'absolute',
            ...positionClasses[position],
            zIndex: 1000,
            width: '280px',
            padding: '12px',
            background: '#1E293B',
            color: '#F1F5F9',
            borderRadius: '8px',
            fontSize: '13px',
            lineHeight: '1.5',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            pointerEvents: 'none'
          }}
        >
          <div style={{ fontWeight: '600', marginBottom: '6px', color: '#8B5CF6' }}>
            Mark Diyor ki:
          </div>
          <div>{quote}</div>
          <div
            style={{
              position: 'absolute',
              width: '0',
              height: '0',
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid #1E293B',
              bottom: '-6px',
              left: '20px'
            }}
          />
        </div>
      )}
    </div>
  )
}


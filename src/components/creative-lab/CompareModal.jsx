import { X } from 'lucide-react'

const metricsKeys = [
  { key: 'spend', label: 'Harcama' },
  { key: 'roas', label: 'ROAS' },
  { key: 'clicks', label: 'Tıklama' }
]

export default function CompareModal({ open, onClose, left, right }) {
  if (!open || !left || !right) return null

  const leftMetrics = left.metrics || {}
  const rightMetrics = right.metrics || {}

  const ratio = (l, r) => {
    const max = Math.max(Number(l) || 0, Number(r) || 0, 1)
    return {
      left: ((Number(l) || 0) / max) * 100,
      right: ((Number(r) || 0) / max) * 100
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-card glass-panel">
        <header>
          <div>
            <p className="eyebrow">VS Modu</p>
            <h3>{left.ad_headline || 'Reklam A'} vs {right.ad_headline || 'Reklam B'}</h3>
          </div>
          <button onClick={onClose} className="close-btn"><X size={18} /></button>
        </header>

        <div className="compare-grid">
          <div className="side">
            <p className="eyebrow">{left.platform}</p>
            <h4>{left.ad_headline || 'Reklam A'}</h4>
            <p className="muted">{left.strategy_angle || 'Strateji yok'}</p>
          </div>
          <div className="bars">
            {metricsKeys.map(({ key, label }) => {
              const lVal = leftMetrics[key] ?? 0
              const rVal = rightMetrics[key] ?? 0
              const widths = ratio(lVal, rVal)
              return (
                <div key={key} className="bar-row">
                  <span>{label}</span>
                  <div className="bars-stack">
                    <div className="bar left" style={{ width: `${widths.left}%` }} title={`${lVal}`} />
                    <div className="bar right" style={{ width: `${widths.right}%` }} title={`${rVal}`} />
                  </div>
                  <div className="bar-values">
                    <span>{lVal}</span>
                    <span>{rVal}</span>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="side right">
            <p className="eyebrow">{right.platform}</p>
            <h4>{right.ad_headline || 'Reklam B'}</h4>
            <p className="muted">{right.strategy_angle || 'Strateji yok'}</p>
          </div>
        </div>
      </div>

      <style>{`
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.4);
          display: grid;
          place-items: center;
          z-index: 200;
          padding: 1rem;
        }
        .modal-card {
          max-width: 900px;
          width: 100%;
          padding: 1.25rem;
          border-radius: var(--radius-xl);
          border: 1px solid var(--color-border);
        }
        header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }
        .eyebrow {
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-size: 0.78rem;
          color: var(--color-text-muted);
        }
        .muted { color: var(--color-text-muted); }
        .close-btn {
          border: 1px solid var(--color-border);
          padding: 0.35rem;
          border-radius: var(--radius-md);
          background: white;
          cursor: pointer;
        }
        .compare-grid {
          display: grid;
          grid-template-columns: 1fr 1.2fr 1fr;
          gap: 0.75rem;
          align-items: center;
        }
        .side h4 { margin: 0.25rem 0; }
        .bars {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .bar-row span { font-weight: 600; }
        .bars-stack {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.25rem;
          align-items: center;
          margin: 0.3rem 0;
        }
        .bar {
          height: 12px;
          border-radius: 999px;
          background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
        }
        .bar.right {
          background: linear-gradient(135deg, var(--color-secondary), var(--color-accent));
        }
        .bar-values {
          display: flex;
          justify-content: space-between;
          color: var(--color-text-muted);
          font-size: 0.9rem;
        }
        @media (max-width: 820px) {
          .compare-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}


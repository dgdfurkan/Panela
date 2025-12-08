import { BadgeCheck, Flame, Pause, Play, Star, TrendingUp, TrendingDown } from 'lucide-react'
import StatusBadge from '../ui/StatusBadge'

const roasColor = (roas) => {
  if (roas >= 3) return 'success'
  if (roas >= 1.5) return 'warning'
  return 'error'
}

export default function CreativeCard({ creative, onSelectCompare, selected }) {
  const metrics = creative.metrics || {}
  const roasValue = Number(metrics.roas ?? 0)
  const statusTone = roasColor(roasValue)

  return (
    <article className={`creative-card glass-panel ${selected ? 'selected' : ''}`}>
      <header className="card-header">
        <div>
          <p className="eyebrow">{creative.platform}</p>
          <h4>{creative.ad_headline || 'Başlıksız Creative'}</h4>
          <p className="muted">{creative.strategy_angle || 'Strateji: N/A'}</p>
        </div>
        <StatusBadge status={creative.status} />
      </header>

      <p className="copy-preview">{creative.ad_copy_primary?.slice(0, 120) || 'Henüz metin eklenmedi'}...</p>

      <div className="metrics">
        <Metric label="ROAS" value={roasValue} icon={roasValue >= 2 ? TrendingUp : TrendingDown} tone={statusTone} suffix="x" />
        <Metric label="Spend" value={metrics.spend ?? 0} icon={Flame} prefix="$" />
        <Metric label="Clicks" value={metrics.clicks ?? 0} icon={Star} />
        <Metric label="CTR" value={metrics.ctr ?? 0} icon={BadgeCheck} suffix="%" />
      </div>

      <footer className="card-actions">
        <div className="tags">
          {(creative.tags || []).slice(0, 3).map((t) => <span key={t}>#{t}</span>)}
          {creative.visual_type && <span className="pill">{creative.visual_type}</span>}
        </div>
        <button className={`compare-btn ${selected ? 'active' : ''}`} onClick={() => onSelectCompare(creative.id)}>
          {selected ? <Pause size={16} /> : <Play size={16} />}
          {selected ? 'Seçildi' : 'Karşılaştır'}
        </button>
      </footer>

      <style>{`
        .creative-card {
          border-radius: var(--radius-xl);
          padding: 1rem;
          border: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          gap: 0.7rem;
          background: linear-gradient(135deg, rgba(248,250,252,0.9), rgba(255,255,255,0.98));
        }
        .creative-card.selected {
          border-color: var(--color-primary);
          box-shadow: var(--shadow-glow);
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          align-items: flex-start;
        }
        h4 { margin: 0.15rem 0; }
        .muted { color: var(--color-text-muted); }
        .copy-preview { color: var(--color-text-main); }
        .eyebrow { text-transform: uppercase; letter-spacing: 0.5px; font-size: 0.78rem; color: var(--color-text-muted); }
        .metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 0.5rem;
        }
        .card-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.5rem;
        }
        .tags {
          display: flex;
          gap: 0.35rem;
          flex-wrap: wrap;
        }
        .tags span, .pill {
          background: rgba(139,92,246,0.08);
          color: var(--color-text-main);
          padding: 0.35rem 0.55rem;
          border-radius: var(--radius-md);
          font-size: 0.9rem;
        }
        .compare-btn {
          border: 1px solid var(--color-border);
          background: white;
          padding: 0.45rem 0.9rem;
          border-radius: var(--radius-md);
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .compare-btn.active {
          border-color: var(--color-primary);
          background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
          color: white;
        }
      `}</style>
    </article>
  )
}

function Metric({ label, value, icon: Icon, tone = 'neutral', prefix = '', suffix = '' }) {
  return (
    <div className={`metric metric-${tone}`}>
      <div className="metric-head">
        <Icon size={16} />
        <span>{label}</span>
      </div>
      <p className="metric-value">{prefix}{value}{suffix}</p>

      <style>{`
        .metric {
          border: 1px dashed var(--color-border);
          border-radius: var(--radius-md);
          padding: 0.6rem 0.75rem;
          background: white;
        }
        .metric-head {
          display: flex;
          gap: 0.35rem;
          align-items: center;
          color: var(--color-text-muted);
          font-size: 0.9rem;
        }
        .metric-value {
          font-weight: 700;
          margin-top: 0.2rem;
          color: var(--color-text-main);
        }
        .metric-success { border-color: rgba(16,185,129,0.25); }
        .metric-warning { border-color: rgba(245,158,11,0.25); }
        .metric-error { border-color: rgba(239,68,68,0.25); }
      `}</style>
    </div>
  )
}


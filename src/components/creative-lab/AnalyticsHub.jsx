import { useMemo } from 'react'
import { LineChart, ShieldCheck } from 'lucide-react'
import CreativeCard from './CreativeCard'
import CompareModal from './CompareModal'

export default function AnalyticsHub({ creatives = [], compareSelection = [], onToggleCompare, onCloseCompare }) {
  const [leftId, rightId] = compareSelection

  const left = useMemo(() => creatives.find((c) => c.id === leftId), [creatives, leftId])
  const right = useMemo(() => creatives.find((c) => c.id === rightId), [creatives, rightId])

  return (
    <div className="analytics-view fade-in">
      <header className="analytics-header">
        <div>
          <p className="eyebrow">Analytics Hub</p>
          <h3>Performans & Karşılaştırma</h3>
          <p className="muted">Kartlar üzerinde ROAS rozetleri, iki creative arasında VS modu.</p>
        </div>
        <div className="shield">
          <ShieldCheck size={20} />
          Akıllı rozetler aktif
        </div>
      </header>

      <div className="cards-grid">
        {creatives.map((creative) => (
          <CreativeCard
            key={creative.id}
            creative={creative}
            onSelectCompare={onToggleCompare}
            selected={compareSelection.includes(creative.id)}
          />
        ))}
        {creatives.length === 0 && (
          <div className="empty glass-panel">
            <LineChart size={20} />
            Henüz creative yok. Sihirbazdan bir creative ekle.
          </div>
        )}
      </div>

      <CompareModal open={compareSelection.length === 2} onClose={onCloseCompare} left={left} right={right} />

      <style>{`
        .analytics-view {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .eyebrow {
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-size: 0.78rem;
          color: var(--color-text-muted);
        }
        .muted { color: var(--color-text-muted); }
        .analytics-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .shield {
          display: inline-flex;
          gap: 0.5rem;
          align-items: center;
          padding: 0.5rem 0.75rem;
          border-radius: var(--radius-lg);
          background: rgba(16,185,129,0.12);
          border: 1px solid rgba(16,185,129,0.2);
          color: var(--color-text-main);
          font-weight: 600;
        }
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1rem;
        }
        .empty {
          padding: 1rem;
          border: 1px dashed var(--color-border);
          display: inline-flex;
          gap: 0.5rem;
          align-items: center;
          color: var(--color-text-muted);
        }
        @media (max-width: 720px) {
          .analytics-header {
            flex-direction: column;
            gap: 0.75rem;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  )
}


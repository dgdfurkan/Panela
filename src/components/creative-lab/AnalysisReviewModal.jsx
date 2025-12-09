import { useEffect, useState } from 'react'
import { Check, X, Sparkles, ShieldCheck } from 'lucide-react'

const fields = [
  { key: 'strategy_angle', label: 'Strateji Açısı' },
  { key: 'target_age_min', label: 'Yaş Min' },
  { key: 'target_age_max', label: 'Yaş Max' },
  { key: 'target_age_notes', label: 'Yaş Notu' },
  { key: 'target_location', label: 'Lokasyon' },
  { key: 'target_interests', label: 'İlgi Alanları' },
  { key: 'hook', label: 'Hook (Kanca)' },
  { key: 'ad_headline', label: 'Başlık' },
  { key: 'body', label: 'Gövde Metni' },
  { key: 'cta', label: 'CTA' },
  { key: 'visual_idea', label: 'Görsel Fikir' },
  { key: 'tags', label: 'Etiketler' },
  { key: 'budget_note', label: 'Bütçe Notu' }
]

export default function AnalysisReviewModal({ open, suggestions, onClose, onApply }) {
  const [choices, setChoices] = useState({})

  useEffect(() => {
    if (suggestions) {
      const initial = {}
      fields.forEach((f) => {
        if (suggestions[f.key]) initial[f.key] = true
      })
      setChoices(initial)
    }
  }, [suggestions])

  if (!open || !suggestions) return null

  const toggle = (key) => setChoices((prev) => ({ ...prev, [key]: !prev[key] }))
  const applySelected = () => {
    const accepted = {}
    Object.entries(choices).forEach(([k, v]) => {
      if (v && suggestions[k] !== undefined) accepted[k] = suggestions[k]
    })
    onApply(accepted)
  }

  const applyAll = () => {
    const accepted = {}
    fields.forEach((f) => {
      if (suggestions[f.key] !== undefined) accepted[f.key] = suggestions[f.key]
    })
    onApply(accepted)
  }

  const rejectAll = () => {
    setChoices({})
  }

  const renderValue = (val) => {
    if (Array.isArray(val)) return val.join(', ')
    return val
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-card glass-panel">
        <header className="modal-header">
          <div>
            <p className="eyebrow">AI Analizi (Gemini)</p>
            <h3>Önerileri Uygula?</h3>
          </div>
          <button className="close-btn" onClick={onClose}><X size={16} /></button>
        </header>

        <div className="summary">
          <ShieldCheck size={18} />
          AI önerilerini alan bazlı onaylayabilir veya topluca uygulayabilirsin.
        </div>

        <div className="fields">
          {fields.map((f) => {
            const suggestion = suggestions[f.key]
            if (suggestion === undefined || suggestion === null || suggestion === '') return null
            const accepted = choices[f.key]
            return (
              <div key={f.key} className={`field-row ${accepted ? 'accepted' : ''}`}>
                <div>
                  <p className="field-label">{f.label}</p>
                  <p className="field-value">{renderValue(suggestion)}</p>
                </div>
                <button className="toggle-btn" onClick={() => toggle(f.key)}>
                  {accepted ? <Check size={16} /> : <X size={16} />}
                </button>
              </div>
            )
          })}
        </div>

        <footer className="modal-actions">
          <button className="ghost" onClick={rejectAll}>Tümünü Reddet</button>
          <div className="action-right">
            <button className="secondary" onClick={applyAll}>
              <Sparkles size={16} /> Tümünü Uygula
            </button>
            <button className="primary" onClick={applySelected}>Seçilenleri Uygula</button>
          </div>
        </footer>

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
            background: white;
            border-radius: 16px;
            border: 1px solid var(--color-border);
            padding: 1.25rem;
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }
          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .eyebrow {
            text-transform: uppercase;
            letter-spacing: 0.6px;
            font-size: 0.78rem;
            color: var(--color-text-muted);
          }
          .close-btn {
            border: 1px solid var(--color-border);
            padding: 0.35rem;
            border-radius: 10px;
            background: white;
            cursor: pointer;
          }
          .summary {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1rem;
            border-radius: 12px;
            background: rgba(20,184,166,0.1);
            border: 1px solid rgba(20,184,166,0.2);
            color: var(--color-text-main);
          }
          .fields {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            max-height: 60vh;
            overflow: auto;
          }
          .field-row {
            border: 1px solid var(--color-border);
            border-radius: 12px;
            padding: 0.75rem 1rem;
            display: flex;
            justify-content: space-between;
            gap: 1rem;
            align-items: flex-start;
            background: white;
          }
          .field-row.accepted {
            border-color: rgba(16,185,129,0.4);
            box-shadow: 0 0 0 1px rgba(16,185,129,0.2);
          }
          .field-label { font-weight: 700; margin-bottom: 0.2rem; }
          .field-value { color: var(--color-text-main); white-space: pre-wrap; }
          .toggle-btn {
            border: 1px solid var(--color-border);
            background: white;
            border-radius: 10px;
            padding: 0.35rem;
            cursor: pointer;
          }
          .modal-actions {
            display: flex;
            justify-content: space-between;
            gap: 0.75rem;
            flex-wrap: wrap;
          }
          .action-right {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
          }
          .ghost, .primary, .secondary {
            padding: 0.65rem 1.1rem;
            border-radius: 10px;
            border: 1px solid var(--color-border);
            background: white;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
          }
          .secondary {
            background: rgba(20,184,166,0.1);
            border-color: rgba(20,184,166,0.3);
          }
          .primary {
            background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
            color: white;
            border: none;
          }
        `}</style>
      </div>
    </div>
  )
}


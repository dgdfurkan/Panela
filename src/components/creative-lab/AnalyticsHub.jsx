import { useMemo, useState, useRef, useEffect } from 'react'
import { LineChart, ShieldCheck, Save, X, Clock4 } from 'lucide-react'
import CreativeCard from './CreativeCard'
import CompareModal from './CompareModal'
import { supabase } from '../../lib/supabaseClient'

export default function AnalyticsHub({ creatives = [], compareSelection = [], onToggleCompare, onCloseCompare }) {
  const [leftId, rightId] = compareSelection
  const [detail, setDetail] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])
  const originalRef = useRef(null)

  const left = useMemo(() => creatives.find((c) => c.id === leftId), [creatives, leftId])
  const right = useMemo(() => creatives.find((c) => c.id === rightId), [creatives, rightId])

  const openDetail = (creative) => {
    setDetail({
      ...creative,
      metrics: {
        spend: creative.metrics?.spend ?? 0,
        roas: creative.metrics?.roas ?? 0,
        clicks: creative.metrics?.clicks ?? 0,
        ctr: creative.metrics?.ctr ?? 0,
        conversion_rate: creative.metrics?.conversion_rate ?? 0
      }
    })
    originalRef.current = {
      status: creative.status,
      notes: creative.notes,
      metrics: { ...(creative.metrics || {}) }
    }
    setError('')
  }

  const handleDetailChange = (key, value) => {
    setDetail((prev) => ({ ...prev, [key]: value }))
  }

  const handleMetricChange = (key, value) => {
    setDetail((prev) => ({ ...prev, metrics: { ...prev.metrics, [key]: value } }))
  }

  const saveDetail = async () => {
    if (!detail) return
    setSaving(true)
    setError('')
    try {
      const { id, status, notes, metrics } = detail
      const { error: err } = await supabase
        .from('marketing_creatives')
        .update({ status, notes, metrics })
        .eq('id', id)
      if (err) throw err
      const orig = originalRef.current || {}
      const changes = []
      if (status !== orig.status) changes.push(`Durum: ${orig.status || '-'} → ${status}`)
      if (notes !== orig.notes) changes.push('Notlar güncellendi')
      const om = orig.metrics || {}
      const m = metrics || {}
      const metricKeys = ['spend', 'roas', 'clicks', 'ctr', 'conversion_rate']
      metricKeys.forEach((k) => {
        if (m[k] !== om[k]) changes.push(`${k}: ${om[k] ?? 0} → ${m[k] ?? 0}`)
      })
      setHistory((prev) => [
        { id, at: new Date().toISOString(), changes: changes.length ? changes : ['Kaydedildi'] },
        ...prev
      ])
      // no refetch here; optimistic update handled by parent data reload externally
      setDetail(null)
    } catch (e) {
      setError(e.message || 'Kaydedilemedi')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="analytics-view fade-in">
      <header className="analytics-header">
        <div>
          <p className="eyebrow">Analitik Merkezi</p>
          <h3>Performans & Karşılaştırma</h3>
          <p className="muted">Kartlar üzerinde ROAS rozetleri, iki reklam arasında VS modu.</p>
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
            onOpenDetail={openDetail}
          />
        ))}
        {creatives.length === 0 && (
          <div className="empty glass-panel">
            <LineChart size={20} />
            Henüz reklam yok. Sihirbazdan bir reklam ekle.
          </div>
        )}
      </div>

      <CompareModal open={compareSelection.length === 2} onClose={onCloseCompare} left={left} right={right} />
      <DetailModal
        open={!!detail}
        detail={detail}
        onClose={() => setDetail(null)}
        onChange={handleDetailChange}
        onMetricChange={handleMetricChange}
        onSave={saveDetail}
        saving={saving}
        error={error}
        history={history.filter((h) => h.id === detail?.id)}
      />

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

function DetailModal({ open, detail, onClose, onChange, onMetricChange, onSave, saving, error, history }) {
  const noteRef = useRef(null)
  useEffect(() => {
    if (noteRef.current) {
      noteRef.current.style.height = 'auto'
      noteRef.current.style.height = `${noteRef.current.scrollHeight}px`
    }
  }, [detail?.notes])

  if (!open || !detail) return null
  const m = detail.metrics || {}
  const num = (v) => Number(v ?? 0)

  return (
    <div className="modal-backdrop">
      <div className="modal-card glass-panel">
        <header className="modal-header">
          <div>
            <p className="eyebrow">Reklam Detayı</p>
            <h3>{detail.ad_headline || 'Başlık yok'}</h3>
          </div>
          <button className="close-btn" onClick={onClose}><X size={16} /></button>
        </header>

        <div className="modal-body">
          <div className="grid">
            <div>
              <label>Platform</label>
              <div className="pill">{detail.platform}</div>
            </div>
            <div>
              <label>Durum</label>
              <select value={detail.status} onChange={(e) => onChange('status', e.target.value)}>
                {['Draft', 'Active', 'Paused', 'Completed'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid metrics">
            <Field label="Harcama ($)" value={m.spend} onChange={(v) => onMetricChange('spend', num(v))} />
            <Field label="ROAS" value={m.roas} onChange={(v) => onMetricChange('roas', num(v))} />
            <Field label="Tıklama" value={m.clicks} onChange={(v) => onMetricChange('clicks', num(v))} />
            <Field label="CTR (%)" value={m.ctr} onChange={(v) => onMetricChange('ctr', num(v))} />
            <Field label="Conversion Rate (%)" value={m.conversion_rate} onChange={(v) => onMetricChange('conversion_rate', num(v))} />
          </div>

          <div>
            <label>Notlar</label>
            <textarea
              ref={noteRef}
              value={detail.notes || ''}
              onChange={(e) => onChange('notes', e.target.value)}
              rows={3}
              onInput={() => {
                if (noteRef.current) {
                  noteRef.current.style.height = 'auto'
                  noteRef.current.style.height = `${noteRef.current.scrollHeight}px`
                }
              }}
            />
          </div>

          {error && <div className="error">{error}</div>}

          <div className="history">
            <div className="history-head">
              <Clock4 size={16} />
              <span>Değişiklik Geçmişi</span>
            </div>
            {history && history.length ? (
              <div className="history-list">
                {history.map((h) => (
                  <div key={h.at} className="history-item">
                    <p className="history-time">{new Date(h.at).toLocaleString('tr-TR')}</p>
                    <ul>
                      {h.changes.map((c, idx) => <li key={idx}>{c}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">Henüz değişiklik yok.</p>
            )}
          </div>
        </div>

        <footer className="modal-actions">
          <button className="ghost-btn" onClick={onClose}>Kapat</button>
          <button className="primary" onClick={onSave} disabled={saving}>
            <Save size={16} /> {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
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
            max-width: 780px;
            width: 100%;
            background: linear-gradient(145deg, rgba(255,255,255,0.98), rgba(248,250,252,0.96));
            border-radius: 16px;
            border: 1px solid var(--color-border);
            padding: 1.25rem;
            display: flex;
            flex-direction: column;
            gap: 1rem;
            box-shadow: var(--shadow-lg);
          }
          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .close-btn {
            border: 1px solid var(--color-border);
            padding: 0.35rem;
            border-radius: 10px;
            background: white;
            cursor: pointer;
          }
          .modal-body {
            display: flex;
            flex-direction: column;
            gap: 0.9rem;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 0.75rem;
          }
          .grid.metrics {
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          }
          label { font-weight: 600; color: var(--color-text-main); }
          textarea, input, select {
            width: 100%;
            padding: 0.65rem 0.75rem;
            border: 1px solid var(--color-border);
            border-radius: 10px;
            background: white;
          }
          textarea { resize: none; overflow: hidden; }
          .pill {
            display: inline-flex;
            padding: 0.4rem 0.75rem;
            border-radius: 999px;
            background: rgba(139,92,246,0.1);
            color: var(--color-text-main);
            border: 1px solid var(--color-border);
          }
          .modal-actions {
            display: flex;
            justify-content: space-between;
            gap: 0.5rem;
            flex-wrap: wrap;
          }
          .ghost-btn, .primary {
            padding: 0.65rem 1rem;
            border-radius: 10px;
            border: 1px solid var(--color-border);
            background: white;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
          }
          .primary {
            background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
            color: white;
            border: none;
          }
          .error {
            background: rgba(239,68,68,0.08);
            border: 1px solid rgba(239,68,68,0.2);
            color: var(--color-text-main);
            padding: 0.6rem 0.75rem;
            border-radius: 10px;
          }
          .history {
            border: 1px dashed var(--color-border);
            border-radius: 12px;
            padding: 0.75rem;
            background: white;
          }
          .history-head {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
          }
          .history-list {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }
          .history-item {
            padding: 0.5rem 0.6rem;
            border: 1px solid var(--color-border);
            border-radius: 10px;
            background: rgba(248,250,252,0.8);
          }
          .history-time { font-size: 0.9rem; color: var(--color-text-muted); margin-bottom: 0.25rem; }
          .history-item ul { margin: 0; padding-left: 1.1rem; color: var(--color-text-main); }
        `}</style>
      </div>
    </div>
  )
}

function Field({ label, value, onChange }) {
  return (
    <div className="field">
      <label>{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}


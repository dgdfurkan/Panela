import { useMemo, useState, useRef, useEffect } from 'react'
import { LineChart, ShieldCheck, Save, X, Clock4, Filter, Layers } from 'lucide-react'
import CreativeCard from './CreativeCard'
import CompareModal from './CompareModal'
import { supabase } from '../../lib/supabaseClient'
import Modal from '../ui/Modal'

export default function AnalyticsHub({ creatives = [], compareSelection = [], onToggleCompare, onCloseCompare, onUpdateCreative }) {
  const [leftId, rightId] = compareSelection
  const [detail, setDetail] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])
  const originalRef = useRef(null)
  const [saveNotice, setSaveNotice] = useState('')
  const [historyModal, setHistoryModal] = useState(false)

  const left = useMemo(() => creatives.find((c) => c.id === leftId), [creatives, leftId])
  const right = useMemo(() => creatives.find((c) => c.id === rightId), [creatives, rightId])

  const loadHistory = async (creativeId) => {
    const { data, error } = await supabase
      .from('creative_history')
      .select('*')
      .eq('creative_id', creativeId)
      .order('created_at', { ascending: false })
      .limit(200)
    if (!error) setHistory(data || [])
  }

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
    loadHistory(creative.id)
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
    setSaveNotice('')
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
      const historyRow = { creative_id: id, changes: changes.length ? changes : ['Kaydedildi'] }
      await supabase.from('creative_history').insert(historyRow)
      setHistory((prev) => [
        { ...historyRow, at: new Date().toISOString(), kind: detectKind(changes) },
        ...prev
      ])
      onUpdateCreative?.(id, { status, notes, metrics })
      // Keep modal open and update baseline for next edits
      originalRef.current = { status, notes, metrics: { ...metrics } }
      setDetail((prev) => ({ ...prev, status, notes, metrics }))
      setSaveNotice('Kaydedildi')
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
        history={history.filter((h) => h.creative_id === detail?.id)}
        saveNotice={saveNotice}
        onOpenFullHistory={() => setHistoryModal(true)}
      />
      <HistoryModal
        open={historyModal}
        onClose={() => setHistoryModal(false)}
        history={history.filter((h) => h.creative_id === detail?.id)}
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

function detectKind(changes = []) {
  const text = changes.join(' ').toLowerCase()
  if (text.includes('durum')) return 'status'
  if (text.includes('not')) return 'notes'
  if (text.includes('roas')) return 'roas'
  if (text.includes('harcama') || text.includes('spend')) return 'spend'
  if (text.includes('tıklama')) return 'clicks'
  if (text.includes('ctr')) return 'ctr'
  if (text.includes('conversion')) return 'conversion_rate'
  return 'other'
}

function HistoryModal({ open, onClose, history }) {
  const [filterText, setFilterText] = useState('')
  const [filterStart, setFilterStart] = useState('')
  const [filterEnd, setFilterEnd] = useState('')
  const [filterKinds, setFilterKinds] = useState({
    status: true,
    notes: true,
    spend: true,
    roas: true,
    clicks: true,
    ctr: true,
    conversion_rate: true,
    other: true
  })

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const filtered = (history || []).filter((h) => {
    const t = new Date(h.at || h.created_at)
    if (filterStart && t < new Date(filterStart)) return false
    if (filterEnd) {
      const end = new Date(filterEnd); end.setHours(23,59,59,999)
      if (t > end) return false
    }
    const activeKinds = Object.entries(filterKinds).filter(([, v]) => v).map(([k]) => k)
    if (activeKinds.length && h.kind && !activeKinds.includes(h.kind)) return false
    if (filterText) {
      const text = filterText.toLowerCase()
      const matchChanges = h.changes?.some((c) => c.toLowerCase().includes(text))
      const matchTime = t.toLocaleString('tr-TR').toLowerCase().includes(text)
      return matchChanges || matchTime
    }
    return true
  })

  return (
    <div className="modal-backdrop-full">
      <div className="modal-card-full glass-panel">
        <header className="modal-header">
          <div>
            <p className="eyebrow">Tüm Geçmiş</p>
            <h3>Değişiklik Kayıtları</h3>
          </div>
          <button className="close-btn" onClick={onClose}><X size={16} /></button>
        </header>

        <div className="history-filters full">
          <div className="filter-item">
            <label><Filter size={14} /> Metin</label>
            <input value={filterText} onChange={(e) => setFilterText(e.target.value)} placeholder="Metin veya tarih ara" />
          </div>
          <div className="filter-item">
            <label>Başlangıç</label>
            <input type="date" value={filterStart} onChange={(e) => setFilterStart(e.target.value)} />
          </div>
          <div className="filter-item">
            <label>Bitiş</label>
            <input type="date" value={filterEnd} onChange={(e) => setFilterEnd(e.target.value)} />
          </div>
          <div className="filter-item checkbox-group">
            <label>Alanlar</label>
            <div className="checkboxes">
              {[
                ['status', 'Durum'],
                ['notes', 'Notlar'],
                ['spend', 'Harcama'],
                ['roas', 'ROAS'],
                ['clicks', 'Tıklama'],
                ['ctr', 'CTR'],
                ['conversion_rate', 'CR'],
                ['other', 'Diğer']
              ].map(([k, label]) => (
                <label key={k} className="chk">
                  <input
                    type="checkbox"
                    checked={filterKinds[k]}
                    onChange={(e) => setFilterKinds((prev) => ({ ...prev, [k]: e.target.checked }))}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="history-list full">
          {filtered.map((h) => (
            <div key={(h.at || h.created_at)} className="history-item">
              <p className="history-time">{new Date(h.at || h.created_at).toLocaleString('tr-TR')}</p>
              <ul>
                {h.changes?.map((c, idx) => <li key={idx}>{c}</li>)}
              </ul>
            </div>
          ))}
          {filtered.length === 0 && <p className="muted">Kayıt yok.</p>}
        </div>
      </div>

      <style>{`
        .modal-backdrop-full {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.35);
          display: grid;
          place-items: center;
          z-index: 210;
          padding: 1rem;
        }
        .modal-card-full {
          max-width: 900px;
          width: 100%;
          max-height: 80vh;
          overflow: hidden;
          background: linear-gradient(145deg, rgba(255,255,255,0.98), rgba(248,250,252,0.96));
          border-radius: 16px;
          border: 1px solid var(--color-border);
          padding: 1.1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          box-shadow: var(--shadow-lg);
        }
        .history-list.full {
          max-height: 60vh;
          overflow: auto;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding-right: 0.35rem;
        }
      `}</style>
    </div>
  )
}
function DetailModal({ open, detail, onClose, onChange, onMetricChange, onSave, saving, error, history, saveNotice, onOpenFullHistory }) {
  const noteRef = useRef(null)
  const [filterText, setFilterText] = useState('')
  const [filterStart, setFilterStart] = useState('')
  const [filterEnd, setFilterEnd] = useState('')
  const [filterKinds, setFilterKinds] = useState({
    status: true,
    notes: true,
    spend: true,
    roas: true,
    clicks: true,
    ctr: true,
    conversion_rate: true
  })

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    if (noteRef.current) {
      noteRef.current.style.height = 'auto'
      noteRef.current.style.height = `${noteRef.current.scrollHeight}px`
    }
  }, [detail?.notes])

  if (!open || !detail) return null
  const m = detail.metrics || {}
  const num = (v) => Number(v ?? 0)

  const filteredHistory = (history || []).filter((h) => {
    const t = new Date(h.at)
    if (filterStart && t < new Date(filterStart)) return false
    if (filterEnd) {
      const end = new Date(filterEnd)
      end.setHours(23, 59, 59, 999)
      if (t > end) return false
    }
    const activeKinds = Object.entries(filterKinds).filter(([, v]) => v).map(([k]) => k)
    const kindMatch = activeKinds.length === 0 || (h.kind && activeKinds.includes(h.kind))
    if (!kindMatch) return false
    if (filterText) {
      const text = filterText.toLowerCase()
      const matchChanges = h.changes?.some((c) => c.toLowerCase().includes(text))
      const matchTime = t.toLocaleString('tr-TR').toLowerCase().includes(text)
      return matchChanges || matchTime
    }
    return true
  })

  return (
    <Modal title="Reklam Detayı" isOpen={open} onClose={onClose}>
      <div className="modal-card-body">
        <div className="modal-head-inline">
          <div>
            <p className="eyebrow">Reklam Detayı</p>
            <h3>{detail.ad_headline || 'Başlık yok'}</h3>
          </div>
          {saveNotice && <span className="save-notice chip">{saveNotice}</span>}
        </div>

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
            <div className="history-filters">
              <div className="filter-item">
                <label><Filter size={14} /> Metin</label>
                <input
                  type="text"
                  placeholder="Durum, metrik, tarih ara"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                />
              </div>
              <div className="filter-item">
                <label>Başlangıç</label>
                <input type="date" value={filterStart} onChange={(e) => setFilterStart(e.target.value)} />
              </div>
              <div className="filter-item">
                <label>Bitiş</label>
                <input type="date" value={filterEnd} onChange={(e) => setFilterEnd(e.target.value)} />
              </div>
              <div className="filter-item checkbox-group">
                <label>Alanlar</label>
                <div className="checkboxes">
                  {[
                    ['status', 'Durum'],
                    ['notes', 'Notlar'],
                    ['spend', 'Harcama'],
                    ['roas', 'ROAS'],
                    ['clicks', 'Tıklama'],
                    ['ctr', 'CTR'],
                    ['conversion_rate', 'CR']
                  ].map(([k, label]) => (
                    <label key={k} className="chk">
                      <input
                        type="checkbox"
                        checked={filterKinds[k]}
                        onChange={(e) => setFilterKinds((prev) => ({ ...prev, [k]: e.target.checked }))}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            {history && history.length ? (
              <div className="history-list">
                {filteredHistory.map((h) => (
                  <div key={h.at} className="history-item">
                    <p className="history-time">{new Date(h.at).toLocaleString('tr-TR')}</p>
                    <ul>
                      {h.changes.map((c, idx) => <li key={idx}>{c}</li>)}
                    </ul>
                  </div>
                ))}
                {filteredHistory.length === 0 && <p className="muted">Filtreye uygun kayıt yok.</p>}
              </div>
            ) : (
              <p className="muted">Henüz değişiklik yok.</p>
            )}
            <div className="history-footer">
              <button className="ghost-btn" onClick={onOpenFullHistory}>Tüm Geçmişi Gör</button>
              {saveNotice && <span className="save-notice">{saveNotice}</span>}
            </div>
          </div>
        </div>

        <footer className="modal-actions">
          <button className="ghost-btn" onClick={onClose}>Kapat</button>
          <button className="primary" onClick={onSave} disabled={saving}>
            <Save size={16} /> {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </footer>

        <style>{`
          .modal-card-body {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            max-height: 75vh;
          }
          .modal-head-inline {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .chip {
            padding: 0.35rem 0.6rem;
            border-radius: 10px;
            background: rgba(16,185,129,0.12);
            color: var(--color-text-main);
            border: 1px solid rgba(16,185,129,0.25);
            font-weight: 600;
          }
          .modal-body {
            display: flex;
            flex-direction: column;
            gap: 0.9rem;
            overflow: auto;
            padding-right: 0.35rem;
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
            max-height: 240px;
            overflow: auto;
            padding-right: 0.35rem;
          }
          .history-item {
            padding: 0.5rem 0.6rem;
            border: 1px solid var(--color-border);
            border-radius: 10px;
            background: rgba(248,250,252,0.8);
          }
          .history-time { font-size: 0.9rem; color: var(--color-text-muted); margin-bottom: 0.25rem; }
          .history-item ul { margin: 0; padding-left: 1.1rem; color: var(--color-text-main); }
          .history-filters {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 0.75rem;
            margin-bottom: 0.5rem;
          }
          .filter-item label {
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            font-weight: 600;
            color: var(--color-text-main);
          }
          .filter-item input {
            margin-top: 0.25rem;
          }
          .checkbox-group .checkboxes {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 0.25rem 0.5rem;
            margin-top: 0.35rem;
          }
          .chk {
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            font-weight: 500;
            color: var(--color-text-main);
          }
        `}</style>
      </div>
    </Modal>
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


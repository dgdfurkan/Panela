import { useEffect, useMemo, useState } from 'react'
import confetti from 'canvas-confetti'
import { supabase } from '../lib/supabaseClient'
import Guide from '../components/creative-lab/Guide'
import WorkspaceWizard from '../components/creative-lab/WorkspaceWizard'
import AnalyticsHub from '../components/creative-lab/AnalyticsHub'
import { BookMarked, Workflow, BarChart3, AlertCircle } from 'lucide-react'

const views = [
  { id: 'guide', label: 'Rehber', icon: BookMarked },
  { id: 'workspace', label: 'Çalışma Alanı', icon: Workflow },
  { id: 'analytics', label: 'Analitik Merkezi', icon: BarChart3 }
]

export default function CreativeLab() {
  const [activeView, setActiveView] = useState('guide')
  const [products, setProducts] = useState([])
  const [creatives, setCreatives] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [compareSelection, setCompareSelection] = useState([])

  const activeTitle = useMemo(() => views.find((v) => v.id === activeView)?.label || 'Yaratıcı Laboratuvar', [activeView])

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [{ data: prodData, error: prodErr }, { data: creativeData, error: creativeErr }] = await Promise.all([
          supabase.from('products').select('id,name'),
          supabase.from('marketing_creatives').select('*').order('created_at', { ascending: false })
        ])

        if (prodErr || creativeErr) {
          throw prodErr || creativeErr
        }
        setProducts(prodData || [])
        setCreatives(creativeData || [])
      } catch (err) {
        console.error('Creative Lab load error', err)
        setError('Veriler yüklenirken bir sorun oluştu')
      } finally {
        setLoading(false)
      }
    }
    bootstrap()
  }, [])

  const handleSave = async (payload) => {
    setSaving(true)
    setError('')
    try {
      const { data, error: insertError } = await supabase
        .from('marketing_creatives')
        .insert(payload)
        .select()
        .single()

      if (insertError) throw insertError
      setCreatives((prev) => [data, ...prev])
      setActiveView('analytics')
      fireConfetti()
    } catch (err) {
      console.error('Creative save error', err)
      if (err?.code === '42501' || (err?.message || '').includes('row-level security')) {
        setError('Erişim reddedildi. Oturumunun açık olduğundan ve Supabase politikalarının uygulandığından emin ol.')
      } else {
        setError('Reklam kaydedilirken bir hata oluştu')
      }
    } finally {
      setSaving(false)
    }
  }

  const fireConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.7 }
    })
  }

  const handleToggleCompare = (id) => {
    setCompareSelection((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length === 2) return [prev[1], id]
      return [...prev, id]
    })
  }

  const handleCloseCompare = () => setCompareSelection([])

  return (
    <div className="creative-lab-page fade-in">
      <header className="page-head">
        <div>
          <p className="eyebrow">Yaratıcı Laboratuvar</p>
          <h2 className="text-gradient">{activeTitle}</h2>
          <p className="muted">Pazarlama kokpiti: rehber, sihirbaz ve analiz tek ekranda.</p>
        </div>
        <div className="tabs">
          {views.map((v) => {
            const Icon = v.icon
            return (
              <button key={v.id} className={`tab ${activeView === v.id ? 'active' : ''}`} onClick={() => setActiveView(v.id)}>
                <Icon size={18} />
                {v.label}
              </button>
            )
          })}
        </div>
      </header>

      {error && (
        <div className="toast error">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="loader">Yükleniyor...</div>
      ) : (
        <>
          {activeView === 'guide' && <Guide />}
          {activeView === 'workspace' && (
            <WorkspaceWizard products={products} onSave={handleSave} saving={saving} />
          )}
          {activeView === 'analytics' && (
            <AnalyticsHub
              creatives={creatives}
              compareSelection={compareSelection}
              onToggleCompare={handleToggleCompare}
              onCloseCompare={handleCloseCompare}
              onUpdateCreative={(id, updates) => {
                setCreatives((prev) => prev.map((c) => c.id === id ? { ...c, ...updates } : c))
              }}
            />
          )}
        </>
      )}

      <style>{`
        .creative-lab-page {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .page-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .tabs {
          display: inline-flex;
          gap: 0.5rem;
          background: rgba(255,255,255,0.9);
          border: 1px solid var(--color-border);
          padding: 0.35rem;
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-sm);
        }
        .tab {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.5rem 0.9rem;
          border-radius: var(--radius-lg);
          border: none;
          background: transparent;
          color: var(--color-text-muted);
          font-weight: 600;
          transition: all var(--transition-fast);
        }
        .tab.active {
          background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
          color: white;
          box-shadow: var(--shadow-sm);
        }
        .toast {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-border);
        }
        .toast.error {
          background: rgba(239,68,68,0.08);
          border-color: rgba(239,68,68,0.25);
          color: var(--color-text-main);
        }
        .eyebrow {
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-size: 0.78rem;
          color: var(--color-text-muted);
        }
        .muted {
          color: var(--color-text-muted);
        }
        .loader {
          padding: 1rem;
          color: var(--color-text-muted);
        }
      `}</style>
    </div>
  )
}


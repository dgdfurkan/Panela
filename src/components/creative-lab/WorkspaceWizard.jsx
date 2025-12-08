import { useMemo, useState } from 'react'
import { ChevronRight, Info, Lightbulb, Sparkles } from 'lucide-react'
import TagInput from './TagInput'

const platforms = ['Meta', 'TikTok', 'Google', 'YouTube', 'Email', 'Influencer']
const visualTypes = ['Video', 'Image', 'Carousel']

export default function WorkspaceWizard({ products = [], onSave, saving }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    product_id: '',
    platform: platforms[0],
    strategy_angle: '',
    target_age: '',
    target_interests: '',
    target_location: '',
    hook: '',
    body: '',
    cta: '',
    visual_idea: '',
    tags: [],
    visual_type: visualTypes[0],
    ad_headline: '',
    budget_note: ''
  })

  const steps = useMemo(() => [
    { id: 1, title: 'Ürün ve Platform', desc: 'Ürünü seç ve çalışacağın platformu belirle' },
    { id: 2, title: 'Hedef Kitle', desc: 'Kimin için konuştuğunu netleştir' },
    { id: 3, title: 'Kreatif Detaylar', desc: 'Kanca + Gövde + CTA, görsel fikri ve etiketler' },
    { id: 4, title: 'Bütçe & Not', desc: 'Başlangıç bütçesi ve iç notlar' }
  ], [])

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))
  const next = () => setStep((s) => Math.min(s + 1, 4))
  const prev = () => setStep((s) => Math.max(s - 1, 1))

  const handleSubmit = async () => {
    const target_audience = {
      age: form.target_age || undefined,
      interests: form.target_interests ? form.target_interests.split(',').map((i) => i.trim()).filter(Boolean) : [],
      location: form.target_location || undefined
    }

    const ad_copy_primary = `${form.hook}\n\n${form.body}\n\n${form.cta}`.trim()
    const payload = {
      product_id: form.product_id || null,
      platform: form.platform,
      strategy_angle: form.strategy_angle,
      target_audience,
      ad_copy_primary,
      ad_headline: form.ad_headline || form.hook,
      visual_type: form.visual_type,
      tags: form.tags,
      status: 'Draft',
      metrics: { spend: 0, roas: 0, clicks: 0, ctr: 0, conversion_rate: 0 },
      notes: form.budget_note || form.visual_idea || ''
    }

    await onSave(payload)
  }

  return (
    <div className="wizard glass-panel fade-in">
      <header className="wizard-header">
        <div>
          <p className="eyebrow">Adım Adım Sihirbaz</p>
          <h3>The Workspace</h3>
          <p className="muted">Sıkıcı formlar yok. Her adımda küçük ipuçlarıyla ilerle.</p>
        </div>
        <Sparkles className="accent-icon" size={28} />
      </header>

      <div className="steps">
        {steps.map((s) => (
          <div key={s.id} className={`step ${step === s.id ? 'active' : ''}`}>
            <div className="dot">{s.id}</div>
            <div>
              <p className="step-title">{s.title}</p>
              <p className="muted">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {step === 1 && (
        <section className="panel">
          <div>
            <label>Ürün</label>
            <select value={form.product_id} onChange={(e) => updateField('product_id', e.target.value)}>
              <option value="">Ürün seç (opsiyonel)</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name || 'Adsız Ürün'}</option>)}
            </select>
          </div>
          <div>
            <label>Platform</label>
            <div className="pill-row">
              {platforms.map((p) => (
                <button key={p} className={`pill ${form.platform === p ? 'active' : ''}`} onClick={() => updateField('platform', p)} type="button">
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label>Strateji Açısı</label>
            <input
              value={form.strategy_angle}
              onChange={(e) => updateField('strategy_angle', e.target.value)}
              placeholder='Örn: Duygusal, FOMO, Sosyal Kanıt'
            />
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="panel two-col">
          <div>
            <label>Yaş Aralığı</label>
            <input value={form.target_age} onChange={(e) => updateField('target_age', e.target.value)} placeholder="18-25" />
          </div>
          <div>
            <label>Lokasyon</label>
            <input value={form.target_location} onChange={(e) => updateField('target_location', e.target.value)} placeholder="İstanbul, TR" />
          </div>
          <div className="full">
            <label>İlgi Alanları (virgülle)</label>
            <textarea value={form.target_interests} onChange={(e) => updateField('target_interests', e.target.value)} placeholder="Doğa, Kamp, Kahve, Yazılım" rows={2} />
          </div>
          <div className="tip">
            <Info size={16} />
            İlk cümlede problemi ve hedef kitleyi aynı anda söyle: “İstanbul’un sıcak yazında ferahlamak isteyen kampçılar için…”
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="panel">
          <div className="two-col">
            <div>
              <label>Hook (Kanca)</label>
              <input value={form.hook} onChange={(e) => updateField('hook', e.target.value)} placeholder="İlk 3 saniyede merak uyandır" />
            </div>
            <div>
              <label>Başlık</label>
              <input value={form.ad_headline} onChange={(e) => updateField('ad_headline', e.target.value)} placeholder="Manşet / Headline" />
            </div>
          </div>
          <div>
            <label>Gövde Metni</label>
            <textarea value={form.body} onChange={(e) => updateField('body', e.target.value)} placeholder="Kullanıcının sorununa odaklan, çözümü net söyle" rows={3} />
          </div>
          <div>
            <label>Call To Action</label>
            <input value={form.cta} onChange={(e) => updateField('cta', e.target.value)} placeholder="Şimdi keşfet, Hemen indir, Sepete ekle" />
          </div>
          <div className="two-col">
            <div>
              <label>Görsel/Senaryo Fikri</label>
              <textarea value={form.visual_idea} onChange={(e) => updateField('visual_idea', e.target.value)} placeholder="Video açılış sahnesi, ürün yakın planı, testimonial" rows={2} />
            </div>
            <div>
              <label>Görsel Tipi</label>
              <div className="pill-row">
                {visualTypes.map((t) => (
                  <button key={t} className={`pill ${form.visual_type === t ? 'active' : ''}`} onClick={() => updateField('visual_type', t)} type="button">
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label>Etiketler</label>
            <TagInput value={form.tags} onChange={(tags) => updateField('tags', tags)} placeholder="#indirim, #yazsezonu" />
          </div>
          <div className="tip">
            <Lightbulb size={16} />
            CTA’yı tek bir fiil + fayda ile bitir: “Hemen dene ve serinle.”
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="panel two-col">
          <div>
            <label>Bütçe Notu</label>
            <textarea value={form.budget_note} onChange={(e) => updateField('budget_note', e.target.value)} placeholder="Başlangıç bütçesi, beklenen CPA/ROAS" rows={3} />
          </div>
          <div className="callout">
            <Sparkles size={18} />
            <div>
              <p className="callout-title">Son dokunuş</p>
              <p className="muted">Kaydettikten sonra Analytics Hub’da kart olarak göreceksin. Yüksek ROAS için kancayı test et.</p>
            </div>
          </div>
        </section>
      )}

      <footer className="wizard-actions">
        <button onClick={prev} disabled={step === 1} className="ghost">Geri</button>
        {step < 4 ? (
          <button onClick={next} className="primary">
            İleri <ChevronRight size={18} />
          </button>
        ) : (
          <button onClick={handleSubmit} className="primary" disabled={saving}>
            {saving ? 'Kaydediliyor...' : 'Creative’i Kaydet'}
          </button>
        )}
      </footer>

      <style>{`
        .wizard {
          padding: 1.5rem;
          border-radius: var(--radius-xl);
          background: white;
          border: 1px solid var(--color-border);
          box-shadow: var(--shadow-md);
        }
        .wizard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        .muted { color: var(--color-text-muted); }
        .eyebrow { text-transform: uppercase; letter-spacing: 1px; font-size: 0.75rem; color: var(--color-text-muted); }
        h3 { margin: 0.1rem 0; }
        .accent-icon { color: var(--color-primary); }
        .steps {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 0.75rem;
          margin: 1rem 0 1.25rem;
        }
        .step {
          border: 1px dashed var(--color-border);
          padding: 0.9rem;
          border-radius: var(--radius-lg);
          display: flex;
          gap: 0.75rem;
          align-items: flex-start;
          background: rgba(255,255,255,0.9);
        }
        .step.active {
          border-color: var(--color-primary);
          background: linear-gradient(135deg, rgba(139,92,246,0.08), rgba(255,255,255,0.95));
          box-shadow: var(--shadow-sm);
        }
        .dot {
          width: 32px;
          height: 32px;
          border-radius: 999px;
          background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
          color: white;
          display: grid;
          place-items: center;
          font-weight: 700;
        }
        .panel {
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 1.1rem;
          background: rgba(255,255,255,0.95);
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
        }
        .panel.two-col {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 0.85rem;
        }
        label {
          font-weight: 600;
          color: var(--color-text-main);
          display: block;
          margin-bottom: 0.35rem;
        }
        input, textarea, select {
          width: 100%;
          padding: 0.65rem 0.75rem;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          background: white;
          transition: border var(--transition-fast), box-shadow var(--transition-fast);
        }
        input:focus, textarea:focus, select:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(139,92,246,0.15);
        }
        .pill-row {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .pill {
          padding: 0.55rem 0.9rem;
          border-radius: 999px;
          border: 1px solid var(--color-border);
          background: white;
          color: var(--color-text-main);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .pill.active {
          border-color: var(--color-primary);
          background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
          color: white;
          box-shadow: var(--shadow-sm);
        }
        .tip {
          display: flex;
          gap: 0.5rem;
          align-items: flex-start;
          font-size: 0.95rem;
          color: var(--color-text-muted);
          padding: 0.75rem;
          border-radius: var(--radius-md);
          background: rgba(20,184,166,0.08);
          border: 1px solid rgba(20,184,166,0.12);
        }
        .callout {
          display: flex;
          gap: 0.75rem;
          border: 1px solid rgba(139,92,246,0.2);
          background: linear-gradient(135deg, rgba(139,92,246,0.07), rgba(244,114,182,0.07));
          border-radius: var(--radius-lg);
          padding: 0.9rem;
        }
        .callout-title { font-weight: 700; margin-bottom: 0.15rem; }
        .wizard-actions {
          display: flex;
          justify-content: space-between;
          margin-top: 1rem;
        }
        .ghost, .primary {
          padding: 0.65rem 1.1rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border);
          background: white;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
        }
        .ghost:disabled { opacity: 0.4; }
        .primary {
          background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
          color: white;
          border: none;
          box-shadow: var(--shadow-sm);
        }
        @media (max-width: 720px) {
          .wizard-actions { flex-direction: column; gap: 0.6rem; }
          .primary, .ghost { width: 100%; justify-content: center; }
        }
      `}</style>
    </div>
  )
}


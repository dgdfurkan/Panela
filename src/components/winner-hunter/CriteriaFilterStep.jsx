import { useState } from 'react'
import { AlertCircle, CheckCircle } from 'lucide-react'
import MarkQuoteTooltip from './MarkQuoteTooltip'

const niches = ['Health & Beauty', 'Pain Relief', 'Pet', 'Gadget - RISKLI', 'Other']

export default function CriteriaFilterStep({ onComplete, initialData = {} }) {
  const [formData, setFormData] = useState({
    product_name: initialData.product_name || '',
    niche: initialData.niche || '',
    is_problem_solving: initialData.is_problem_solving ?? null,
    is_lightweight: initialData.is_lightweight ?? null,
    is_evergreen: initialData.is_evergreen ?? null,
    cost: initialData.cost || '',
    sale_price: initialData.sale_price || '',
    upsell_potential: initialData.upsell_potential || ''
  })

  const updateField = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const calculateProfitMargin = () => {
    if (!formData.cost || !formData.sale_price) return null
    const cost = parseFloat(formData.cost)
    const price = parseFloat(formData.sale_price)
    if (cost > 0 && price > 0) {
      return (price / cost).toFixed(2)
    }
    return null
  }

  const profitMargin = calculateProfitMargin()
  const isLowMargin = profitMargin && parseFloat(profitMargin) < 3.0
  const showGadgetWarning = formData.is_problem_solving === false

  const handleNext = () => {
    const data = {
      ...formData,
      profit_margin: profitMargin ? parseFloat(profitMargin) : null
    }
    onComplete(data)
  }

  const canProceed = formData.product_name && 
                     formData.niche && 
                     formData.is_problem_solving !== null &&
                     formData.is_lightweight !== null &&
                     formData.is_evergreen !== null &&
                     formData.cost &&
                     formData.sale_price

  return (
    <>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-xl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '700',
              fontSize: '20px'
            }}>
              2
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', marginBottom: '0.5rem' }}>
                6 Kriter Filtresi
              </h2>
              <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '14px' }}>
                Ürün Değerlendirme - Yargıç Modu
              </p>
            </div>
            <MarkQuoteTooltip quoteKey="problemSolving" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Product Name */}
            <div>
              <label>Ürün Adı</label>
              <input
                type="text"
                value={formData.product_name}
                onChange={e => updateField('product_name', e.target.value)}
                placeholder="Örn: Ağrı Kesici Yama"
              />
            </div>

            {/* Niche Selection */}
            <div>
              <label>Niş Seçimi</label>
              <div className="pill-row">
                {niches.map(niche => (
                  <button
                    key={niche}
                    type="button"
                    onClick={() => updateField('niche', niche)}
                    className={`pill ${formData.niche === niche ? 'active' : ''}`}
                  >
                    {niche}
                  </button>
                ))}
              </div>
            </div>

            {/* Question 1: Problem Solving */}
            <div>
              <label>Soru 1: Ürün ne işe yarıyor?</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => updateField('is_problem_solving', true)}
                  className={`choice-btn ${formData.is_problem_solving === true ? 'active success' : ''}`}
                >
                  Sorun Çözüyor (Ağrı/Güzellik)
                </button>
                <button
                  type="button"
                  onClick={() => updateField('is_problem_solving', false)}
                  className={`choice-btn ${formData.is_problem_solving === false ? 'active error' : ''}`}
                >
                  Şirin/Komik (Gadget)
                </button>
              </div>
              {showGadgetWarning && (
                <div className="toast error" style={{ marginTop: '0.75rem' }}>
                  <AlertCircle size={18} />
                  <span style={{ fontWeight: '600' }}>
                    HATA: Rastgele gadget satma! Gerçek problemler milyar dolarlık pazardır.
                  </span>
                </div>
              )}
            </div>

            {/* Question 2: Physical Properties */}
            <div>
              <label>Soru 2: Fiziksel Özellikler</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.is_lightweight === true}
                    onChange={e => updateField('is_lightweight', e.target.checked)}
                  />
                  <span>Ayakkabı kutusuna sığar mı?</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.is_evergreen === false}
                    onChange={e => updateField('is_evergreen', !e.target.checked)}
                  />
                  <span>Mevsimsel mi? (Evet seçilirse riskli)</span>
                </label>
              </div>
              {formData.is_evergreen === false && (
                <div className="toast" style={{
                  marginTop: '0.75rem',
                  background: 'rgba(245, 158, 11, 0.08)',
                  borderColor: 'rgba(245, 158, 11, 0.25)'
                }}>
                  <AlertCircle size={18} />
                  <span>Dikkat! Kışın elinde patlayabilir (Plaj ürünü riski).</span>
                </div>
              )}
            </div>

            {/* Question 3: Profitability Calculator */}
            <div>
              <label>Soru 3: Kârlılık Hesaplayıcı</label>
              <div className="two-col" style={{ marginBottom: '1rem' }}>
                <div>
                  <label style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Ürün Maliyeti ($)</label>
                  <input
                    type="number"
                    value={formData.cost}
                    onChange={e => updateField('cost', e.target.value)}
                    placeholder="10"
                    step="0.01"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Hedef Satış Fiyatı ($)</label>
                  <input
                    type="number"
                    value={formData.sale_price}
                    onChange={e => updateField('sale_price', e.target.value)}
                    placeholder="30"
                    step="0.01"
                  />
                </div>
              </div>
              {profitMargin && (
                <div className={`toast ${isLowMargin ? 'error' : ''}`} style={{
                  background: isLowMargin ? undefined : 'rgba(16, 185, 129, 0.08)',
                  borderColor: isLowMargin ? undefined : 'rgba(16, 185, 129, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {isLowMargin ? (
                      <AlertCircle size={18} />
                    ) : (
                      <CheckCircle size={18} color="var(--color-success)" />
                    )}
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '15px' }}>
                        Kâr Marjı: {profitMargin}x
                      </div>
                      {isLowMargin ? (
                        <div style={{ fontSize: '13px', marginTop: '0.25rem' }}>
                          Matematik yalan söylemez. Bu ürünle reklam maliyetini kurtaramazsın.
                        </div>
                      ) : (
                        <div style={{ color: 'var(--color-success)', fontSize: '13px', marginTop: '0.25rem' }}>
                          Hedef marjı geçtin! ✅
                        </div>
                      )}
                    </div>
                  </div>
                  {!isLowMargin && (
                    <div style={{
                      fontSize: '24px',
                      fontWeight: '700',
                      color: 'var(--color-success)'
                    }}>
                      {profitMargin}x
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Upsell Potential */}
            <div>
              <label>Upsell Potansiyeli</label>
              <textarea
                value={formData.upsell_potential}
                onChange={e => updateField('upsell_potential', e.target.value)}
                placeholder="Yanına ne satılabilir? Örn: Gözlük -> Kılıf"
                rows={3}
              />
            </div>
          </div>

          <button
            onClick={handleNext}
            disabled={!canProceed}
            className={canProceed ? 'primary' : 'ghost'}
            style={{ width: '100%', marginTop: '2rem' }}
          >
            Devam Et →
          </button>
        </div>
      </div>

      <style>{`
        label {
          font-weight: 600;
          color: var(--color-text-main);
          display: block;
          margin-bottom: 0.35rem;
          font-size: 15px;
        }
        input, textarea {
          width: 100%;
          padding: 0.65rem 0.75rem;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          background: white;
          transition: border var(--transition-fast), box-shadow var(--transition-fast);
          font-size: 15px;
        }
        input:focus, textarea:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(139,92,246,0.15);
          outline: none;
        }
        .two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
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
          font-weight: 600;
          font-size: 14px;
        }
        .pill.active {
          border-color: var(--color-primary);
          background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
          color: white;
          box-shadow: var(--shadow-sm);
        }
        .choice-btn {
          flex: 1;
          padding: 1rem;
          border: 2px solid var(--color-border);
          border-radius: var(--radius-md);
          background: white;
          color: var(--color-text-main);
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .choice-btn.active.success {
          border-color: var(--color-success);
          background: rgba(16, 185, 129, 0.05);
        }
        .choice-btn.active.error {
          border-color: var(--color-error);
          background: rgba(239, 68, 68, 0.05);
        }
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          border: 2px solid var(--color-border);
          border-radius: var(--radius-md);
          background: white;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .checkbox-label input {
          width: 20px;
          height: 20px;
          cursor: pointer;
          accent-color: var(--color-primary);
        }
        .checkbox-label:hover {
          border-color: var(--color-primary);
        }
        .ghost {
          padding: 0.65rem 1.1rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border);
          background: white;
          font-weight: 600;
          color: var(--color-text-main);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .ghost:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .primary {
          padding: 0.65rem 1.1rem;
          border-radius: var(--radius-md);
          border: none;
          background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
          color: white;
          font-weight: 600;
          cursor: pointer;
          box-shadow: var(--shadow-sm);
          transition: all var(--transition-fast);
        }
        .primary:hover {
          box-shadow: var(--shadow-md);
          transform: translateY(-1px);
        }
        .primary:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          transform: none;
        }
      `}</style>
    </>
  )
}

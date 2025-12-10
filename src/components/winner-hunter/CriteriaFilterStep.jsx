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
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="glass-panel">
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
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', fontSize: '15px' }}>
              Ürün Adı
            </label>
            <input
              type="text"
              value={formData.product_name}
              onChange={e => updateField('product_name', e.target.value)}
              placeholder="Örn: Ağrı Kesici Yama"
              className="input"
              style={{ width: '100%' }}
            />
          </div>

          {/* Niche Selection */}
          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', fontSize: '15px' }}>
              Niş Seçimi
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {niches.map(niche => (
                <button
                  key={niche}
                  type="button"
                  onClick={() => updateField('niche', niche)}
                  className={formData.niche === niche ? 'primary-btn' : 'ghost-btn'}
                  style={{
                    padding: '0.75rem 1.25rem',
                    fontSize: '14px'
                  }}
                >
                  {niche}
                </button>
              ))}
            </div>
          </div>

          {/* Question 1: Problem Solving */}
          <div>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.75rem', fontSize: '15px' }}>
              Soru 1: Ürün ne işe yarıyor?
            </label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="button"
                onClick={() => updateField('is_problem_solving', true)}
                className="glass-panel"
                style={{
                  flex: 1,
                  padding: '1rem',
                  border: `2px solid ${formData.is_problem_solving === true ? 'var(--color-success)' : 'var(--color-border)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Sorun Çözüyor (Ağrı/Güzellik)
              </button>
              <button
                type="button"
                onClick={() => updateField('is_problem_solving', false)}
                className="glass-panel"
                style={{
                  flex: 1,
                  padding: '1rem',
                  border: `2px solid ${formData.is_problem_solving === false ? 'var(--color-error)' : 'var(--color-border)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
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
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.75rem', fontSize: '15px' }}>
              Soru 2: Fiziksel Özellikler
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label className="glass-panel" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem',
                border: `2px solid ${formData.is_lightweight === true ? 'var(--color-success)' : formData.is_lightweight === false ? 'var(--color-error)' : 'var(--color-border)'}`,
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={formData.is_lightweight === true}
                  onChange={e => updateField('is_lightweight', e.target.checked)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <span style={{ fontWeight: '500' }}>Ayakkabı kutusuna sığar mı?</span>
              </label>
              <label className="glass-panel" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem',
                border: `2px solid ${formData.is_evergreen === false ? 'var(--color-error)' : formData.is_evergreen === true ? 'var(--color-success)' : 'var(--color-border)'}`,
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={formData.is_evergreen === false}
                  onChange={e => updateField('is_evergreen', !e.target.checked)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <span style={{ fontWeight: '500' }}>Mevsimsel mi? (Evet seçilirse riskli)</span>
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
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.75rem', fontSize: '15px' }}>
              Soru 3: Kârlılık Hesaplayıcı
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', color: 'var(--color-text-muted)', fontSize: '13px', marginBottom: '0.5rem' }}>
                  Ürün Maliyeti ($)
                </label>
                <input
                  type="number"
                  value={formData.cost}
                  onChange={e => updateField('cost', e.target.value)}
                  placeholder="10"
                  step="0.01"
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: 'var(--color-text-muted)', fontSize: '13px', marginBottom: '0.5rem' }}>
                  Hedef Satış Fiyatı ($)
                </label>
                <input
                  type="number"
                  value={formData.sale_price}
                  onChange={e => updateField('sale_price', e.target.value)}
                  placeholder="30"
                  step="0.01"
                  className="input"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
            {profitMargin && (
              <div className={isLowMargin ? 'toast error' : 'toast'} style={{
                padding: '1rem',
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
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', fontSize: '15px' }}>
              Upsell Potansiyeli
            </label>
            <textarea
              value={formData.upsell_potential}
              onChange={e => updateField('upsell_potential', e.target.value)}
              placeholder="Yanına ne satılabilir? Örn: Gözlük -> Kılıf"
              rows={3}
              className="input"
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>
        </div>

        <button
          onClick={handleNext}
          disabled={!canProceed}
          className={canProceed ? 'primary-btn' : 'ghost-btn'}
          style={{ width: '100%', marginTop: '2rem' }}
        >
          Devam Et →
        </button>
      </div>
    </div>
  )
}


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
      <div style={{
        background: 'rgba(30, 41, 59, 0.5)',
        borderRadius: 'var(--radius-lg)',
        padding: '2rem',
        border: '1px solid rgba(139, 92, 246, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
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
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#F1F5F9', marginBottom: '0.5rem' }}>
              The 6 Criteria Filter
            </h2>
            <p style={{ margin: 0, color: '#94A3B8', fontSize: '14px' }}>
              Ürün Değerlendirme - Yargıç Modu
            </p>
          </div>
          <MarkQuoteTooltip quoteKey="problemSolving" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Product Name */}
          <div>
            <label style={{ display: 'block', color: '#F1F5F9', fontWeight: '600', marginBottom: '0.5rem', fontSize: '15px' }}>
              Ürün Adı
            </label>
            <input
              type="text"
              value={formData.product_name}
              onChange={e => updateField('product_name', e.target.value)}
              placeholder="Örn: Ağrı Kesici Yama"
              style={{
                width: '100%',
                padding: '0.875rem',
                background: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: 'var(--radius-md)',
                color: '#F1F5F9',
                fontSize: '15px'
              }}
            />
          </div>

          {/* Niche Selection */}
          <div>
            <label style={{ display: 'block', color: '#F1F5F9', fontWeight: '600', marginBottom: '0.5rem', fontSize: '15px' }}>
              Niş Seçimi
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {niches.map(niche => (
                <button
                  key={niche}
                  type="button"
                  onClick={() => updateField('niche', niche)}
                  style={{
                    padding: '0.75rem 1.25rem',
                    background: formData.niche === niche
                      ? 'linear-gradient(135deg, #8B5CF6, #7C3AED)'
                      : 'rgba(30, 41, 59, 0.5)',
                    border: `2px solid ${formData.niche === niche ? '#8B5CF6' : 'rgba(139, 92, 246, 0.3)'}`,
                    borderRadius: 'var(--radius-md)',
                    color: '#F1F5F9',
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {niche}
                </button>
              ))}
            </div>
          </div>

          {/* Question 1: Problem Solving */}
          <div>
            <label style={{ display: 'block', color: '#F1F5F9', fontWeight: '600', marginBottom: '0.75rem', fontSize: '15px' }}>
              Soru 1: Ürün ne işe yarıyor?
            </label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="button"
                onClick={() => updateField('is_problem_solving', true)}
                style={{
                  flex: 1,
                  padding: '1rem',
                  background: formData.is_problem_solving === true
                    ? 'rgba(16, 185, 129, 0.2)'
                    : 'rgba(30, 41, 59, 0.5)',
                  border: `2px solid ${formData.is_problem_solving === true ? '#10B981' : 'rgba(139, 92, 246, 0.3)'}`,
                  borderRadius: 'var(--radius-md)',
                  color: '#F1F5F9',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Sorun Çözüyor (Ağrı/Güzellik)
              </button>
              <button
                type="button"
                onClick={() => updateField('is_problem_solving', false)}
                style={{
                  flex: 1,
                  padding: '1rem',
                  background: formData.is_problem_solving === false
                    ? 'rgba(239, 68, 68, 0.2)'
                    : 'rgba(30, 41, 59, 0.5)',
                  border: `2px solid ${formData.is_problem_solving === false ? '#EF4444' : 'rgba(139, 92, 246, 0.3)'}`,
                  borderRadius: 'var(--radius-md)',
                  color: '#F1F5F9',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Şirin/Komik (Gadget)
              </button>
            </div>
            {showGadgetWarning && (
              <div style={{
                marginTop: '0.75rem',
                padding: '1rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <AlertCircle size={20} color="#EF4444" />
                <span style={{ color: '#FCA5A5', fontSize: '14px', fontWeight: '600' }}>
                  HATA: Rastgele gadget satma! Gerçek problemler milyar dolarlık pazardır.
                </span>
              </div>
            )}
          </div>

          {/* Question 2: Physical Properties */}
          <div>
            <label style={{ display: 'block', color: '#F1F5F9', fontWeight: '600', marginBottom: '0.75rem', fontSize: '15px' }}>
              Soru 2: Fiziksel Özellikler
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem',
                background: formData.is_lightweight === true
                  ? 'rgba(16, 185, 129, 0.1)'
                  : formData.is_lightweight === false
                  ? 'rgba(239, 68, 68, 0.1)'
                  : 'rgba(30, 41, 59, 0.3)',
                border: `2px solid ${formData.is_lightweight === true ? '#10B981' : formData.is_lightweight === false ? '#EF4444' : 'rgba(139, 92, 246, 0.3)'}`,
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={formData.is_lightweight === true}
                  onChange={e => updateField('is_lightweight', e.target.checked)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <span style={{ color: '#F1F5F9', fontWeight: '500' }}>Ayakkabı kutusuna sığar mı?</span>
              </label>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem',
                background: formData.is_evergreen === false
                  ? 'rgba(239, 68, 68, 0.1)'
                  : formData.is_evergreen === true
                  ? 'rgba(16, 185, 129, 0.1)'
                  : 'rgba(30, 41, 59, 0.3)',
                border: `2px solid ${formData.is_evergreen === false ? '#EF4444' : formData.is_evergreen === true ? '#10B981' : 'rgba(139, 92, 246, 0.3)'}`,
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={formData.is_evergreen === false}
                  onChange={e => updateField('is_evergreen', !e.target.checked)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <span style={{ color: '#F1F5F9', fontWeight: '500' }}>Mevsimsel mi? (Evet seçilirse riskli)</span>
              </label>
            </div>
            {formData.is_evergreen === false && (
              <div style={{
                marginTop: '0.75rem',
                padding: '1rem',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <AlertCircle size={20} color="#F59E0B" />
                <span style={{ color: '#FCD34D', fontSize: '14px' }}>
                  Dikkat! Kışın elinde patlayabilir (Plaj ürünü riski).
                </span>
              </div>
            )}
          </div>

          {/* Question 3: Profitability Calculator */}
          <div>
            <label style={{ display: 'block', color: '#F1F5F9', fontWeight: '600', marginBottom: '0.75rem', fontSize: '15px' }}>
              Soru 3: Kârlılık Hesaplayıcı
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', color: '#94A3B8', fontSize: '13px', marginBottom: '0.5rem' }}>
                  Ürün Maliyeti ($)
                </label>
                <input
                  type="number"
                  value={formData.cost}
                  onChange={e => updateField('cost', e.target.value)}
                  placeholder="10"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    background: 'rgba(30, 41, 59, 0.5)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    color: '#F1F5F9',
                    fontSize: '15px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#94A3B8', fontSize: '13px', marginBottom: '0.5rem' }}>
                  Hedef Satış Fiyatı ($)
                </label>
                <input
                  type="number"
                  value={formData.sale_price}
                  onChange={e => updateField('sale_price', e.target.value)}
                  placeholder="30"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    background: 'rgba(30, 41, 59, 0.5)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    color: '#F1F5F9',
                    fontSize: '15px'
                  }}
                />
              </div>
            </div>
            {profitMargin && (
              <div style={{
                padding: '1rem',
                background: isLowMargin
                  ? 'rgba(239, 68, 68, 0.1)'
                  : 'rgba(16, 185, 129, 0.1)',
                border: `2px solid ${isLowMargin ? '#EF4444' : '#10B981'}`,
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {isLowMargin ? (
                    <AlertCircle size={20} color="#EF4444" />
                  ) : (
                    <CheckCircle size={20} color="#10B981" />
                  )}
                  <div>
                    <div style={{ color: '#F1F5F9', fontWeight: '600', fontSize: '15px' }}>
                      Kâr Marjı: {profitMargin}x
                    </div>
                    {isLowMargin ? (
                      <div style={{ color: '#FCA5A5', fontSize: '13px', marginTop: '0.25rem' }}>
                        Matematik yalan söylemez. Bu ürünle reklam maliyetini kurtaramazsın.
                      </div>
                    ) : (
                      <div style={{ color: '#6EE7B7', fontSize: '13px', marginTop: '0.25rem' }}>
                        Hedef marjı geçtin! ✅
                      </div>
                    )}
                  </div>
                </div>
                {!isLowMargin && (
                  <div style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#10B981',
                    textShadow: '0 0 10px rgba(16, 185, 129, 0.5)'
                  }}>
                    {profitMargin}x
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Upsell Potential */}
          <div>
            <label style={{ display: 'block', color: '#F1F5F9', fontWeight: '600', marginBottom: '0.5rem', fontSize: '15px' }}>
              Upsell Potansiyeli
            </label>
            <textarea
              value={formData.upsell_potential}
              onChange={e => updateField('upsell_potential', e.target.value)}
              placeholder="Yanına ne satılabilir? Örn: Gözlük -> Kılıf"
              rows={3}
              style={{
                width: '100%',
                padding: '0.875rem',
                background: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: 'var(--radius-md)',
                color: '#F1F5F9',
                fontSize: '15px',
                resize: 'vertical'
              }}
            />
          </div>
        </div>

        <button
          onClick={handleNext}
          disabled={!canProceed}
          style={{
            width: '100%',
            marginTop: '2rem',
            padding: '1rem',
            background: canProceed
              ? 'linear-gradient(135deg, #8B5CF6, #7C3AED)'
              : 'rgba(100, 116, 139, 0.3)',
            color: canProceed ? 'white' : '#64748B',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontWeight: '700',
            fontSize: '16px',
            cursor: canProceed ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
            boxShadow: canProceed ? '0 4px 12px rgba(139, 92, 246, 0.4)' : 'none'
          }}
        >
          Devam Et →
        </button>
      </div>
    </div>
  )
}


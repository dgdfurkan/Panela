import { useState } from 'react'
import { CheckCircle, Circle, AlertCircle } from 'lucide-react'
import MarkQuoteTooltip from './MarkQuoteTooltip'

const checklistItems = [
  {
    id: 'burner_accounts',
    label: 'Burner (Kullan-At) Hesapların hazır mı?',
    tooltip: 'Algoritma eğitimi için geçici hesaplar oluşturuldu mu?'
  },
  {
    id: 'niche_selection',
    label: 'Niş Seçimi Yapıldı mı? (Öneri: Health & Beauty, Pain Relief)',
    tooltip: 'İnsanlar zevk kazanmaktan çok acıdan kaçınır. Acıya odaklan.'
  },
  {
    id: 'algorithm_training',
    label: 'Algoritma Eğitildi mi? (CeraVe, Sephora gibi devleri beğendin mi?)',
    tooltip: 'Hedef nişteki büyük markaları beğenerek algoritmayı eğit.'
  },
  {
    id: 'active_buyer_signal',
    label: 'Aktif Alıcı Sinyali Verildi mi? (Sepete ekleme yaptın mı?)',
    tooltip: 'Sepete ürün ekleyerek aktif alıcı sinyali ver.'
  }
]

export default function BurnerProtocolStep({ onComplete, initialData = {} }) {
  const [checkedItems, setCheckedItems] = useState(initialData.checklist || {})

  const handleToggle = (id) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const allChecked = checklistItems.every(item => checkedItems[item.id] === true)

  const handleStartHunt = () => {
    if (allChecked) {
      onComplete({ checklist: checkedItems })
    }
  }

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
            1
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', marginBottom: '0.5rem' }}>
              Hazırlık Protokolü
            </h2>
            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '14px' }}>
              Hazırlık ve Algoritma Eğitimi
            </p>
          </div>
          <MarkQuoteTooltip quoteKey="niche" />
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '15px', lineHeight: '1.6', marginBottom: '1.5rem' }}>
            Ürün aramaya başlamadan önce bu adımları tamamladığından emin ol. Her madde kritik!
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {checklistItems.map(item => {
              const isChecked = checkedItems[item.id] === true
              return (
                <div
                  key={item.id}
                  onClick={() => handleToggle(item.id)}
                  className="glass-panel"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem',
                    border: `2px solid ${isChecked ? 'var(--color-success)' : 'var(--color-border)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {isChecked ? (
                    <CheckCircle size={24} color="var(--color-success)" />
                  ) : (
                    <Circle size={24} color="var(--color-text-muted)" />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '500', fontSize: '15px' }}>
                      {item.label}
                    </div>
                    {item.tooltip && (
                      <div style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginTop: '4px' }}>
                        {item.tooltip}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {!allChecked && (
          <div className="toast error" style={{ marginBottom: '1.5rem' }}>
            <AlertCircle size={18} />
            <span>Tüm maddeleri tamamlamadan ava başlayamazsın!</span>
          </div>
        )}

        <button
          onClick={handleStartHunt}
          disabled={!allChecked}
          className={allChecked ? 'primary-btn' : 'ghost-btn'}
          style={{ width: '100%' }}
        >
          {allChecked ? '🎯 Ava Başla' : 'Tüm Maddeleri Tamamla'}
        </button>
      </div>
    </div>
  )
}


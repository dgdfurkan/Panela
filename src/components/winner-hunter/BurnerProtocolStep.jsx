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
            1
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#F1F5F9', marginBottom: '0.5rem' }}>
              Burner Protocol
            </h2>
            <p style={{ margin: 0, color: '#94A3B8', fontSize: '14px' }}>
              Hazırlık ve Algoritma Eğitimi
            </p>
          </div>
          <MarkQuoteTooltip quoteKey="niche" />
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <p style={{ color: '#94A3B8', fontSize: '15px', lineHeight: '1.6', marginBottom: '1.5rem' }}>
            Ürün aramaya başlamadan önce bu adımları tamamladığından emin ol. Her madde kritik!
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {checklistItems.map(item => {
              const isChecked = checkedItems[item.id] === true
              return (
                <div
                  key={item.id}
                  onClick={() => handleToggle(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem',
                    background: isChecked ? 'rgba(16, 185, 129, 0.1)' : 'rgba(30, 41, 59, 0.3)',
                    border: `2px solid ${isChecked ? '#10B981' : 'rgba(139, 92, 246, 0.2)'}`,
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => {
                    if (!isChecked) {
                      e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isChecked) {
                      e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.2)'
                    }
                  }}
                >
                  {isChecked ? (
                    <CheckCircle size={24} color="#10B981" />
                  ) : (
                    <Circle size={24} color="#64748B" />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#F1F5F9', fontWeight: '500', fontSize: '15px' }}>
                      {item.label}
                    </div>
                    {item.tooltip && (
                      <div style={{ color: '#94A3B8', fontSize: '13px', marginTop: '4px' }}>
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
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem'
          }}>
            <AlertCircle size={20} color="#EF4444" />
            <span style={{ color: '#FCA5A5', fontSize: '14px' }}>
              Tüm maddeleri tamamlamadan ava başlayamazsın!
            </span>
          </div>
        )}

        <button
          onClick={handleStartHunt}
          disabled={!allChecked}
          style={{
            width: '100%',
            padding: '1rem',
            background: allChecked
              ? 'linear-gradient(135deg, #8B5CF6, #7C3AED)'
              : 'rgba(100, 116, 139, 0.3)',
            color: allChecked ? 'white' : '#64748B',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontWeight: '700',
            fontSize: '16px',
            cursor: allChecked ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
            boxShadow: allChecked ? '0 4px 12px rgba(139, 92, 246, 0.4)' : 'none'
          }}
        >
          {allChecked ? '🎯 Ava Başla' : 'Tüm Maddeleri Tamamla'}
        </button>
      </div>
    </div>
  )
}


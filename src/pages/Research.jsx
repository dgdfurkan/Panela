import { useState, useEffect } from 'react'
import { Target, Trophy, Trash2, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import WinnerHunterWizard from '../components/winner-hunter/WinnerHunterWizard'

export default function Research() {
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSave = async (data) => {
    setSaving(true)
    setError('')
    setSuccess('')
    
    try {
      if (!user || !user.id) {
        throw new Error('Oturum kapalı. Lütfen tekrar giriş yapın.')
      }

      // Veritabanına kaydet
      const { error: insertError } = await supabase
        .from('product_hunting_lab')
        .insert([{
          ...data,
          user_id: user.id,
          updated_at: new Date().toISOString()
        }])

      if (insertError) throw insertError

      setSuccess('Ürün analizi başarıyla kaydedildi!')
      
      // Eğer WINNER ise products tablosuna da ekle (opsiyonel)
      if (data.status === 'WINNER') {
        const { error: productError } = await supabase
          .from('products')
          .insert([{
            name: data.product_name,
            status: 'Researching',
            priority: 'High',
            thoughts: `Winner Score: ${data.winner_score}\nNiş: ${data.niche}\nKâr Marjı: ${data.profit_margin}x\nGolden Ratio: ${data.engagement_ratio}x`,
            user_id: user.id
          }])
        
        if (productError) {
          console.error('Products tablosuna ekleme hatası:', productError)
        }
      }
    } catch (err) {
      console.error('Kaydetme hatası:', err)
      setError(err.message || 'Ürün analizi kaydedilirken bir hata oluştu')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [success])

  return (
    <div className="page-container fade-in">
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div className="page-head" style={{ marginBottom: '2rem' }}>
          <div>
            <div className="eyebrow">Kazanan Ürün Avcısı</div>
            <h1 style={{ margin: '0.5rem 0', fontSize: '2rem', fontWeight: '700' }}>
              The Winner Hunter
            </h1>
            <p style={{ margin: '0.5rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
              Mark Builds Brands Metodolojisi - Duygusal kararlar verme. <strong>VERİ, MATEMATİK ve PSİKOLOJİ</strong> ile ürünlerini analiz et.
            </p>
          </div>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-md)'
          }}>
            <Target size={32} color="white" />
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="toast" style={{
            background: 'rgba(16, 185, 129, 0.08)',
            borderColor: 'rgba(16, 185, 129, 0.25)',
            marginBottom: '1.5rem'
          }}>
            <Trophy size={18} />
            {success}
          </div>
        )}

        {error && (
          <div className="toast error" style={{ marginBottom: '1.5rem' }}>
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* Winner Hunter Wizard */}
        <WinnerHunterWizard
          onSave={handleSave}
          userId={user?.id}
        />
      </div>
    </div>
  )
}

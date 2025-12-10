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
    <div className="page-container fade-in" style={{
      background: '#0F172A',
      minHeight: '100vh',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          marginBottom: '3rem',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(139, 92, 246, 0.4)'
            }}>
              <Target size={32} color="white" />
            </div>
            <div style={{ textAlign: 'left' }}>
              <h1 style={{
                margin: 0,
                fontSize: '36px',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #8B5CF6, #F59E0B)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                The Winner Hunter
              </h1>
              <p style={{
                margin: '0.5rem 0 0',
                color: '#94A3B8',
                fontSize: '16px',
                fontWeight: '500'
              }}>
                Kazanan Ürün Avcısı - Mark Builds Brands Metodolojisi
              </p>
            </div>
          </div>
          <p style={{
            color: '#64748B',
            fontSize: '15px',
            maxWidth: '700px',
            margin: '1.5rem auto 0',
            lineHeight: '1.6'
          }}>
            Duygusal kararlar verme. <strong style={{ color: '#F1F5F9' }}>VERİ, MATEMATİK ve PSİKOLOJİ</strong> ile ürünlerini analiz et.
            Mark'ın öğretilerine göre kazanan ürünleri bul.
          </p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div style={{
            marginBottom: '2rem',
            padding: '1rem 1.5rem',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: '#6EE7B7',
            fontSize: '15px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <Trophy size={20} />
            {success}
          </div>
        )}

        {error && (
          <div style={{
            marginBottom: '2rem',
            padding: '1rem 1.5rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: '#FCA5A5',
            fontSize: '15px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <AlertCircle size={20} />
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

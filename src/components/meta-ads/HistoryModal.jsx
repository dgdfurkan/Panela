import { useState, useEffect } from 'react'
import { X, Clock, RotateCcw, Search } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

export default function HistoryModal({ isOpen, onClose, userId }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterKeyword, setFilterKeyword] = useState('')
  const [filterCountry, setFilterCountry] = useState('')
  const [filterAction, setFilterAction] = useState('')

  useEffect(() => {
    if (isOpen && userId) {
      loadHistory()
    }
  }, [isOpen, userId])

  const loadHistory = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('research_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (filterKeyword) {
        query = query.ilike('keyword', `%${filterKeyword}%`)
      }
      if (filterCountry) {
        query = query.eq('country_code', filterCountry)
      }
      if (filterAction) {
        query = query.eq('action_type', filterAction)
      }

      const { data, error } = await query

      if (error) throw error
      setHistory(data || [])
    } catch (error) {
      console.error('Error loading history:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadHistory()
    }
  }, [filterKeyword, filterCountry, filterAction])

  if (!isOpen) return null

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const getCountryFlag = (code) => {
    const flags = {
      US: '🇺🇸',
      CA: '🇨🇦',
      GB: '🇬🇧',
      AU: '🇦🇺',
      NZ: '🇳🇿'
    }
    return flags[code] || code
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: '800px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.5rem',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>Araştırma Geçmişi</h2>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Filters */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            gap: '0.75rem',
            flexWrap: 'wrap'
          }}
        >
          <input
            type="text"
            placeholder="Kelime ara..."
            value={filterKeyword}
            onChange={e => setFilterKeyword(e.target.value)}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '0.5rem 0.75rem',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '14px'
            }}
          />
          <select
            value={filterCountry}
            onChange={e => setFilterCountry(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '14px',
              background: 'white'
            }}
          >
            <option value="">Tüm Ülkeler</option>
            <option value="US">🇺🇸 US</option>
            <option value="CA">🇨🇦 CA</option>
            <option value="GB">🇬🇧 GB</option>
            <option value="AU">🇦🇺 AU</option>
            <option value="NZ">🇳🇿 NZ</option>
          </select>
          <select
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '14px',
              background: 'white'
            }}
          >
            <option value="">Tüm İşlemler</option>
            <option value="clicked">Tıklama</option>
            <option value="reset">Reset</option>
          </select>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem'
          }}
        >
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
              Yükleniyor...
            </div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
              Henüz geçmiş kaydı yok
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {history.map(item => (
                <div
                  key={item.id}
                  style={{
                    padding: '1rem',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    background: item.action_type === 'reset' ? 'rgba(239, 68, 68, 0.05)' : 'var(--color-background)'
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: 'var(--radius-sm)',
                      background: item.action_type === 'reset' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {item.action_type === 'reset' ? (
                      <RotateCcw size={20} color="var(--color-error)" />
                    ) : (
                      <Clock size={20} color="var(--color-primary)" />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                      {item.keyword}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span>{getCountryFlag(item.country_code)} {item.country_code}</span>
                      <span>•</span>
                      <span>{item.action_type === 'clicked' ? 'Tıklama' : 'Reset'}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    {formatDate(item.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


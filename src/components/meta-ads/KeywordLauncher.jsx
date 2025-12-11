import { useState, useEffect } from 'react'
import { Check, RotateCcw, History, ExternalLink, Calendar, X } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { parseKeywordsFromFile, ensureKeywordsInDatabase } from '../../lib/keywordsLoader'
import KeywordInput from './KeywordInput'
import HistoryModal from './HistoryModal'

const COUNTRIES = [
  { code: 'US', flag: '🇺🇸', name: 'ABD' },
  { code: 'CA', flag: '🇨🇦', name: 'Kanada' },
  { code: 'GB', flag: '🇬🇧', name: 'İngiltere' },
  { code: 'AU', flag: '🇦🇺', name: 'Avustralya' },
  { code: 'NZ', flag: '🇳🇿', name: 'Yeni Zelanda' }
]

export default function KeywordLauncher({ userId }) {
  const [keywords, setKeywords] = useState([])
  const [loading, setLoading] = useState(true)
  const [clickedCombos, setClickedCombos] = useState(new Set())
  const [otherUserCombos, setOtherUserCombos] = useState(new Set())
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  
  // Date range state
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    if (userId) {
      loadKeywords()
      loadClickedStates()
    }
  }, [userId])

  const loadKeywords = async () => {
    setLoading(true)
    try {
      // First, parse and ensure keywords from file are in DB
      const fileKeywords = await parseKeywordsFromFile()
      await ensureKeywordsInDatabase(supabase, fileKeywords)

      // Then load all keywords from DB
      const { data, error } = await supabase
        .from('research_keywords')
        .select('*')
        .order('keyword', { ascending: true })

      if (error) throw error
      setKeywords(data || [])
    } catch (error) {
      console.error('Error loading keywords:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadClickedStates = async () => {
    if (!userId) return

    try {
      // Load current user's clicked combos
      const { data: myData } = await supabase
        .from('research_history')
        .select('keyword, country_code')
        .eq('user_id', userId)
        .eq('action_type', 'clicked')

      const myCombos = new Set()
      myData?.forEach(item => {
        myCombos.add(`${item.keyword}|${item.country_code}`)
      })
      setClickedCombos(myCombos)

      // Load other users' clicked combos
      const { data: otherData } = await supabase
        .from('research_history')
        .select('keyword, country_code, user_id')
        .eq('action_type', 'clicked')
        .neq('user_id', userId)

      const otherCombos = new Set()
      otherData?.forEach(item => {
        otherCombos.add(`${item.keyword}|${item.country_code}`)
      })
      setOtherUserCombos(otherCombos)
    } catch (error) {
      console.error('Error loading clicked states:', error)
    }
  }

  const handleCountryClick = async (keyword, countryCode) => {
    if (!userId) return

    const combo = `${keyword}|${countryCode}`
    
    // Create Meta Ads Library URL
    let url = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=${countryCode}&q=${encodeURIComponent(keyword)}&search_type=keyword_unordered&media_type=all`
    
    // Add date range if provided
    if (startDate) {
      // Convert YYYY-MM-DD to timestamp (Unix timestamp in seconds)
      const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000)
      url += `&start_date=${startTimestamp}`
    }
    if (endDate) {
      // Convert YYYY-MM-DD to timestamp (Unix timestamp in seconds)
      // Set to end of day (23:59:59)
      const endDateObj = new Date(endDate)
      endDateObj.setHours(23, 59, 59, 999)
      const endTimestamp = Math.floor(endDateObj.getTime() / 1000)
      url += `&end_date=${endTimestamp}`
    }
    
    // Open in new tab
    window.open(url, '_blank')

    // Save to history
    try {
      const { error } = await supabase
        .from('research_history')
        .insert({
          user_id: userId,
          keyword,
          country_code: countryCode,
          action_type: 'clicked'
        })

      if (error) throw error

      // Update local state
      setClickedCombos(prev => new Set([...prev, combo]))
      loadClickedStates() // Reload to update other users' states
    } catch (error) {
      console.error('Error saving click:', error)
    }
  }

  const handleReset = async (keyword, countryCode) => {
    if (!userId) return

    try {
      // Delete all clicked records for this combo
      const { error: deleteError } = await supabase
        .from('research_history')
        .delete()
        .eq('user_id', userId)
        .eq('keyword', keyword)
        .eq('country_code', countryCode)
        .eq('action_type', 'clicked')

      if (deleteError) throw deleteError

      // Add reset record
      const { error: insertError } = await supabase
        .from('research_history')
        .insert({
          user_id: userId,
          keyword,
          country_code: countryCode,
          action_type: 'reset'
        })

      if (insertError) throw insertError

      // Update local state
      const combo = `${keyword}|${countryCode}`
      setClickedCombos(prev => {
        const newSet = new Set(prev)
        newSet.delete(combo)
        return newSet
      })
      
      // Reload to update other users' states
      loadClickedStates()
    } catch (error) {
      console.error('Error resetting:', error)
    }
  }

  const handleAddKeywords = async (newKeywords) => {
    try {
      const { error } = await supabase
        .from('research_keywords')
        .insert(newKeywords.map(keyword => ({ keyword, created_by: userId })))

      if (error) throw error
      loadKeywords()
    } catch (error) {
      console.error('Error adding keywords:', error)
    }
  }

  const isClicked = (keyword, countryCode) => {
    return clickedCombos.has(`${keyword}|${countryCode}`)
  }

  const isOtherUserClicked = (keyword, countryCode) => {
    return otherUserCombos.has(`${keyword}|${countryCode}`)
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>Hızlı Başlatıcı</h2>
          <button
            onClick={() => setHistoryModalOpen(true)}
            className="primary"
            style={{
              padding: '0.5rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '14px'
            }}
          >
            <History size={18} />
            Geçmiş
          </button>
        </div>
        
        {/* Date Range Selector */}
        <div
          style={{
            padding: '1rem',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            background: 'white',
            marginBottom: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Calendar size={18} color="var(--color-primary)" />
            <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text-main)' }}>
              Tarih Aralığı (Opsiyonel)
            </label>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                Başlangıç
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '14px',
                  background: 'white'
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                Bitiş
              </label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                min={startDate || undefined}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '14px',
                  background: 'white'
                }}
              />
            </div>
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('')
                  setEndDate('')
                }}
                style={{
                  padding: '0.5rem 0.75rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--color-text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  height: 'fit-content'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--color-error)'
                  e.currentTarget.style.color = 'var(--color-error)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--color-border)'
                  e.currentTarget.style.color = 'var(--color-text-muted)'
                }}
              >
                <X size={14} />
                Temizle
              </button>
            )}
          </div>
          {(startDate || endDate) && (
            <div style={{ marginTop: '0.5rem', fontSize: '12px', color: 'var(--color-primary)', fontWeight: '500' }}>
              {startDate && endDate
                ? `Aralık: ${new Date(startDate).toLocaleDateString('tr-TR')} - ${new Date(endDate).toLocaleDateString('tr-TR')}`
                : startDate
                ? `Başlangıç: ${new Date(startDate).toLocaleDateString('tr-TR')}`
                : `Bitiş: ${new Date(endDate).toLocaleDateString('tr-TR')}`}
            </div>
          )}
        </div>
        
        <KeywordInput onAdd={handleAddKeywords} />
      </div>

      {/* Keywords List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
            Yükleniyor...
          </div>
        ) : keywords.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
            Henüz anahtar kelime yok
          </div>
        ) : (
          keywords.map(keywordItem => (
            <div
              key={keywordItem.id}
              style={{
                padding: '1rem',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                background: 'white',
                transition: 'all var(--transition-fast)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontWeight: '600', fontSize: '15px' }}>{keywordItem.keyword}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {COUNTRIES.map(country => {
                  const clicked = isClicked(keywordItem.keyword, country.code)
                  const otherClicked = isOtherUserClicked(keywordItem.keyword, country.code)
                  
                  return (
                    <div key={country.code} style={{ position: 'relative' }}>
                      <button
                        onClick={() => handleCountryClick(keywordItem.keyword, country.code)}
                        disabled={clicked}
                        style={{
                          padding: '0.5rem 0.75rem',
                          border: `1px solid ${clicked ? 'var(--color-success)' : otherClicked ? 'var(--color-primary)' : 'var(--color-border)'}`,
                          borderRadius: 'var(--radius-sm)',
                          background: clicked
                            ? 'rgba(16, 185, 129, 0.1)'
                            : otherClicked
                            ? 'rgba(139, 92, 246, 0.05)'
                            : 'white',
                          cursor: clicked ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '13px',
                          fontWeight: '500',
                          opacity: clicked ? 0.6 : 1,
                          transition: 'all var(--transition-fast)',
                          position: 'relative'
                        }}
                        onMouseEnter={e => {
                          if (!clicked) {
                            e.currentTarget.style.borderColor = 'var(--color-primary)'
                            e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                          }
                        }}
                        onMouseLeave={e => {
                          if (!clicked) {
                            e.currentTarget.style.borderColor = otherClicked ? 'var(--color-primary)' : 'var(--color-border)'
                            e.currentTarget.style.boxShadow = 'none'
                          }
                        }}
                      >
                        <span>{country.flag}</span>
                        <span>{country.code}</span>
                        {clicked && <Check size={14} color="var(--color-success)" />}
                        {otherClicked && !clicked && (
                          <span style={{ fontSize: '10px', color: 'var(--color-primary)' }}>•</span>
                        )}
                      </button>
                      {clicked && (
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            handleReset(keywordItem.keyword, country.code)
                          }}
                          style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '-8px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: 'var(--color-error)',
                            border: '2px solid white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            padding: 0
                          }}
                          title="Sıfırla"
                        >
                          <RotateCcw size={10} color="white" />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <HistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        userId={userId}
      />
    </div>
  )
}


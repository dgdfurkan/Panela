import { useState } from 'react'
import { Plus, Upload } from 'lucide-react'

export default function KeywordInput({ onAdd, loading = false }) {
  const [inputValue, setInputValue] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    // Support both comma-separated and single keyword
    const keywords = inputValue
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0)

    if (keywords.length > 0) {
      onAdd(keywords)
      setInputValue('')
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const keywords = text
        .split(/[|,\n]/)
        .map(k => k.trim())
        .filter(k => k.length > 0)
        .filter((k, i, arr) => arr.indexOf(k) === i) // Remove duplicates

      if (keywords.length > 0) {
        onAdd(keywords)
      }
    } catch (error) {
      console.error('Error reading file:', error)
    }

    // Reset input
    e.target.value = ''
  }

  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
      <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder="Kelime ekle (virgülle ayırarak toplu ekleyebilirsin)"
          disabled={loading}
          style={{
            flex: 1,
            padding: '0.65rem 0.75rem',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            background: 'white',
            fontSize: '14px',
            transition: 'border var(--transition-fast), box-shadow var(--transition-fast)'
          }}
          onFocus={e => {
            e.target.style.borderColor = 'var(--color-primary)'
            e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.15)'
          }}
          onBlur={e => {
            e.target.style.borderColor = 'var(--color-border)'
            e.target.style.boxShadow = 'none'
          }}
        />
        <button
          type="submit"
          disabled={loading || !inputValue.trim()}
          className="primary"
          style={{
            padding: '0.65rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Plus size={18} />
          Ekle
        </button>
      </form>
      <label
        style={{
          padding: '0.65rem 1rem',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          background: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontWeight: '600',
          fontSize: '14px',
          transition: 'all var(--transition-fast)'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'var(--color-primary)'
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--color-border)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <Upload size={18} />
        Dosya
        <input
          type="file"
          accept=".txt"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          disabled={loading}
        />
      </label>
    </div>
  )
}


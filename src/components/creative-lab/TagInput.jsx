import { useState } from 'react'
import { X, Hash } from 'lucide-react'

export default function TagInput({ value = [], onChange, placeholder = '#etiket ekle' }) {
  const [input, setInput] = useState('')

  const addTag = (tag) => {
    const trimmed = tag.trim()
    if (!trimmed) return
    if (value.includes(trimmed)) return
    onChange([...value, trimmed])
    setInput('')
  }

  const removeTag = (tag) => {
    onChange(value.filter((t) => t !== tag))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag(input)
    }
    if (e.key === 'Backspace' && !input && value.length) {
      removeTag(value[value.length - 1])
    }
  }

  return (
    <div className="tag-input glass-panel">
      <div className="tags">
        {value.map((tag) => (
          <span key={tag} className="tag">
            <Hash size={14} />
            {tag}
            <button type="button" onClick={() => removeTag(tag)} aria-label="etiketi sil">
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />
      </div>

      <style>{`
        .tag-input {
          border-radius: var(--radius-lg);
          padding: 0.75rem;
          border: 1px dashed var(--color-border);
          background: rgba(255,255,255,0.9);
        }
        .tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          align-items: center;
        }
        .tag {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          background: linear-gradient(135deg, rgba(139,92,246,0.12), rgba(244,114,182,0.12));
          color: var(--color-text-main);
          padding: 0.35rem 0.6rem;
          border-radius: var(--radius-md);
          font-size: 0.85rem;
          border: 1px solid rgba(139,92,246,0.2);
        }
        .tag button {
          background: transparent;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          color: var(--color-text-muted);
        }
        input {
          border: none;
          outline: none;
          min-width: 120px;
          flex: 1;
          padding: 0.35rem 0.25rem;
          background: transparent;
          color: var(--color-text-main);
        }
      `}</style>
    </div>
  )
}


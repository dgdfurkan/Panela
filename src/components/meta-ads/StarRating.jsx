import { useState } from 'react'
import { Star } from 'lucide-react'

export default function StarRating({ value = 0, onChange, label, disabled = false }) {
  const [hoverValue, setHoverValue] = useState(0)

  const handleClick = (rating) => {
    if (!disabled && onChange) {
      onChange(rating)
    }
  }

  const handleMouseEnter = (rating) => {
    if (!disabled) {
      setHoverValue(rating)
    }
  }

  const handleMouseLeave = () => {
    if (!disabled) {
      setHoverValue(0)
    }
  }

  const displayValue = hoverValue || value

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {label && (
        <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--color-text-main)' }}>
          {label}
        </label>
      )}
      <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleClick(star)}
            onMouseEnter={() => handleMouseEnter(star)}
            onMouseLeave={handleMouseLeave}
            disabled={disabled}
            style={{
              background: 'none',
              border: 'none',
              padding: '0',
              cursor: disabled ? 'default' : 'pointer',
              transition: 'transform 0.1s'
            }}
          >
            <Star
              size={24}
              fill={star <= displayValue ? 'var(--color-warning)' : 'transparent'}
              color={star <= displayValue ? 'var(--color-warning)' : 'var(--color-border)'}
              style={{
                transition: 'all 0.2s',
                transform: star <= displayValue && !disabled ? 'scale(1.1)' : 'scale(1)'
              }}
            />
          </button>
        ))}
        {value > 0 && (
          <span style={{ marginLeft: '0.5rem', fontSize: '14px', color: 'var(--color-text-muted)', fontWeight: '600' }}>
            {value}/5
          </span>
        )}
      </div>
    </div>
  )
}


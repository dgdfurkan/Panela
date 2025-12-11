import { ExternalLink } from 'lucide-react'

export default function ProductCard({ product, onEdit }) {
  const scores = typeof product.scores === 'string' 
    ? JSON.parse(product.scores) 
    : product.scores || {}

  const getScoreColor = (score) => {
    if (score >= 4) return 'var(--color-success)'
    if (score >= 3) return 'var(--color-warning)'
    return 'var(--color-error)'
  }

  return (
    <div
      style={{
        padding: '1.25rem',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        background: 'white',
        transition: 'all var(--transition-fast)',
        cursor: 'pointer'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--color-primary)'
        e.currentTarget.style.boxShadow = 'var(--shadow-md)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--color-border)'
        e.currentTarget.style.boxShadow = 'none'
      }}
      onClick={onEdit}
    >
      <div style={{ display: 'flex', gap: '1rem' }}>
        {product.image_url && (
          <img
            src={product.image_url}
            alt={product.product_name}
            style={{
              width: '80px',
              height: '80px',
              objectFit: 'cover',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)'
            }}
            onError={e => {
              e.target.style.display = 'none'
            }}
          />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              margin: '0 0 0.5rem',
              fontSize: '16px',
              fontWeight: '600',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {product.product_name}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '14px' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Reklam Sayısı:</span>
              <span style={{ fontWeight: '600' }}>{product.ad_count || 0}</span>
              {product.ad_count > 30 && (
                <span
                  style={{
                    padding: '0.25rem 0.5rem',
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: 'var(--color-success)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}
                >
                  🔥 Markalaşma Sinyali
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '14px' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Potansiyel Skoru:</span>
              <span
                style={{
                  fontWeight: '700',
                  fontSize: '16px',
                  color: getScoreColor(product.potential_score)
                }}
              >
                {product.potential_score?.toFixed(1) || '0.0'}/5
              </span>
            </div>
            {product.meta_link && (
              <a
                href={product.meta_link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '12px',
                  color: 'var(--color-primary)',
                  textDecoration: 'none'
                }}
              >
                <ExternalLink size={14} />
                Meta Link
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


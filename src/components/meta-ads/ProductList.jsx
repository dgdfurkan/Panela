import { ExternalLink, User } from 'lucide-react'

export default function ProductList({ products, onEdit, currentUserId }) {
  const getScoreColor = (score) => {
    if (score >= 4) return 'var(--color-success)'
    if (score >= 3) return 'var(--color-warning)'
    return 'var(--color-error)'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {products.map(product => {
        const scores = typeof product.scores === 'string' 
          ? JSON.parse(product.scores) 
          : product.scores || {}

        return (
          <div
            key={product.id}
            style={{
              padding: '1rem',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              transition: 'all var(--transition-fast)',
              cursor: 'pointer'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--color-primary)'
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--color-border)'
              e.currentTarget.style.boxShadow = 'none'
            }}
            onClick={() => onEdit(product)}
          >
            {product.image_url && (
              <img
                src={product.image_url}
                alt={product.product_name}
                style={{
                  width: '60px',
                  height: '60px',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '15px',
                    fontWeight: '600',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1
                  }}
                >
                  {product.product_name || 'İsimsiz Ürün'}
                </h3>
                {(() => {
                  const user = product.app_users || {}
                  const isMyProduct = product.user_id === currentUserId
                  const userName = user.username || user.full_name || 'Bilinmeyen'
                  
                  if (isMyProduct) {
                    return (
                      <span style={{ fontSize: '10px', color: 'var(--color-success)', fontWeight: '600', flexShrink: 0 }}>
                        Benim
                      </span>
                    )
                  }
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '10px', color: 'var(--color-primary)', fontWeight: '600', flexShrink: 0 }}>
                      <User size={12} />
                      {userName}
                    </div>
                  )
                })()}
              </div>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                <span>Reklam: {product.ad_count || 0}</span>
                {product.ad_count > 30 && (
                  <span style={{ color: 'var(--color-success)', fontWeight: '600' }}>
                    🔥 Markalaşma Sinyali
                  </span>
                )}
                <span>Skor: <strong style={{ color: getScoreColor(product.potential_score) }}>{product.potential_score?.toFixed(1) || '0.0'}/5</strong></span>
              </div>
            </div>
            {product.meta_link && (
              <a
                href={product.meta_link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                style={{
                  padding: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-primary)',
                  transition: 'background var(--transition-fast)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <ExternalLink size={18} />
              </a>
            )}
          </div>
        )
      })}
    </div>
  )
}


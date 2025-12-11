import { ExternalLink, User, MessageSquare } from 'lucide-react'

export default function ProductCard({ product, onEdit, currentUserId, unreadCount = 0 }) {
  const scores = typeof product.scores === 'string' 
    ? JSON.parse(product.scores) 
    : product.scores || {}

  const getScoreColor = (score) => {
    if (score >= 4) return 'var(--color-success)'
    if (score >= 3) return 'var(--color-warning)'
    return 'var(--color-error)'
  }

  const user = product.app_users || {}
  const isMyProduct = product.user_id === currentUserId
  const userName = user.username || user.full_name || 'Bilinmeyen'
  const createdAt = product.created_at
    ? new Date(product.created_at).toLocaleString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : ''

  return (
    <div
      style={{
        padding: '1.25rem',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        background: 'white',
        transition: 'all var(--transition-fast)',
        cursor: 'pointer',
        position: 'relative'
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
      {unreadCount > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'var(--color-primary)',
            color: 'white',
            borderRadius: '12px',
            padding: '0.15rem 0.45rem',
            fontSize: '11px',
            fontWeight: '700',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            boxShadow: '0 2px 6px rgba(0,0,0,0.12)'
          }}
        >
          <MessageSquare size={12} />
          {unreadCount}
        </div>
      )}
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <h3
              style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: '600',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1
              }}
            >
              {product.product_name || 'İsimsiz Ürün'}
            </h3>
            {!isMyProduct && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.25rem 0.5rem',
                  background: 'rgba(139, 92, 246, 0.1)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: 'var(--color-primary)',
                  marginLeft: '0.5rem',
                  flexShrink: 0
                }}
              >
                <User size={12} />
                {userName}
              </div>
            )}
            {isMyProduct && (
              <div
                style={{
                  padding: '0.25rem 0.5rem',
                  background: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '11px',
                  fontWeight: '600',
                  color: 'var(--color-success)',
                  marginLeft: '0.5rem',
                  flexShrink: 0
                }}
              >
                Benim
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '13px', color: 'var(--color-text-muted)' }}>
              {createdAt && <span>{createdAt}</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '14px', flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Reklam Sayısı:</span>
              <span style={{ fontWeight: '600' }}>{product.ad_count ?? '-'}</span>
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
              {product.country_code && (
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', background: 'rgba(59,130,246,0.08)', padding: '0.2rem 0.4rem', borderRadius: '8px' }}>
                  {product.country_code}
                </span>
              )}
              {product.search_keyword && (
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', background: 'rgba(16,185,129,0.08)', padding: '0.2rem 0.4rem', borderRadius: '8px' }}>
                  {product.search_keyword}
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
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '12px' }}>
              {product.meta_link && (
                <a
                  href={product.meta_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-primary)', textDecoration: 'none' }}
                >
                  <ExternalLink size={14} />
                  Meta
                </a>
              )}
              {product.trendyol_link && (
                <a
                  href={product.trendyol_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-primary)', textDecoration: 'none' }}
                >
                  <ExternalLink size={14} />
                  Trendyol
                </a>
              )}
              {product.amazon_link && (
                <a
                  href={product.amazon_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-primary)', textDecoration: 'none' }}
                >
                  <ExternalLink size={14} />
                  Amazon
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


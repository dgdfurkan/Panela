import { ExternalLink, User, MessageSquare } from 'lucide-react'

export default function ProductList({ products, onEdit, currentUserId, unreadCounts = {} }) {
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
        const unread = unreadCounts[product.id] || 0
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
              cursor: 'pointer',
              position: 'relative'
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
            {unread > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: 'var(--color-primary)',
                  color: 'white',
                  borderRadius: '12px',
                  padding: '0.1rem 0.4rem',
                  fontSize: '11px',
                  fontWeight: '700',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.12)'
                }}
              >
                <MessageSquare size={12} />
                {unread}
              </div>
            )}
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
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                {createdAt && <span>{createdAt}</span>}
                <span>Reklam: {product.ad_count ?? '-'}</span>
                {product.ad_count > 30 && (
                  <span style={{ color: 'var(--color-success)', fontWeight: '600' }}>
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
                <span>Skor: <strong style={{ color: getScoreColor(product.potential_score) }}>{product.potential_score?.toFixed(1) || '0.0'}/5</strong></span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {product.meta_link && (
                <a
                  href={product.meta_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  style={{ padding: '0.35rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-sm)', color: 'var(--color-primary)', transition: 'background var(--transition-fast)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  <ExternalLink size={16} />
                </a>
              )}
              {product.trendyol_link && (
                <a
                  href={product.trendyol_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  style={{ padding: '0.35rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-sm)', color: 'var(--color-primary)', transition: 'background var(--transition-fast)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  <ExternalLink size={16} />
                </a>
              )}
              {product.amazon_link && (
                <a
                  href={product.amazon_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  style={{ padding: '0.35rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-sm)', color: 'var(--color-primary)', transition: 'background var(--transition-fast)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}


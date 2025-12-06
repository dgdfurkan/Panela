import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, ShoppingBag, CheckSquare, Map, Search } from 'lucide-react'

export default function MobileNav() {
  const { pathname } = useLocation()

  const navItems = [
    { label: 'Özet', path: '/', icon: LayoutDashboard },
    { label: 'Ürünler', path: '/products', icon: ShoppingBag },
    { label: 'İşler', path: '/todos', icon: CheckSquare },
    { label: 'Araştır', path: '/research', icon: Search },
    { label: 'Yol', path: '/roadmap', icon: Map },
  ]

  return (
    <nav className="mobile-nav glass-panel">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.path

        return (
          <Link
            key={item.path}
            to={item.path}
            className={`mobile-item ${isActive ? 'active' : ''}`}
          >
            <div className="icon-wrapper">
              <Icon size={22} />
            </div>
            <span className="label">{item.label}</span>
          </Link>
        )
      })}

      <style>{`
        .mobile-nav {
          display: none;
          position: fixed;
          bottom: 1.5rem;
          left: 50%;
          transform: translateX(-50%);
          width: 90%;
          max-width: 400px;
          border-radius: var(--radius-xl);
          padding: 0.75rem 1.5rem;
          justify-content: space-between;
          z-index: 100;
        }

        .mobile-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          color: var(--color-text-muted);
          transition: all 0.2s;
        }

        .mobile-item.active {
          color: var(--color-primary);
        }

        .mobile-item.active .icon-wrapper {
          transform: translateY(-2px);
        }
        
        .label {
          font-size: 0.7rem;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .mobile-nav {
            display: flex;
          }
        }
      `}</style>
    </nav>
  )
}

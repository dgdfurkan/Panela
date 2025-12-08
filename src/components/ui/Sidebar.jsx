import { useLocation, Link } from 'react-router-dom'
import { LayoutDashboard, ShoppingBag, CheckSquare, Map, LogOut, Search, Settings } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Sidebar() {
  const { pathname } = useLocation()
  const { signOut } = useAuth()

  const navItems = [
    { label: 'Özet', path: '/', icon: LayoutDashboard },
    { label: 'Ürünlerim', path: '/products', icon: ShoppingBag },
    { label: 'Yapılacaklar', path: '/todos', icon: CheckSquare },
    { label: 'Yol Haritası', path: '/roadmap', icon: Map },
    { label: 'Araştırma', path: '/research', icon: Search },
    { label: 'Creative Lab', path: '/creative-lab', icon: LayoutDashboard },
    { label: 'Ayarlar', path: '/settings', icon: Settings },
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Panela</h2>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.path

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="sidebar-footer">
        <button onClick={signOut} className="nav-item logout-btn">
          <LogOut size={20} />
          <span>Çıkış Yap</span>
        </button>
      </div>

      <style>{`
        .sidebar {
          width: 260px;
          height: 100vh;
          background: rgba(255, 255, 255, 0.8);
          border-right: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          position: fixed;
          left: 0;
          top: 0;
          padding: 2rem 1.5rem;
          backdrop-filter: blur(10px);
          z-index: 50;
        }

        .sidebar-header {
          margin-bottom: 3rem;
          padding-left: 0.5rem;
        }

        .sidebar-header h2 {
          font-size: 1.75rem;
          font-weight: 800;
          letter-spacing: -0.5px;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.875rem 1rem;
          border-radius: var(--radius-md);
          color: var(--color-text-muted);
          font-weight: 500;
          transition: all 0.2s;
        }

        .nav-item:hover {
          background: rgba(139, 92, 246, 0.05);
          color: var(--color-primary);
        }

        .nav-item.active {
          background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
          color: white;
          box-shadow: var(--shadow-sm);
        }

        .logout-btn {
          color: var(--color-error);
          width: 100%;
        }
        
        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.05);
          color: var(--color-error);
        }

        @media (max-width: 768px) {
          .sidebar {
            display: none;
          }
        }
      `}</style>
    </aside>
  )
}

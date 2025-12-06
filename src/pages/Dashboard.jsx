
import { useEffect, useState } from 'react'
import { Sparkles, TrendingUp, CheckCircle, Package } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    products: 0,
    todos: 0,
    completedTodos: 0,
    roadmapStep: 'Başlangıç'
  })

  // Mocking stats for now if DB is empty or connection fails
  useEffect(() => {
    // In a real scenario, we would fetch counts here
    // const fetchStats = async () => { ... }
    // fetchStats()

    // Using dummy data for immediate visual feedback
    const fetchStats = async () => {
      try {
        // Products Count
        const { count: productsCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })

        // Todos Count
        const { count: todosCount } = await supabase
          .from('todos')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'Todo')

        const { count: completedCount } = await supabase
          .from('todos')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'Done')

        // Active Roadmap Step (first not completed)
        const { data: step } = await supabase
          .from('roadmap_steps')
          .select('title')
          .neq('status', 'Completed')
          .order('sort_order', { ascending: true })
          .limit(1)
          .single()

        setStats({
          products: productsCount || 0,
          todos: todosCount || 0,
          completedTodos: completedCount || 0,
          roadmapStep: step?.title || 'Tümü Tamamlandı! 🎉'
        })
      } catch (error) {
        console.error('Error loading stats:', error)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="dashboard fade-in">
      <header className="page-header">
        <div>
          <h1 className="welcome-text">Hoşgeldin, <span className="font-bold">{user?.username || 'Girişimci'}</span> 👋</h1>
          <p className="subtitle">Bugün e-ticaret imparatorluğun için neler yapıyoruz?</p>
        </div>
        <div className="date-badge">
          {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </header>

      <div className="stats-grid">
        {/* Active Roadmap Step Widget */}
        <div className="widget highlight-widget">
          <div className="widget-header">
            <Sparkles className="icon-pulse" />
            <h3>Aktif Hedef</h3>
          </div>
          <p className="widget-value">{stats.roadmapStep}</p>
          <p className="widget-desc">Bu adımda derinlemesine araştırma yap.</p>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '35%' }}></div>
          </div>
        </div>

        {/* Product Stats */}
        <div className="widget glass-panel">
          <div className="widget-icon bg-blue">
            <Package size={24} color="#3B82F6" />
          </div>
          <div className="widget-info">
            <p className="label">Keşfedilen Ürünler</p>
            <p className="value">{stats.products}</p>
          </div>
        </div>

        {/* Todo Stats */}
        <div className="widget glass-panel">
          <div className="widget-icon bg-green">
            <CheckCircle size={24} color="#10B981" />
          </div>
          <div className="widget-info">
            <p className="label">Mevcut Görevler</p>
            <p className="value">{stats.todos} <span className="sub-value">({stats.completedTodos} tamamlandı)</span></p>
          </div>
        </div>
      </div>

      <div className="recent-activity-section">
        <h3 className="section-title"> <TrendingUp size={20} /> Son Hareketler</h3>
        <div className="glass-panel activity-list">
          <p className="empty-state">Henüz bir aktivite yok. Bir ürün ekleyerek başla!</p>
        </div>
      </div>

      <style>{`
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 2.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        
        .welcome-text {
          font-size: 2rem;
          font-weight: 700;
          color: var(--color-text-main);
          margin-bottom: 0.5rem;
        }

        .subtitle {
          color: var(--color-text-muted);
        }

        .date-badge {
          background: white;
          padding: 0.5rem 1rem;
          border-radius: var(--radius-lg);
          font-weight: 600;
          color: var(--color-primary);
          box-shadow: var(--shadow-sm);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .widget {
          padding: 1.5rem;
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
        }

        .highlight-widget {
          background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
          color: white;
          grid-row: span 1;
        }

        .highlight-widget .widget-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
          font-weight: 500;
          opacity: 0.9;
        }

        .widget-value {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }

        .widget-desc {
          font-size: 0.9rem;
          opacity: 0.8;
          margin-bottom: 1rem;
        }

        .progress-bar {
          height: 6px;
          background: rgba(255,255,255,0.2);
          border-radius: 10px;
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          background: white;
        }

        .glass-panel .widget-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
        }
        
        .bg-blue { background: rgba(59, 130, 246, 0.1); }
        .bg-green { background: rgba(16, 185, 129, 0.1); }

        .widget-info .label {
          color: var(--color-text-muted);
          font-size: 0.9rem;
          margin-bottom: 0.25rem;
        }
        
        .widget-info .value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--color-text-main);
        }

        .sub-value {
          font-size: 0.9rem;
          color: var(--color-success);
          font-weight: 500;
        }

        .section-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--color-text-main);
        }

        .activity-list {
          padding: 2rem;
          text-align: center;
          border-radius: var(--radius-lg);
        }

        .empty-state {
          color: var(--color-text-muted);
        }
        
        .icon-pulse {
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }

        @media (max-width: 1024px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}


import { Outlet } from 'react-router-dom'
import Sidebar from '../components/ui/Sidebar'
import MobileNav from '../components/ui/MobileNav'

export default function DashboardLayout() {
    return (
        <div className="layout">
            {/* Desktop Sidebar */}
            <Sidebar />

            <main className="main-content">
                <div className="content-container">
                    <Outlet />
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <MobileNav />

            <style>{`
        .layout {
          min-height: 100vh;
          background: var(--color-background);
        }

        .main-content {
          margin-left: 260px; /* Sidebar width */
          min-height: 100vh;
          padding: 2rem;
          transition: margin 0.3s;
        }

        .content-container {
          max-width: 1200px;
          margin: 0 auto;
          padding-bottom: 5rem; /* Space for mobile nav */
        }

        @media (max-width: 768px) {
          .main-content {
            margin-left: 0;
            padding: 1.5rem 1rem;
          }
        }
      `}</style>
        </div>
    )
}

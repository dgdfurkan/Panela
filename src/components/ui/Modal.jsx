import { X } from 'lucide-react'

export default function Modal({ title, isOpen, onClose, children }) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay fade-in">
      <div className="modal-content glass-panel">
        <div className="modal-header">
          <h3>{title}</h3>
          <button onClick={onClose} className="close-btn">
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(15, 23, 42, 0.6); /* Slightly darker, premium tint */
          backdrop-filter: blur(12px); /* Strong blur */
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: fadeIn 0.3s ease-out;
        }

        .modal-content {
          width: 90%;
          max-width: 500px;
          background: white;
          border-radius: var(--radius-xl);
          max-height: 85vh; /* Prevent overflow */
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          border: 1px solid rgba(255, 255, 255, 0.5);
        }

        @keyframes slideUp {
          from { transform: translateY(40px) scale(0.95); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }

        .modal-header {
          padding: 1.5rem 2rem;
          border-bottom: 1px solid var(--color-border);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(250, 250, 250, 0.8);
          border-radius: var(--radius-xl) var(--radius-xl) 0 0;
        }

        .modal-header h3 {
          font-size: 1.4rem;
          font-weight: 700;
          background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .close-btn {
          color: var(--color-text-muted);
          padding: 0.5rem;
          border-radius: 50%;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-btn:hover {
          background: rgba(239, 68, 68, 0.1);
          color: var(--color-error);
          transform: rotate(90deg);
        }

        .modal-body {
          padding: 2rem;
          overflow-y: auto;
          /* Custom scrollbar */
          scrollbar-width: thin;
          scrollbar-color: var(--color-border) transparent;
        }
      `}</style>
    </div>
  )
}

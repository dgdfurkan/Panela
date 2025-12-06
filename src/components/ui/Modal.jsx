import { X } from 'lucide-react'

export default function Modal({ title, isOpen, onClose, children }) {
  if (!isOpen) return null

  return (
    <div className="modal-container">
      <div className="modal-content">
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
        .modal-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.2); /* Subtle dim */
          backdrop-filter: blur(8px); /* Premium blur */
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: fadeIn 0.3s ease-out;
        }

        .modal-content {
          width: 90%;
          max-width: 500px;
          border-radius: var(--radius-xl);
          max-height: 85vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 80px -12px rgba(0, 0, 0, 0.4); /* Deep, premium shadow */
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          background: rgba(255, 255, 255, 0.95); /* Slightly more opaque for readability */
        }

        @keyframes slideUp {
          from { transform: translateY(20px) scale(0.98); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }

        .modal-header {
          padding: 1.5rem 2rem;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05); /* Softer border */
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h3 {
          font-size: 1.5rem; /* Clean, not shouting */
          font-weight: 700;
          color: var(--color-text-main);
          letter-spacing: -0.02em;
        }

        .close-btn {
          color: var(--color-text-muted);
          padding: 0.5rem;
          border-radius: 50%;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          background: rgba(0,0,0,0.03);
        }

        .close-btn:hover {
          background: rgba(239, 68, 68, 0.1);
          color: var(--color-error);
          transform: rotate(90deg);
        }

        .modal-body {
          padding: 2rem;
          overflow-y: auto;
          scrollbar-width: thin;
        }
      `}</style>
    </div>
  )
}

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
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .modal-content {
          width: 100%;
          max-width: 500px;
          background: white;
          border-radius: var(--radius-lg);
          max-height: 90vh;
          display: flex;
          flex-direction: column;
        }

        .modal-header {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--color-border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--color-text-main);
        }

        .close-btn {
          color: var(--color-text-muted);
          padding: 0.25rem;
          border-radius: var(--radius-sm);
          transition: all 0.2s;
        }

        .close-btn:hover {
          background: rgba(0,0,0,0.05);
          color: var(--color-error);
        }

        .modal-body {
          padding: 1.5rem;
          overflow-y: auto;
        }
      `}</style>
        </div>
    )
}

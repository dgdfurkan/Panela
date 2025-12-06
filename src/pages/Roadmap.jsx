
import { useEffect, useState } from 'react'
import { Check, ChevronDown, ChevronUp, BookOpen, Save } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

export default function Roadmap() {
    const [steps, setSteps] = useState([])
    const [loading, setLoading] = useState(true)
    const [expandedId, setExpandedId] = useState(null)

    // To handle auto-saving or manual saving of research notes
    const [noteEdits, setNoteEdits] = useState({})

    useEffect(() => {
        fetchSteps()
    }, [])

    const fetchSteps = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('roadmap_steps')
                .select('*')
                .order('sort_order', { ascending: true })

            if (error) throw error
            setSteps(data)
        } catch (error) {
            console.error('Error fetching roadmap:', error.message)
        } finally {
            setLoading(false)
        }
    }

    const toggleStep = (id) => {
        setExpandedId(expandedId === id ? null : id)
    }

    const updateStatus = async (id, currentStatus) => {
        // Cycle: Not Started -> Learning -> Completed -> Not Started
        const statusMap = {
            'Not Started': 'Learning',
            'Learning': 'Completed',
            'Completed': 'Not Started'
        }
        const newStatus = statusMap[currentStatus] || 'Not Started'

        setSteps(steps.map(s => s.id === id ? { ...s, status: newStatus } : s))
        await supabase.from('roadmap_steps').update({ status: newStatus }).eq('id', id)
    }

    const saveNote = async (id) => {
        const note = noteEdits[id]
        if (note === undefined) return // No changes

        try {
            await supabase.from('roadmap_steps').update({ research_notes: note }).eq('id', id)
            // Update local state to reflect saved
            setSteps(steps.map(s => s.id === id ? { ...s, research_notes: note } : s))
            alert('Not kaydedildi!')
        } catch (error) {
            console.error('Save error:', error)
        }
    }

    const handleNoteChange = (id, value) => {
        setNoteEdits({ ...noteEdits, [id]: value })
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return 'var(--color-success)';
            case 'Learning': return 'var(--color-primary)';
            default: return 'var(--color-text-muted)';
        }
    }

    return (
        <div className="page-container fade-in">
            <div className="page-header">
                <div>
                    <h1 className="text-2xl font-bold">Yol Haritası</h1>
                    <p className="text-muted">E-ticaret başarısı için adım adım rehber.</p>
                </div>
            </div>

            <div className="roadmap-container">
                {steps.map((step, index) => {
                    const isExpanded = expandedId === step.id
                    const statusColor = getStatusColor(step.status)

                    return (
                        <div key={step.id} className={`roadmap-step ${step.status === 'Completed' ? 'completed' : ''}`}>
                            <div className="step-connector">
                                <div className="step-number" style={{ borderColor: statusColor, color: statusColor }}>
                                    {step.status === 'Completed' ? <Check size={16} /> : index + 1}
                                </div>
                                {index !== steps.length - 1 && <div className="step-line"></div>}
                            </div>

                            <div className="step-content glass-panel">
                                <div className="step-header" onClick={() => toggleStep(step.id)}>
                                    <div className="header-info">
                                        <h3 className={step.status === 'Completed' ? 'text-muted' : ''}>{step.title}</h3>
                                        <span
                                            className="status-badge"
                                            style={{
                                                background: step.status === 'Not Started' ? 'var(--color-border)' : statusColor,
                                                opacity: 0.8
                                            }}
                                            onClick={(e) => { e.stopPropagation(); updateStatus(step.id, step.status); }}
                                        >
                                            {step.status === 'Not Started' && 'Başlanmadı'}
                                            {step.status === 'Learning' && 'Araştırılıyor'}
                                            {step.status === 'Completed' && 'Tamamlandı'}
                                        </span>
                                    </div>
                                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </div>

                                {isExpanded && (
                                    <div className="step-body fade-in">
                                        <p className="step-desc">{step.description}</p>

                                        <div className="research-box">
                                            <div className="research-header">
                                                <BookOpen size={16} />
                                                <span>Araştırma & Notlar</span>
                                            </div>
                                            <textarea
                                                className="research-input"
                                                placeholder="Bu adım ile ilgili öğrendiklerini buraya not al..."
                                                value={noteEdits[step.id] !== undefined ? noteEdits[step.id] : (step.research_notes || '')}
                                                onChange={(e) => handleNoteChange(step.id, e.target.value)}
                                            />
                                            <div className="action-row">
                                                <button onClick={() => saveNote(step.id)} className="save-btn">
                                                    <Save size={16} /> Kaydet
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            <style>{`
        .roadmap-container {
          display: flex;
          flex-direction: column;
          gap: 0;
          max-width: 800px;
          margin: 0 auto;
        }

        .roadmap-step {
          display: flex;
          gap: 1.5rem;
        }

        .step-connector {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 40px;
        }

        .step-number {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 2px solid var(--color-border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          background: var(--color-background);
          z-index: 2;
          transition: all 0.3s;
        }

        .step-line {
          width: 2px;
          flex: 1;
          background: var(--color-border);
          margin-top: -2px;
          margin-bottom: -2px;
        }

        .step-content {
          flex: 1;
          margin-bottom: 2rem;
          border-radius: var(--radius-lg);
          overflow: hidden;
          transition: all 0.3s;
        }
        
        .step-content:hover {
          box-shadow: var(--shadow-lg);
        }

        .step-header {
          padding: 1.25rem 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          background: rgba(255,255,255,0.5);
        }
        
        .header-info {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .header-info h3 {
          font-weight: 700;
          font-size: 1.1rem;
        }

        .status-badge {
          font-size: 0.75rem;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s;
        }
        
        .status-badge:hover { transform: scale(1.05); }

        .step-body {
          padding: 1.5rem;
          background: white;
          border-top: 1px solid var(--color-border);
        }

        .step-desc {
          margin-bottom: 1.5rem;
          color: var(--color-text-muted);
          line-height: 1.6;
        }

        .research-box {
          background: var(--color-background);
          border-radius: var(--radius-md);
          padding: 1rem;
          border: 1px solid var(--color-border);
        }

        .research-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--color-primary);
        }

        .research-input {
          width: 100%;
          min-height: 100px;
          padding: 0.75rem;
          border-radius: var(--radius-sm);
          border: 1px solid var(--color-border);
          resize: vertical;
          font-size: 0.95rem;
          margin-bottom: 0.5rem;
        }
        
        .research-input:focus { border-color: var(--color-primary); outline: none; }

        .action-row {
          display: flex;
          justify-content: flex-end;
        }

        .save-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: var(--color-primary);
          color: white;
          border-radius: var(--radius-sm);
          font-size: 0.85rem;
          font-weight: 600;
          transition: opacity 0.2s;
        }
        
        .save-btn:hover { opacity: 0.9; }

        .page-header { margin-bottom: 2.5rem; }
      `}</style>
        </div>
    )
}

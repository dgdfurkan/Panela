import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, ArrowRight, CheckCircle2, Clock } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function CurrentTasksWidget() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (user) fetchTasks()
    }, [user])

    const fetchTasks = async () => {
        try {
            const { data, error } = await supabase
                .from('todos')
                .select('*')
                .neq('status', 'Done') // Only active tasks
                .order('due_date', { ascending: true }) // Urgent first
                .limit(3)

            if (error) throw error
            setTasks(data || [])
        } catch (error) {
            console.error('Error fetching dashboard tasks:', error)
        } finally {
            setLoading(false)
        }
    }

    const getTagColor = (tag) => {
        switch (tag) {
            case 'Tasarım': return 'bg-purple-100 text-purple-700'
            case 'Yazılım': return 'bg-blue-100 text-blue-700'
            case 'Pazarlama': return 'bg-orange-100 text-orange-700'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'Tarih yok'
        return new Date(dateString).toLocaleDateString('tr-TR', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (loading) {
        return (
            <div className="glass-panel widget-container animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                    <div className="h-16 bg-gray-100 rounded-lg"></div>
                    <div className="h-16 bg-gray-100 rounded-lg"></div>
                    <div className="h-16 bg-gray-100 rounded-lg"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="glass-panel widget-container">
            <div className="widget-header">
                <h3><Clock size={20} className="text-primary" /> Yaklaşan Görevler</h3>
                <button onClick={() => navigate('/todos')} className="view-all-btn">
                    Tümü <ArrowRight size={14} />
                </button>
            </div>

            <div className="tasks-list">
                {tasks.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon-bg">
                            <CheckCircle2 size={32} className="text-success" />
                        </div>
                        <p className="empty-title">Harika!</p>
                        <p className="empty-desc">Şu an acil bir görevin yok. Kahve molası? ☕</p>
                    </div>
                ) : (
                    tasks.map(task => (
                        <div key={task.id} className="task-item" onClick={() => navigate('/todos')}>
                            <div className="task-content">
                                <h4 className="task-title">{task.title}</h4>
                                <div className="task-meta">
                                    <span className={`task-tag ${getTagColor(task.tags?.[0])}`}>
                                        {task.tags?.[0] || 'Genel'}
                                    </span>
                                    <span className="task-date">
                                        <Calendar size={12} />
                                        {formatDate(task.due_date)}
                                    </span>
                                </div>
                            </div>
                            <div className="task-action">
                                <div className="status-indicator"></div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <style>{`
                .widget-container {
                    padding: 1.5rem;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                }

                .widget-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }

                .widget-header h3 {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: var(--color-text-main);
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .view-all-btn {
                    font-size: 0.85rem;
                    color: var(--color-primary);
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                    padding: 0.25rem 0.5rem;
                    border-radius: 6px;
                    transition: all 0.2s;
                }

                .view-all-btn:hover {
                    background: rgba(var(--color-primary-rgb), 0.1);
                }

                .tasks-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    flex: 1;
                }

                .task-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0.75rem 1rem;
                    background: rgba(255, 255, 255, 0.5);
                    border: 1px solid rgba(0, 0, 0, 0.05);
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                }

                .task-item:hover {
                    transform: translateY(-2px);
                    background: white;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                    border-color: rgba(var(--color-primary-rgb), 0.2);
                }

                .task-title {
                    font-size: 0.95rem;
                    font-weight: 600;
                    color: var(--color-text-main);
                    margin-bottom: 0.35rem;
                    line-height: 1.3;
                    display: -webkit-box;
                    -webkit-line-clamp: 1;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .task-meta {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .task-tag {
                    font-size: 0.7rem;
                    padding: 2px 8px;
                    border-radius: 10px;
                    font-weight: 600;
                    letter-spacing: 0.02em;
                }

                /* Setup Tailwind-like colors manually since we don't have full tailwind */
                .bg-purple-100 { background: #F3E8FF; }
                .text-purple-700 { color: #7E22CE; }
                .bg-blue-100 { background: #DBEAFE; }
                .text-blue-700 { color: #1D4ED8; }
                .bg-orange-100 { background: #FFEDD5; }
                .text-orange-700 { color: #C2410C; }
                .bg-gray-100 { background: #F3F4F6; }
                .text-gray-700 { color: #374151; }

                .task-date {
                    font-size: 0.75rem;
                    color: var(--color-text-muted);
                    display: flex;
                    align-items: center;
                    gap: 0.25rem;
                }

                .empty-state {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 2rem 1rem;
                    text-align: center;
                    background: rgba(255,255,255,0.3);
                    border-radius: 16px;
                    border: 2px dashed rgba(0,0,0,0.05);
                }

                .empty-icon-bg {
                    width: 56px;
                    height: 56px;
                    border-radius: 50%;
                    background: rgba(16, 185, 129, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 1rem;
                }

                .empty-title {
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: var(--color-text-main);
                    margin-bottom: 0.25rem;
                }

                .empty-desc {
                    font-size: 0.9rem;
                    color: var(--color-text-muted);
                }
            `}</style>
        </div>
    )
}

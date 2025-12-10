import { useEffect, useMemo, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, ArrowRight, CheckCircle2, Clock } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function CurrentTasksWidget() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [tasks, setTasks] = useState([])
    const [settings, setSettings] = useState({
        tasks_view_mode: 'latest',
        tasks_count: 3,
        tasks_animation_duration: 5,
        tasks_status_filters: ['Todo', 'In Progress', 'Review']
    })
    const [loading, setLoading] = useState(true)
    const intervalRef = useRef(null)
    const [startIndex, setStartIndex] = useState(0)

    useEffect(() => {
        if (user) {
            fetchSettingsAndTasks()
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [user])

    useEffect(() => {
        if (settings.tasks_view_mode === 'loop') {
            setupLoopInterval(tasks.length)
        } else if (intervalRef.current) {
            clearInterval(intervalRef.current)
        }
    }, [settings, tasks])

    const setupLoopInterval = (length) => {
        if (intervalRef.current) clearInterval(intervalRef.current)
        const showCount = settings.tasks_count || 3
        if (length <= showCount) return
        const durationMs = (settings.tasks_animation_duration || 5) * 1000
        intervalRef.current = setInterval(() => {
            setStartIndex((prev) => (prev + showCount) % length)
        }, durationMs)
    }

    const fetchSettingsAndTasks = async () => {
        try {
            // Load user settings
            const { data: userSettings } = await supabase
                .from('user_settings')
                .select('tasks_view_mode, tasks_count, tasks_animation_duration, tasks_status_filters')
                .eq('user_id', user.id)
                .maybeSingle()

            const mergedSettings = {
                tasks_view_mode: userSettings?.tasks_view_mode || 'latest',
                tasks_count: userSettings?.tasks_count || 3,
                tasks_animation_duration: userSettings?.tasks_animation_duration || 5,
                tasks_status_filters: userSettings?.tasks_status_filters?.length
                    ? userSettings.tasks_status_filters
                    : ['Todo', 'In Progress', 'Review']
            }
            setSettings(mergedSettings)

            const activeStatuses = mergedSettings.tasks_status_filters?.length
                ? mergedSettings.tasks_status_filters
                : ['Todo', 'In Progress', 'Review']

            // Fetch tasks according to mode
            const baseQuery = supabase
                .from('todos')
                .select('*')
                .in('status', activeStatuses)

            if (mergedSettings.tasks_view_mode === 'latest' || mergedSettings.tasks_view_mode === 'loop') {
                const { data, error } = await baseQuery
                    .order('created_at', { ascending: false })
                    .limit(Math.max(mergedSettings.tasks_count || 3, 10))
                if (error) throw error
                setTasks(prioritySorted(data || [], mergedSettings.tasks_count))
            } else {
                // random
                const { data, error } = await baseQuery
                    .order('created_at', { ascending: false })
                    .limit(Math.max((mergedSettings.tasks_count || 3) * 3, 15))
                if (error) throw error
                const shuffled = shuffleArray(data || [])
                setTasks(prioritySorted(shuffled, mergedSettings.tasks_count))
            }
        } catch (error) {
            console.error('Error fetching dashboard tasks:', error)
        } finally {
            setLoading(false)
        }
    }

    const prioritySorted = (list, takeCount = 3) => {
        const priorities = { 'Todo': 1, 'In Progress': 2, 'Review': 3 }
        const sorted = [...list].sort((a, b) => {
            const pa = priorities[a.status] || 99
            const pb = priorities[b.status] || 99
            if (pa !== pb) return pa - pb
            return new Date(a.created_at) - new Date(b.created_at)
        })
        return sorted.slice(0, takeCount || 3)
    }

    const shuffleArray = (arr) => {
        const copy = [...arr]
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[copy[i], copy[j]] = [copy[j], copy[i]]
        }
        return copy
    }

    const getTagColor = (tag) => {
        switch (tag) {
            case 'Tasarım': return 'bg-purple-100 text-purple-700'
            case 'Yazılım': return 'bg-blue-100 text-blue-700'
            case 'Pazarlama': return 'bg-orange-100 text-orange-700'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'Todo': return '#f59e0b' // amber
            case 'In Progress': return '#3b82f6' // blue
            case 'Review': return '#a855f7' // purple
            default: return '#cbd5e1'
        }
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'Tarih yok'
        return new Date(dateString).toLocaleString('tr-TR', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        })
    }

    const visibleTasks = useMemo(() => {
        const count = settings.tasks_count || 3
        if (settings.tasks_view_mode === 'loop' && tasks.length > count) {
            const items = []
            for (let i = 0; i < count; i++) {
                items.push(tasks[(startIndex + i) % tasks.length])
            }
            return items
        }
        return tasks.slice(0, count)
    }, [tasks, settings, startIndex])

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
                {visibleTasks.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon-bg">
                            <CheckCircle2 size={32} className="text-success" />
                        </div>
                        <p className="empty-title">Harika!</p>
                        <p className="empty-desc">Şu an acil bir görevin yok. Kahve molası? ☕</p>
                    </div>
                ) : (
                    visibleTasks.map(task => (
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
                                <div className="status-indicator" style={{ background: getStatusColor(task.status) }}></div>
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

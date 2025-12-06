
import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/ui/Modal'
import KanbanBoard from '../components/KanbanBoard'
import ActivityLogModal from '../components/ActivityLogModal'

export default function Todos() {
    const [todos, setTodos] = useState([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false)
    const [users, setUsers] = useState({}) // id -> username map
    const [activities, setActivities] = useState([])
    const [formData, setFormData] = useState({
        id: null,
        title: '',
        priority: 'Medium',
        due_date: '',
        tags: '' // comma separated string for input
    })

    useEffect(() => {
        fetchTodos()
        fetchActivities()
    }, [])

    const fetchActivities = async () => {
        const { data } = await supabase
            .from('todo_activities')
            .select(`
                *,
                app_users (
                    username
                )
            `)
            .order('created_at', { ascending: false })
            .limit(20)

        if (data) setActivities(data)
    }

    const logActivity = async (actionType, details, todoId) => {
        if (!user?.id) return

        await supabase.from('todo_activities').insert([{
            todo_id: todoId,
            user_id: user.id,
            action_type: actionType,
            details: details
        }])
        fetchActivities()
    }

    const fetchTodos = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('todos')
                .select('*')
                .order('due_date', { ascending: true })

            if (error) throw error
            setTodos(data)
        } catch (error) {
            console.error('Error fetching todos:', error.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const fetchUsers = async () => {
            const { data } = await supabase.from('app_users').select('id, username')
            if (data) {
                const map = data.reduce((acc, u) => ({ ...acc, [u.id]: u.username }), {})
                setUsers(map)
            }
        }
        fetchUsers()
    }, [])
    const { user } = useAuth()

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            if (!user || !user.id) throw new Error('Oturum kapalı.')

            if (!user || !user.id) throw new Error('Oturum kapalı.')

            // Tag is now a single selection from dropdown, but backend expects array
            const tagsArray = formData.tags ? [formData.tags] : ['Genel']

            const payload = {
                title: formData.title,
                priority: 'Medium', // Default priority since we removed the input
                due_date: formData.due_date,
                tags: tagsArray,
                created_by: user.id
            }

            if (formData.id) {
                // Update
                const { error } = await supabase
                    .from('todos')
                    .update({
                        title: payload.title,
                        priority: payload.priority,
                        due_date: payload.due_date,
                        tags: payload.tags
                    })
                if (error) throw error
                logActivity('UPDATE', 'görevi güncelledi', formData.id)
            } else {
                // Insert
                const { data, error } = await supabase.from('todos').insert([payload]).select()
                if (error) throw error
                if (data && data[0]) {
                    logActivity('CREATE', 'yeni görev ekledi', data[0].id)
                }
            }

            setIsModalOpen(false)
            fetchTodos()
            resetForm()
        } catch (error) {
            alert(error.message)
        }
    }

    const resetForm = () => {
        const now = new Date()
        const pad = (n) => n.toString().padStart(2, '0')
        // Default to next hour or current time local
        const localNowString = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`

        setFormData({
            id: null,
            title: '',
            priority: 'Medium',
            due_date: localNowString,
            tags: 'Genel'
        })
    }

    const handleEdit = (todo) => {
        // Date formatting fix: Convert UTC db date to Local 'YYYY-MM-DDTHH:mm' string
        let localDateString = ''
        if (todo.due_date) {
            const d = new Date(todo.due_date)
            // Manual format: YYYY-MM-DDTHH:mm (local)
            const pad = (n) => n.toString().padStart(2, '0')
            localDateString = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
        }

        setFormData({
            id: todo.id,
            title: todo.title,
            priority: todo.priority,
            due_date: localDateString,
            tags: todo.tags && todo.tags.length > 0 ? todo.tags[0] : 'Genel'
        })
        setIsModalOpen(true)
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Görevi silmek istiyor musun?')) return
        const todoToDelete = todos.find(t => t.id === id)
        const { error } = await supabase.from('todos').delete().eq('id', id)
        if (error) {
            console.error('Error deleting:', error)
            alert('Silinirken hata oluştu.')
        } else {
            setTodos(todos.filter(t => t.id !== id))
            if (todoToDelete) {
                logActivity('DELETE', todoToDelete.title, null)
            }
        }
    }

    const handleStatusChange = async (id, newStatus) => {
        // Optimistic update
        setTodos(todos.map(t => t.id === id ? { ...t, status: newStatus } : t))

        const { error } = await supabase
            .from('todos')
            .update({ status: newStatus })
            .eq('id', id)

        if (error) {
            console.error('Error updating status:', error)
            fetchTodos() // Revert
        } else {
            logActivity('MOVE', newStatus === 'Todo' ? 'Yapılacaklar' :
                newStatus === 'In Progress' ? 'Devam Edenler' :
                    newStatus === 'Review' ? 'Kontrol' : 'Tamamlandı', id)
        }
    }

    return (
        <div className="page-container fade-in" style={{ padding: 0, maxWidth: '100%', margin: 0 }}>
            {/* Header and filters removed as they are part of Kanban layout now, or optional */}
            {/* Keeping the Create Button available via Kanban "Add" button or Floating Action Button if needed, 
                but for now we rely on the Modal state which is passed down or controlled here.
                The Kanban layout has its own "Add" buttons usually, but we'll reuse the Modal.
            */}

            <div style={{ padding: '0 2rem' }}>
                <div className="page-header">
                    <div></div>
                    <button onClick={() => { resetForm(); setIsModalOpen(true) }} className="btn-primary">
                        <Plus size={18} />
                        <span>Yeni Görev</span>
                    </button>
                </div>
            </div>

            <KanbanBoard
                todos={todos}
                onStatusChange={handleStatusChange}
                onEdit={handleEdit}
                onDelete={handleDelete}
                users={users}
                activities={activities}
                onOpenActivityModal={() => setIsActivityModalOpen(true)}
            />

            <ActivityLogModal
                isOpen={isActivityModalOpen}
                onClose={() => setIsActivityModalOpen(false)}
                activities={activities}
            />

            <Modal title={formData.id ? "Görevi Düzenle" : "Yeni Görev Ekle"} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    <div className="form-group">
                        <label style={{
                            display: 'block',
                            fontSize: '12px',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            color: '#64748b',
                            marginBottom: '0.5rem'
                        }}>
                            GÖREV BAŞLIĞI
                        </label>
                        <input
                            required
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Örn: Muhasebeciyle görüşme ayarla..."
                            style={{
                                width: '100%',
                                padding: '0.8rem 1rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid #e2e8f0',
                                fontSize: '15px',
                                outline: 'none',
                                transition: 'border-color 0.2s',
                                background: '#f8fafc'
                            }}
                            onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label style={{
                                display: 'block',
                                fontSize: '12px',
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                color: '#64748b',
                                marginBottom: '0.5rem'
                            }}>
                                SON TARİH
                            </label>
                            <input
                                type="datetime-local"
                                required
                                value={formData.due_date}
                                onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '0.8rem 1rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '14px',
                                    outline: 'none',
                                    background: '#f8fafc'
                                }}
                            />
                        </div>

                        <div className="form-group">
                            <label style={{
                                display: 'block',
                                fontSize: '12px',
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                color: '#64748b',
                                marginBottom: '0.5rem'
                            }}>
                                ETİKET
                            </label>
                            <select
                                value={formData.tags}
                                onChange={e => setFormData({ ...formData, tags: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '0.8rem 1rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '14px',
                                    outline: 'none',
                                    background: '#f8fafc',
                                    appearance: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                <option value="Genel">Genel</option>
                                <option value="Tasarım">Tasarım</option>
                                <option value="Yazılım">Yazılım</option>
                                <option value="Pazarlama">Pazarlama</option>
                            </select>
                        </div>
                    </div>

                    {/* Old Tags Input Removed as requested we use the selector above */}

                    <button
                        type="submit"
                        style={{
                            marginTop: '1rem',
                            padding: '1rem',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--color-primary)',
                            color: 'white',
                            border: 'none',
                            fontSize: '15px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'transform 0.1s',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                        }}
                        className="btn-primary full-width"
                        onMouseDown={e => e.target.style.transform = 'scale(0.98)'}
                        onMouseUp={e => e.target.style.transform = 'scale(1)'}
                    >
                        {formData.id ? "Değişiklikleri Kaydet" : "Görevi Oluştur"}
                    </button>
                </form>
            </Modal>
        </div>
    )
}

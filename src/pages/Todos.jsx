
import { useEffect, useState, useRef } from 'react'
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
    const [isDraftsModalOpen, setIsDraftsModalOpen] = useState(false)
    const [users, setUsers] = useState({}) // id -> username map
    const [activities, setActivities] = useState([])
    const [draftFilters, setDraftFilters] = useState({
        search: '',
        createdBy: '',
        dateFrom: '',
        dateTo: '',
        tag: ''
    })
    const titleTextareaRef = useRef(null)
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
        try {
            if (!user?.id) return

            const { error } = await supabase.from('todo_activities').insert([{
                todo_id: todoId,
                user_id: user.id,
                action_type: actionType,
                details: details
            }])

            if (error) {
                // Ignore RLS/unauthorized silently to avoid noise
                if (error.code === '42501' || error.code === '401') {
                    console.debug('Activity log skipped (RLS/unauthorized).')
                    return
                }
                throw error
            }
            fetchActivities()
        } catch (error) {
            console.error('Activity logging failed (safe to ignore if RLS not set):', error)
        }
    }

    const fetchTodos = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('todos')
                .select('*')
                .order('due_date', { ascending: true })

            if (error) throw error
            
            // Auto-move Done tasks older than 1 day to Draft
            const now = new Date()
            const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
            const doneTasksToMove = data.filter(t => 
                t.status === 'Done' && 
                t.completed_at && 
                new Date(t.completed_at) < oneDayAgo
            )
            
            if (doneTasksToMove.length > 0) {
                const idsToMove = doneTasksToMove.map(t => t.id)
                await supabase
                    .from('todos')
                    .update({ status: 'Draft' })
                    .in('id', idsToMove)
                
                // Update local state
                const updatedData = data.map(t => 
                    idsToMove.includes(t.id) ? { ...t, status: 'Draft' } : t
                )
                setTodos(updatedData)
            } else {
                setTodos(data)
            }
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
                    .eq('id', formData.id)
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
        
        // Auto-resize textarea after modal opens
        setTimeout(() => {
            if (titleTextareaRef.current) {
                titleTextareaRef.current.style.height = 'auto'
                titleTextareaRef.current.style.height = `${titleTextareaRef.current.scrollHeight}px`
            }
        }, 100)
    }
    
    const handleTitleChange = (e) => {
        setFormData({ ...formData, title: e.target.value })
        // Auto-resize
        if (titleTextareaRef.current) {
            titleTextareaRef.current.style.height = 'auto'
            titleTextareaRef.current.style.height = `${titleTextareaRef.current.scrollHeight}px`
        }
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

        // Set completed_at when status changes to 'Done', clear it otherwise
        const updateData = { status: newStatus }
        if (newStatus === 'Done') {
            updateData.completed_at = new Date().toISOString()
        } else {
            updateData.completed_at = null
        }

        const { error } = await supabase
            .from('todos')
            .update(updateData)
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

            <KanbanBoard
                todos={todos}
                onStatusChange={handleStatusChange}
                onEdit={handleEdit}
                onDelete={handleDelete}
                users={users}
                activities={activities}
                onOpenActivityModal={() => setIsActivityModalOpen(true)}
                onCreate={() => { resetForm(); setIsModalOpen(true) }}
                onOpenDraftsModal={() => setIsDraftsModalOpen(true)}
            />

            <ActivityLogModal
                isOpen={isActivityModalOpen}
                onClose={() => setIsActivityModalOpen(false)}
                activities={activities}
            />

            {/* Drafts Modal */}
            <Modal 
                title="Taslaklar" 
                isOpen={isDraftsModalOpen} 
                onClose={() => setIsDraftsModalOpen(false)}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Filters */}
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '2fr 1fr 1fr 1fr', 
                        gap: '1rem',
                        padding: '1rem',
                        background: '#f8fafc',
                        borderRadius: 'var(--radius-md)'
                    }}>
                        <input
                            type="text"
                            placeholder="Görev içeriğinde ara..."
                            value={draftFilters.search}
                            onChange={e => setDraftFilters({ ...draftFilters, search: e.target.value })}
                            style={{
                                padding: '0.6rem',
                                border: '1px solid #e2e8f0',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '14px'
                            }}
                        />
                        <select
                            value={draftFilters.createdBy}
                            onChange={e => setDraftFilters({ ...draftFilters, createdBy: e.target.value })}
                            style={{
                                padding: '0.6rem',
                                border: '1px solid #e2e8f0',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '14px',
                                background: 'white'
                            }}
                        >
                            <option value="">Tüm Kullanıcılar</option>
                            {Object.entries(users).map(([id, name]) => (
                                <option key={id} value={id}>{name}</option>
                            ))}
                        </select>
                        <input
                            type="date"
                            placeholder="Başlangıç"
                            value={draftFilters.dateFrom}
                            onChange={e => setDraftFilters({ ...draftFilters, dateFrom: e.target.value })}
                            style={{
                                padding: '0.6rem',
                                border: '1px solid #e2e8f0',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '14px'
                            }}
                        />
                        <input
                            type="date"
                            placeholder="Bitiş"
                            value={draftFilters.dateTo}
                            onChange={e => setDraftFilters({ ...draftFilters, dateTo: e.target.value })}
                            style={{
                                padding: '0.6rem',
                                border: '1px solid #e2e8f0',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '14px'
                            }}
                        />
                    </div>
                    <select
                        value={draftFilters.tag}
                        onChange={e => setDraftFilters({ ...draftFilters, tag: e.target.value })}
                        style={{
                            padding: '0.6rem',
                            border: '1px solid #e2e8f0',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '14px',
                            background: 'white'
                        }}
                    >
                        <option value="">Tüm Etiketler</option>
                        <option value="Genel">Genel</option>
                        <option value="Tasarım">Tasarım</option>
                        <option value="Yazılım">Yazılım</option>
                        <option value="Pazarlama">Pazarlama</option>
                    </select>

                    {/* Drafts List */}
                    <div style={{ 
                        maxHeight: '400px', 
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem'
                    }}>
                        {todos
                            .filter(t => t.status === 'Draft')
                            .filter(t => {
                                if (draftFilters.search && !t.title.toLowerCase().includes(draftFilters.search.toLowerCase())) return false
                                if (draftFilters.createdBy && t.created_by !== draftFilters.createdBy) return false
                                if (draftFilters.dateFrom && new Date(t.created_at) < new Date(draftFilters.dateFrom)) return false
                                if (draftFilters.dateTo && new Date(t.created_at) > new Date(draftFilters.dateTo)) return false
                                if (draftFilters.tag && (!t.tags || !t.tags.includes(draftFilters.tag))) return false
                                return true
                            })
                            .map(draft => (
                                <div 
                                    key={draft.id}
                                    onClick={() => { handleEdit(draft); setIsDraftsModalOpen(false) }}
                                    style={{
                                        padding: '1rem',
                                        background: 'white',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: 'var(--radius-md)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => e.target.style.borderColor = 'var(--color-primary)'}
                                    onMouseLeave={e => e.target.style.borderColor = '#e2e8f0'}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600' }}>{draft.title}</h3>
                                        <span style={{
                                            padding: '0.2rem 0.6rem',
                                            background: '#f0fdf4',
                                            color: '#166534',
                                            borderRadius: '100px',
                                            fontSize: '11px',
                                            fontWeight: '600'
                                        }}>
                                            {draft.tags?.[0] || 'Genel'}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', gap: '1rem' }}>
                                        <span>{users[draft.created_by] || 'Bilinmeyen'}</span>
                                        <span>{new Date(draft.created_at).toLocaleDateString('tr-TR')}</span>
                                    </div>
                                </div>
                            ))}
                        {todos.filter(t => t.status === 'Draft').length === 0 && (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                                Henüz taslak görev yok.
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

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
                        <textarea
                            ref={titleTextareaRef}
                            required
                            value={formData.title}
                            onChange={handleTitleChange}
                            placeholder="Örn: Muhasebeciyle görüşme ayarla..."
                            rows={1}
                            style={{
                                width: '100%',
                                padding: '0.8rem 1rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid #e2e8f0',
                                fontSize: '15px',
                                outline: 'none',
                                transition: 'border-color 0.2s',
                                background: '#f8fafc',
                                resize: 'none',
                                overflow: 'hidden',
                                minHeight: '44px',
                                lineHeight: '1.5',
                                fontFamily: 'inherit'
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

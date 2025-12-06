
import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/ui/Modal'
import KanbanBoard from '../components/KanbanBoard'

export default function Todos() {
    const [todos, setTodos] = useState([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [users, setUsers] = useState({}) // id -> username map
    const [formData, setFormData] = useState({
        id: null,
        title: '',
        priority: 'Medium',
        due_date: '',
        tags: '' // comma separated string for input
    })

    useEffect(() => {
        fetchTodos()
    }, [])

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

            const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(t => t)

            const payload = {
                title: formData.title,
                priority: formData.priority,
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
            } else {
                // Insert
                const { error } = await supabase.from('todos').insert([payload])
                if (error) throw error
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
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset())

        setFormData({
            id: null,
            title: '',
            priority: 'Medium',
            due_date: now.toISOString().slice(0, 16),
            tags: ''
        })
    }

    const handleEdit = (todo) => {
        setFormData({
            id: todo.id,
            title: todo.title,
            priority: todo.priority,
            due_date: todo.due_date ? new Date(todo.due_date).toISOString().slice(0, 16) : '',
            tags: todo.tags ? todo.tags.join(', ') : ''
        })
        setIsModalOpen(true)
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Görevi silmek istiyor musun?')) return
        const { error } = await supabase.from('todos').delete().eq('id', id)
        if (error) {
            console.error('Error deleting:', error)
            alert('Silinirken hata oluştu.')
        } else {
            setTodos(todos.filter(t => t.id !== id))
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
            />

            <Modal title={formData.id ? "Görevi Düzenle" : "Yeni Görev Ekle"} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <form onSubmit={handleSubmit} className="form-grid">
                    <div className="form-group">
                        <label>Görev Adı</label>
                        <input
                            required
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Örn: Vergi dairesine git"
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Tarih ve Saat</label>
                            <input
                                type="datetime-local"
                                required
                                value={formData.due_date}
                                onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label>Öncelik</label>
                            <select
                                value={formData.priority}
                                onChange={e => setFormData({ ...formData, priority: e.target.value })}
                            >
                                <option value="Low">Düşük</option>
                                <option value="Medium">Orta</option>
                                <option value="High">Yüksek</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Etiketler (Virgülle ayır)</label>
                        <input
                            value={formData.tags}
                            onChange={e => setFormData({ ...formData, tags: e.target.value })}
                            placeholder="Örn: resmi, acil, finans"
                        />
                    </div>

                    <button type="submit" className="btn-primary full-width">Oluştur</button>
                </form>
            </Modal>
        </div>
    )
}

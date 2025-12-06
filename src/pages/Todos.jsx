
import { useEffect, useState } from 'react'
import { Plus, Calendar, CheckCircle, Circle, Clock, Trash2, Filter, Flag, Edit } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/ui/Modal'
import StatusBadge from '../components/ui/StatusBadge'

export default function Todos() {
    const [todos, setTodos] = useState([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [filter, setFilter] = useState('all') // all, today, week
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

    const toggleStatus = async (todo) => {
        const newStatus = todo.status === 'Done' ? 'Todo' : 'Done'
        // Optimistic update
        setTodos(todos.map(t => t.id === todo.id ? { ...t, status: newStatus } : t))

        await supabase.from('todos').update({ status: newStatus }).eq('id', todo.id)
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Görevi silmek istiyor musun?')) return
        await supabase.from('todos').delete().eq('id', id)
        setTodos(todos.filter(t => t.id !== id))
    }

    // Filtering Logic
    const filteredTodos = todos.filter(todo => {
        if (filter === 'all') return true

        const today = new Date()
        const taskDate = new Date(todo.due_date)

        if (filter === 'today') {
            return taskDate.toDateString() === today.toDateString()
        }

        if (filter === 'week') {
            const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
            return taskDate >= today && taskDate <= nextWeek
        }
        return true
    })

    const groupedTodos = {
        'Yapılacak': filteredTodos.filter(t => t.status === 'Todo'),
        'Tamamlanan': filteredTodos.filter(t => t.status === 'Done')
    }

    return (
        <div className="page-container fade-in">
            <div className="page-header">
                <div>
                    <h1 className="text-2xl font-bold">Yapılacaklar Listesi</h1>
                    <p className="text-muted">Günlük hedeflerini takip et ve yönet.</p>
                </div>
                <button onClick={() => { resetForm(); setIsModalOpen(true) }} className="btn-primary">
                    <Plus size={18} />
                    <span>Yeni Görev</span>
                </button>
            </div>

            <div className="filters-bar glass-panel">
                <div className="filter-group">
                    <button
                        className={`filter-chip ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        Tümü
                    </button>
                    <button
                        className={`filter-chip ${filter === 'today' ? 'active' : ''}`}
                        onClick={() => setFilter('today')}
                    >
                        Bugün
                    </button>
                    <button
                        className={`filter-chip ${filter === 'week' ? 'active' : ''}`}
                        onClick={() => setFilter('week')}
                    >
                        Bu Hafta
                    </button>
                </div>
            </div>

            <div className="todos-grid">
                {/* Active Todos */}
                <div className="todo-section">
                    <h3 className="section-title">
                        <Circle size={20} className="text-primary" />
                        Bekleyenler ({groupedTodos['Yapılacak'].length})
                    </h3>
                    <div className="todo-list">
                        {groupedTodos['Yapılacak'].map(todo => (
                            <div key={todo.id} className="todo-card glass-panel">
                                <div className="todo-check">
                                    <button onClick={() => toggleStatus(todo)} className="check-circle">
                                        <Circle size={24} />
                                    </button>
                                </div>
                                <div className="todo-content">
                                    <div className="todo-header-row">
                                        <h4>{todo.title}</h4>
                                        <div className="action-buttons">
                                            <button onClick={() => handleEdit(todo)} className="icon-btn edit">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(todo.id)} className="icon-btn delete">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="todo-meta">
                                        <span className="meta-item">
                                            <Calendar size={14} />
                                            {new Date(todo.due_date).toLocaleString('tr-TR', {
                                                year: 'numeric', month: '2-digit', day: '2-digit',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </span>
                                        <span className="creator-badge">
                                            {users[todo.created_by] || 'Bilinmeyen'}
                                        </span>
                                        <StatusBadge value={todo.priority} />
                                        {todo.tags?.map((tag, i) => (
                                            <span key={i} className="tag">#{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {groupedTodos['Yapılacak'].length === 0 && (
                            <div className="empty-placeholder">Yapılacak görev kalmadı! 🎉</div>
                        )}
                    </div>
                </div>

                {/* Completed Todos */}
                <div className="todo-section">
                    <h3 className="section-title">
                        <CheckCircle size={20} className="text-success" />
                        Tamamlananlar ({groupedTodos['Tamamlanan'].length})
                    </h3>
                    <div className="todo-list">
                        {groupedTodos['Tamamlanan'].map(todo => (
                            <div key={todo.id} className="todo-card glass-panel completed">
                                <div className="todo-check">
                                    <button onClick={() => toggleStatus(todo)} className="check-circle checked">
                                        <CheckCircle size={24} />
                                    </button>
                                </div>
                                <div className="todo-content">
                                    <div className="todo-header-row">
                                        <h4 className="strikethrough">{todo.title}</h4>
                                        <div className="action-buttons">
                                            <button onClick={() => handleEdit(todo)} className="icon-btn edit">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(todo.id)} className="icon-btn delete">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="todo-meta">
                                        <span className="meta-item">
                                            <Calendar size={14} />
                                            {new Date(todo.due_date).toLocaleString('tr-TR', {
                                                year: 'numeric', month: '2-digit', day: '2-digit',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </span>
                                        <span className="creator-badge">
                                            {users[todo.created_by] || 'Bilinmeyen'}
                                        </span>
                                        <span className="completed-badge">Tamamlandı</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

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

            <style>{`
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .btn-primary {
          background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
          color: white;
          padding: 0.75rem 1.25rem;
          border-radius: var(--radius-md);
          font-weight: 600;
          display: flex;
          gap: 0.5rem;
          align-items: center;
          box-shadow: var(--shadow-glow);
        }

        .filters-bar {
          padding: 0.5rem;
          margin-bottom: 2rem;
          display: inline-flex;
          border-radius: var(--radius-lg);
        }

        .filter-group {
          display: flex;
          gap: 0.5rem;
        }

        .filter-chip {
          padding: 0.5rem 1.25rem;
          border-radius: var(--radius-md);
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--color-text-muted);
          transition: all 0.2s;
        }

        .filter-chip:hover {
          background: rgba(0,0,0,0.05);
        }

        .filter-chip.active {
          background: white;
          color: var(--color-primary);
          box-shadow: var(--shadow-sm);
        }

        .todos-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .section-title {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--color-text-main);
        }

        .text-primary { color: var(--color-primary); }
        .text-success { color: var(--color-success); }

        .todo-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .todo-card {
          padding: 1rem;
          display: flex;
          gap: 1rem;
          align-items: flex-start;
          transition: transform 0.2s;
        }
        
        .todo-card:hover {
          transform: translateY(-2px);
        }

        .todo-card.completed {
          opacity: 0.7;
          background: rgba(241, 245, 249, 0.5);
        }

        .check-circle {
          color: var(--color-border);
          transition: color 0.2s;
          margin-top: 2px;
        }
        
        .check-circle:hover { color: var(--color-primary); }
        .check-circle.checked { color: var(--color-success); }

        .todo-content {
          flex: 1;
        }

        .todo-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.5rem;
        }

        .todo-header-row h4 {
          font-weight: 600;
          color: var(--color-text-main);
          font-size: 1rem;
        }

        .strikethrough {
          text-decoration: line-through;
          color: var(--color-text-muted);
        }

        .action-buttons {
          display: flex;
          gap: 0.5rem;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .todo-card:hover .action-buttons {
          opacity: 1;
        }

        .icon-btn {
          color: var(--color-text-muted);
          transition: color 0.2s;
        }

        .icon-btn.delete:hover { color: var(--color-error); }
        .icon-btn.edit:hover { color: var(--color-primary); }

        .todo-meta {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          color: var(--color-text-muted);
          font-size: 0.8rem;
        }

        .tag {
          font-size: 0.8rem;
          color: var(--color-primary);
          background: rgba(139, 92, 246, 0.1);
          padding: 0.1rem 0.5rem;
          border-radius: var(--radius-sm);
        }
        
        .creator-badge {
            font-size: 0.75rem;
            color: var(--color-text-main);
            background: rgba(0,0,0,0.05);
            padding: 0.1rem 0.4rem;
            border-radius: 4px;
        }

        .completed-badge {
          font-size: 0.8rem;
          color: var(--color-success);
          font-weight: 500;
        }

        .empty-placeholder {
          text-align: center;
          padding: 2rem;
          color: var(--color-text-muted);
          font-style: italic;
        }
        
        .full-width { width: 100%; margin-top: 1rem; }
        
        .form-grid { display: flex; flexDirection: column; gap: 1rem; }
        .form-row { display: grid; gridTemplateColumns: 1fr 1fr; gap: 1rem; }
        .form-group label { display: block; marginBottom: 0.4rem; fontSize: 0.9rem; color: var(--color-text-muted); fontWeight: 500; }
        .form-group input, .form-group select { 
          width: 100%; 
          padding: 1.1rem; /* Premium height */
          border-radius: var(--radius-md); 
          border: 1px solid var(--color-border); 
          background: var(--color-background); 
          font-size: 1rem;
          transition: all 0.2s;
          color: var(--color-text-main);
        }

        .form-group input:focus, .form-group select:focus {
          border-color: var(--color-primary);
          background: white;
          box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
          outline: none;
        }
      `}</style>
        </div>
    )
}

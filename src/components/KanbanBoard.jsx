import { useState } from 'react'
import { MoreHorizontal, Flag, Edit, Trash2, Plus } from 'lucide-react'
import '../styles/Kanban.css'

export default function KanbanBoard({ todos, onStatusChange, onEdit, onDelete, users, activities }) {
    // Columns definition
    const columns = [
        { id: 'Todo', title: 'Yapılacaklar', tagClass: 'tag-1' },
        { id: 'In Progress', title: 'Devam Edenler', tagClass: 'tag-2' },
        { id: 'Review', title: 'Kontrol', tagClass: 'tag-3' },
        { id: 'Done', title: 'Tamamlandı', tagClass: 'tag-4' }
    ]

    const handleDragStart = (e, todoId) => {
        e.dataTransfer.setData('todoId', todoId)
        e.dataTransfer.effectAllowed = 'move'
        e.target.style.opacity = '0.4'
    }

    const handleDragEnd = (e) => {
        e.target.style.opacity = '1'
    }

    const handleDragOver = (e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
    }

    const handleDrop = (e, status) => {
        e.preventDefault()
        const todoId = e.dataTransfer.getData('todoId')
        if (todoId) {
            onStatusChange(todoId, status)
        }
    }

    const getColumnTodos = (status) => {
        // Map any unknown status to 'Todo' or handle strictly
        return todos.filter(t => t.status === status || (status === 'Todo' && !['In Progress', 'Review', 'Done'].includes(t.status)))
    }

    return (
        <div className="kanban-app fade-in">
            <main className="project">
                <div className="project-info">
                    <h1>Görevler</h1>
                </div>

                <div className="project-tasks">
                    {columns.map(col => (
                        <div
                            key={col.id}
                            className="project-column"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, col.id)}
                        >
                            <div className="project-column-heading">
                                <h2 className="project-column-heading__title">{col.title}</h2>
                                <button className="project-column-heading__options">
                                    <MoreHorizontal size={20} />
                                </button>
                            </div>

                            {getColumnTodos(col.id).map(todo => (
                                <div
                                    key={todo.id}
                                    className="task"
                                    draggable="true"
                                    onDragStart={(e) => handleDragStart(e, todo.id)}
                                    onDragEnd={handleDragEnd}
                                >
                                    <div className="task__tags">
                                        <span className={`task__tag task__tag--${todo.tags?.[0] ? 'illustration' : 'copyright'}`}>
                                            {todo.tags?.[0] || 'Genel'}
                                        </span>
                                        <div className="task-actions" style={{ display: 'flex', gap: '5px' }}>
                                            <button onClick={() => onEdit(todo)} className="task__options">
                                                <Edit size={14} />
                                            </button>
                                            <button onClick={() => onDelete(todo.id)} className="task__options">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    <p>{todo.title}</p>

                                    <div className="task__stats">
                                        <span>
                                            <Flag size={12} />
                                            <time>{new Date(todo.due_date).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</time>
                                        </span>
                                        <span className="task__owner">
                                            {users[todo.created_by]?.substring(0, 2).toUpperCase() || '??'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </main>

            <aside className="task-details">
                <div className="tag-progress">
                    <h2>İlerleme Durumu</h2>
                    <div className="tag-progress">
                        <p>Devam Edenler <span>{getColumnTodos('In Progress').length}</span></p>
                        <progress className="progress" max={todos.length || 1} value={getColumnTodos('In Progress').length}></progress>
                    </div>
                    <div className="tag-progress">
                        <p>Tamamlananlar <span>{getColumnTodos('Done').length}</span></p>
                        <progress className="progress" max={todos.length || 1} value={getColumnTodos('Done').length}></progress>
                    </div>
                </div>

                <div className="task-activity">
                    <h2>Son Hareketler</h2>
                    <ul>
                        {activities && activities.map(act => (
                            <li key={act.id}>
                                <span className={`task-icon task-icon--${act.action_type === 'CREATE' ? 'attachment' :
                                    act.action_type === 'UPDATE' ? 'edit' :
                                        act.action_type === 'DELETE' ? 'comment' : 'comment'
                                    }`}>
                                    {act.action_type === 'CREATE' && <Plus size={12} />}
                                    {act.action_type === 'UPDATE' && <Edit size={12} />}
                                    {act.action_type === 'DELETE' && <Trash2 size={12} />}
                                    {act.action_type === 'MOVE' && <MoreHorizontal size={12} />}
                                </span>
                                <b>{act.app_users?.username || 'Kullanıcı'} </b>
                                {act.action_type === 'CREATE' && 'yeni görev ekledi.'}
                                {act.action_type === 'UPDATE' && 'görevi güncelledi.'}
                                {act.action_type === 'DELETE' && `"${act.details}" görevini sildi.`}
                                {act.action_type === 'MOVE' && `görevi taşıdı: ${act.details}`}
                                <time>{new Date(act.created_at).toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</time>
                            </li>
                        ))}
                        {(!activities || activities.length === 0) && (
                            <li>
                                <span className="task-icon task-icon--attachment"><MoreHorizontal size={12} /></span>
                                <b>Sistem </b> hazır.
                                <time>Şimdi</time>
                            </li>
                        )}
                    </ul>
                </div>
            </aside>
        </div>
    )
}

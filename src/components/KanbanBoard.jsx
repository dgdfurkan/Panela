import { useState } from 'react'
import { MoreHorizontal, Paperclip, MessageSquare, Flag, Edit, Trash2 } from 'lucide-react'
import '../styles/Kanban.css'

export default function KanbanBoard({ todos, onStatusChange, onEdit, onDelete, users }) {
    // Columns definition
    const columns = [
        { id: 'Todo', title: 'Task Ready', tagClass: 'tag-1' },
        { id: 'In Progress', title: 'In Progress', tagClass: 'tag-2' },
        { id: 'Review', title: 'Needs Review', tagClass: 'tag-3' },
        { id: 'Done', title: 'Done', tagClass: 'tag-4' }
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

    // Helper to get random stats for demo visual parity with reference
    // In real app, these would come from DB
    const getRandomStats = (id) => {
        const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        return {
            comments: hash % 10,
            attachments: hash % 5
        }
    }

    return (
        <div className="kanban-app fade-in">
            <main className="project">
                <div className="project-info">
                    <h1>Panela Tasks</h1>
                    <div className="project-participants">
                        <span></span>
                        <span></span>
                        <span></span>
                        <button className="project-participants__add">Add Participant</button>
                    </div>
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
                                            {todo.tags?.[0] || 'General'}
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
                                            <time>{new Date(todo.due_date).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })}</time>
                                        </span>
                                        <span>
                                            <MessageSquare size={12} />
                                            {getRandomStats(todo.id).comments}
                                        </span>
                                        <span>
                                            <Paperclip size={12} />
                                            {getRandomStats(todo.id).attachments}
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
                    <h2>Task Progress</h2>
                    <div className="tag-progress">
                        <p>In Progress Tasks <span>{getColumnTodos('In Progress').length}</span></p>
                        <progress className="progress" max={todos.length || 1} value={getColumnTodos('In Progress').length}></progress>
                    </div>
                    <div className="tag-progress">
                        <p>Done Tasks <span>{getColumnTodos('Done').length}</span></p>
                        <progress className="progress" max={todos.length || 1} value={getColumnTodos('Done').length}></progress>
                    </div>
                </div>

                <div className="task-activity">
                    <h2>Recent Activity</h2>
                    <ul>
                        <li>
                            <span className="task-icon task-icon--attachment"><Paperclip /></span>
                            <b>System </b> initialized board
                            <time>Just now</time>
                        </li>
                    </ul>
                </div>
            </aside>
        </div>
    )
}

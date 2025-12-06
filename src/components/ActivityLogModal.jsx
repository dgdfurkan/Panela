import { useState, useMemo } from 'react'
import { Plus, Edit, Trash2, MoreHorizontal, Filter, X } from 'lucide-react'
import Modal from './ui/Modal'

export default function ActivityLogModal({ isOpen, onClose, activities }) {
    const [userFilter, setUserFilter] = useState('')
    const [actionFilter, setActionFilter] = useState('')

    // Get unique users for filter dropdown
    const users = useMemo(() => {
        const unique = new Set(activities.map(a => a.app_users?.username).filter(Boolean))
        return Array.from(unique)
    }, [activities])

    const filteredActivities = activities.filter(act => {
        const matchesUser = userFilter ? act.app_users?.username === userFilter : true
        const matchesAction = actionFilter ? act.action_type === actionFilter : true
        return matchesUser && matchesAction
    })

    const getActionLabel = (type) => {
        switch (type) {
            case 'CREATE': return 'Ekleme'
            case 'UPDATE': return 'Güncelleme'
            case 'DELETE': return 'Silme'
            case 'MOVE': return 'Taşıma'
            default: return type
        }
    }

    return (
        <Modal title="Hareket Geçmişi" isOpen={isOpen} onClose={onClose}>
            <div className="activity-filters" style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '1.5rem',
                padding: '1rem',
                background: 'rgba(255,255,255,0.5)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgba(0,0,0,0.05)'
            }}>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Kullanıcı</label>
                    <select
                        value={userFilter}
                        onChange={(e) => setUserFilter(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid #e2e8f0',
                            fontSize: '14px'
                        }}
                    >
                        <option value="">Tümü</option>
                        {users.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                </div>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>İşlem Türü</label>
                    <select
                        value={actionFilter}
                        onChange={(e) => setActionFilter(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid #e2e8f0',
                            fontSize: '14px'
                        }}
                    >
                        <option value="">Tümü</option>
                        <option value="CREATE">Yeni Görev</option>
                        <option value="UPDATE">Güncelleme</option>
                        <option value="MOVE">Durum Değişikliği</option>
                        <option value="DELETE">Silme</option>
                    </select>
                </div>
                {(userFilter || actionFilter) && (
                    <div style={{ display: 'flex', alignItems: 'end' }}>
                        <button
                            onClick={() => { setUserFilter(''); setActionFilter('') }}
                            style={{
                                padding: '0.5rem',
                                color: 'var(--color-error)',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <X size={18} />
                        </button>
                    </div>
                )}
            </div>

            <div className="activity-list" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                {filteredActivities.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>Kayıt bulunamadı.</p>
                ) : (
                    <ul style={{ padding: 0, listStyle: 'none' }}>
                        {filteredActivities.map(act => (
                            <li key={act.id} style={{
                                padding: '1rem',
                                borderBottom: '1px solid #f1f5f9',
                                display: 'flex',
                                alignItems: 'start',
                                gap: '1rem'
                            }}>
                                <span style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    background:
                                        act.action_type === 'CREATE' ? '#dcfce7' :
                                            act.action_type === 'UPDATE' ? '#dbeafe' :
                                                act.action_type === 'DELETE' ? '#fee2e2' : '#fef9c3',
                                    color:
                                        act.action_type === 'CREATE' ? '#166534' :
                                            act.action_type === 'UPDATE' ? '#1e40af' :
                                                act.action_type === 'DELETE' ? '#991b1b' : '#854d0e'
                                }}>
                                    {act.action_type === 'CREATE' && <Plus size={16} />}
                                    {act.action_type === 'UPDATE' && <Edit size={16} />}
                                    {act.action_type === 'DELETE' && <Trash2 size={16} />}
                                    {act.action_type === 'MOVE' && <MoreHorizontal size={16} />}
                                </span>
                                <div>
                                    <div style={{ fontSize: '14px', marginBottom: '0.2rem' }}>
                                        <span style={{ fontWeight: '600' }}>{act.app_users?.username || 'Kullanıcı'}</span>
                                        <span style={{ margin: '0 0.5rem', color: '#cbd5e1' }}>•</span>
                                        <span style={{
                                            fontSize: '12px',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            background: '#f1f5f9',
                                            color: '#64748b'
                                        }}>
                                            {getActionLabel(act.action_type)}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: '14px', color: '#334155', margin: 0 }}>
                                        {act.action_type === 'CREATE' && 'Yeni görev oluşturdu.'}
                                        {act.action_type === 'UPDATE' && 'Görev detaylarını güncelledi.'}
                                        {act.action_type === 'DELETE' && `"${act.details}" adlı görevi sildi.`}
                                        {act.action_type === 'MOVE' && `Görevi "${act.details}" aşamasına taşıdı.`}
                                    </p>
                                    <time style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginTop: '0.4rem' }}>
                                        {new Date(act.created_at).toLocaleString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                                    </time>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </Modal>
    )
}

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { CheckSquare, Square, Upload, Link as LinkIcon, Loader2, FileText } from 'lucide-react'

export default function AssignmentsTab({ weekId, userId }) {
    const [assignments, setAssignments] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (weekId && userId) fetchAssignments()
    }, [weekId, userId])

    const fetchAssignments = async () => {
        try {
            const { data, error } = await supabase
                .from('academy_assignments')
                .select('*')
                .eq('week_id', weekId)
                .eq('user_id', userId)
                .order('created_at', { ascending: false })

            if (error) throw error
            setAssignments(data || [])
        } catch (error) {
            console.error('Error fetching assignments:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleToggleComplete = async (id, currentStatus) => {
        try {
            const { error } = await supabase
                .from('academy_assignments')
                .update({ is_completed: !currentStatus })
                .eq('id', id)

            if (error) throw error
            fetchAssignments()
        } catch (error) {
            console.error('Error updating assignment:', error)
        }
    }

    const handleSubmitLink = async (id, link) => {
        try {
            const { error } = await supabase
                .from('academy_assignments')
                .update({ submission_url: link })
                .eq('id', id)

            if (error) throw error
            fetchAssignments()
        } catch (error) {
            console.error('Error submitting link:', error)
        }
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                <Loader2 className="animate-spin" size={24} color="var(--color-primary)" />
            </div>
        )
    }

    if (assignments.length === 0) {
        return (
            <div style={{
                textAlign: 'center',
                padding: '3rem',
                background: 'white',
                borderRadius: 'var(--radius-lg)',
                color: '#64748b'
            }}>
                <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <div style={{ fontSize: '16px', fontWeight: '600' }}>Henüz ödev eklenmemiş</div>
            </div>
        )
    }

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {assignments.map(assignment => (
                    <div
                        key={assignment.id}
                        style={{
                            background: 'white',
                            padding: '1.5rem',
                            borderRadius: 'var(--radius-lg)',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            border: assignment.is_completed ? '2px solid #10b981' : '2px solid #e2e8f0'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'start', gap: '1rem' }}>
                            <button
                                onClick={() => handleToggleComplete(assignment.id, assignment.is_completed)}
                                style={{
                                    padding: 0,
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                    marginTop: '0.25rem'
                                }}
                            >
                                {assignment.is_completed ? (
                                    <CheckSquare size={24} color="#10b981" fill="#10b981" />
                                ) : (
                                    <Square size={24} color="#94a3b8" />
                                )}
                            </button>
                            <div style={{ flex: 1 }}>
                                <h3 style={{
                                    margin: 0,
                                    fontSize: '18px',
                                    fontWeight: '600',
                                    color: assignment.is_completed ? '#10b981' : '#1e293b',
                                    textDecoration: assignment.is_completed ? 'line-through' : 'none',
                                    opacity: assignment.is_completed ? 0.7 : 1
                                }}>
                                    {assignment.title}
                                </h3>
                                {assignment.description && (
                                    <p style={{
                                        margin: '0.5rem 0 0 0',
                                        fontSize: '14px',
                                        color: '#64748b',
                                        lineHeight: '1.6'
                                    }}>
                                        {assignment.description}
                                    </p>
                                )}

                                {/* Submission Area */}
                                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '0.5rem' }}>
                                        Teslim Et:
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                        <input
                                            type="url"
                                            placeholder="Link veya dosya URL'si ekle..."
                                            defaultValue={assignment.submission_url || ''}
                                            onBlur={e => {
                                                if (e.target.value !== assignment.submission_url) {
                                                    handleSubmitLink(assignment.id, e.target.value)
                                                }
                                            }}
                                            style={{
                                                flex: 1,
                                                padding: '0.6rem',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: 'var(--radius-md)',
                                                fontSize: '14px'
                                            }}
                                        />
                                        {assignment.submission_url && (
                                            <a
                                                href={assignment.submission_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    padding: '0.6rem',
                                                    background: '#f0f9ff',
                                                    color: 'var(--color-primary)',
                                                    borderRadius: 'var(--radius-md)',
                                                    textDecoration: 'none',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.4rem'
                                                }}
                                            >
                                                <LinkIcon size={16} />
                                                <span style={{ fontSize: '13px' }}>Aç</span>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}


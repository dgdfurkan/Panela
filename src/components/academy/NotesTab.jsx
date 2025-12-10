import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { PenTool, Send, Loader2, Save } from 'lucide-react'

export default function NotesTab({ weekId, userId }) {
    const { user } = useAuth()
    const [comments, setComments] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [newComment, setNewComment] = useState('')
    const textareaRef = useRef(null)
    const commentsEndRef = useRef(null)
    const [summaryContent, setSummaryContent] = useState('')
    const [summaryLoading, setSummaryLoading] = useState(true)
    const [summarySaving, setSummarySaving] = useState(false)
    const [summaryLastSaved, setSummaryLastSaved] = useState(null)
    const summaryRef = useRef(null)

    useEffect(() => {
        if (weekId) {
            fetchComments()
            fetchSummary()
            // Real-time subscription for comments
            const subscription = supabase
                .channel(`academy_notes_${weekId}`)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'academy_notes_comments',
                    filter: `week_id=eq.${weekId}`
                }, () => {
                    fetchComments()
                })
                .subscribe()

            return () => {
                subscription.unsubscribe()
            }
        }
    }, [weekId])

    useEffect(() => {
        // Auto-scroll to bottom when new comments arrive
        if (commentsEndRef.current) {
            commentsEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [comments])

    useEffect(() => {
        // Auto-resize textarea
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
        }
    }, [newComment])

    useEffect(() => {
        // Auto-resize summary textarea
        if (summaryRef.current) {
            summaryRef.current.style.height = 'auto'
            summaryRef.current.style.height = `${summaryRef.current.scrollHeight}px`
        }
    }, [summaryContent])

    const fetchComments = async () => {
        try {
            const { data, error } = await supabase
                .from('academy_notes_comments')
                .select('*')
                .eq('week_id', weekId)
                .order('created_at', { ascending: true })

            if (error) throw error
            setComments(data || [])
        } catch (error) {
            console.error('Error fetching comments:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchSummary = async () => {
        try {
            const { data, error } = await supabase
                .from('academy_notes_summary')
                .select('*')
                .eq('week_id', weekId)
                .single()

            if (error && error.code !== 'PGRST116') throw error
            if (data) {
                setSummaryContent(data.content || '')
                setSummaryLastSaved(data.updated_at)
            } else {
                setSummaryContent('')
            }
        } catch (error) {
            console.error('Error fetching summary:', error)
        } finally {
            setSummaryLoading(false)
        }
    }

    const handleAddComment = async () => {
        if (!newComment.trim() || !userId || !user) return

        setSaving(true)
        try {
            const { error } = await supabase
                .from('academy_notes_comments')
                .insert([{
                    week_id: weekId,
                    user_id: userId,
                    username: user.username || 'Kullanıcı',
                    content: newComment.trim()
                }])

            if (error) throw error
            setNewComment('')
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto'
            }
        } catch (error) {
            console.error('Error adding comment:', error)
            alert('Yorum eklenirken hata oluştu: ' + error.message)
        } finally {
            setSaving(false)
        }
    }

    const handleSaveSummary = async () => {
        if (!weekId) return
        setSummarySaving(true)
        try {
            const { error } = await supabase
                .from('academy_notes_summary')
                .upsert({
                    week_id: weekId,
                    content: summaryContent,
                    updated_at: new Date().toISOString(),
                    updated_by_id: userId || null,
                    updated_by_username: user?.username || 'Kullanıcı'
                }, { onConflict: 'week_id' })

            if (error) throw error
            setSummaryLastSaved(new Date().toISOString())
        } catch (error) {
            console.error('Error saving summary:', error)
            alert('Genel özet kaydedilirken hata oluştu: ' + error.message)
        } finally {
            setSummarySaving(false)
        }
    }

    const formatDateTime = (dateString) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now - date
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return 'Az önce'
        if (diffMins < 60) return `${diffMins} dakika önce`
        if (diffHours < 24) return `${diffHours} saat önce`
        if (diffDays < 7) return `${diffDays} gün önce`

        return date.toLocaleString('tr-TR', {
            day: '2-digit',
            month: 'short',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                <Loader2 className="animate-spin" size={24} color="var(--color-primary)" />
            </div>
        )
    }

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Summary Card */}
            <div style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <PenTool size={20} color="var(--color-primary)" />
                        <div>
                            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
                                Genel Özet / Word Alanı
                            </h2>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                                Uzun özetler, altyazılar, ders metinleri; AI için hazır tut.
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {summaryLastSaved && (
                            <span style={{ fontSize: '12px', color: '#64748b' }}>
                                Son kayıt: {new Date(summaryLastSaved).toLocaleString('tr-TR', {
                                    day: '2-digit',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        )}
                        <button
                            onClick={handleSaveSummary}
                            disabled={summarySaving}
                            style={{
                                padding: '0.65rem 1.2rem',
                                background: summarySaving ? '#cbd5e1' : 'var(--color-primary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                fontWeight: '600',
                                fontSize: '13px',
                                cursor: summarySaving ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem'
                            }}
                        >
                            {summarySaving ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" />
                                    <span>Kaydediliyor...</span>
                                </>
                            ) : (
                                <>
                                    <Save size={14} />
                                    <span>Kaydet</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
                <textarea
                    ref={summaryRef}
                    value={summaryContent}
                    onChange={e => setSummaryContent(e.target.value)}
                    placeholder="Genel özet, altyazılar, uzun metinler... (Shift+Enter yeni satır)"
                    rows={6}
                    disabled={summaryLoading}
                    style={{
                        width: '100%',
                        minHeight: '220px',
                        padding: '1rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '14px',
                        lineHeight: '1.6',
                        fontFamily: 'inherit',
                        resize: 'none',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        background: summaryLoading ? '#f8fafc' : 'white'
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
            </div>

            {/* Comments Area (Chat) */}
            <div style={{
                flex: 1,
                background: 'white',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}>
                <div style={{
                    padding: '1.25rem 1.5rem',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                }}>
                    <PenTool size={18} color="var(--color-primary)" />
                    <div>
                        <div style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>Dijital Defter - Yorumlar</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>Ekip içi mesajlar, notlar, fikirler</div>
                    </div>
                </div>
                {/* Comments List */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                }}>
                    {comments.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '3rem',
                            color: '#64748b'
                        }}>
                            <PenTool size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                            <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '0.5rem' }}>
                                Henüz yorum yok
                            </div>
                            <div style={{ fontSize: '14px' }}>
                                İlk yorumu siz yapın!
                            </div>
                        </div>
                    ) : (
                        comments.map(comment => {
                            const isOwn = comment.user_id === userId
                            return (
                                <div
                                    key={comment.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: isOwn ? 'flex-start' : 'flex-end',
                                        marginBottom: '0.5rem'
                                    }}
                                >
                                    <div style={{
                                        maxWidth: '70%',
                                        background: isOwn
                                            ? 'linear-gradient(135deg, var(--color-primary) 0%, #8b5cf6 100%)'
                                            : '#f1f5f9',
                                        color: isOwn ? 'white' : '#1e293b',
                                        padding: '1rem 1.25rem',
                                        borderRadius: isOwn
                                            ? 'var(--radius-lg) var(--radius-lg) var(--radius-lg) 0'
                                            : 'var(--radius-lg) var(--radius-lg) 0 var(--radius-lg)',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                        wordWrap: 'break-word'
                                    }}>
                                        <div style={{
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            marginBottom: '0.5rem',
                                            opacity: isOwn ? 0.9 : 0.7
                                        }}>
                                            {comment.username}
                                        </div>
                                        <div style={{
                                            fontSize: '14px',
                                            lineHeight: '1.6',
                                            whiteSpace: 'pre-wrap'
                                        }}>
                                            {comment.content}
                                        </div>
                                        <div style={{
                                            fontSize: '11px',
                                            marginTop: '0.5rem',
                                            opacity: isOwn ? 0.8 : 0.6,
                                            textAlign: 'right'
                                        }}>
                                            {formatDateTime(comment.created_at)}
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                    <div ref={commentsEndRef} />
                </div>

                {/* Input Area */}
                <div style={{
                    padding: '1.5rem',
                    borderTop: '1px solid #e2e8f0',
                    background: '#f8fafc'
                }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                        <div style={{ flex: 1 }}>
                            <textarea
                                ref={textareaRef}
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault()
                                        handleAddComment()
                                    }
                                }}
                                placeholder="Yorumunuzu yazın... (Enter ile gönder, Shift+Enter ile yeni satır)"
                                rows={1}
                                style={{
                                    width: '100%',
                                    minHeight: '44px',
                                    maxHeight: '200px',
                                    padding: '0.75rem 1rem',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 'var(--radius-md)',
                                    fontSize: '14px',
                                    fontFamily: 'inherit',
                                    resize: 'none',
                                    outline: 'none',
                                    transition: 'border-color 0.2s',
                                    lineHeight: '1.5'
                                }}
                                onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                            />
                        </div>
                        <button
                            onClick={handleAddComment}
                            disabled={saving || !newComment.trim()}
                            style={{
                                padding: '0.75rem 1.5rem',
                                background: saving || !newComment.trim() ? '#cbd5e1' : 'var(--color-primary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                fontWeight: '600',
                                cursor: saving || !newComment.trim() ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '14px',
                                transition: 'all 0.2s'
                            }}
                        >
                            {saving ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    <span>Ekleniyor...</span>
                                </>
                            ) : (
                                <>
                                    <Send size={16} />
                                    <span>Yorumumu Ekle</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

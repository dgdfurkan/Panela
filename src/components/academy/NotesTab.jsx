import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { PenTool, Save, Loader2 } from 'lucide-react'

export default function NotesTab({ weekId, userId }) {
    const [content, setContent] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [lastSaved, setLastSaved] = useState(null)
    const textareaRef = useRef(null)
    const saveTimeoutRef = useRef(null)

    useEffect(() => {
        if (weekId && userId) {
            fetchNotes()
        }
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current)
            }
        }
    }, [weekId, userId])

    const fetchNotes = async () => {
        try {
            const { data, error } = await supabase
                .from('academy_user_notes')
                .select('*')
                .eq('week_id', weekId)
                .eq('user_id', userId)
                .single()

            if (error && error.code !== 'PGRST116') throw error
            if (data) {
                setContent(data.content || '')
                setLastSaved(data.updated_at)
            }
        } catch (error) {
            console.error('Error fetching notes:', error)
        } finally {
            setLoading(false)
        }
    }

    const saveNotes = async () => {
        if (!weekId || !userId) return

        setSaving(true)
        try {
            const { error } = await supabase
                .from('academy_user_notes')
                .upsert({
                    week_id: weekId,
                    user_id: userId,
                    content: content,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'week_id,user_id'
                })

            if (error) throw error
            setLastSaved(new Date().toISOString())
        } catch (error) {
            console.error('Error saving notes:', error)
            alert('Notlar kaydedilirken hata oluştu: ' + error.message)
        } finally {
            setSaving(false)
        }
    }

    const handleContentChange = (e) => {
        setContent(e.target.value)
        
        // Auto-resize textarea
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
        }

        // Auto-save after 2 seconds of inactivity
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current)
        }
        saveTimeoutRef.current = setTimeout(() => {
            saveNotes()
        }, 2000)
    }

    const handleManualSave = () => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current)
        }
        saveNotes()
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                <Loader2 className="animate-spin" size={24} color="var(--color-primary)" />
            </div>
        )
    }

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{
                background: 'white',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <PenTool size={20} color="var(--color-primary)" />
                        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
                            Dijital Defter
                        </h2>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {lastSaved && (
                            <span style={{ fontSize: '12px', color: '#64748b' }}>
                                Son kayıt: {new Date(lastSaved).toLocaleString('tr-TR', {
                                    day: '2-digit',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        )}
                        <button
                            onClick={handleManualSave}
                            disabled={saving}
                            style={{
                                padding: '0.5rem 1rem',
                                background: saving ? '#cbd5e1' : 'var(--color-primary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                fontWeight: '600',
                                fontSize: '13px',
                                cursor: saving ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem'
                            }}
                        >
                            {saving ? (
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

                {/* Editor */}
                <div style={{ padding: '1.5rem' }}>
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={handleContentChange}
                        placeholder="Notlarınızı buraya yazın... Markdown formatını destekler (kalın: **metin**, italik: *metin*, liste: - item)"
                        style={{
                            width: '100%',
                            minHeight: '500px',
                            padding: '1rem',
                            border: '1px solid #e2e8f0',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '15px',
                            lineHeight: '1.6',
                            fontFamily: 'inherit',
                            resize: 'vertical',
                            outline: 'none',
                            transition: 'border-color 0.2s'
                        }}
                        onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                        onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    />
                </div>

                {/* Markdown Preview Hint */}
                <div style={{
                    padding: '1rem 1.5rem',
                    background: '#f8fafc',
                    borderTop: '1px solid #e2e8f0',
                    fontSize: '12px',
                    color: '#64748b'
                }}>
                    <strong>Markdown İpuçları:</strong> <strong>**kalın**</strong>, <em>*italik*</em>, <code>`kod`</code>, <code>- liste</code>, <code># başlık</code>
                </div>
            </div>
        </div>
    )
}


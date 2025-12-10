import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { PenTool, Save, Loader2 } from 'lucide-react'

export default function SummaryTab({ weekId, userId }) {
    const { user } = useAuth()
    const [content, setContent] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [lastSaved, setLastSaved] = useState(null)
    const textareaRef = useRef(null)

    useEffect(() => {
        if (weekId) fetchSummary()
    }, [weekId])

    useEffect(() => {
        if (textareaRef.current) {
            const maxHeight = 15 * 22 // approx line-height 22px → 15 satır sınırı
            textareaRef.current.style.height = 'auto'
            const nextHeight = Math.min(textareaRef.current.scrollHeight, maxHeight)
            textareaRef.current.style.height = `${nextHeight}px`
            textareaRef.current.style.overflowY = textareaRef.current.scrollHeight > maxHeight ? 'auto' : 'hidden'
        }
    }, [content])

    const fetchSummary = async () => {
        try {
            const { data, error } = await supabase
                .from('academy_notes_summary')
                .select('*')
                .eq('week_id', weekId)
                .single()

            if (error && error.code !== 'PGRST116') throw error
            if (data) {
                setContent(data.content || '')
                setLastSaved(data.updated_at)
            } else {
                setContent('')
            }
        } catch (error) {
            console.error('Error fetching summary:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!weekId) return
        setSaving(true)
        try {
            const { error } = await supabase
                .from('academy_notes_summary')
                .upsert({
                    week_id: weekId,
                    content,
                    updated_at: new Date().toISOString(),
                    updated_by_id: userId || null,
                    updated_by_username: user?.username || 'Kullanıcı'
                }, { onConflict: 'week_id' })

            if (error) throw error
            setLastSaved(new Date().toISOString())
        } catch (error) {
            console.error('Error saving summary:', error)
            alert('Genel özet kaydedilirken hata oluştu: ' + error.message)
        } finally {
            setSaving(false)
        }
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
                            onClick={handleSave}
                            disabled={saving}
                            style={{
                                padding: '0.65rem 1.2rem',
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
                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Genel özet, altyazılar, uzun metinler... (Shift+Enter yeni satır)"
                    rows={8}
                    style={{
                        width: '100%',
                        minHeight: '220px',
                        maxHeight: '330px', // ~15 satır sınırı
                        padding: '1rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '14px',
                        lineHeight: '1.6',
                        fontFamily: 'inherit',
                        resize: 'none',
                        overflowY: 'auto',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Bu alanı AI’ye göndermek istediğin metinler için kullan. (Gemini Pro çıktıları, altyazılar vb.)
                </div>
            </div>
        </div>
    )
}


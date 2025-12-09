import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Plus, Instagram, Youtube, Globe, CheckCircle, XCircle, Loader2, BookOpen } from 'lucide-react'

export default function ResourcesTab({ weekId }) {
    const [resources, setResources] = useState([])
    const [loading, setLoading] = useState(true)
    const [newUrl, setNewUrl] = useState('')
    const [isAdding, setIsAdding] = useState(false)

    useEffect(() => {
        if (weekId) fetchResources()
    }, [weekId])

    const fetchResources = async () => {
        try {
            const { data, error } = await supabase
                .from('academy_resources')
                .select('*')
                .eq('week_id', weekId)
                .order('created_at', { ascending: false })

            if (error) throw error
            setResources(data || [])
        } catch (error) {
            console.error('Error fetching resources:', error)
        } finally {
            setLoading(false)
        }
    }

    const detectResourceType = (url) => {
        if (url.includes('instagram.com')) return 'instagram'
        if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
        return 'website'
    }

    const extractYouTubeId = (url) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
        const match = url.match(regExp)
        return match && match[2].length === 11 ? match[2] : null
    }

    const getYouTubeThumbnail = (url) => {
        const videoId = extractYouTubeId(url)
        if (videoId) {
            return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
        }
        return null
    }

    const getInstagramUsername = (url) => {
        const match = url.match(/instagram\.com\/([^\/\?]+)/)
        return match ? match[1] : null
    }

    const getWebsiteDomain = (url) => {
        try {
            const urlObj = new URL(url)
            return urlObj.hostname.replace('www.', '')
        } catch {
            return url
        }
    }

    const handleAddResource = async () => {
        if (!newUrl.trim()) return

        setIsAdding(true)
        try {
            const resourceType = detectResourceType(newUrl)
            const embedData = {}

            // Extract YouTube video ID if YouTube
            if (resourceType === 'youtube') {
                const videoId = extractYouTubeId(newUrl)
                if (videoId) {
                    embedData.videoId = videoId
                    embedData.embedUrl = `https://www.youtube.com/embed/${videoId}`
                }
            }

            const { error } = await supabase
                .from('academy_resources')
                .insert([{
                    week_id: weekId,
                    resource_type: resourceType,
                    url: newUrl,
                    title: '',
                    description: '',
                    is_good_example: true,
                    embed_data: embedData
                }])

            if (error) throw error
            setNewUrl('')
            fetchResources()
        } catch (error) {
            console.error('Error adding resource:', error)
            alert('Kaynak eklenirken hata oluştu: ' + error.message)
        } finally {
            setIsAdding(false)
        }
    }

    const handleToggleExample = async (id, currentValue) => {
        try {
            const { error } = await supabase
                .from('academy_resources')
                .update({ is_good_example: !currentValue })
                .eq('id', id)

            if (error) throw error
            fetchResources()
        } catch (error) {
            console.error('Error updating resource:', error)
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Bu kaynağı silmek istediğinize emin misiniz?')) return
        try {
            const { error } = await supabase
                .from('academy_resources')
                .delete()
                .eq('id', id)

            if (error) throw error
            fetchResources()
        } catch (error) {
            console.error('Error deleting resource:', error)
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
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {/* Add Resource Input */}
            <div style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: 'var(--radius-lg)',
                marginBottom: '2rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{
                            display: 'block',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#64748b',
                            marginBottom: '0.5rem'
                        }}>
                            Kaynak URL'si (Instagram, YouTube veya Website)
                        </label>
                        <input
                            type="url"
                            value={newUrl}
                            onChange={e => setNewUrl(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && handleAddResource()}
                            placeholder="https://instagram.com/p/... veya https://youtube.com/watch?v=... veya https://example.com"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #e2e8f0',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '14px'
                            }}
                        />
                    </div>
                    <button
                        onClick={handleAddResource}
                        disabled={isAdding || !newUrl.trim()}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: 'var(--color-primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            fontWeight: '600',
                            cursor: isAdding || !newUrl.trim() ? 'not-allowed' : 'pointer',
                            opacity: isAdding || !newUrl.trim() ? 0.6 : 1
                        }}
                    >
                        {isAdding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    </button>
                </div>
            </div>

            {/* Resources Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '1.5rem'
            }}>
                {resources.map(resource => {
                    const isGood = resource.is_good_example
                    return (
                        <div
                            key={resource.id}
                            style={{
                                background: 'white',
                                borderRadius: 'var(--radius-lg)',
                                overflow: 'hidden',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                border: `2px solid ${isGood ? '#10b981' : '#ef4444'}`,
                                position: 'relative'
                            }}
                        >
                            {/* Badge */}
                            <div style={{
                                position: 'absolute',
                                top: '1rem',
                                right: '1rem',
                                zIndex: 10,
                                display: 'flex',
                                gap: '0.5rem',
                                alignItems: 'center'
                            }}>
                                <button
                                    onClick={() => handleToggleExample(resource.id, resource.is_good_example)}
                                    style={{
                                        padding: '0.4rem 0.8rem',
                                        background: isGood ? '#10b981' : '#ef4444',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: 'var(--radius-sm)',
                                        fontSize: '11px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.3rem'
                                    }}
                                >
                                    {isGood ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                    {isGood ? 'Doğru Örnek' : 'Yanlış Örnek'}
                                </button>
                                <button
                                    onClick={() => handleDelete(resource.id)}
                                    style={{
                                        padding: '0.4rem',
                                        background: '#fee2e2',
                                        color: '#991b1b',
                                        border: 'none',
                                        borderRadius: 'var(--radius-sm)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    ×
                                </button>
                            </div>

                            {/* Content */}
                            <div style={{ padding: '1.5rem' }}>
                                {resource.resource_type === 'instagram' && (
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                            <Instagram size={20} color="#E4405F" />
                                            <span style={{ fontWeight: '600', fontSize: '14px' }}>Instagram</span>
                                        </div>
                                        <a
                                            href={resource.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                display: 'block',
                                                textDecoration: 'none',
                                                color: 'inherit'
                                            }}
                                        >
                                            <div style={{
                                                border: '1px solid #e2e8f0',
                                                borderRadius: 'var(--radius-md)',
                                                overflow: 'hidden',
                                                background: 'white',
                                                transition: 'all 0.2s',
                                                cursor: 'pointer'
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.borderColor = 'var(--color-primary)'
                                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.borderColor = '#e2e8f0'
                                                e.currentTarget.style.boxShadow = 'none'
                                            }}
                                            >
                                                <div style={{
                                                    background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                                                    padding: '2rem',
                                                    textAlign: 'center',
                                                    color: 'white'
                                                }}>
                                                    <Instagram size={48} style={{ marginBottom: '0.5rem' }} />
                                                    <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '0.25rem' }}>
                                                        @{getInstagramUsername(resource.url) || 'Instagram'}
                                                    </div>
                                                    <div style={{ fontSize: '13px', opacity: 0.9 }}>
                                                        Instagram profil sayfasını görüntüle
                                                    </div>
                                                </div>
                                                {resource.title && (
                                                    <div style={{ padding: '1rem', borderTop: '1px solid #e2e8f0' }}>
                                                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '0.25rem' }}>
                                                            {resource.title}
                                                        </div>
                                                        {resource.description && (
                                                            <div style={{ fontSize: '13px', color: '#64748b' }}>
                                                                {resource.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </a>
                                    </div>
                                )}

                                {resource.resource_type === 'youtube' && (
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                            <Youtube size={20} color="#FF0000" />
                                            <span style={{ fontWeight: '600', fontSize: '14px' }}>YouTube</span>
                                        </div>
                                        {resource.embed_data?.embedUrl ? (
                                            <div style={{
                                                position: 'relative',
                                                paddingBottom: '56.25%',
                                                height: 0,
                                                overflow: 'hidden',
                                                borderRadius: 'var(--radius-md)',
                                                border: '1px solid #e2e8f0'
                                            }}>
                                                <iframe
                                                    src={`${resource.embed_data.embedUrl}?rel=0&modestbranding=1&controls=1`}
                                                    style={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        width: '100%',
                                                        height: '100%'
                                                    }}
                                                    frameBorder="0"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                    loading="lazy"
                                                    title={`YouTube: ${resource.title || resource.url}`}
                                                />
                                            </div>
                                        ) : (
                                            <a
                                                href={resource.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    display: 'block',
                                                    textDecoration: 'none',
                                                    color: 'inherit'
                                                }}
                                            >
                                                <div style={{
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: 'var(--radius-md)',
                                                    overflow: 'hidden',
                                                    background: 'white',
                                                    transition: 'all 0.2s',
                                                    cursor: 'pointer'
                                                }}
                                                onMouseEnter={e => {
                                                    e.currentTarget.style.borderColor = '#FF0000'
                                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,0,0,0.1)'
                                                }}
                                                onMouseLeave={e => {
                                                    e.currentTarget.style.borderColor = '#e2e8f0'
                                                    e.currentTarget.style.boxShadow = 'none'
                                                }}
                                                >
                                                    {getYouTubeThumbnail(resource.url) ? (
                                                        <div style={{
                                                            position: 'relative',
                                                            paddingBottom: '56.25%',
                                                            height: 0,
                                                            overflow: 'hidden',
                                                            background: '#000'
                                                        }}>
                                                            <img
                                                                src={getYouTubeThumbnail(resource.url)}
                                                                alt={resource.title || 'YouTube'}
                                                                style={{
                                                                    position: 'absolute',
                                                                    top: 0,
                                                                    left: 0,
                                                                    width: '100%',
                                                                    height: '100%',
                                                                    objectFit: 'cover'
                                                                }}
                                                            />
                                                            <div style={{
                                                                position: 'absolute',
                                                                top: '50%',
                                                                left: '50%',
                                                                transform: 'translate(-50%, -50%)',
                                                                background: 'rgba(0,0,0,0.8)',
                                                                borderRadius: '50%',
                                                                width: '64px',
                                                                height: '64px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}>
                                                                <Youtube size={32} color="#FF0000" fill="#FF0000" />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div style={{
                                                            background: '#FF0000',
                                                            padding: '2rem',
                                                            textAlign: 'center',
                                                            color: 'white'
                                                        }}>
                                                            <Youtube size={48} style={{ marginBottom: '0.5rem' }} />
                                                            <div style={{ fontSize: '16px', fontWeight: '600' }}>
                                                                YouTube Kanalı
                                                            </div>
                                                        </div>
                                                    )}
                                                    {(resource.title || resource.description) && (
                                                        <div style={{ padding: '1rem', borderTop: '1px solid #e2e8f0' }}>
                                                            {resource.title && (
                                                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '0.25rem' }}>
                                                                    {resource.title}
                                                                </div>
                                                            )}
                                                            {resource.description && (
                                                                <div style={{ fontSize: '13px', color: '#64748b' }}>
                                                                    {resource.description}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </a>
                                        )}
                                    </div>
                                )}

                                {resource.resource_type === 'website' && (
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                            <Globe size={20} color="var(--color-primary)" />
                                            <span style={{ fontWeight: '600', fontSize: '14px' }}>Website</span>
                                        </div>
                                        <a
                                            href={resource.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                display: 'block',
                                                textDecoration: 'none',
                                                color: 'inherit'
                                            }}
                                        >
                                            <div style={{
                                                border: '1px solid #e2e8f0',
                                                borderRadius: 'var(--radius-md)',
                                                overflow: 'hidden',
                                                background: 'white',
                                                transition: 'all 0.2s',
                                                cursor: 'pointer'
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.borderColor = 'var(--color-primary)'
                                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.borderColor = '#e2e8f0'
                                                e.currentTarget.style.boxShadow = 'none'
                                            }}
                                            >
                                                <div style={{
                                                    background: 'linear-gradient(135deg, var(--color-primary) 0%, #8b5cf6 100%)',
                                                    padding: '2rem',
                                                    textAlign: 'center',
                                                    color: 'white'
                                                }}>
                                                    <Globe size={48} style={{ marginBottom: '0.5rem' }} />
                                                    <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '0.25rem' }}>
                                                        {getWebsiteDomain(resource.url)}
                                                    </div>
                                                    <div style={{ fontSize: '13px', opacity: 0.9 }}>
                                                        Web sitesini görüntüle
                                                    </div>
                                                </div>
                                                {(resource.title || resource.description) && (
                                                    <div style={{ padding: '1rem', borderTop: '1px solid #e2e8f0' }}>
                                                        {resource.title && (
                                                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '0.25rem' }}>
                                                                {resource.title}
                                                            </div>
                                                        )}
                                                        {resource.description && (
                                                            <div style={{ fontSize: '13px', color: '#64748b' }}>
                                                                {resource.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {resources.length === 0 && (
                <div style={{
                    textAlign: 'center',
                    padding: '3rem',
                    background: 'white',
                    borderRadius: 'var(--radius-lg)',
                    color: '#64748b'
                }}>
                    <BookOpen size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                    <div style={{ fontSize: '16px', fontWeight: '600' }}>Henüz kaynak eklenmemiş</div>
                    <div style={{ fontSize: '14px', marginTop: '0.5rem' }}>Yukarıdaki alana URL ekleyerek başlayın</div>
                </div>
            )}
        </div>
    )
}


import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Video, Play, Loader2, Maximize2, Folder } from 'lucide-react'

export default function ClassroomTab({ weekId }) {
    const [videos, setVideos] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedVideo, setSelectedVideo] = useState(null)
    const [isFullscreen, setIsFullscreen] = useState(false)

    useEffect(() => {
        if (weekId) fetchVideos()
    }, [weekId])

    const fetchVideos = async () => {
        try {
            const { data, error } = await supabase
                .from('academy_videos')
                .select('*')
                .eq('week_id', weekId)
                .order('created_at', { ascending: false })

            if (error) throw error
            setVideos(data || [])
            if (data && data.length > 0) {
                setSelectedVideo(data[0])
            }
        } catch (error) {
            console.error('Error fetching videos:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatDuration = (seconds) => {
        if (!seconds) return ''
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const getVideoPlayerUrl = (video) => {
        if (video.video_provider === 'youtube') {
            const videoId = video.video_url.includes('youtu.be') 
                ? video.video_url.split('youtu.be/')[1]?.split('?')[0]
                : video.video_url.match(/[?&]v=([^&]+)/)?.[1]
            return videoId ? `https://www.youtube.com/embed/${videoId}` : null
        }
        if (video.video_provider === 'vimeo') {
            const videoId = video.video_url.split('vimeo.com/')[1]?.split('?')[0]
            return videoId ? `https://player.vimeo.com/video/${videoId}` : null
        }
        if (video.video_provider === 'cloudinary') {
            return video.video_url
        }
        if (video.video_provider === 'googledrive') {
            return null // Google Drive klasörleri embed edilemez
        }
        return null
    }

    const isGoogleDrive = (video) => {
        return video.video_provider === 'googledrive' || 
               video.video_url?.includes('drive.google.com')
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                <Loader2 className="animate-spin" size={24} color="var(--color-primary)" />
            </div>
        )
    }

    if (videos.length === 0) {
        return (
            <div style={{
                textAlign: 'center',
                padding: '3rem',
                background: 'white',
                borderRadius: 'var(--radius-lg)',
                color: '#64748b'
            }}>
                <Video size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <div style={{ fontSize: '16px', fontWeight: '600' }}>Henüz video eklenmemiş</div>
            </div>
        )
    }

    const playerUrl = selectedVideo ? getVideoPlayerUrl(selectedVideo) : null

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: isFullscreen ? '1fr' : '1fr 350px', gap: '2rem' }}>
                {/* Video Player */}
                <div style={{
                    background: 'white',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                    {selectedVideo && isGoogleDrive(selectedVideo) ? (
                        <div>
                            <a
                                href={selectedVideo.video_url}
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
                                    cursor: 'pointer',
                                    margin: '1.5rem'
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = '#4285F4'
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(66, 133, 244, 0.2)'
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = '#e2e8f0'
                                    e.currentTarget.style.boxShadow = 'none'
                                }}
                                >
                                    <div style={{
                                        background: 'linear-gradient(135deg, #4285F4 0%, #34A853 50%, #FBBC04 100%)',
                                        padding: '3rem 2rem',
                                        textAlign: 'center',
                                        color: 'white'
                                    }}>
                                        <Folder size={64} style={{ marginBottom: '1rem' }} />
                                        <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '0.5rem' }}>
                                            Google Drive Klasörü
                                        </div>
                                        <div style={{ fontSize: '14px', opacity: 0.9 }}>
                                            Ders kaydını görüntüle
                                        </div>
                                    </div>
                                    <div style={{ padding: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
                                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '0.5rem' }}>
                                            {selectedVideo.title || 'Ders Videosu'}
                                        </div>
                                        {selectedVideo.description && (
                                            <div style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>
                                                {selectedVideo.description}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </a>
                        </div>
                    ) : selectedVideo && playerUrl ? (
                        <div style={{ position: 'relative' }}>
                            <div style={{
                                position: 'relative',
                                paddingBottom: '56.25%',
                                height: 0,
                                overflow: 'hidden',
                                background: '#000'
                            }}>
                                <iframe
                                    src={playerUrl}
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
                                />
                            </div>
                            <div style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>
                                        {selectedVideo.title}
                                    </h2>
                                    <button
                                        onClick={() => setIsFullscreen(!isFullscreen)}
                                        style={{
                                            padding: '0.5rem',
                                            background: '#f1f5f9',
                                            border: 'none',
                                            borderRadius: 'var(--radius-sm)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <Maximize2 size={18} />
                                    </button>
                                </div>
                                {selectedVideo.video_duration && (
                                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '0.5rem' }}>
                                        Süre: {formatDuration(selectedVideo.video_duration)}
                                    </div>
                                )}
                                {selectedVideo.description && (
                                    <p style={{ fontSize: '14px', color: '#64748b', margin: 0, lineHeight: '1.6' }}>
                                        {selectedVideo.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                            <Play size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                            <div>Video yükleniyor...</div>
                        </div>
                    )}
                </div>

                {/* Video List */}
                {!isFullscreen && (
                    <div>
                        <div style={{
                            background: 'white',
                            borderRadius: 'var(--radius-lg)',
                            padding: '1rem',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            maxHeight: 'calc(100vh - 200px)',
                            overflowY: 'auto'
                        }}>
                            <h3 style={{ margin: '0 0 1rem 0', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                                Ders Videoları
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {videos.map(video => {
                                    const isSelected = selectedVideo?.id === video.id
                                    return (
                                        <button
                                            key={video.id}
                                            onClick={() => setSelectedVideo(video)}
                                            style={{
                                                width: '100%',
                                                padding: '1rem',
                                                border: 'none',
                                                borderRadius: 'var(--radius-md)',
                                                background: isSelected ? '#f0f9ff' : '#f8fafc',
                                                borderLeft: isSelected ? '3px solid var(--color-primary)' : '3px solid transparent',
                                                textAlign: 'left',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={e => {
                                                if (!isSelected) e.target.style.background = '#f1f5f9'
                                            }}
                                            onMouseLeave={e => {
                                                if (!isSelected) e.target.style.background = '#f8fafc'
                                            }}
                                        >
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.75rem',
                                                marginBottom: '0.5rem'
                                            }}>
                                                {isGoogleDrive(video) ? (
                                                    <Folder size={18} color={isSelected ? '#4285F4' : '#64748b'} />
                                                ) : (
                                                    <Video size={18} color={isSelected ? 'var(--color-primary)' : '#64748b'} />
                                                )}
                                                <div style={{
                                                    fontSize: '14px',
                                                    fontWeight: isSelected ? '600' : '500',
                                                    color: isSelected ? 'var(--color-primary)' : '#1e293b',
                                                    flex: 1
                                                }}>
                                                    {video.title}
                                                </div>
                                            </div>
                                            {video.video_duration && (
                                                <div style={{ fontSize: '12px', color: '#64748b', marginLeft: '2rem' }}>
                                                    {formatDuration(video.video_duration)}
                                                </div>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}


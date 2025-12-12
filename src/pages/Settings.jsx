import { useState, useEffect, useCallback, useRef } from 'react'
import { Save, Loader2, Monitor, List, Clock, Zap, Plus, Trash2, ShieldCheck, Download, ExternalLink } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

// Simple debounce utility
function debounce(func, wait) {
    let timeout
    return function (...args) {
        const context = this
        clearTimeout(timeout)
        timeout = setTimeout(() => func.apply(context, args), wait)
    }
}

export default function Settings() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [lastSaved, setLastSaved] = useState(null)
    const [settings, setSettings] = useState({
        product_view_mode: 'latest',
        product_count: 3,
        animation_duration: 5,
        tasks_view_mode: 'latest',
        tasks_count: 3,
        tasks_animation_duration: 5,
        tasks_status_filters: ['Todo', 'In Progress', 'Review']
    })
    const [tokens, setTokens] = useState([])
    const [tokenForm, setTokenForm] = useState({ label: '', token: '' })
    const [tokenSaving, setTokenSaving] = useState(false)

    // Fetch initial settings
    useEffect(() => {
        const fetchSettings = async () => {
            if (!user) return

            try {
                // Using maybeSingle to avoid 406/error when no row exists
                const { data, error } = await supabase
                    .from('user_settings')
                    .select('*')
                    .eq('user_id', user.id)
                    .maybeSingle()

                if (error) throw error

                if (data) {
                    setSettings({
                        product_view_mode: data.product_view_mode,
                        product_count: data.product_count,
                        animation_duration: data.animation_duration,
                        tasks_view_mode: data.tasks_view_mode || 'latest',
                        tasks_count: data.tasks_count || 3,
                        tasks_animation_duration: data.tasks_animation_duration || 5,
                        tasks_status_filters: data.tasks_status_filters?.length ? data.tasks_status_filters : ['Todo', 'In Progress', 'Review']
                    })
                } else {
                    // Create default settings if not exists
                    // We must ensure the INSERT includes the user_id explicitly
                    const { error: insertError } = await supabase
                        .from('user_settings')
                        .insert([{
                            user_id: user.id,
                            product_view_mode: 'latest',
                            product_count: 3,
                            animation_duration: 5,
                            tasks_view_mode: 'latest',
                            tasks_count: 3,
                            tasks_animation_duration: 5,
                            tasks_status_filters: ['Todo', 'In Progress', 'Review']
                        }])
                        .select() // Good practice to select back to confirm
                        .single()

                    if (insertError) throw insertError
                }
            } catch (error) {
                console.error('Error fetching settings:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchSettings()
    }, [user])

    useEffect(() => {
        const fetchTokens = async () => {
            if (!user) return
            const { data, error } = await supabase
                .from('ai_tokens')
                .select('*')
                .eq('user_id', user.id)
                .order('priority', { ascending: true })
                .order('created_at', { ascending: true })

            if (!error) setTokens(data || [])
        }
        fetchTokens()
    }, [user])

    // useReference to persist the debounced function across renders
    const saveSettingsRef = useRef(
        debounce(async (newSettings, userId) => {
            // Internal save logic
            try {
                // Set saving to true (must be handled carefully in debounce context or via parent state wrapper if simple)
                // Since this runs later, we can't easily toggle state unless we pass setters or use refs.
                // However, for simplicity in this component structure, let's keep it simple.
                // Actually, accessing state inside debounce cache requires refs or passing data.

                const { error } = await supabase
                    .from('user_settings')
                    .upsert({
                        user_id: userId,
                        ...newSettings,
                        updated_at: new Date()
                    })

                if (error) throw error
                // We'll update the 'lastSaved' state via a callback or event if strictly needed, 
                // but usually direct state set here is fine if component is mounted.
            } catch (error) {
                console.error('Error saving settings:', error)
            }
        }, 1000)
    ).current

    // Wrapper to handle state updates immediately for UI, then trigger save
    const handleSave = async (newSettings) => {
        setSaving(true)
        try {
            const { error } = await supabase
                .from('user_settings')
                .upsert({
                    user_id: user.id,
                    ...newSettings,
                    updated_at: new Date()
                })

            if (error) throw error
            setLastSaved(new Date())
        } catch (error) {
            console.error('Error saving settings:', error)
        } finally {
            setSaving(false)
        }
    }

    // Debounced version for the UI slider/inputs to avoid hammering DB
    const debouncedSaveReference = useRef(
        debounce((newSettings, userId, onStart, onComplete) => {
            onStart()
            supabase.from('user_settings').upsert({
                user_id: userId,
                ...newSettings,
                updated_at: new Date()
            }).then(({ error }) => {
                if (!error) onComplete(new Date())
            })
        }, 1000)
    ).current

    const handleChange = (key, value) => {
        const newSettings = { ...settings, [key]: value }
        setSettings(newSettings)

        // Trigger auto-save
        debouncedSaveReference(
            newSettings,
            user.id,
            () => setSaving(true),
            (date) => {
                setSaving(false)
                setLastSaved(date)
            }
        )
    }

    const toggleTaskStatusFilter = (statusKey) => {
        const current = settings.tasks_status_filters || []
        const exists = current.includes(statusKey)
        const next = exists ? current.filter(s => s !== statusKey) : [...current, statusKey]
        handleChange('tasks_status_filters', next.length ? next : ['Todo', 'In Progress', 'Review'])
    }

    const handleAddToken = async () => {
        if (!tokenForm.token.trim()) return
        setTokenSaving(true)
        try {
            const nextPriority = (tokens.reduce((max, t) => Math.max(max, t.priority || 0), 0) || 0) + 1
            const payload = {
                user_id: user.id,
                label: tokenForm.label || 'Gemini Anahtarı',
                token: tokenForm.token.trim(),
                priority: nextPriority
            }
            const { data, error } = await supabase.from('ai_tokens').insert(payload).select().single()
            if (error) throw error
            setTokens((prev) => [...prev, data].sort((a, b) => (a.priority || 1) - (b.priority || 1)))
            setTokenForm({ label: '', token: '' })
        } catch (error) {
            console.error('AI token ekleme hatası:', error)
        } finally {
            setTokenSaving(false)
        }
    }

    const handleDeleteToken = async (id) => {
        const { error } = await supabase.from('ai_tokens').delete().eq('id', id).eq('user_id', user.id)
        if (!error) setTokens((prev) => prev.filter((t) => t.id !== id))
    }

    const handleDownloadExtension = async () => {
        try {
            // GitHub'dan direkt zip indirme linki
            const zipUrl = 'https://github.com/dgdfurkan/Panela/archive/refs/heads/main.zip'
            
            // Kullanıcıya kurulum talimatlarını göster
            const confirmed = window.confirm(
                'Extension\'ı indirmek için:\n\n' +
                '1. Aşağıdaki linkten GitHub repository\'sini zip olarak indirin\n' +
                '2. Zip dosyasını açın ve "Panela-main/public/chrome-extension" klasörünü bulun\n' +
                '3. Chrome\'da chrome://extensions/ adresine gidin\n' +
                '4. Sağ üstte "Geliştirici modu"nu açın\n' +
                '5. "Paketlenmemiş uzantı yükle" butonuna tıklayın\n' +
                '6. "chrome-extension" klasörünü seçin\n\n' +
                'Extension aktif olacak ve Meta Ads Library sayfalarında otomatik çalışacak.\n\n' +
                'GitHub repository\'sini zip olarak indirmek ister misiniz?'
            )
            
            if (confirmed) {
                // GitHub repository zip indirme linki
                window.open(zipUrl, '_blank')
                
                // 2 saniye sonra kurulum sayfasını da aç
                setTimeout(() => {
                    window.open('https://github.com/dgdfurkan/Panela/tree/main/public/chrome-extension', '_blank')
                }, 2000)
            }
        } catch (error) {
            console.error('Extension indirme hatası:', error)
            alert('Extension indirilemedi. Lütfen daha sonra tekrar deneyin.')
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        )
    }

    return (
        <div className="settings-page fade-in">
            <header className="page-header">
                <div>
                    <h1 className="page-title">Ayarlar</h1>
                    <p className="page-subtitle">Panelini kendine göre özelleştir.</p>
                </div>
                <div className="save-status">
                    {saving ? (
                        <span className="status-badge saving">
                            <Loader2 size={14} className="animate-spin" /> Kaydediliyor...
                        </span>
                    ) : lastSaved ? (
                        <span className="status-badge saved">
                            <Save size={14} /> Kaydedildi {lastSaved.toLocaleTimeString()}
                        </span>
                    ) : null}
                </div>
            </header>

            <div className="settings-grid">
                {/* Keşfedilen Ürünler - Tek Kart */}
                <div className="glass-panel settings-card">
                    <div className="card-header compact-header">
                        <div className="header-left">
                            <Monitor className="text-primary" size={22} />
                            <div>
                                <h3>Keşfedilen Ürünler Görünümü</h3>
                                <p className="setting-desc">Mode + adet + animasyon süresi aynı yerde.</p>
                            </div>
                        </div>
                    </div>
                    <div className="card-content compact-grid">
                        <div className="radio-group slim">
                            <label className={`radio-option ${settings.product_view_mode === 'latest' ? 'active' : ''}`}>
                                <input
                                    type="radio"
                                    name="view_mode"
                                    value="latest"
                                    checked={settings.product_view_mode === 'latest'}
                                    onChange={(e) => handleChange('product_view_mode', e.target.value)}
                                />
                                <span className="radio-label">📌 Son Eklenenler</span>
                            </label>

                            <label className={`radio-option ${settings.product_view_mode === 'random' ? 'active' : ''}`}>
                                <input
                                    type="radio"
                                    name="view_mode"
                                    value="random"
                                    checked={settings.product_view_mode === 'random'}
                                    onChange={(e) => handleChange('product_view_mode', e.target.value)}
                                />
                                <span className="radio-label">🎲 Rastgele</span>
                            </label>

                            <label className={`radio-option ${settings.product_view_mode === 'loop' ? 'active' : ''}`}>
                                <input
                                    type="radio"
                                    name="view_mode"
                                    value="loop"
                                    checked={settings.product_view_mode === 'loop'}
                                    onChange={(e) => handleChange('product_view_mode', e.target.value)}
                                />
                                <span className="radio-label">🔄 Animasyonlu Döngü</span>
                            </label>
                        </div>

                        <div className="form-group inline">
                            <label className="input-label">
                                <List size={16} />
                                Gösterilecek Ürün Sayısı
                            </label>
                            <div className="range-wrapper">
                                <input
                                    type="range"
                                    min="1"
                                    max="12"
                                    value={settings.product_count}
                                    onChange={(e) => handleChange('product_count', parseInt(e.target.value))}
                                    className="range-input"
                                />
                                <span className="range-value">{settings.product_count}</span>
                            </div>
                        </div>

                        {settings.product_view_mode === 'loop' && (
                            <div className="form-group inline">
                                <label className="input-label">
                                    <Clock size={16} />
                                    Animasyon Süresi (sn)
                                </label>
                                <div className="input-wrapper">
                                    <input
                                        type="number"
                                        min="1"
                                        max="20"
                                        value={settings.animation_duration}
                                        onChange={(e) => handleChange('animation_duration', parseInt(e.target.value))}
                                        className="text-input"
                                    />
                                    <span className="unit">sn</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Yaklaşan Görevler Görünümü */}
                <div className="glass-panel settings-card">
                    <div className="card-header compact-header">
                        <div className="header-left">
                            <List className="text-primary" size={22} />
                            <div>
                                <h3>Ayarlara Yaklaşan Görevler Görünüm</h3>
                                <p className="setting-desc">Hangi statüler, kaç görev, hangi mod?</p>
                            </div>
                        </div>
                    </div>
                    <div className="card-content compact-grid">
                        <div className="checkbox-group slim">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={settings.tasks_status_filters?.includes('Todo')}
                                    onChange={() => toggleTaskStatusFilter('Todo')}
                                />
                                <span>Yapılacaklar (Todo)</span>
                            </label>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={settings.tasks_status_filters?.includes('In Progress')}
                                    onChange={() => toggleTaskStatusFilter('In Progress')}
                                />
                                <span>Devam Edenler (In Progress)</span>
                            </label>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={settings.tasks_status_filters?.includes('Review')}
                                    onChange={() => toggleTaskStatusFilter('Review')}
                                />
                                <span>Kontrol (Review)</span>
                            </label>
                        </div>

                        <div className="radio-group slim">
                            <label className={`radio-option ${settings.tasks_view_mode === 'latest' ? 'active' : ''}`}>
                                <input
                                    type="radio"
                                    name="tasks_view_mode"
                                    value="latest"
                                    checked={settings.tasks_view_mode === 'latest'}
                                    onChange={(e) => handleChange('tasks_view_mode', e.target.value)}
                                />
                                <span className="radio-label">📌 Son Eklenenler</span>
                            </label>
                            <label className={`radio-option ${settings.tasks_view_mode === 'random' ? 'active' : ''}`}>
                                <input
                                    type="radio"
                                    name="tasks_view_mode"
                                    value="random"
                                    checked={settings.tasks_view_mode === 'random'}
                                    onChange={(e) => handleChange('tasks_view_mode', e.target.value)}
                                />
                                <span className="radio-label">🎲 Rastgele</span>
                            </label>
                            <label className={`radio-option ${settings.tasks_view_mode === 'loop' ? 'active' : ''}`}>
                                <input
                                    type="radio"
                                    name="tasks_view_mode"
                                    value="loop"
                                    checked={settings.tasks_view_mode === 'loop'}
                                    onChange={(e) => handleChange('tasks_view_mode', e.target.value)}
                                />
                                <span className="radio-label">🔄 Animasyonlu Döngü</span>
                            </label>
                        </div>

                        <div className="number-group">
                            <label>Gösterilecek Görev Sayısı</label>
                            <input
                                type="number"
                                min={1}
                                max={10}
                                value={settings.tasks_count}
                                onChange={(e) => handleChange('tasks_count', Number(e.target.value) || 1)}
                            />
                        </div>

                        {settings.tasks_view_mode === 'loop' && (
                            <div className="number-group">
                                <label>Animasyon Süresi (sn)</label>
                                <input
                                    type="number"
                                    min={2}
                                    max={30}
                                    value={settings.tasks_animation_duration}
                                    onChange={(e) => handleChange('tasks_animation_duration', Number(e.target.value) || 5)}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Gemini Token Yönetimi */}
                <div className="glass-panel settings-card">
                    <div className="card-header">
                        <ShieldCheck className="text-primary" size={24} />
                        <h3>Gemini Token Yönetimi</h3>
                    </div>
                    <div className="card-content form-layout">
                        <p className="setting-desc">Birden fazla token ekleyip öncelik verebilirsin. Limit aşımında sıradaki token kullanılır.</p>
                        <div className="form-group">
                            <label className="input-label">Etiket</label>
                            <input
                                className="text-input"
                                placeholder="Örn: Ana Token"
                                value={tokenForm.label}
                                onChange={(e) => setTokenForm({ ...tokenForm, label: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="input-label">Token</label>
                            <input
                                className="text-input"
                                placeholder="Gemini API anahtarı"
                                value={tokenForm.token}
                                onChange={(e) => setTokenForm({ ...tokenForm, token: e.target.value })}
                            />
                        </div>
                        <button className="token-add-btn" onClick={handleAddToken} disabled={tokenSaving}>
                            <Plus size={16} />
                            {tokenSaving ? 'Ekleniyor...' : 'Token Ekle'}
                        </button>

                        <div className="token-list">
                            {tokens.length === 0 && <p className="muted">Henüz token eklenmedi.</p>}
                            {tokens.map((t) => (
                                <div key={t.id} className="token-row">
                                    <div>
                                        <p className="token-label">{t.label || 'Adsız'}</p>
                                        <p className="token-meta">Öncelik: {t.priority || 1}</p>
                                    </div>
                                    <button className="token-delete" onClick={() => handleDeleteToken(t.id)}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Chrome Extension */}
                <div className="glass-panel settings-card">
                    <div className="card-header">
                        <Zap className="text-primary" size={24} />
                        <h3>Chrome Extension</h3>
                    </div>
                    <div className="card-content form-layout">
                        <p className="setting-desc">
                            Meta Ads Library'de sadece "Shop Now" ve "Şimdi alışveriş yap" butonları olan reklamları gösteren Chrome eklentisi.
                            Gereksiz reklamları otomatik olarak filtreler ve sonuçları daha kompakt gösterir.
                        </p>
                        
                        <div className="extension-instructions">
                            <h4 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600' }}>Kurulum Adımları (Windows, macOS, Linux):</h4>
                            <ol style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'var(--color-text-main)', fontSize: '0.9rem' }}>
                                <li><strong>1.</strong> Aşağıdaki "Extension'ı İndir" butonuna tıkla - GitHub repository zip dosyası indirilecek</li>
                                <li><strong>2.</strong> Zip dosyasını aç (Windows: sağ tık → "Extract All", macOS: çift tık, Linux: unzip komutu) ve <code style={{ background: 'rgba(0,0,0,0.05)', padding: '0.2rem 0.4rem', borderRadius: '4px', fontFamily: 'monospace' }}>Panela-main/public/chrome-extension</code> klasörünü bul</li>
                                <li><strong>3.</strong> Chrome veya Edge tarayıcısında <code style={{ background: 'rgba(0,0,0,0.05)', padding: '0.2rem 0.4rem', borderRadius: '4px', fontFamily: 'monospace' }}>chrome://extensions/</code> veya <code style={{ background: 'rgba(0,0,0,0.05)', padding: '0.2rem 0.4rem', borderRadius: '4px', fontFamily: 'monospace' }}>edge://extensions/</code> adresine git</li>
                                <li><strong>4.</strong> Sağ üstte <strong>"Geliştirici modu"</strong> veya <strong>"Developer mode"</strong> açık olduğundan emin ol</li>
                                <li><strong>5.</strong> <strong>"Paketlenmemiş uzantı yükle"</strong> veya <strong>"Load unpacked"</strong> butonuna tıkla</li>
                                <li><strong>6.</strong> <code style={{ background: 'rgba(0,0,0,0.05)', padding: '0.2rem 0.4rem', borderRadius: '4px', fontFamily: 'monospace' }}>chrome-extension</code> klasörünü seç (içinde manifest.json olan klasör)</li>
                                <li><strong>7.</strong> Extension aktif olacak! Meta Ads Library sayfalarında otomatik çalışır</li>
                            </ol>
                            <div style={{ 
                                marginTop: '1rem', 
                                padding: '0.75rem', 
                                background: 'rgba(16, 185, 129, 0.1)', 
                                borderRadius: '6px',
                                border: '1px solid rgba(16, 185, 129, 0.2)',
                                fontSize: '0.85rem'
                            }}>
                                <strong>✅ Platform Desteği:</strong> Bu extension Windows, macOS ve Linux'ta çalışır. Chrome, Edge, Brave, Opera gibi Chromium tabanlı tüm tarayıcılarda çalışır.
                            </div>
                            <div style={{ 
                                marginTop: '0.75rem', 
                                padding: '0.75rem', 
                                background: 'rgba(255, 193, 7, 0.1)', 
                                borderRadius: '6px',
                                border: '1px solid rgba(255, 193, 7, 0.2)',
                                fontSize: '0.85rem'
                            }}>
                                <strong>⚠️ Önemli:</strong> Zip dosyasını açtıktan sonra <code style={{ background: 'rgba(0,0,0,0.1)', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>chrome-extension</code> klasörünü seçtiğinden emin ol. Tüm dosyalar (manifest.json, content.js, popup.html vb.) bu klasörün içinde olmalı.
                            </div>
                        </div>

                        <button 
                            className="extension-download-btn" 
                            onClick={handleDownloadExtension}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '10px',
                                border: 'none',
                                background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                                color: 'white',
                                fontWeight: '600',
                                cursor: 'pointer',
                                fontSize: '0.95rem',
                                transition: 'transform 0.2s, box-shadow 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.transform = 'translateY(-2px)'
                                e.target.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)'
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0)'
                                e.target.style.boxShadow = 'none'
                            }}
                        >
                            <Download size={18} />
                            Extension'ı İndir
                        </button>

                        <div style={{ 
                            marginTop: '1rem', 
                            padding: '1rem', 
                            background: 'rgba(139, 92, 246, 0.05)', 
                            borderRadius: '8px',
                            border: '1px solid rgba(139, 92, 246, 0.1)'
                        }}>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                                <strong>Not:</strong> Extension sadece Meta Ads Library sayfalarında çalışır. 
                                Sayfayı yenilediğinizde otomatik olarak filtreleme aktif olur.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    margin-bottom: 2rem;
                    border-bottom: 1px solid rgba(0,0,0,0.05);
                    padding-bottom: 1rem;
                }

                .page-title {
                    font-size: 1.8rem;
                    font-weight: 700;
                    color: var(--color-text-main);
                }

                .page-subtitle {
                    color: var(--color-text-muted);
                }

                .status-badge {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    border-radius: 20px;
                    font-size: 0.85rem;
                    font-weight: 500;
                }

                .status-badge.saving {
                    background: rgba(var(--color-primary-rgb), 0.1);
                    color: var(--color-primary);
                }

                .status-badge.saved {
                    background: rgba(16, 185, 129, 0.1);
                    color: #10B981;
                }

                .settings-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                    gap: 2rem;
                }

                .settings-card {
                    padding: 0;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }

                .card-header {
                    padding: 1.5rem;
                    background: rgba(255,255,255,0.5);
                    border-bottom: 1px solid rgba(0,0,0,0.05);
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .card-header h3 {
                    font-size: 1.1rem;
                    font-weight: 600;
                    margin: 0;
                }

                .card-content {
                    padding: 2rem;
                    flex: 1;
                }
                .card-header.compact-header {
                    padding: 1rem 1.5rem;
                }
                .header-left {
                    display: flex;
                    gap: 0.6rem;
                    align-items: center;
                }
                .compact-grid {
                    display: grid;
                    gap: 1rem;
                }
                .radio-group.slim {
                    flex-direction: row;
                    flex-wrap: wrap;
                    gap: 0.75rem;
                }
                .checkbox-group.slim {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .checkbox-group.slim label {
                    display: flex;
                    gap: 0.5rem;
                    align-items: center;
                    font-size: 0.95rem;
                    color: var(--color-text-main);
                }
                .checkbox-group.slim input {
                    accent-color: var(--color-primary);
                }
                .number-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.4rem;
                }
                .number-group input {
                    width: 120px;
                    padding: 0.45rem 0.75rem;
                    border: 1px solid rgba(0,0,0,0.1);
                    border-radius: 8px;
                    font-size: 0.95rem;
                }
                .number-group label {
                    font-weight: 600;
                    color: var(--color-text-main);
                }
                .form-group.inline {
                    gap: 0.35rem;
                }

                .setting-desc {
                    margin-bottom: 1.5rem;
                    color: var(--color-text-muted);
                    font-size: 0.95rem;
                }

                .radio-group {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .radio-option {
                    display: flex;
                    align-items: center;
                    padding: 1rem;
                    border: 1px solid rgba(0,0,0,0.1);
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                    background: white;
                }

                .radio-option:hover {
                    border-color: var(--color-primary);
                    background: rgba(var(--color-primary-rgb), 0.02);
                }

                .radio-option.active {
                    border-color: var(--color-primary);
                    background: rgba(var(--color-primary-rgb), 0.05);
                    box-shadow: 0 0 0 1px var(--color-primary);
                }

                .radio-option input {
                    margin-right: 1rem;
                    accent-color: var(--color-primary);
                }

                .radio-label {
                    font-weight: 500;
                }

                .form-layout {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .input-label {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-weight: 600;
                    color: var(--color-text-main);
                    font-size: 0.95rem;
                }

                .range-wrapper {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .range-input {
                    flex: 1;
                    accent-color: var(--color-primary);
                }

                .range-value {
                    font-weight: 700;
                    font-size: 1.2rem;
                    color: var(--color-primary);
                    width: 30px;
                    text-align: center;
                }

                .input-help {
                    font-size: 0.8rem;
                    color: var(--color-text-muted);
                }

                .divider {
                    height: 1px;
                    background: rgba(0,0,0,0.05);
                    margin: 0.5rem 0;
                }

                .input-wrapper {
                    position: relative;
                    max-width: 150px;
                }

                .text-input {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    padding-right: 2.5rem;
                    border: 1px solid rgba(0,0,0,0.1);
                    border-radius: 8px;
                    font-size: 1rem;
                    font-weight: 500;
                }
                
                .text-input:focus {
                    border-color: var(--color-primary);
                    box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.1);
                }

                .unit {
                    position: absolute;
                    right: 1rem;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--color-text-muted);
                    font-size: 0.9rem;
                    pointer-events: none;
                }

                .token-add-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.4rem;
                    padding: 0.65rem 0.9rem;
                    border-radius: 10px;
                    border: 1px solid var(--color-border);
                    background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
                    color: white;
                    font-weight: 600;
                    cursor: pointer;
                }

                .token-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .token-row {
                    padding: 0.9rem;
                    border: 1px solid var(--color-border);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: white;
                }

                .token-label { font-weight: 600; }
                .token-meta { color: var(--color-text-muted); font-size: 0.9rem; }

                .token-delete {
                    border: 1px solid var(--color-border);
                    background: white;
                    padding: 0.35rem;
                    border-radius: 10px;
                    cursor: pointer;
                }
            `}</style>
        </div>
    )
}

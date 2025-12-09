import { useState, useEffect, useCallback, useRef } from 'react'
import { Save, Loader2, Monitor, List, Clock, Zap, Plus, Trash2, ShieldCheck } from 'lucide-react'
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
        animation_duration: 5
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
                        animation_duration: data.animation_duration
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
                            animation_duration: 5
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
                {/* Product View Settings */}
                <div className="glass-panel settings-card">
                    <div className="card-header">
                        <Monitor className="text-primary" size={24} />
                        <h3>Keşfedilen Ürünler Görünümü</h3>
                    </div>
                    <div className="card-content">
                        <p className="setting-desc">Ürünler sayfasında kartların nasıl listeleneceğini seç.</p>

                        <div className="radio-group">
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
                    </div>
                </div>

                {/* List & Animation Settings */}
                <div className="glass-panel settings-card">
                    <div className="card-header">
                        <Zap className="text-orange-500" size={24} />
                        <h3>Performans ve Liste</h3>
                    </div>

                    <div className="card-content form-layout">
                        {/* Product Count */}
                        <div className="form-group">
                            <label className="input-label">
                                <List size={16} />
                                Görüntülenecek Ürün Sayısı
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
                            <p className="input-help">Sayfa başına gösterilecek kart sayısı.</p>
                        </div>

                        <div className="divider"></div>

                        {/* Animation Duration */}
                        <div className="form-group">
                            <label className="input-label">
                                <Clock size={16} />
                                Animasyon Süresi (Saniye)
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

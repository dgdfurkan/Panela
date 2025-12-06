
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Login() {
    const [loading, setLoading] = useState(false)
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(null)
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const result = await login(username, password)

        if (result.success) {
            navigate('/')
        } else {
            setError(result.error)
        }
        setLoading(false)
    }

    return (
        <div style={{
            display: 'flex',
            minHeight: '100vh',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#F3F0FF'
        }}>
            <div className="glass-panel fade-in" style={{
                padding: '3rem',
                borderRadius: 'var(--radius-xl)',
                width: '100%',
                maxWidth: '420px',
                textAlign: 'center'
            }}>
                <h1 style={{
                    fontSize: '3rem',
                    fontWeight: '800',
                    marginBottom: '1rem',
                    letterSpacing: '-1px',
                    color: 'var(--color-primary)'
                }}>
                    Panela
                </h1>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                    Giriş yap ve yönetmeye başla.
                </p>

                {error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: 'var(--color-error)',
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        marginBottom: '1.5rem',
                        fontSize: '0.9rem'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input
                        type="text"
                        placeholder="Kullanıcı Adı"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        style={{
                            padding: '0.875rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            background: 'rgba(255,255,255,0.8)',
                            fontSize: '1rem'
                        }}
                    />
                    <input
                        type="password"
                        placeholder="Şifre"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{
                            padding: '0.875rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            background: 'rgba(255,255,255,0.8)',
                            fontSize: '1rem'
                        }}
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            marginTop: '0.5rem',
                            padding: '0.875rem',
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--color-primary)',
                            color: 'white',
                            fontWeight: '600',
                            fontSize: '1rem',
                            boxShadow: 'var(--shadow-glow)',
                            transition: 'transform 0.2s',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? 'Kontrol Ediliyor...' : 'Giriş Yap'}
                    </button>
                </form>
            </div>
        </div>
    )
}

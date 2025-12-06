import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom' // Import useNavigate

export default function Login() {
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(null)
    const navigate = useNavigate() // Initialize hook

    const handleAuth = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const result = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (result.error) throw result.error
            // Navigate to dashboard on success (though AuthContext usually handles redirect protection)
            if (!result.error) navigate('/')

        } catch (error) {
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            display: 'flex',
            minHeight: '100vh',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #F3F0FF 0%, #E0F2FE 100%)'
        }}>
            <div className="glass-panel fade-in" style={{
                padding: '3rem',
                borderRadius: 'var(--radius-xl)',
                width: '100%',
                maxWidth: '420px',
                textAlign: 'center'
            }}>
                <h1 className="text-gradient" style={{
                    fontSize: '2.5rem',
                    fontWeight: '800',
                    marginBottom: '0.5rem',
                    letterSpacing: '-1px'
                }}>
                    Panela
                </h1>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                    Tekrar hoşgeldiniz!
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

                <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input
                        type="email"
                        placeholder="E-posta Adresi"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
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
                            background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
                            color: 'white',
                            fontWeight: '600',
                            fontSize: '1rem',
                            boxShadow: 'var(--shadow-glow)',
                            transition: 'transform 0.2s',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? 'İşleniyor...' : 'Giriş Yap'}
                    </button>
                </form>
            </div>
        </div>
    )
}
```

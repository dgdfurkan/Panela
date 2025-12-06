import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Check local storage for existing session
        const storedUser = localStorage.getItem('panela_user')
        if (storedUser) {
            setUser(JSON.parse(storedUser))
        }
        setLoading(false)
    }, [])

    const login = async (username, password) => {
        try {
            const { data, error } = await supabase
                .from('app_users')
                .select('*')
                .eq('username', username)
                .eq('password', password)
                .single()

            if (error || !data) throw new Error('Kullanıcı adı veya şifre hatalı')

            // Success
            setUser(data)
            localStorage.setItem('panela_user', JSON.stringify(data))
            return { success: true }
        } catch (e) {
            return { error: e.message }
        }
    }

    const signOut = () => {
        setUser(null)
        localStorage.removeItem('panela_user')
    }

    const value = {
        user,
        login,
        signOut,
        loading,
        session: user ? { user } : null // Compatibility adaptor
    }

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    )
}

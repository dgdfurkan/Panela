import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'

import DashboardLayout from './layouts/DashboardLayout'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Todos from './pages/Todos'
import Roadmap from './pages/Roadmap'
import Research from './pages/Research'

const ProtectedRoute = ({ children }) => {
  const { session, loading } = useAuth()

  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Yükleniyor...</div>

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return children
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/todos" element={<Todos />} />
        <Route path="/roadmap" element={<Roadmap />} />
        <Route path="/research" element={<Research />} />
      </Route>
    </Routes>
  )
}

export default App

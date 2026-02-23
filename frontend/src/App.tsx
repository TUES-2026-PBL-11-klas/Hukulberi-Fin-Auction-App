import { useState, useEffect } from 'react'
import './App.css'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import AdminPanelPage from '../AdminPanelPage'

type PageType = 'login' | 'home' | 'admin'

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('login')
  const [token, setToken] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is already logged in
    const savedToken = localStorage.getItem('authToken')
    const savedRole = localStorage.getItem('userRole')
    if (savedToken) {
      setToken(savedToken)
      setUserRole(savedRole)
      setCurrentPage(savedRole === 'admin' ? 'admin' : 'home')
    }
  }, [])

  const handleLogin = (token: string, role: string) => {
    setToken(token)
    setUserRole(role)
    localStorage.setItem('authToken', token)
    localStorage.setItem('userRole', role)
    setCurrentPage(role === 'admin' ? 'admin' : 'home')
  }

  const handleLogout = () => {
    setToken(null)
    setUserRole(null)
    localStorage.removeItem('authToken')
    localStorage.removeItem('userRole')
    setCurrentPage('login')
  }

  return (
    <div className="app-container">
      {currentPage === 'login' && <LoginPage onLogin={handleLogin} />}
      {currentPage === 'home' && token && <HomePage onLogout={handleLogout} />}
      {currentPage === 'admin' && token && <AdminPanelPage token={token} />}
    </div>
  )
}

export default App

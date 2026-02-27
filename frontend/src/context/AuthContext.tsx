import React, { createContext, useContext, useState, useEffect } from 'react';
import { refreshUserSession } from '../services/authService';

interface User {
  id: number;
  username?: string;
  email: string;
  role: 'user' | 'admin';
  banned?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  refreshSession: (token: string, user: User) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function decodeToken(token: string): User | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { id: payload.id, username: payload.username, email: payload.email, role: payload.role, banned: payload.banned };
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const saved = localStorage.getItem('token');
      if (saved) {
        const decoded = decodeToken(saved);
        if (decoded) {
          setToken(saved);
          setUser(decoded);
          
          // Fetch fresh user data from server on page load
          try {
            const freshData = await refreshUserSession(saved);
            setToken(freshData.token);
            setUser(freshData.user);
          } catch (err) {
            console.error('Failed to refresh user data on page load:', err);
            // Keep using decoded token data if refresh fails
          }
        } else {
          localStorage.removeItem('token');
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    // Listen for ban status change
    const handleBanned = () => {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    };

    window.addEventListener('auth-banned', handleBanned);
    return () => window.removeEventListener('auth-banned', handleBanned);
  }, []);

  // Auto-refresh session every 30 seconds if logged in
  useEffect(() => {
    if (!token || !user) return;

    const refreshInterval = setInterval(async () => {
      try {
        const data = await refreshUserSession(token);
        setToken(data.token);
        setUser(data.user);
      } catch (err) {
        console.error('Auto-refresh failed:', err);
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(refreshInterval);
  }, [token, user]);

  // Refresh session when window regains focus
  useEffect(() => {
    const handleFocus = async () => {
      if (!token || !user) return;
      try {
        const data = await refreshUserSession(token);
        setToken(data.token);
        setUser(data.user);
      } catch (err) {
        console.error('Focus refresh failed:', err);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [token, user]);

  const login = (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(decodeToken(newToken));
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const refreshSessionManual = (newToken: string, userData: User) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, refreshSession: refreshSessionManual, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

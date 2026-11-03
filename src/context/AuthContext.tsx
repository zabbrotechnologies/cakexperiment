import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { storageService, DEMO_ADMIN, DEMO_STUDENT } from '../services/storage';

const TOKEN_KEY = 'cakexperiment_auth_token';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isStudent: boolean;
  signIn: (email: string, pass: string) => Promise<{ success: boolean; message?: string; redirectTo?: string }>;
  signUp: (name: string, email: string, pass: string) => Promise<{ success: boolean; message?: string; redirectTo?: string }>;
  signOut: () => void;
  refreshUser: () => void;
  hasCourseAccess: (courseId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const res = await fetch('/api/auth/me', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.user) {
          setUser(data.user);
          return;
        }
      }
    } catch {
      // API unavailable or network error, fallback to local storage
    }

    // Fallback to local storage if API not available
    const localUser = storageService.getCurrentUser();
    setUser(localUser);
  };

  useEffect(() => {
    storageService.init();
    fetchCurrentUser().finally(() => setLoading(false));
  }, []);

  const refreshUser = () => {
    fetchCurrentUser();
  };

  const signIn = async (email: string, pass: string) => {
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });

      const data = await res.json();
      if (res.ok && data.success && data.user) {
        if (data.token) {
          localStorage.setItem(TOKEN_KEY, data.token);
        }
        setUser(data.user);
        return {
          success: true,
          redirectTo: data.redirectTo || (data.user.role === 'ADMIN' ? '/admin/dashboard' : '/learn')
        };
      }

      return {
        success: false,
        message: data.error || 'Invalid credentials'
      };
    } catch (err: any) {
      // Fallback for offline demo mode
      const res = storageService.signIn(email, pass);
      if (res.success && res.user) {
        setUser(res.user);
        const redirectTo = res.user.role === 'admin' ? '/admin/dashboard' : '/learn';
        return { success: true, redirectTo };
      }
      return { success: false, message: res.message || err.message || 'Authentication error' };
    }
  };

  const signUp = async (name: string, email: string, pass: string) => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password: pass, confirmPassword: pass })
      });

      const data = await res.json();
      if (res.ok && data.success && data.user) {
        if (data.token) {
          localStorage.setItem(TOKEN_KEY, data.token);
        }
        setUser(data.user);
        return {
          success: true,
          redirectTo: data.redirectTo || '/learn'
        };
      }

      return {
        success: false,
        message: data.error || 'Could not complete registration'
      };
    } catch (err: any) {
      const res = storageService.signUp(name, email, pass);
      if (res.success && res.user) {
        setUser(res.user);
        return { success: true, redirectTo: '/learn' };
      }
      return { success: false, message: res.message || err.message || 'Could not register' };
    }
  };

  const signOut = () => {
    const token = localStorage.getItem(TOKEN_KEY);
    fetch('/api/auth/signout', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    }).catch(() => {});

    localStorage.removeItem(TOKEN_KEY);
    storageService.signOut();
    setUser(null);
  };

  const hasCourseAccess = (courseId: string): boolean => {
    if (!user) return false;
    if (user.role === 'ADMIN' || user.role === 'admin') return true;
    return storageService.isEnrolled(user.id, courseId);
  };

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'admin';
  const isStudent = user?.role === 'USER' || user?.role === 'student';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        isAdmin,
        isStudent,
        signIn,
        signUp,
        signOut,
        refreshUser,
        hasCourseAccess
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { DEMO_ADMIN, DEMO_STUDENT };

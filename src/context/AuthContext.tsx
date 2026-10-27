import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { storageService, DEMO_ADMIN, DEMO_STUDENT } from '../services/storage';

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

  useEffect(() => {
    storageService.init();
    const currentUser = storageService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const refreshUser = () => {
    const currentUser = storageService.getCurrentUser();
    setUser(currentUser);
  };

  const signIn = async (email: string, pass: string) => {
    const res = storageService.signIn(email, pass);
    if (res.success && res.user) {
      setUser(res.user);
      const redirectTo = res.user.role === 'admin' ? '/admin' : '/learn';
      return { success: true, redirectTo };
    }
    return { success: false, message: res.message || 'Invalid credentials' };
  };

  const signUp = async (name: string, email: string, pass: string) => {
    const res = storageService.signUp(name, email, pass);
    if (res.success && res.user) {
      setUser(res.user);
      return { success: true, redirectTo: '/learn' };
    }
    return { success: false, message: res.message || 'Could not register' };
  };

  const signOut = () => {
    storageService.signOut();
    setUser(null);
  };

  const hasCourseAccess = (courseId: string): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true; // admin preview
    return storageService.isEnrolled(user.id, courseId);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isStudent: user?.role === 'student',
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

// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, UserProfile } from '../types/erp.ts';
import { DEMO_USERS } from '../services/db.ts';

interface AuthContextType {
  currentUser: UserProfile;
  setRole: (role: UserRole) => void;
  setUser: (user: UserProfile) => void;
  availableUsers: UserProfile[];
  canAccess: (module: 'sales' | 'procurement' | 'production' | 'dispatch' | 'reports' | 'admin') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_USER_KEY = 'elite_packages_current_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUserState] = useState<UserProfile>(() => {
    try {
      const stored = localStorage.getItem(AUTH_USER_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const match = DEMO_USERS.find((u) => u.id === parsed.id);
        if (match) return match;
      }
    } catch {
      // fallback
    }
    return DEMO_USERS[0]; // Admin by default
  });

  const setUser = (user: UserProfile) => {
    setCurrentUserState(user);
    try {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
  };

  const setRole = (role: UserRole) => {
    const user = DEMO_USERS.find((u) => u.role === role) || DEMO_USERS[0];
    setUser(user);
  };

  const canAccess = (module: 'sales' | 'procurement' | 'production' | 'dispatch' | 'reports' | 'admin'): boolean => {
    if (currentUser.role === 'admin') return true;

    switch (module) {
      case 'sales':
        return ['sales', 'accounts'].includes(currentUser.role);
      case 'procurement':
        return ['store', 'accounts'].includes(currentUser.role);
      case 'production':
        return ['production', 'store'].includes(currentUser.role);
      case 'dispatch':
        return ['sales', 'store', 'production', 'accounts'].includes(currentUser.role);
      case 'reports':
        return ['accounts', 'sales', 'production'].includes(currentUser.role);
      case 'admin':
        return true;
      default:
        return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setRole,
        setUser,
        availableUsers: DEMO_USERS,
        canAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

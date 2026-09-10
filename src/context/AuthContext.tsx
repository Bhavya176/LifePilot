import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types/user';
import {
  subscribeToAuthChanges,
  logoutUser,
  deleteUserAccount,
  resetPassword,
  sendVerificationEmail,
  auth,
} from '../firebase/auth';
import { SentryService } from '../services/sentry';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  setUser: (user: UserProfile | null) => void;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  verifyEmail: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUser: () => {},
  signOut: async () => {},
  deleteAccount: async () => {},
  sendPasswordReset: async () => {},
  verifyEmail: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (auth.currentUser) {
      return {
        uid: auth.currentUser.uid,
        name: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'User',
        email: auth.currentUser.email || '',
        emailVerified: auth.currentUser.emailVerified,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Firebase Auth real-time listener for authentication state persistence
    const unsubscribe = subscribeToAuthChanges((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        SentryService.setUser(currentUser.uid, currentUser.email, currentUser.name);
        SentryService.addBreadcrumb('Auth state changed: signed in', 'auth', 'info');
      } else {
        SentryService.setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.warn('Logout error:', e);
    } finally {
      setUser(null);
      SentryService.setUser(null);
      SentryService.addBreadcrumb('User signed out', 'auth', 'info');
    }
  };

  const deleteAccount = async () => {
    try {
      await deleteUserAccount();
    } finally {
      setUser(null);
      SentryService.setUser(null);
      SentryService.addBreadcrumb('User account deleted and session purged', 'auth', 'info');
    }
  };

  const sendPasswordReset = async (email: string) => {
    await resetPassword(email);
  };

  const verifyEmail = async () => {
    await sendVerificationEmail();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        setUser,
        signOut,
        deleteAccount,
        sendPasswordReset,
        verifyEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);


import React, { createContext, useContext, useEffect } from 'react';
import { useSession } from '../lib/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // useSession is a reactive hook provided by better-auth/react
  // It automatically fetches the session and user data
  const { data: session, isPending, error } = useSession();

  return (
    <AuthContext.Provider value={{ session, user: session?.user, isPending, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

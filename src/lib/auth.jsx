// Auth provider — exposes the current Supabase session, sign-in/up/out
// helpers, and a `loading` flag so the app can hold its UI until we know
// whether the user is authenticated.

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';

const AuthCtx = createContext({
  session: null,
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next ?? null);
    });
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, []);

  const value = {
    session,
    user: session?.user ?? null,
    loading,
    signIn: (email, password) =>
      supabase.auth.signInWithPassword({ email, password }),
    signUp: (email, password) =>
      supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      }),
    signOut: () => supabase.auth.signOut(),
    resetPassword: (email) =>
      supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      }),
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
};

export const useAuth = () => useContext(AuthCtx);

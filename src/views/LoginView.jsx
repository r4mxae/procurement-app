// Sign-in / sign-up screen — gates the rest of the app behind a
// Supabase session. Supports email+password and Google OAuth.

import React, { useState } from 'react';
import { AlertCircle, ArrowRight, Check, KeyRound, LogIn, Mail } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { isSupabaseConfigured } from '../lib/supabase';
import { LOGO_FULL_DARK_BG } from '../constants/logos';

export default function LoginView() {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState('signin'); // signin | signup | reset
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const configured = isSupabaseConfigured();

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setError('');
    setInfo('');
    setBusy(true);
    try {
      if (mode === 'signin') {
        const { error } = await signIn(email.trim(), password);
        if (error) throw error;
      } else if (mode === 'signup') {
        if (password.length < 8) throw new Error('Password must be at least 8 characters.');
        const { data, error } = await signUp(email.trim(), password);
        if (error) throw error;
        if (data?.user && !data?.session) {
          setInfo('Check your inbox for a confirmation email, then sign in.');
        }
      } else if (mode === 'reset') {
        const { error } = await resetPassword(email.trim());
        if (error) throw error;
        setInfo('If that email exists, a reset link is on its way.');
      }
    } catch (err) {
      setError(err?.message || 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pd-root" data-theme="obsidian">
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: 'var(--bg)' }}
      >
        <div
          className="w-full max-w-md p-8 rounded-2xl"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex flex-col items-center mb-6">
            <img src={LOGO_FULL_DARK_BG} alt="ProcTrax" style={{ height: 36, width: 'auto', marginBottom: 16 }} draggable={false} />
            <h1 className="pd-display text-2xl font-medium">
              {mode === 'signup' ? 'Create your account' : mode === 'reset' ? 'Reset your password' : 'Welcome back'}
            </h1>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {mode === 'signup'
                ? 'Sign up to access your private workspace'
                : mode === 'reset'
                ? 'We’ll send a reset link to your email'
                : 'Sign in to continue to your workspace'}
            </p>
          </div>

          {!configured && (
            <div
              className="flex items-start gap-2 px-3 py-2.5 rounded-lg mb-4 text-xs"
              style={{ background: 'rgba(201,122,122,0.12)', color: 'var(--danger)', border: '1px solid var(--danger)' }}
            >
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>
                Supabase is not configured. Set <span className="pd-mono">VITE_SUPABASE_URL</span> and <span className="pd-mono">VITE_SUPABASE_ANON_KEY</span> in your environment, then reload.
              </span>
            </div>
          )}

          <form onSubmit={submit} className="space-y-3">
            <label className="block">
              <span className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>Email</span>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pd-input rounded-lg pl-9 pr-3 py-2 text-sm w-full"
                  placeholder="you@company.com"
                />
              </div>
            </label>

            {mode !== 'reset' && (
              <label className="block">
                <span className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>Password</span>
                <div className="relative">
                  <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="password"
                    required
                    minLength={mode === 'signup' ? 8 : undefined}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pd-input rounded-lg pl-9 pr-3 py-2 text-sm w-full"
                    placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'}
                  />
                </div>
              </label>
            )}

            {error && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-lg text-xs" style={{ background: 'rgba(201,122,122,0.12)', color: 'var(--danger)' }}>
                <AlertCircle size={13} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            {info && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-lg text-xs" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                <Check size={13} className="shrink-0 mt-0.5" />
                <span>{info}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={busy || !configured}
              className="pd-btn pd-btn-primary w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
              style={{ cursor: busy || !configured ? 'not-allowed' : 'pointer', opacity: busy || !configured ? 0.6 : 1 }}
            >
              {busy ? 'Working…' : (
                <>
                  {mode === 'signup' ? 'Create account' : mode === 'reset' ? 'Send reset link' : 'Sign in'}
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
            {mode === 'signin' && (
              <>
                <button type="button" className="underline hover:opacity-80" onClick={() => { setMode('reset'); setError(''); setInfo(''); }}>Forgot password?</button>
                <span className="mx-2" style={{ color: 'var(--text-faint)' }}>·</span>
                <button type="button" className="underline hover:opacity-80" onClick={() => { setMode('signup'); setError(''); setInfo(''); }}>Create an account</button>
              </>
            )}
            {mode === 'signup' && (
              <button type="button" className="underline hover:opacity-80" onClick={() => { setMode('signin'); setError(''); setInfo(''); }}>
                <LogIn size={11} className="inline mr-1" /> Already have an account? Sign in
              </button>
            )}
            {mode === 'reset' && (
              <button type="button" className="underline hover:opacity-80" onClick={() => { setMode('signin'); setError(''); setInfo(''); }}>
                Back to sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

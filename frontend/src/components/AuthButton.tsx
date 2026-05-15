'use client';

import { useState } from 'react';
import { useAuth } from './AuthProvider';
import { signInWithGoogle, logout } from '@/lib/firebase';

export default function AuthButton() {
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);

  if (loading) return <div className="h-8 w-24 animate-pulse rounded-lg bg-gray-100" />;

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <img
          src={user.photoURL ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName ?? 'U')}`}
          alt={user.displayName ?? 'User'}
          className="h-8 w-8 rounded-full object-cover"
        />
        <button
          onClick={async () => { setBusy(true); await logout(); setBusy(false); }}
          disabled={busy}
          className="btn-secondary text-xs"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={async () => {
        setBusy(true);
        try { await signInWithGoogle(); } finally { setBusy(false); }
      }}
      disabled={busy}
      className="btn-primary text-xs"
    >
      {busy ? 'Signing in…' : 'Sign in with Google'}
    </button>
  );
}

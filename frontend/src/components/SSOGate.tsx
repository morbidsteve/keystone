import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import apiClient from '@/api/client';
import type { LoginResponse } from '@/lib/types';

/**
 * SSOGate — wraps the app when VITE_AUTH_MODE=sso.
 *
 * On mount it calls GET /api/v1/auth/sso which reads the x-auth-request-*
 * headers injected by OAuth2 Proxy.  On success it stores the JWT in
 * localStorage and renders the children (the main app).  On failure it
 * shows an error screen.
 */
export default function SSOGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    // If already authenticated, skip SSO handshake
    if (token && user) {
      setStatus('ok');
      return;
    }

    let cancelled = false;

    async function doSSO() {
      try {
        const resp = await apiClient.get<LoginResponse>('/auth/sso');
        if (cancelled) return;

        const data = resp.data;
        // Store in localStorage + zustand (same pattern as authStore.login)
        localStorage.setItem('keystone_token', data.token);
        localStorage.setItem('keystone_user', JSON.stringify(data.user));

        const perms = data.user.permissions ?? [];
        localStorage.setItem('keystone_permissions', JSON.stringify(perms));

        useAuthStore.setState({
          token: data.token,
          user: data.user,
          permissions: perms,
          isLoading: false,
          error: null,
        });

        setStatus('ok');
      } catch (err: unknown) {
        if (cancelled) return;
        const msg =
          (err as { response?: { data?: { detail?: string } } })?.response?.data
            ?.detail || 'SSO authentication failed';
        setErrorMsg(msg);
        setStatus('error');
      }
    }

    doSSO();
    return () => {
      cancelled = true;
    };
  }, [token, user]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--color-bg-primary)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-[var(--color-text-muted)] font-[var(--font-mono)]">
            Authenticating via SSO...
          </span>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--color-bg-primary)]">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <div className="text-[48px] font-bold text-[var(--color-danger)]">
            SSO Error
          </div>
          <div className="text-sm text-[var(--color-text-muted)] font-[var(--font-mono)]">
            {errorMsg}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-[var(--color-accent)] text-white rounded text-sm hover:opacity-90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

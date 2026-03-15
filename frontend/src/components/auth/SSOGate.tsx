/**
 * SSOGate — transparent SSO authentication wrapper.
 *
 * When VITE_AUTH_MODE=sso, this component calls the backend's /sso-user
 * endpoint on mount. The OAuth2 Proxy sitting in front of the app will have
 * already authenticated the user via Keycloak and set the X-Auth-Request-*
 * headers. The backend reads those headers, finds-or-creates the user, and
 * returns a JWT token + user object — exactly like a normal login response.
 *
 * When VITE_AUTH_MODE is anything else (or unset), this component is a no-op
 * passthrough that renders its children immediately.
 */

import { useEffect, useState } from 'react';
import { useAuthStore, DEFAULT_ROLE_PERMISSIONS } from '@/stores/authStore';

export default function SSOGate({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Already authenticated — nothing to do
    if (token) {
      setChecking(false);
      return;
    }

    fetch('/api/v1/auth/sso-user')
      .then((res) => {
        if (!res.ok) throw new Error('SSO not available');
        return res.json();
      })
      .then((data) => {
        const role = (data.user.role || 'commander').toLowerCase();
        const perms: string[] =
          data.user.permissions?.length > 0
            ? data.user.permissions
            : DEFAULT_ROLE_PERMISSIONS[role] || DEFAULT_ROLE_PERMISSIONS.commander;

        localStorage.setItem('keystone_token', data.token);
        localStorage.setItem('keystone_user', JSON.stringify(data.user));
        localStorage.setItem('keystone_permissions', JSON.stringify(perms));

        useAuthStore.setState({
          token: data.token,
          user: data.user,
          permissions: perms,
        });
        setChecking(false);
      })
      .catch(() => {
        // SSO unavailable — fall through to normal login flow
        setChecking(false);
      });
  }, [token]);

  if (checking) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: '#0a0e1a',
          color: '#94a3b8',
          fontFamily: 'monospace',
          fontSize: '13px',
          letterSpacing: '2px',
        }}
      >
        AUTHENTICATING...
      </div>
    );
  }

  return <>{children}</>;
}

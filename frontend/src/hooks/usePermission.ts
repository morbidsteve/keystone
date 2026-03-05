import { useAuthStore } from '../stores/authStore';

export function usePermission() {
  const user = useAuthStore((s) => s.user);
  const permissions = useAuthStore((s) => s.permissions);

  const hasPermission = (code: string): boolean => {
    if (!user) return false;
    const role = user.role?.toLowerCase();
    if (role === 'admin') return true;
    return permissions.includes(code);
  };

  const hasAnyPermission = (...codes: string[]): boolean => {
    if (!user) return false;
    const role = user.role?.toLowerCase();
    if (role === 'admin') return true;
    return codes.some((c) => permissions.includes(c));
  };

  const hasAllPermissions = (...codes: string[]): boolean => {
    if (!user) return false;
    const role = user.role?.toLowerCase();
    if (role === 'admin') return true;
    return codes.every((c) => permissions.includes(c));
  };

  const isAdmin = user?.role?.toLowerCase() === 'admin';

  return { hasPermission, hasAnyPermission, hasAllPermissions, isAdmin };
}

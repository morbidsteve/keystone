import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

export function useAuth() {
  const navigate = useNavigate();
  const { user, token, isLoading, error, clearError } = useAuthStore();
  const loginAction = useAuthStore((s) => s.login);
  const logoutAction = useAuthStore((s) => s.logout);

  const isAuthenticated = !!token && !!user;

  const login = useCallback(
    async (username: string, password: string) => {
      await loginAction(username, password);
      navigate('/dashboard');
    },
    [loginAction, navigate],
  );

  const logout = useCallback(() => {
    logoutAction();
    navigate('/login');
  }, [logoutAction, navigate]);

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    clearError,
  };
}

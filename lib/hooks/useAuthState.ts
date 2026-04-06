import { useSession } from 'next-auth/react';

export function useAuthState() {
  const { data: session, status } = useSession();
  return {
    isLoading: status === 'loading',
    isAuthenticated: !!session,
    isUnauthenticated: status === 'unauthenticated',
  };
}
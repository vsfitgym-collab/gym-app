import { useAuthStore } from "@/stores/authStore";

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const profileExtended = useAuthStore((state) => state.profileExtended);
  const loading = useAuthStore((state) => state.loading);
  const initialized = useAuthStore((state) => state.initialized);
  const fetchUser = useAuthStore((state) => state.fetchUser);
  const signOut = useAuthStore((state) => state.signOut);
  const hasAccess = useAuthStore((state) => state.hasAccess);

  const isAuthenticated = user !== null && initialized && !loading;

  return {
    user,
    profileExtended,
    loading,
    initialized,
    isAuthenticated,
    fetchUser,
    signOut,
    hasAccess,
  };
}
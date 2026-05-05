import { createContext, useContext, type ReactNode } from "react";
import { useAuthStore, type AuthState } from "@/stores/authStore";

interface AuthContextValue extends AuthState {
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const store = useAuthStore();
  const isAuthenticated = store.user !== null && store.initialized && !store.loading;

  return (
    <AuthContext.Provider value={{ ...store, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
}
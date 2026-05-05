import { create } from "zustand";
import {
  supabase,
  type Profile,
  type UserProfileExtended,
} from "@/lib/supabase";
import { isPlanActive } from "@/lib/services/featureAccess";

export interface AuthState {
  user: Profile | null;
  profileExtended: UserProfileExtended | null;
  loading: boolean;
  initialized: boolean;
  isFetching: boolean;
  setUser: (user: Profile | null) => void;
  setProfileExtended: (profile: UserProfileExtended | null) => void;
  setLoading: (loading: boolean) => void;
  fetchUser: () => Promise<void>;
  signOut: () => Promise<void>;
  hasAccess: () => Promise<boolean>;
  initAuth: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profileExtended: null,
  loading: true,
  initialized: false,
  isFetching: false,

  setUser: (user) => set({ user }),
  setProfileExtended: (profileExtended) => set({ profileExtended }),
  setLoading: (loading) => set({ loading }),

  initAuth: () => {
    if (get().initialized) return;

    console.log('[initAuth] Starting bootstrap...');
    const timeoutId = setTimeout(() => {
      if (!get().initialized && !get().isFetching) {
        console.warn('[initAuth] Boot timeout reached (8s). Forcing initialization.');
        set({ loading: false, initialized: true });
      }
    }, 8000);

    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[initAuth] onAuthStateChange event:', event);
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Only call fetchUser if we don't have a user yet. 
        // The bootstrap process (getSession) already handles the first fetch.
        if (!get().user && !get().isFetching) {
           await get().fetchUser();
        }
      } else if (event === 'SIGNED_OUT') {
        set({ user: null, profileExtended: null, loading: false });
      }
    });

    (async () => {
      try {
        console.log('[initAuth] Fetching session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session?.user) {
          console.log('[initAuth] Session found, fetching user profile...');
          await get().fetchUser();
        } else {
          console.log('[initAuth] No session found.');
        }
      } catch (error) {
        console.error('[initAuth] Session bootstrap error:', error);
      } finally {
        console.log('[initAuth] Bootstrap finished.');
        set({ loading: false, initialized: true });
        clearTimeout(timeoutId);
      }
    })();
  },

  fetchUser: async () => {
    if (get().isFetching) {
      return;
    }
 
    set({ isFetching: true });
    try {
      const getUserPromise = supabase.auth.getUser();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Supabase getUser() request timed out')), 5000)
      );

      const { data: { user: authUser }, error: userError } = await Promise.race([
        getUserPromise,
        timeoutPromise
      ]) as { data: { user: any }, error: any };

      if (userError) throw userError;
 
      if (!authUser) {
        set({ user: null, profileExtended: null, isFetching: false });
        return;
      }
 
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();
      
      if (profileError) throw profileError;
 
      if (!profile) {
        set({ user: null, profileExtended: null, isFetching: false });
        return;
      }
 
      const { data: profileExtended, error: extendedError } = await supabase
        .from("user_profiles_extended")
        .select("*")
        .eq("user_id", authUser.id)
        .maybeSingle();
      
      if (extendedError) throw extendedError;
 
      set({
        user: profile as Profile,
        profileExtended: profileExtended as UserProfileExtended | null,
        isFetching: false,
      });
    } catch (error) {
      console.error("[fetchUser] Critical Error:", error);
      set({ user: null, profileExtended: null, isFetching: false });
      throw error;
    }
  },

  signOut: async () => {
    set({ user: null, profileExtended: null, loading: false, isFetching: false });
    await supabase.auth.signOut();
  },

  hasAccess: async () => {
    const { user, profileExtended } = get();
    if (!user) return false;
    if (user.role === "trainer") return true;

    const hasSubscription = await isPlanActive(user.id);
    if (hasSubscription) return true;

    if (!profileExtended) return false;

    const now = new Date();
    const startDate = new Date(profileExtended.created_at || "");
    const diffDays = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    return diffDays <= 7;
  },
}));

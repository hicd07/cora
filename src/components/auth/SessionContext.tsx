import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { AppProfile } from "@/lib/types";

export type Profile = AppProfile;

interface SessionContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  roles: string[];
  isAdmin: boolean;
  loading: boolean;
  profileError: boolean;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType>({
  session: null,
  user: null,
  profile: null,
  roles: [],
  isAdmin: false,
  loading: true,
  profileError: false,
  refreshProfile: async () => {},
  updateProfile: async () => {},
  signOut: async () => {},
});

const createEmptyProfile = (userId: string): Profile => ({
  id: userId,
  full_name: null,
  document_id: null,
  user_type: null,
  onboarded: false,
  store_name: null,
  sector: null,
  delivery_coverage: [],
  is_public: false,
  rating: null,
  reviews_count: 0,
  cover_url: null,
});

const isProfileCompleted = (profile: Partial<Profile> | null | undefined) =>
  Boolean(profile?.full_name && profile?.document_id && profile?.user_type);

// Wraps a promise with a hard timeout so the UI never gets stuck on "Cargando PIDO"
const withTimeout = <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout: ${label} (${ms}ms)`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });

export const SessionContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(false);

  // Avoid re-fetching the profile on every auth event (e.g. TOKEN_REFRESHED on tab focus)
  const lastFetchedUserIdRef = useRef<string | null>(null);

  const fetchRoles = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      if (error) {
        console.error("Error fetching roles:", error);
        setRoles([]);
        return;
      }
      setRoles((data ?? []).map((r) => r.role));
    } catch (error) {
      console.error("Roles fetch failed:", error);
      setRoles([]);
    }
  }, []);

  const fetchProfile = useCallback(async (userId: string) => {
    setProfileError(false);
    try {
      const query = Promise.resolve(
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      );
      const { data, error } = await withTimeout(query, 10000, "fetchProfile");

      if (error) {
        // If the profile row is missing or RLS blocks read, fall back to an empty profile
        // so the user can still complete onboarding instead of seeing an infinite loader.
        console.error("Error fetching profile:", error);
        const emptyProfile = createEmptyProfile(userId);
        setProfile(emptyProfile);
        return emptyProfile;
      }

      if (!data) {
        const emptyProfile = createEmptyProfile(userId);
        setProfile(emptyProfile);
        return emptyProfile;
      }

      const mappedProfile: Profile = {
        id: data.id,
        full_name: data.full_name ?? null,
        document_id: data.document_id ?? null,
        user_type: data.user_type ?? null,
        onboarded: Boolean(data.onboarded ?? isProfileCompleted(data)),
        store_name: data.store_name ?? null,
        sector: data.sector ?? null,
        delivery_coverage: data.delivery_coverage ?? [],
        is_public: Boolean(data.is_public),
        rating: data.rating && Number(data.rating) > 0 ? Number(data.rating) : null,
        reviews_count: data.reviews_count ?? 0,
        cover_url: data.cover_url ?? null,
      };

      setProfile(mappedProfile);
      lastFetchedUserIdRef.current = userId;
      return mappedProfile;
    } catch (error) {
      console.error("Profile fetch failed or timed out:", error);
      // Surface the error and still hydrate a fallback profile so ProtectedRoute can render.
      setProfileError(true);
      const emptyProfile = createEmptyProfile(userId);
      setProfile(emptyProfile);
      return emptyProfile;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      await Promise.all([fetchProfile(user.id), fetchRoles(user.id)]);
    } finally {
      setLoading(false);
    }
  }, [fetchProfile, fetchRoles, user]);

  const updateProfile = useCallback(
    async (updates: Partial<Profile>) => {
      if (!user) return;

      const nextProfile: Profile = {
        ...(profile ?? createEmptyProfile(user.id)),
        ...updates,
        id: user.id,
      };

      const onboarded = nextProfile.onboarded || isProfileCompleted(nextProfile);

      const { error } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          full_name: nextProfile.full_name,
          document_id: nextProfile.document_id,
          user_type: nextProfile.user_type,
          onboarded,
          store_name: nextProfile.store_name,
          sector: nextProfile.sector,
          delivery_coverage: nextProfile.delivery_coverage ?? [],
          is_public: nextProfile.is_public ?? false,
          rating: nextProfile.rating ?? 0,
          reviews_count: nextProfile.reviews_count ?? 0,
          cover_url: nextProfile.cover_url ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );

      if (error) {
        throw error;
      }

      setProfile({ ...nextProfile, onboarded });
    },
    [profile, user],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setRoles([]);
    lastFetchedUserIdRef.current = null;
  }, []);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      setLoading(true);
      try {
        const { data } = await withTimeout(supabase.auth.getSession(), 8000, "getSession");
        const currentSession = data.session;

        if (!mounted) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          await Promise.all([
            fetchProfile(currentSession.user.id),
            fetchRoles(currentSession.user.id),
          ]);
        } else {
          setProfile(null);
          setRoles([]);
          lastFetchedUserIdRef.current = null;
        }
      } catch (error) {
        console.error("Error initializing session:", error);
        // Make sure we don't stay stuck on the loader if Supabase is unreachable.
        if (mounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;

      // Always keep session/user in sync, but avoid triggering a full-screen loader
      // for background events that shouldn't unmount the app (TOKEN_REFRESHED, USER_UPDATED,
      // or INITIAL_SESSION when we already have the same user loaded).
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (event === "SIGNED_OUT") {
        setProfile(null);
        setRoles([]);
        lastFetchedUserIdRef.current = null;
        setLoading(false);
        return;
      }

      const nextUserId = currentSession?.user?.id ?? null;

      // When a user clicks a recovery link, Supabase sets the session
      if (event === "PASSWORD_RECOVERY") {
        console.log("Password recovery event triggered");
        // Ensure the AuthSheet opens in recovery mode
        return;
      }

      // Background refresh events: do NOT toggle global loading.
      if (event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        return;
      }

      // Initial session for the same user we already hydrated → no need to reload.
      if (
        event === "INITIAL_SESSION" &&
        nextUserId &&
        lastFetchedUserIdRef.current === nextUserId
      ) {
        return;
      }

      // Real sign-in or user change → fetch profile with a visible loader.
      if (nextUserId && nextUserId !== lastFetchedUserIdRef.current) {
        setLoading(true);
        try {
          await Promise.all([fetchProfile(nextUserId), fetchRoles(nextUserId)]);
        } catch (error) {
          console.error("Error during auth state change:", error);
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      } else if (!nextUserId) {
        setProfile(null);
        setRoles([]);
        lastFetchedUserIdRef.current = null;
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile, fetchRoles]);

  const isAdmin = roles.includes("admin");

  return (
    <SessionContext.Provider
      value={{
        session,
        user,
        profile,
        roles,
        isAdmin,
        loading,
        profileError,
        refreshProfile,
        updateProfile,
        signOut,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSessionContext = () => useContext(SessionContext);
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { AppProfile } from "@/lib/types";

export type Profile = AppProfile;

interface SessionContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
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
});

const isProfileCompleted = (profile: Partial<Profile> | null | undefined) => Boolean(profile?.full_name && profile?.document_id && profile?.user_type);

export const SessionContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();

    if (error || !data) {
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
    };

    setProfile(mappedProfile);
    return mappedProfile;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    await fetchProfile(user.id);
    setLoading(false);
  }, [fetchProfile, user]);

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
  }, []);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      setLoading(true);
      const { data } = await supabase.auth.getSession();
      const currentSession = data.session;

      if (!mounted) return;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        await fetchProfile(currentSession.user.id);
      } else {
        setProfile(null);
      }

      if (mounted) {
        setLoading(false);
      }
    };

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      if (!mounted) return;

      setLoading(true);
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        await fetchProfile(currentSession.user.id);
      } else {
        setProfile(null);
      }

      if (mounted) {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  return <SessionContext.Provider value={{ session, user, profile, loading, refreshProfile, updateProfile, signOut }}>{children}</SessionContext.Provider>;
};

export const useSessionContext = () => useContext(SessionContext);

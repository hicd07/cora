import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface Profile {
  id: string;
  full_name: string | null;
  document_id: string | null;
  user_type: 'engineer' | 'hardware' | null;
  onboarded: boolean;
  store_name?: string | null;
  sector?: string | null;
  delivery_coverage?: string[];
  is_public?: boolean;
  rating?: number;
  reviews_count?: number;
}

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

const getLocalProfile = (userId: string): Profile | null => {
  const localProfileStr = localStorage.getItem(`profile_${userId}`);
  return localProfileStr ? JSON.parse(localProfileStr) : null;
};

const saveLocalProfile = (userId: string, profile: Profile) => {
  localStorage.setItem(`profile_${userId}`, JSON.stringify(profile));
};

const isProfileCompleted = (profile: Partial<Profile> | null | undefined) => {
  return Boolean(
    profile?.full_name &&
    profile?.document_id &&
    profile?.user_type
  );
};

const buildFallbackProfile = (userId: string, localProfile?: Profile | null): Profile => ({
  id: userId,
  full_name: localProfile?.full_name ?? null,
  document_id: localProfile?.document_id ?? null,
  user_type: localProfile?.user_type ?? null,
  onboarded: localProfile?.onboarded ?? isProfileCompleted(localProfile),
  store_name: localProfile?.store_name ?? null,
  sector: localProfile?.sector ?? 'Alma Rosa I',
  delivery_coverage: localProfile?.delivery_coverage ?? ['Alma Rosa I', 'Alma Rosa II'],
  is_public: localProfile?.is_public ?? true,
  rating: localProfile?.rating ?? 5.0,
  reviews_count: localProfile?.reviews_count ?? 0,
});

export const SessionContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const localProfile = getLocalProfile(userId);
    const fallbackProfile = buildFallbackProfile(userId, localProfile);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) {
      setProfile(fallbackProfile);
      if (localProfile) {
        saveLocalProfile(userId, fallbackProfile);
      }
      return fallbackProfile;
    }

    const mergedProfile: Profile = {
      id: data.id,
      full_name: data.full_name ?? localProfile?.full_name ?? null,
      document_id: data.document_id ?? localProfile?.document_id ?? null,
      user_type: data.user_type ?? localProfile?.user_type ?? null,
      onboarded:
        data.onboarded ??
        localProfile?.onboarded ??
        isProfileCompleted({
          full_name: data.full_name ?? localProfile?.full_name,
          document_id: data.document_id ?? localProfile?.document_id,
          user_type: data.user_type ?? localProfile?.user_type,
        }),
      store_name: data.store_name ?? localProfile?.store_name ?? data.full_name ?? null,
      sector: data.sector ?? localProfile?.sector ?? 'Alma Rosa I',
      delivery_coverage: data.delivery_coverage ?? localProfile?.delivery_coverage ?? ['Alma Rosa I', 'Alma Rosa II'],
      is_public: data.is_public ?? localProfile?.is_public ?? true,
      rating: data.rating ?? localProfile?.rating ?? 5.0,
      reviews_count: data.reviews_count ?? localProfile?.reviews_count ?? 0,
    };

    setProfile(mergedProfile);
    saveLocalProfile(userId, mergedProfile);
    return mergedProfile;
  };

  const refreshProfile = async () => {
    if (!user) return;
    setLoading(true);
    await fetchProfile(user.id);
    setLoading(false);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;

    const completedProfile = {
      ...profile,
      ...updates,
      id: user.id,
    } as Profile;

    const updatedProfile: Profile = {
      ...completedProfile,
      onboarded: completedProfile.onboarded || isProfileCompleted(completedProfile),
    };

    const { error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          full_name: updatedProfile.full_name,
          document_id: updatedProfile.document_id,
          user_type: updatedProfile.user_type,
          onboarded: updatedProfile.onboarded,
          store_name: updatedProfile.store_name,
          sector: updatedProfile.sector,
          delivery_coverage: updatedProfile.delivery_coverage,
          is_public: updatedProfile.is_public,
          rating: updatedProfile.rating,
          reviews_count: updatedProfile.reviews_count,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    saveLocalProfile(user.id, updatedProfile);
    setProfile(updatedProfile);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  };

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
  }, []);

  return (
    <SessionContext.Provider value={{ session, user, profile, loading, refreshProfile, updateProfile, signOut }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSessionContext = () => useContext(SessionContext);
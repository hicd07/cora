import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface Profile {
  id: string;
  full_name: string | null;
  document_id: string | null; // RNC or Cedula
  user_type: 'engineer' | 'hardware' | null;
  onboarded: boolean;
  // Provider specific fields
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

export const SessionContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Fallback to local storage to ensure 100% uptime and support custom fields
      const localProfileStr = localStorage.getItem(`profile_${userId}`);
      const localProfile = localProfileStr ? JSON.parse(localProfileStr) : null;

      if (error) {
        console.log('Profile fetch error or not found, using local profile:', error.message);
        if (localProfile) {
          setProfile(localProfile);
        } else {
          const tempProfile: Profile = {
            id: userId,
            full_name: null,
            document_id: null,
            user_type: null,
            onboarded: false,
            store_name: null,
            sector: 'Alma Rosa I',
            delivery_coverage: ['Alma Rosa I', 'Alma Rosa II'],
            is_public: true,
            rating: 5.0,
            reviews_count: 0,
          };
          setProfile(tempProfile);
        }
      } else if (data) {
        // Merge database data with local storage custom fields if any
        const mergedProfile: Profile = {
          id: data.id,
          full_name: data.full_name || data.first_name || localProfile?.full_name || null,
          document_id: data.document_id || localProfile?.document_id || null,
          user_type: data.user_type || localProfile?.user_type || null,
          onboarded: data.onboarded || localProfile?.onboarded || false,
          store_name: data.store_name || localProfile?.store_name || data.full_name || null,
          sector: data.sector || localProfile?.sector || 'Alma Rosa I',
          delivery_coverage: data.delivery_coverage || localProfile?.delivery_coverage || ['Alma Rosa I', 'Alma Rosa II'],
          is_public: data.is_public !== undefined ? data.is_public : (localProfile?.is_public !== undefined ? localProfile.is_public : true),
          rating: data.rating || localProfile?.rating || 5.0,
          reviews_count: data.reviews_count || localProfile?.reviews_count || 0,
        };
        setProfile(mergedProfile);
        // Keep local storage in sync
        localStorage.setItem(`profile_${userId}`, JSON.stringify(mergedProfile));
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;

    try {
      const updatedProfile = {
        ...profile,
        ...updates,
        id: user.id,
      } as Profile;

      // Save to local storage first for instant update and fallback
      localStorage.setItem(`profile_${user.id}`, JSON.stringify(updatedProfile));
      setProfile(updatedProfile);

      // Try to save to Supabase profiles table
      const { error } = await supabase
        .from('profiles')
        .upsert({
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
        });

      if (error) {
        console.warn('Database upsert failed, using local storage fallback:', error.message);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).then(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        await fetchProfile(currentSession.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
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
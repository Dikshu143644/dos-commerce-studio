import { createContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';

export type UserRole = 'viewer' | 'client' | 'staff' | 'manager' | 'admin';

export interface AuthState {
  user: SupabaseUser | null;
  session: Session | null;
  profile: Profile | null;
  userRole: UserRole;
  loading: boolean;
  initialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loginWithOAuth: (provider: 'google' | 'github') => Promise<void>;
}

export const AuthContext = createContext<AuthState | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

async function fetchUserProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) return null;
    return data as Profile;
  } catch {
    return null;
  }
}

async function fetchRoleName(roleId: string | null): Promise<UserRole> {
  if (!roleId) return 'viewer';
  try {
    const { data, error } = await supabase
      .from('roles')
      .select('name')
      .eq('id', roleId)
      .single();
    if (error || !data) return 'viewer';
    const name = (data.name as string).toLowerCase();
    if (name === 'admin') return 'admin';
    if (name === 'manager') return 'manager';
    if (name === 'staff') return 'staff';
    if (name === 'client') return 'client';
    return 'viewer';
  } catch {
    return 'viewer';
  }
}

async function createProfileForUser(
  userId: string,
  email: string,
  fullName: string,
  phone: string | null
): Promise<void> {
  try {
    // Get or use a default viewer role ID
    const { data: roleData } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'viewer')
      .single();

    await supabase.from('profiles').upsert(
      {
        id: userId,
        email,
        full_name: fullName,
        phone,
        role_id: roleData?.id ?? null,
        is_active: true,
      },
      { onConflict: 'id' }
    );
  } catch {
    // Profile creation is best-effort; Supabase trigger may also handle it
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('viewer');
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const loadProfile = useCallback(async (currentUser: SupabaseUser | null) => {
    if (!currentUser) {
      setProfile(null);
      setUserRole('viewer');
      return;
    }
    const prof = await fetchUserProfile(currentUser.id);
    setProfile(prof);
    if (prof) {
      const role = await fetchRoleName(prof.role_id);
      setUserRole(role);
    } else {
      setUserRole('viewer');
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);
      await loadProfile(currentUser);
      setInitialized(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      const newUser = newSession?.user ?? null;
      setUser(newUser);
      await loadProfile(newUser);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(
    async (email: string, password: string, metadata?: Record<string, unknown>) => {
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: metadata },
        });
        if (error) throw error;

        // Create profile after successful signup
        if (data.user) {
          const fullName = (metadata?.full_name as string) || '';
          const phone = (metadata?.phone as string) || null;
          await createProfileForUser(data.user.id, email, fullName, phone);
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const loginWithOAuth = useCallback(async (provider: 'google' | 'github') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) throw error;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        userRole,
        loading,
        initialized,
        login,
        signup,
        logout,
        resetPassword,
        loginWithOAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

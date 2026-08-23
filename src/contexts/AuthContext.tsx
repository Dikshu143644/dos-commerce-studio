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
}

export const AuthContext = createContext<AuthState | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

function resolveRoleName(name: string | null | undefined): UserRole {
  if (!name) return 'viewer';
  const lower = name.toLowerCase();
  if (lower === 'admin') return 'admin';
  if (lower === 'manager') return 'manager';
  if (lower === 'staff') return 'staff';
  if (lower === 'client') return 'client';
  return 'viewer';
}

async function fetchProfileWithRole(userId: string): Promise<{ profile: Profile | null; role: UserRole }> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, roles(name)')
      .eq('id', userId)
      .single();
    if (error || !data) return { profile: null, role: 'viewer' };
    // Extract role name from joined result
    const roleName = (data.roles as { name: string } | null)?.name ?? null;
    // Remove the joined `roles` field from the profile object
    const { roles: _roles, ...profileData } = data as Record<string, unknown>;
    return {
      profile: profileData as unknown as Profile,
      role: resolveRoleName(roleName),
    };
  } catch {
    return { profile: null, role: 'viewer' };
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
    const { profile: prof, role } = await fetchProfileWithRole(currentUser.id);
    setProfile(prof);
    setUserRole(role);
  }, []);

  useEffect(() => {
    // Handle OAuth callback - check for hash fragments OR PKCE code parameter
    const hashParams = window.location.hash;
    const searchParams = window.location.search;
    const hasOAuthReturn =
      (hashParams && (hashParams.includes('access_token') || hashParams.includes('refresh_token'))) ||
      (searchParams && searchParams.includes('code='));

    if (hasOAuthReturn) {
      // For PKCE flow: Supabase JS automatically exchanges the code for a session
      // via getSession(). We just need to wait for it to complete.
      supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
        setSession(currentSession);
        const currentUser = currentSession?.user ?? null;
        setUser(currentUser);
        await loadProfile(currentUser);
        setInitialized(true);
        // Clean up the URL (remove hash/code params)
        if (currentUser) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      });
    } else {
      supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
        setSession(currentSession);
        const currentUser = currentSession?.user ?? null;
        setUser(currentUser);
        await loadProfile(currentUser);
        setInitialized(true);
      });
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      const newUser = newSession?.user ?? null;
      setUser(newUser);
      await loadProfile(newUser);
      // Mark initialized on any auth event (covers OAuth SIGNED_IN)
      setInitialized(true);
      // Create profile for OAuth users on first sign-in
      if (event === 'SIGNED_IN' && newUser) {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', newUser.id)
          .single();
        if (!existingProfile) {
          await createProfileForUser(
            newUser.id,
            newUser.email || '',
            newUser.user_metadata?.full_name || newUser.user_metadata?.name || '',
            newUser.user_metadata?.phone || null
          );
        }
      }
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

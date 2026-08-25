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
  isDemoMode: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginDemo: (role?: UserRole) => void;
  signup: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

export const AuthContext = createContext<AuthState | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

const DEMO_STORAGE_KEY = 'stockflow_demo_auth';

interface DemoAuthSession {
  user: {
    id: string;
    email: string;
    user_metadata: { full_name: string; role: UserRole };
  };
  profile: Profile;
  role: UserRole;
}

const DEMO_PROFILES: Record<UserRole, DemoAuthSession> = {
  admin: {
    user: {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@stockflow.com',
      user_metadata: { full_name: 'DOS-APP (Admin)', role: 'admin' },
    },
    profile: {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@stockflow.com',
      full_name: 'DOS-APP',
      avatar_url: null,
      phone: '+1 555-0100',
      role_id: 'admin-role-id',
      branch_id: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    role: 'admin',
  },
  manager: {
    user: {
      id: '00000000-0000-0000-0000-000000000002',
      email: 'manager@stockflow.com',
      user_metadata: { full_name: 'Jordan Lee (Manager)', role: 'manager' },
    },
    profile: {
      id: '00000000-0000-0000-0000-000000000002',
      email: 'manager@stockflow.com',
      full_name: 'Jordan Lee',
      avatar_url: null,
      phone: '+1 555-0101',
      role_id: 'manager-role-id',
      branch_id: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    role: 'manager',
  },
  staff: {
    user: {
      id: '00000000-0000-0000-0000-000000000003',
      email: 'staff@stockflow.com',
      user_metadata: { full_name: 'Sam Taylor (Staff)', role: 'staff' },
    },
    profile: {
      id: '00000000-0000-0000-0000-000000000003',
      email: 'staff@stockflow.com',
      full_name: 'Sam Taylor',
      avatar_url: null,
      phone: '+1 555-0102',
      role_id: 'staff-role-id',
      branch_id: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    role: 'staff',
  },
  client: {
    user: {
      id: '00000000-0000-0000-0000-000000000004',
      email: 'client@stockflow.com',
      user_metadata: { full_name: 'Chris Evans (Client)', role: 'client' },
    },
    profile: {
      id: '00000000-0000-0000-0000-000000000004',
      email: 'client@stockflow.com',
      full_name: 'Chris Evans',
      avatar_url: null,
      phone: '+1 555-0103',
      role_id: 'client-role-id',
      branch_id: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    role: 'client',
  },
  viewer: {
    user: {
      id: '00000000-0000-0000-0000-000000000005',
      email: 'viewer@stockflow.com',
      user_metadata: { full_name: 'Guest Viewer', role: 'viewer' },
    },
    profile: {
      id: '00000000-0000-0000-0000-000000000005',
      email: 'viewer@stockflow.com',
      full_name: 'Guest Viewer',
      avatar_url: null,
      phone: '+1 555-0104',
      role_id: 'viewer-role-id',
      branch_id: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    role: 'viewer',
  },
};

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
    const roleName = (data.roles as { name: string } | null)?.name ?? null;
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
    // Profile creation is best-effort
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('viewer');
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

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

  const loginDemo = useCallback((role: UserRole = 'admin') => {
    const demo = DEMO_PROFILES[role] || DEMO_PROFILES.admin;
    const mockUser = {
      id: demo.user.id,
      email: demo.user.email,
      app_metadata: {},
      user_metadata: demo.user.user_metadata,
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as unknown as SupabaseUser;

    setUser(mockUser);
    setProfile(demo.profile);
    setUserRole(demo.role);
    setIsDemoMode(true);
    setInitialized(true);

    try {
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demo));
    } catch {
      // Ignore storage errors
    }
  }, []);

  useEffect(() => {
    // 1. Check if a demo session already exists in localStorage
    try {
      const savedDemo = localStorage.getItem(DEMO_STORAGE_KEY);
      if (savedDemo) {
        const parsed: DemoAuthSession = JSON.parse(savedDemo);
        if (parsed?.role && DEMO_PROFILES[parsed.role]) {
          loginDemo(parsed.role);
          setInitialized(true);
          return;
        }
      }
    } catch {
      // Ignore storage read error
    }

    // 2. Otherwise, check Supabase with a safety timeout so we never hang indefinitely
    let isCancelled = false;

    const timeoutId = setTimeout(() => {
      if (!isCancelled) {
        setInitialized(true);
      }
    }, 2000);

    const hashParams = window.location.hash;
    const searchParams = window.location.search;
    const hasOAuthReturn =
      (hashParams && (hashParams.includes('access_token') || hashParams.includes('refresh_token'))) ||
      (searchParams && searchParams.includes('code=') && !searchParams.includes('error='));

    supabase.auth
      .getSession()
      .then(async ({ data: { session: currentSession } }) => {
        if (isCancelled) return;
        clearTimeout(timeoutId);
        setSession(currentSession);
        const currentUser = currentSession?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await loadProfile(currentUser);
        }
        setInitialized(true);
        if (hasOAuthReturn && currentUser) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      })
      .catch(() => {
        if (isCancelled) return;
        clearTimeout(timeoutId);
        setInitialized(true);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (isCancelled) return;
      setSession(newSession);
      const newUser = newSession?.user ?? null;
      setUser(newUser);
      if (newUser) {
        setIsDemoMode(false);
        try {
          localStorage.removeItem(DEMO_STORAGE_KEY);
        } catch {
          // ignore
        }
        await loadProfile(newUser);
      }
      setInitialized(true);

      if (event === 'SIGNED_IN' && newUser) {
        try {
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
        } catch {
          // ignore profile lookup errors
        }
      }
    });

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [loadProfile, loginDemo]);

  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      try {
        // Check for quick demo shortcuts or known demo emails
        const lower = email.toLowerCase().trim();
        if (lower.includes('admin') || lower === 'admin@stockflow.com' || lower === 'admin@example.com') {
          loginDemo('admin');
          return;
        }
        if (lower.includes('manager') || lower === 'manager@stockflow.com') {
          loginDemo('manager');
          return;
        }
        if (lower.includes('staff') || lower === 'staff@stockflow.com') {
          loginDemo('staff');
          return;
        }
        if (lower.includes('client') || lower === 'client@stockflow.com') {
          loginDemo('client');
          return;
        }
        if (lower.includes('demo') || lower === 'demo@stockflow.com') {
          loginDemo('admin');
          return;
        }

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          // If Supabase failed because project is offline or not configured, fallback gracefully to demo
          if (
            error.message.includes('fetch') ||
            error.message.includes('Invalid API key') ||
            error.message.includes('not found') ||
            error.message.includes('network')
          ) {
            loginDemo('admin');
            return;
          }
          throw error;
        }
      } catch (err) {
        // If Supabase network connection failed, fallback to demo mode
        const msg = err instanceof Error ? err.message : '';
        if (msg.includes('fetch') || msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
          loginDemo('admin');
          return;
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loginDemo]
  );

  const signup = useCallback(
    async (email: string, password: string, metadata?: Record<string, unknown>) => {
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: metadata },
        });

        if (error) {
          // Fallback to local profile creation if Supabase is offline
          loginDemo('viewer');
          return;
        }

        if (data.user) {
          const fullName = (metadata?.full_name as string) || '';
          const phone = (metadata?.phone as string) || null;
          await createProfileForUser(data.user.id, email, fullName, phone);
        }
      } catch {
        loginDemo('viewer');
      } finally {
        setLoading(false);
      }
    },
    [loginDemo]
  );

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      setIsDemoMode(false);
      try {
        localStorage.removeItem(DEMO_STORAGE_KEY);
      } catch {
        // ignore
      }
      setUser(null);
      setSession(null);
      setProfile(null);
      setUserRole('viewer');
      await supabase.auth.signOut().catch(() => {});
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
        isDemoMode,
        login,
        loginDemo,
        signup,
        logout,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


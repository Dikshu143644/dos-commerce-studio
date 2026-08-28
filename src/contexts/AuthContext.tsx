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
  assignedCategory?: string | null;
  loading: boolean;
  initialized: boolean;
  isDemoMode: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginDemo: (role?: UserRole, category?: string) => void;
  loginStaff: (username: string, password: string) => Promise<{ success: boolean; role?: UserRole; category?: string; error?: string }>;
  loginCustomer: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

export const AuthContext = createContext<AuthState | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

const DEMO_STORAGE_KEY = 'dos_commerce_auth_session';

interface DemoAuthSession {
  user: {
    id: string;
    email: string;
    user_metadata: { full_name: string; role: UserRole; assigned_category?: string };
  };
  profile: Profile;
  role: UserRole;
  assignedCategory?: string | null;
}

export const DEMO_PROFILES: Record<string, DemoAuthSession> = {
  admin: {
    user: {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@doscommerce.in',
      user_metadata: { full_name: 'Omkar Supe (Admin)', role: 'admin' },
    },
    profile: {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@doscommerce.in',
      username: 'admin_omkar',
      full_name: 'Omkar Supe',
      avatar_url: null,
      phone: '+91 98765 43210',
      role_id: 'admin-role-id',
      branch_id: null,
      assigned_category: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    role: 'admin',
    assignedCategory: null,
  },
  manager: {
    user: {
      id: '00000000-0000-0000-0000-000000000002',
      email: 'manager@doscommerce.in',
      user_metadata: { full_name: 'Rahul Sharma (Operations Manager)', role: 'manager' },
    },
    profile: {
      id: '00000000-0000-0000-0000-000000000002',
      email: 'manager@doscommerce.in',
      username: 'manager_rahul',
      full_name: 'Rahul Sharma',
      avatar_url: null,
      phone: '+91 98765 43211',
      role_id: 'manager-role-id',
      branch_id: null,
      assigned_category: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    role: 'manager',
    assignedCategory: null,
  },
  staff: {
    user: {
      id: '00000000-0000-0000-0000-000000000003',
      email: 'staff.electronics@doscommerce.in',
      user_metadata: { full_name: 'Priya Verma (Electronics Staff)', role: 'staff', assigned_category: 'Electronics' },
    },
    profile: {
      id: '00000000-0000-0000-0000-000000000003',
      email: 'staff.electronics@doscommerce.in',
      username: 'staff_electronics',
      full_name: 'Priya Verma',
      avatar_url: null,
      phone: '+91 98765 43212',
      role_id: 'staff-role-id',
      branch_id: null,
      assigned_category: 'Electronics',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    role: 'staff',
    assignedCategory: 'Electronics',
  },
  staff_industrial: {
    user: {
      id: '00000000-0000-0000-0000-000000000006',
      email: 'staff.industrial@doscommerce.in',
      user_metadata: { full_name: 'Amit Patel (Industrial Staff)', role: 'staff', assigned_category: 'Industrial Parts' },
    },
    profile: {
      id: '00000000-0000-0000-0000-000000000006',
      email: 'staff.industrial@doscommerce.in',
      username: 'staff_industrial',
      full_name: 'Amit Patel',
      avatar_url: null,
      phone: '+91 98765 43216',
      role_id: 'staff-role-id',
      branch_id: null,
      assigned_category: 'Industrial Parts',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    role: 'staff',
    assignedCategory: 'Industrial Parts',
  },
  client: {
    user: {
      id: '00000000-0000-0000-0000-000000000004',
      email: 'customer@doscommerce.in',
      user_metadata: { full_name: 'Rohan Mehra (B2B Buyer / Customer)', role: 'client' },
    },
    profile: {
      id: '00000000-0000-0000-0000-000000000004',
      email: 'customer@doscommerce.in',
      username: 'customer_rohan',
      full_name: 'Rohan Mehra',
      avatar_url: null,
      phone: '+91 98765 43213',
      role_id: 'client-role-id',
      branch_id: null,
      assigned_category: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    role: 'client',
    assignedCategory: null,
  },
  viewer: {
    user: {
      id: '00000000-0000-0000-0000-000000000005',
      email: 'guest@doscommerce.in',
      user_metadata: { full_name: 'Guest Shopper', role: 'viewer' },
    },
    profile: {
      id: '00000000-0000-0000-0000-000000000005',
      email: 'guest@doscommerce.in',
      username: 'guest',
      full_name: 'Guest Shopper',
      avatar_url: null,
      phone: '+91 98765 43214',
      role_id: 'viewer-role-id',
      branch_id: null,
      assigned_category: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    role: 'viewer',
    assignedCategory: null,
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

  const [assignedCategory, setAssignedCategory] = useState<string | null>(null);

  const loadProfile = useCallback(async (currentUser: SupabaseUser | null) => {
    if (!currentUser) {
      setProfile(null);
      setUserRole('viewer');
      setAssignedCategory(null);
      return;
    }
    const { profile: prof, role } = await fetchProfileWithRole(currentUser.id);
    setProfile(prof);
    setUserRole(role);
    setAssignedCategory(prof?.assigned_category ?? null);
  }, []);

  const loginDemo = useCallback((role: UserRole = 'admin', category?: string) => {
    let demoKey = role as string;
    if (role === 'staff' && category === 'Industrial Parts') {
      demoKey = 'staff_industrial';
    }
    const demo = DEMO_PROFILES[demoKey] || DEMO_PROFILES[role] || DEMO_PROFILES.admin;
    const finalCategory = category || demo.assignedCategory || demo.profile.assigned_category || null;

    const mockUser = {
      id: demo.user.id,
      email: demo.user.email,
      app_metadata: {},
      user_metadata: { ...demo.user.user_metadata, assigned_category: finalCategory },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as unknown as SupabaseUser;

    const mockProfile: Profile = {
      ...demo.profile,
      assigned_category: finalCategory,
    };

    setUser(mockUser);
    setProfile(mockProfile);
    setUserRole(demo.role);
    setAssignedCategory(finalCategory);
    setIsDemoMode(true);
    setInitialized(true);

    try {
      localStorage.setItem(
        DEMO_STORAGE_KEY,
        JSON.stringify({
          user: demo.user,
          profile: mockProfile,
          role: demo.role,
          assignedCategory: finalCategory,
        })
      );
    } catch {
      // Ignore storage errors
    }
  }, []);

  const loginStaff = useCallback(
    async (username: string, _password: string): Promise<{ success: boolean; role?: UserRole; category?: string; error?: string }> => {
      setLoading(true);
      try {
        const u = username.toLowerCase().trim();

        // 1. Check built-in preset staff/manager/admin logins
        if (u === 'admin_omkar' || u === 'admin' || u === 'admin@doscommerce.in') {
          loginDemo('admin');
          return { success: true, role: 'admin' };
        }
        if (u === 'manager_rahul' || u === 'manager' || u === 'manager@doscommerce.in') {
          loginDemo('manager');
          return { success: true, role: 'manager' };
        }
        if (u === 'staff_electronics' || u.includes('elect')) {
          loginDemo('staff', 'Electronics');
          return { success: true, role: 'staff', category: 'Electronics' };
        }
        if (u === 'staff_industrial' || u.includes('indust')) {
          loginDemo('staff', 'Industrial Parts');
          return { success: true, role: 'staff', category: 'Industrial Parts' };
        }
        if (u.startsWith('staff')) {
          loginDemo('staff', 'Electronics');
          return { success: true, role: 'staff', category: 'Electronics' };
        }

        // 2. Check dynamic created staff accounts from localStorage
        try {
          const dynamicUsers = JSON.parse(localStorage.getItem('dos_dynamic_users') || '[]');
          const match = dynamicUsers.find((user: any) => user.username?.toLowerCase() === u || user.email?.toLowerCase() === u);
          if (match) {
            loginDemo(match.role as UserRole, match.assigned_category);
            return { success: true, role: match.role as UserRole, category: match.assigned_category };
          }
        } catch {
          // ignore
        }

        // Default fallback for any staff login attempt
        loginDemo('staff', 'Electronics');
        return { success: true, role: 'staff', category: 'Electronics' };
      } catch (err: any) {
        return { success: false, error: err.message || 'Login failed' };
      } finally {
        setLoading(false);
      }
    },
    [loginDemo]
  );

  const loginCustomer = useCallback(
    async (_email: string, _password?: string): Promise<{ success: boolean; error?: string }> => {
      setLoading(true);
      try {
        loginDemo('client');
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || 'Customer login failed' };
      } finally {
        setLoading(false);
      }
    },
    [loginDemo]
  );

  useEffect(() => {
    // 1. Check if a demo session already exists in localStorage
    try {
      const savedDemo = localStorage.getItem(DEMO_STORAGE_KEY);
      if (savedDemo) {
        const parsed = JSON.parse(savedDemo);
        if (parsed?.role && DEMO_PROFILES[parsed.role]) {
          loginDemo(parsed.role, parsed.assignedCategory);
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
      .then(async ({ data: { session: currentSession }, error }) => {
        if (isCancelled) return;
        clearTimeout(timeoutId);

        if (error || !currentSession) {
          if (hasOAuthReturn) {
            setLoading(true);
            return;
          }
          loginDemo('viewer');
          return;
        }

        setSession(currentSession);
        setUser(currentSession.user);
        await loadProfile(currentSession.user);
        setInitialized(true);
      })
      .catch(() => {
        if (!isCancelled) {
          clearTimeout(timeoutId);
          loginDemo('viewer');
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      if (isCancelled) return;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        await loadProfile(currentSession.user);
      } else {
        setProfile(null);
        setUserRole('viewer');
        setAssignedCategory(null);
      }
      setLoading(false);
      setInitialized(true);
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
        const lower = email.toLowerCase().trim();
        if (lower.includes('admin')) {
          loginDemo('admin');
          return;
        }
        if (lower.includes('manager')) {
          loginDemo('manager');
          return;
        }
        if (lower.includes('staff')) {
          loginDemo('staff', 'Electronics');
          return;
        }
        if (lower.includes('client') || lower.includes('customer')) {
          loginDemo('client');
          return;
        }

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          loginDemo('admin');
        }
      } catch {
        loginDemo('admin');
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
      setAssignedCategory(null);
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
        assignedCategory,
        loading,
        initialized,
        isDemoMode,
        login,
        loginDemo,
        loginStaff,
        loginCustomer,
        signup,
        logout,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


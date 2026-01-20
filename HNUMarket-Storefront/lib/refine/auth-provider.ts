import { AuthProvider } from '@refinedev/core';
import { createClient } from '@/lib/supabase/client';

export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        success: false,
        error: {
          message: error.message,
          name: 'LoginError',
        },
      };
    }

    if (data?.user) {
      return {
        success: true,
        redirectTo: '/admin/dashboard',
      };
    }

    return {
      success: false,
      error: {
        message: 'Login failed',
        name: 'LoginError',
      },
    };
  },

  logout: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    return {
      success: true,
      redirectTo: '/admin/login',
    };
  },

  check: async () => {
    const supabase = createClient();

    // Use getUser() instead of getSession() for secure token validation
    // getUser() validates the JWT while getSession() only reads from storage
    const { data: { user }, error } = await supabase.auth.getUser();

    if (user && !error) {
      // Verify admin role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'admin') {
        return {
          authenticated: true,
        };
      }
    }

    return {
      authenticated: false,
      redirectTo: '/admin/login',
      logout: true,
    };
  },

  onError: async (error) => {
    if (error?.status === 401) {
      return {
        logout: true,
        redirectTo: '/admin/login',
        error,
      };
    }

    return { error };
  },

  getIdentity: async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return {
      id: user.id,
      name: profile?.full_name || user.email || '',
      avatar: profile?.avatar_url || undefined,
      email: user.email,
    };
  },
};


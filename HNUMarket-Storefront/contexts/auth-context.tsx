'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, AuthContextValue } from '@/types/auth';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { toast } from 'sonner';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const supabase = createClient();

  // Initialize auth state and listen for changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
      }
      setIsInitialized(true);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Map Supabase user to our User type
  const mapSupabaseUser = (supabaseUser: SupabaseUser): User => {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email!,
      fullName: supabaseUser.user_metadata?.full_name || '',
      address: supabaseUser.user_metadata?.address || '',
      createdAt: supabaseUser.created_at,
      emailVerified: !!supabaseUser.email_confirmed_at,
    };
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    // Validation
    if (!email.trim() || !password.trim()) {
      toast.error('Vui lòng nhập email và mật khẩu');
      return false;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Email hoặc mật khẩu không đúng');
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Vui lòng xác nhận email trước khi đăng nhập');
        } else {
          toast.error('Đăng nhập thất bại. Vui lòng thử lại.');
        }
        return false;
      }

      if (data.user) {
        setUser(mapSupabaseUser(data.user));
        return true;
      }

      return false;
    } catch (error) {
      toast.error('Đã xảy ra lỗi. Vui lòng thử lại.');
      return false;
    }
  };

  const register = async (
    email: string,
    password: string,
    fullName: string,
    address: string
  ): Promise<boolean> => {
    // Validation
    if (!email.trim() || !password.trim() || !fullName.trim() || !address.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return false;
    }

    if (!EMAIL_REGEX.test(email)) {
      toast.error('Email không hợp lệ');
      return false;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      toast.error(`Mật khẩu phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự`);
      return false;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: fullName.trim(),
            address: address.trim(),
          },
        },
      });

      if (error) {
        console.error('Signup error:', error);
        if (error.message.includes('User already registered')) {
          toast.error('Email đã được sử dụng');
        } else if (error.message.includes('Database error')) {
          toast.error('Lỗi cơ sở dữ liệu. Vui lòng liên hệ admin.');
        } else {
          toast.error(`Đăng ký thất bại: ${error.message}`);
        }
        return false;
      }

      if (data.user) {
        setUser(mapSupabaseUser(data.user));
        return true;
      }

      return false;
    } catch (error) {
      toast.error('Đã xảy ra lỗi. Vui lòng thử lại.');
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error('Đăng xuất thất bại. Vui lòng thử lại.');
      } else {
        setUser(null);
      }
    } catch (error) {
      toast.error('Đã xảy ra lỗi. Vui lòng thử lại.');
    }
  };

  const forgotPassword = async (email: string): Promise<boolean> => {
    // Validation
    if (!email.trim()) {
      toast.error('Vui lòng nhập email');
      return false;
    }

    if (!EMAIL_REGEX.test(email)) {
      toast.error('Email không hợp lệ');
      return false;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        toast.error('Gửi yêu cầu thất bại. Vui lòng thử lại.');
        return false;
      }

      toast.success('Đã gửi yêu cầu đặt lại mật khẩu. Vui lòng kiểm tra email.');
      return true;
    } catch (error) {
      toast.error('Đã xảy ra lỗi. Vui lòng thử lại.');
      return false;
    }
  };

  const resetPassword = async (newPassword: string): Promise<boolean> => {
    // Validation
    if (!newPassword.trim()) {
      toast.error('Vui lòng nhập mật khẩu mới');
      return false;
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      toast.error(`Mật khẩu phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự`);
      return false;
    }

    try {
      // Get token from URL
      const urlParams = new URLSearchParams(window.location.search);
      const token_hash = urlParams.get('token_hash');
      const type = urlParams.get('type');

      if (!token_hash || type !== 'recovery') {
        toast.error('Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
        return false;
      }

      // Verify OTP first to get session
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        type: 'recovery',
        token_hash,
      });

      if (verifyError || !verifyData.session) {
        toast.error('Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
        return false;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        toast.error('Đặt lại mật khẩu thất bại. Vui lòng thử lại.');
        return false;
      }

      return true;
    } catch (error) {
      toast.error('Đã xảy ra lỗi. Vui lòng thử lại.');
      return false;
    }
  };

  const resendConfirmationEmail = async (email: string): Promise<boolean> => {
    // Validation
    if (!email.trim()) {
      toast.error('Vui lòng nhập email');
      return false;
    }

    if (!EMAIL_REGEX.test(email)) {
      toast.error('Email không hợp lệ');
      return false;
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('Resend confirmation error:', error);
        if (error.message.includes('Email rate limit exceeded')) {
          toast.error('Đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.');
        } else {
          toast.error('Gửi lại email xác nhận thất bại. Vui lòng thử lại.');
        }
        return false;
      }

      toast.success('Đã gửi lại email xác nhận. Vui lòng kiểm tra hộp thư của bạn.');
      return true;
    } catch (error) {
      toast.error('Đã xảy ra lỗi. Vui lòng thử lại.');
      return false;
    }
  };

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isInitialized,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    resendConfirmationEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

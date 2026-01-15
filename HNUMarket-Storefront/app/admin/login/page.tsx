'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

/**
 * Admin Login Form Component
 *
 * Handles login form logic with search params
 */
function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(
    searchParams.get('error') === 'unauthorized'
      ? 'You need admin access to view this page'
      : '',
  );
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();

    // Sign in with Supabase Auth
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Check if user has admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (profile?.role !== 'admin') {
      // Sign out non-admin users
      await supabase.auth.signOut();
      setError('Admin access required. Please contact an administrator.');
      setLoading(false);
      return;
    }

    // Redirect to admin dashboard
    router.push('/admin/dashboard');
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-admin-primary/10 rounded-full">
              <ShieldAlert className="h-8 w-8 text-admin-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
          <CardDescription>
            Sign in to access the HNUMarket admin panel
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@hnumarket.com"
                autoComplete="email"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <span className="mr-2">Signing in...</span>
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Admin Login Page
 *
 * Authenticates users via Supabase Auth and verifies admin role.
 * Non-admin users are logged out and shown error message.
 *
 * @route /admin/login
 */
export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-admin-primary/10 rounded-full">
                <ShieldAlert className="h-8 w-8 text-admin-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
            <CardDescription>Loading...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    }>
      <AdminLoginForm />
    </Suspense>
  );
}

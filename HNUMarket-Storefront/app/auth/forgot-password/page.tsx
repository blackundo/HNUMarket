'use client';

import { useState } from 'react';
import Link from 'next/link';
import { KeyRound } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    forgotPassword(email);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 sm:py-16">
      <div className="max-w-md mx-auto px-4 sm:px-6">
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <KeyRound className="w-6 h-6 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Quên mật khẩu</CardTitle>
            <CardDescription className="text-center">
              Nhập email để đặt lại mật khẩu của bạn
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full">
                Gửi yêu cầu
              </Button>
              <p className="text-sm text-center text-gray-600">
                <Link href="/auth/login" className="text-primary hover:underline">
                  Quay lại đăng nhập
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

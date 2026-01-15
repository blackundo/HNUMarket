'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const success = await register(email, password, fullName, address);
    if (success) {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 sm:py-16">
      <div className="max-w-md mx-auto px-4 sm:px-6">
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Đăng ký tài khoản</CardTitle>
            <CardDescription className="text-center">
              Tạo tài khoản mới để bắt đầu mua sắm
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="fullName" className="text-sm font-medium">
                  Họ và tên
                </label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
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
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Mật khẩu
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500">Tối thiểu 6 ký tự</p>
              </div>
              <div className="space-y-2">
                <label htmlFor="address" className="text-sm font-medium">
                  Địa chỉ
                </label>
                <Input
                  id="address"
                  type="text"
                  placeholder="123 Đường ABC, Quận XYZ, TP.HCM"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full">
                Đăng ký
              </Button>
              <p className="text-sm text-center text-gray-600">
                Đã có tài khoản?{' '}
                <Link href="/auth/login" className="text-primary hover:underline">
                  Đăng nhập
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

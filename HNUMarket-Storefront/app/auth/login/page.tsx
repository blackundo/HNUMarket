'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { LogIn, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, resendConfirmationEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showResendButton, setShowResendButton] = useState(false);

  useEffect(() => {
    const error = searchParams.get('error');
    const success = searchParams.get('success');
    const message = searchParams.get('message');

    // Handle error messages
    if (error && message) {
      setErrorMessage(message);
      // Show resend button for email-related errors
      if (error === 'email_link_expired' || error === 'verification_failed' || error === 'email_confirmation_failed') {
        setShowResendButton(true);
      }
    } else if (error) {
      // Fallback error messages if no specific message provided
      switch (error) {
        case 'email_link_expired':
          setErrorMessage('Link xác nhận đã hết hạn. Vui lòng đăng ký lại hoặc yêu cầu gửi lại email xác nhận.');
          setShowResendButton(true);
          break;
        case 'access_denied':
          setErrorMessage('Xác nhận email thất bại. Vui lòng thử lại.');
          setShowResendButton(true);
          break;
        case 'email_confirmation_failed':
          setErrorMessage('Xác nhận email thất bại. Vui lòng thử lại hoặc yêu cầu gửi lại email xác nhận.');
          setShowResendButton(true);
          break;
        case 'verification_failed':
          setErrorMessage('Link xác nhận không hợp lệ hoặc đã hết hạn.');
          setShowResendButton(true);
          break;
        case 'invalid_request':
          setErrorMessage('Yêu cầu không hợp lệ.');
          break;
        default:
          setErrorMessage('Có lỗi xảy ra. Vui lòng thử lại.');
      }
    }

    // Handle success messages
    if (success && message) {
      setSuccessMessage(message);
      setShowResendButton(false);
    } else if (success === 'email_confirmed') {
      setSuccessMessage('Email đã được xác nhận thành công! Bạn có thể đăng nhập ngay bây giờ.');
      setShowResendButton(false);
    } else if (message === 'password_reset_success') {
      setSuccessMessage('Đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới.');
      setShowResendButton(false);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const success = await login(email, password);
    if (success) {
      router.push('/');
    }
  };

  const handleResendConfirmation = async () => {
    if (!email.trim()) {
      setErrorMessage('Vui lòng nhập email để gửi lại email xác nhận.');
      return;
    }

    const success = await resendConfirmationEmail(email);
    if (success) {
      setSuccessMessage('Đã gửi lại email xác nhận. Vui lòng kiểm tra hộp thư của bạn.');
      setErrorMessage(null);
      setShowResendButton(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 sm:py-16">
      <div className="max-w-md mx-auto px-4 sm:px-6">
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <LogIn className="w-6 h-6 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Đăng nhập</CardTitle>
            <CardDescription className="text-center">
              Nhập email và mật khẩu để đăng nhập
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{successMessage}</p>
                </div>
              )}
              {errorMessage && (
                <div className="space-y-2">
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{errorMessage}</p>
                  </div>
                  {showResendButton && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleResendConfirmation}
                      className="w-full"
                    >
                      Gửi lại email xác nhận
                    </Button>
                  )}
                </div>
              )}
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
              </div>
              <div className="flex justify-end">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Quên mật khẩu?
                </Link>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full">
                Đăng nhập
              </Button>
              <p className="text-sm text-center text-gray-600">
                Chưa có tài khoản?{' '}
                <Link href="/auth/register" className="text-primary hover:underline">
                  Đăng ký
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 py-12 sm:py-16">
        <div className="max-w-md mx-auto px-4 sm:px-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">Đang tải...</div>
            </CardContent>
          </Card>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

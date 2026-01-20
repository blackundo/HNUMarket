'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { LogIn, AlertCircle, CheckCircle2, ShoppingBag, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, resendConfirmationEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showResendButton, setShowResendButton] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const error = searchParams.get('error');
    const success = searchParams.get('success');
    const message = searchParams.get('message');

    // Handle error messages
    if (error && message) {
      setErrorMessage(message);
      if (error === 'email_link_expired' || error === 'verification_failed' || error === 'email_confirmation_failed') {
        setShowResendButton(true);
      }
    } else if (error) {
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
    setIsLoading(true);
    setErrorMessage(null);

    const success = await login(email, password);
    setIsLoading(false);

    if (success) {
      router.push('/');
    }
  };

  const handleResendConfirmation = async () => {
    if (!email.trim()) {
      setErrorMessage('Vui lòng nhập email để gửi lại email xác nhận.');
      return;
    }

    setIsLoading(true);
    const success = await resendConfirmationEmail(email);
    setIsLoading(false);

    if (success) {
      setSuccessMessage('Đã gửi lại email xác nhận. Vui lòng kiểm tra hộp thư của bạn.');
      setErrorMessage(null);
      setShowResendButton(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Logo/Brand */}
          <Link href="/" className="inline-flex items-center gap-2 mb-8 group">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-slate-900">HNUMarket</span>
          </Link>

          {/* Welcome Text */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Chào mừng trở lại</h1>
            <p className="text-slate-600">Đăng nhập để tiếp tục mua sắm</p>
          </div>

          {/* Success/Error Messages */}
          {successMessage && (
            <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{successMessage}</p>
            </div>
          )}
          {errorMessage && (
            <div className="mb-6 space-y-3">
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm">{errorMessage}</p>
              </div>
              {showResendButton && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResendConfirmation}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    'Gửi lại email xác nhận'
                  )}
                </Button>
              )}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="h-11 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Mật khẩu
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="h-11 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium transition-all duration-200"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Đăng nhập
                </>
              )}
            </Button>
          </form>

          {/* Register Link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-600">
              Chưa có tài khoản?{' '}
              <Link
                href="/auth/register"
                className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Brand Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-6">
              <ShoppingBag className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-4xl font-bold mb-4">
              Mua sắm thông minh,<br />
              Giao hàng nhanh chóng
            </h2>
            <p className="text-lg text-blue-50">
              Khám phá hàng ngàn sản phẩm chất lượng với giá tốt nhất tại HNUMarket
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Sản phẩm chính hãng</h3>
                <p className="text-sm text-blue-50">100% cam kết hàng thật, nguồn gốc rõ ràng</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Giao hàng tận nơi</h3>
                <p className="text-sm text-blue-50">Miễn phí vận chuyển cho đơn hàng từ 500k</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Hỗ trợ 24/7</h3>
                <p className="text-sm text-blue-50">Đội ngũ chăm sóc khách hàng luôn sẵn sàng</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Đang tải...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

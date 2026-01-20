'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, AlertCircle, CheckCircle2, ShoppingBag, Loader2, Eye, EyeOff, Shield, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resetPassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Check if we have token from email link
  useEffect(() => {
    const token_hash = searchParams.get('token_hash');
    const type = searchParams.get('type');

    if (!token_hash || type !== 'recovery') {
      setError('Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!password.trim() || !confirmPassword.trim()) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsLoading(true);

    const success = await resetPassword(password);

    if (success) {
      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/auth/login?message=password_reset_success');
      }, 3000);
    } else {
      setIsLoading(false);
    }
  };

  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');

  // Success State
  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Link href="/" className="inline-flex items-center gap-2 mb-8 group justify-center w-full">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-slate-900">HNUMarket</span>
          </Link>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Đặt lại mật khẩu thành công!
            </h2>
            <p className="text-slate-600 mb-6">
              Mật khẩu của bạn đã được cập nhật. Bạn sẽ được chuyển đến trang đăng nhập...
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang chuyển hướng...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Invalid Link State
  if (!token_hash || type !== 'recovery') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Link href="/" className="inline-flex items-center gap-2 mb-8 group justify-center w-full">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-slate-900">HNUMarket</span>
          </Link>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Link không hợp lệ
            </h2>
            <p className="text-slate-600 mb-8">
              {error || 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.'}
            </p>
            <Button asChild className="w-full h-11 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600">
              <Link href="/auth/forgot-password">
                Yêu cầu link mới
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Reset Password Form
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
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Tạo mật khẩu mới</h1>
            <p className="text-slate-600">
              Nhập mật khẩu mới cho tài khoản của bạn
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Reset Password Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Mật khẩu mới
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={isLoading}
                  className="h-11 bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-500">Tối thiểu 6 ký tự</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={isLoading}
                  className="h-11 bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white font-medium transition-all duration-200"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Đặt lại mật khẩu
                </>
              )}
            </Button>
          </form>

          {/* Back to Login */}
          <div className="mt-8">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </div>

      {/* Right Side - Brand Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-500 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-6">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-4xl font-bold mb-4">
              Bảo vệ tài khoản<br />
              của bạn
            </h2>
            <p className="text-lg text-indigo-50">
              Tạo mật khẩu mạnh để bảo vệ thông tin cá nhân
            </p>
          </div>

          {/* Password Tips */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-indigo-100 uppercase tracking-wide mb-3">
              Mẹo tạo mật khẩu mạnh
            </h3>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Ít nhất 8 ký tự</h3>
                <p className="text-sm text-indigo-50">
                  Mật khẩu dài hơn sẽ an toàn hơn
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Kết hợp ký tự</h3>
                <p className="text-sm text-indigo-50">
                  Sử dụng chữ hoa, chữ thường, số và ký tự đặc biệt
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Tránh thông tin cá nhân</h3>
                <p className="text-sm text-indigo-50">
                  Không dùng tên, ngày sinh hay thông tin dễ đoán
                </p>
              </div>
            </div>
          </div>

          {/* Security Note */}
          <div className="mt-12 bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-indigo-50 mb-1">
                  <strong className="text-white">Cam kết bảo mật</strong>
                </p>
                <p className="text-sm text-indigo-50">
                  Mật khẩu của bạn được mã hóa và lưu trữ an toàn. Chúng tôi không bao giờ chia sẻ thông tin này với bên thứ ba.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600">Đang tải...</p>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}

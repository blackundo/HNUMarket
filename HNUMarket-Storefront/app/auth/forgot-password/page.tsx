'use client';

import { useState } from 'react';
import Link from 'next/link';
import { KeyRound, ShoppingBag, Loader2, CheckCircle2, ArrowLeft, Mail, Shield, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    await forgotPassword(email);
    setIsLoading(false);
    setIsSubmitted(true);
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

          {!isSubmitted ? (
            <>
              {/* Welcome Text */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Quên mật khẩu?</h1>
                <p className="text-slate-600">
                  Không sao, chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu cho bạn
                </p>
              </div>

              {/* Forgot Password Form */}
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
                    className="h-11 bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-slate-500">
                    Nhập email bạn đã dùng để đăng ký tài khoản
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white font-medium transition-all duration-200"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Gửi yêu cầu
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
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-6">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-3">
                  Kiểm tra email của bạn
                </h1>
                <p className="text-slate-600 mb-8">
                  Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến{' '}
                  <span className="font-medium text-slate-900">{email}</span>
                </p>

                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 text-left">
                  <h3 className="text-sm font-semibold text-blue-900 mb-3">
                    Bước tiếp theo:
                  </h3>
                  <ol className="space-y-2 text-sm text-blue-800">
                    <li className="flex items-start gap-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-200 rounded-full text-xs font-semibold flex-shrink-0 mt-0.5">
                        1
                      </span>
                      <span>Mở email từ HNUMarket trong hộp thư của bạn</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-200 rounded-full text-xs font-semibold flex-shrink-0 mt-0.5">
                        2
                      </span>
                      <span>Nhấp vào link đặt lại mật khẩu trong email</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-200 rounded-full text-xs font-semibold flex-shrink-0 mt-0.5">
                        3
                      </span>
                      <span>Tạo mật khẩu mới cho tài khoản của bạn</span>
                    </li>
                  </ol>
                </div>

                <p className="text-xs text-slate-500 mb-6">
                  Không thấy email? Kiểm tra thư mục spam hoặc{' '}
                  <button
                    onClick={() => {
                      setIsSubmitted(false);
                      setEmail('');
                    }}
                    className="text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    thử lại
                  </button>
                </p>

                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Quay lại đăng nhập
                </Link>
              </div>
            </>
          )}
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
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-4xl font-bold mb-4">
              Bảo mật tài khoản<br />
              là ưu tiên hàng đầu
            </h2>
            <p className="text-lg text-indigo-50">
              Chúng tôi giúp bạn khôi phục quyền truy cập một cách an toàn
            </p>
          </div>

          {/* Security Features */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Email xác thực</h3>
                <p className="text-sm text-indigo-50">
                  Link đặt lại mật khẩu được gửi qua email đã đăng ký
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Link có thời hạn</h3>
                <p className="text-sm text-indigo-50">
                  Link chỉ có hiệu lực trong 1 giờ vì lý do bảo mật
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Mã hóa an toàn</h3>
                <p className="text-sm text-indigo-50">
                  Mật khẩu được mã hóa và bảo vệ theo chuẩn quốc tế
                </p>
              </div>
            </div>
          </div>

          {/* Help Text */}
          <div className="mt-12 bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <p className="text-sm text-indigo-50 mb-2">
              <strong className="text-white">Lưu ý bảo mật:</strong>
            </p>
            <p className="text-sm text-indigo-50">
              HNUMarket sẽ không bao giờ yêu cầu mật khẩu của bạn qua email hoặc điện thoại.
              Nếu bạn nhận được yêu cầu như vậy, đó là lừa đảo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

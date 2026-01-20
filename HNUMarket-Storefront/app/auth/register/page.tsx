'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, ShoppingBag, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const success = await register(email, password, fullName, address);
    setIsLoading(false);

    if (success) {
      router.push('/');
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
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Tạo tài khoản mới</h1>
            <p className="text-slate-600">Đăng ký để bắt đầu mua sắm ngay hôm nay</p>
          </div>

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="fullName" className="block text-sm font-medium text-slate-700">
                Họ và tên
              </label>
              <Input
                id="fullName"
                type="text"
                placeholder="Nguyễn Văn A"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={isLoading}
                className="h-11 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

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
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Mật khẩu
              </label>
              <Input
                id="password"
                type="password"
                placeholder=""
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="h-11 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-500">Tối thiểu 6 ký tự</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="address" className="block text-sm font-medium text-slate-700">
                Địa chỉ
              </label>
              <Input
                id="address"
                type="text"
                placeholder=""
                value={address}
                onChange={(e) => setAddress(e.target.value)}
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
                  Đang đăng ký...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Đăng ký
                </>
              )}
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-600">
              Đã có tài khoản?{' '}
              <Link
                href="/auth/login"
                className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                Đăng nhập ngay
              </Link>
            </p>
          </div>

          {/* Terms Notice */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              Bằng việc đăng ký, bạn đồng ý với{' '}
              <Link href="#" className="text-blue-600 hover:text-blue-700">
                Điều khoản dịch vụ
              </Link>{' '}
              và{' '}
              <Link href="#" className="text-blue-600 hover:text-blue-700">
                Chính sách bảo mật
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Brand Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-600 via-orange-500 to-orange-400 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-6">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-4xl font-bold mb-4">
              Tham gia cộng đồng<br />
              HNUMarket ngay hôm nay
            </h2>
            <p className="text-lg text-orange-50">
              Hàng ngàn người dùng đã tin tưởng lựa chọn chúng tôi
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Ưu đãi độc quyền</h3>
                <p className="text-sm text-orange-50">Nhận ngay voucher 100k cho đơn hàng đầu tiên</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Theo dõi đơn hàng</h3>
                <p className="text-sm text-orange-50">Cập nhật trạng thái giao hàng theo thời gian thực</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Tích điểm thưởng</h3>
                <p className="text-sm text-orange-50">Mỗi đơn hàng đều được tích điểm để đổi quà</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Lưu sản phẩm yêu thích</h3>
                <p className="text-sm text-orange-50">Tạo danh sách mong muốn và mua sắm dễ dàng hơn</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-8">
            <div>
              <div className="text-3xl font-bold mb-1">10K+</div>
              <div className="text-sm text-orange-50">Sản phẩm</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">5K+</div>
              <div className="text-sm text-orange-50">Khách hàng</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">99%</div>
              <div className="text-sm text-orange-50">Hài lòng</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

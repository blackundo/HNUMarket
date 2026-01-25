import { Facebook, Instagram, Music2, MessageCircle, Mail, MapPin, Phone, Send } from 'lucide-react';


export function Footer() {
  return (
    <footer className="relative mt-32 pt-12 pb-10 sm:pb-0 bg-gradient-to-b from-gray-50 via-white to-gray-50 border-t border-gray-100/50 overflow-visible">
      {/* 3D Background Elements - Floor Perspective */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Decorative Blobs with improved blur for depth - Wrapped in overflow-hidden */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4 -z-10" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4 -z-10" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 perspective-1000">

        {/* Newsletter Card - Floating Effect using Negative Margin */}
        <div className="relative -mt-32 mb-16 z-20 transition-all duration-500 ease-out transform hover:-translate-y-2 hover:rotate-x-2 perspective-origin-center group/card">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 md:p-12 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.05)] relative overflow-hidden ring-1 ring-black/5">
            {/* Glossy Reflection */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/80 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover/card:bg-yellow-400/20 transition-colors duration-500" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center relative z-10">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 tracking-tight">
                  Đăng ký nhận <span className="text-primary relative inline-block">
                    bản tin
                    <svg className="absolute -bottom-1 left-0 w-full h-2 text-primary/20" viewBox="0 0 100 10" preserveAspectRatio="none">
                      <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="none" />
                    </svg>
                  </span>
                </h2>
                <p className="text-gray-600 text-sm md:text-base">
                  Nhận thông báo về sản phẩm mới, khuyến mãi và ưu đãi đặc biệt dành riêng cho bạn.
                </p>
              </div>
              <div className="relative">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    placeholder="Nhập email của bạn..."
                    className="flex-1 px-5 py-3.5 rounded-xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/10 outline-none transition-all duration-300 shadow-inner"
                  />
                  <button className="px-6 py-3.5 bg-primary text-white font-bold rounded-xl shadow-[0_10px_20px_-10px_rgba(34,197,94,0.5)] hover:shadow-[0_20px_30px_-15px_rgba(34,197,94,0.6)] hover:-translate-y-1 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2 group/btn whitespace-nowrap">
                    Đăng ký
                    <Send className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
                <p className="mt-3 text-xs text-gray-500 flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center bg-white shrink-0">
                    <svg className="w-2.5 h-2.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  Đồng ý với chính sách bảo mật
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 border-b border-gray-200/60 pb-12">

          {/* Brand Column */}
          <div className="space-y-6">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-800 tracking-tighter group-hover:opacity-90 transition-opacity">
              HNU<span className="text-primary">MARKET</span>
            </h1>
            <p className="text-gray-600 leading-relaxed">
              Hành trình kết nối với những sản phẩm chất lượng và tinh hoa của quê nhà đến với cộng đồng người Việt Nam tại Hàn Quốc.
            </p>
            <div className="flex gap-4">
              {[
                { Icon: Facebook, href: 'https://facebook.com/61578256423959' },
                { Icon: Instagram, href: 'https://instagram.com' },
                { Icon: Music2, href: 'https://tiktok.com' },
                { Icon: MessageCircle, href: 'https://kakaotalk.com' }
              ].map(({ Icon, href }, idx) => (
                <a
                  key={idx}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-white border border-gray-200 shadow-[0_4px_0_0_rgba(229,231,235,1)] hover:shadow-[0_2px_0_0_rgba(229,231,235,1)] hover:translate-y-[2px] active:translate-y-[4px] active:shadow-none flex items-center justify-center text-gray-600 hover:text-primary transition-all duration-200"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* About Column */}
          <div>
            <h4 className="text-gray-900 font-bold text-lg mb-6">Về chúng tôi</h4>
            <ul className="space-y-4">
              {[
                { label: 'Giới thiệu', href: '/about-us' },
                { label: 'Liên hệ', href: '#' },
                { label: 'Tuyển dụng', href: '#' },
                { label: 'Blog', href: '/blog' }
              ].map((item, idx) => (
                <li key={idx}>
                  <a href={item.href} className="group/link flex items-center text-gray-600 hover:text-primary transition-colors py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mr-3 group-hover/link:bg-primary group-hover/link:scale-150 group-hover/link:shadow-[0_0_10px_rgba(34,197,94,0.5)] transition-all duration-300" />
                    <span className="group-hover/link:translate-x-1 transition-transform duration-300 font-medium">{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Policy Column */}
          <div>
            <h4 className="text-gray-900 font-bold text-lg mb-6">Chính sách</h4>
            <ul className="space-y-4">
              {[
                { label: 'Chính sách đổi trả', href: '/policy' },
                { label: 'Chính sách bảo mật', href: '/policy' },
                { label: 'Điều khoản sử dụng', href: '/terms-of-service' },
                { label: 'Hướng dẫn mua hàng', href: '#' }
              ].map((item, idx) => (
                <li key={idx}>
                  <a href={item.href} className="group/link flex items-center text-gray-600 hover:text-primary transition-colors py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mr-3 group-hover/link:bg-primary group-hover/link:scale-150 group-hover/link:shadow-[0_0_10px_rgba(34,197,94,0.5)] transition-all duration-300" />
                    <span className="group-hover/link:translate-x-1 transition-transform duration-300 font-medium">{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h4 className="text-gray-900 font-bold text-lg mb-6">Liên hệ</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-gray-600 group">
                <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 group-hover:bg-orange-100 transition-colors shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase mb-1">Hotline</p>
                  <p className="font-semibold text-gray-900">010 8207 2806</p>
                </div>
              </li>
              <li className="flex items-start gap-3 text-gray-600 group">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase mb-1">Email</p>
                  <p className="font-semibold text-gray-900">support@hnumarket.com</p>
                </div>
              </li>
              <li className="flex items-start gap-3 text-gray-600 group">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600 group-hover:bg-green-100 transition-colors shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase mb-1">Địa chỉ</p>
                  <p className="font-semibold text-gray-900">대전 동구 호도로33번길 84</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>&copy; 2026 HNUMarket. <a href="https://www.facebook.com/UndoTech" className="hover:text-primary transition-colors">Powered by UndoTech</a></p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-primary transition-colors">Cookies</a>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 px-2 bg-gray-100 rounded flex items-center justify-center border border-gray-200">
              <span className="font-bold text-gray-400 text-xs">VISA</span>
            </div>
            <div className="h-8 px-2 bg-gray-100 rounded flex items-center justify-center border border-gray-200">
              <span className="font-bold text-gray-400 text-xs">PAYPAL</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

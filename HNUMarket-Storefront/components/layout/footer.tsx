export function Footer() {
  return (
    <footer className="relative pb-10 md:pb-0 overflow-hidden border-t border-gray-200/60 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-xl" />

      {/* Decorative gradient blobs */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-orange-400/20 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-rose-400/10 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          <div>
            <h3 className="text-gray-900 font-bold text-base sm:text-lg mb-3 sm:mb-4">HNUMarket</h3>
            <p className="text-gray-600 text-xs sm:text-sm">Hành trình kết nối với những sản phẩm chất lượng và tinh hoa của quê nhà đến với cộng đồng người Việt Nam tại Hàn Quốc</p>
          </div>

          <div>
            <h4 className="text-gray-900 font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Về chúng tôi</h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li><a href="/about-us" className="text-gray-600 hover:text-primary transition-colors duration-200 inline-block min-h-[44px] flex items-center">Giới thiệu</a></li>
              <li><a href="#" className="text-gray-600 hover:text-primary transition-colors duration-200 inline-block min-h-[44px] flex items-center">Liên hệ</a></li>
              <li><a href="#" className="text-gray-600 hover:text-primary transition-colors duration-200 inline-block min-h-[44px] flex items-center">Tuyển dụng</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-gray-900 font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Chính sách</h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li><a href="/policy" className="text-gray-600 hover:text-primary transition-colors duration-200 inline-block min-h-[44px] flex items-center">Chính sách đổi trả</a></li>
              <li><a href="/policy" className="text-gray-600 hover:text-primary transition-colors duration-200 inline-block min-h-[44px] flex items-center">Chính sách bảo mật</a></li>
              <li><a href="/terms-of-service" className="text-gray-600 hover:text-primary transition-colors duration-200 inline-block min-h-[44px] flex items-center">Điều khoản sử dụng</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-gray-900 font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Hỗ trợ</h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li><a href="#" className="text-gray-600 hover:text-primary transition-colors duration-200 inline-block min-h-[44px] flex items-center">Hotline: 010 8207 2806</a></li>
              <li><a href="#" className="text-gray-600 hover:text-primary transition-colors duration-200 inline-block min-h-[44px] flex items-center">Email: support@hnumarket.com</a></li>
              <li><a href="#" className="text-gray-600 hover:text-primary transition-colors duration-200 inline-block min-h-[44px] flex items-center">Messenger</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200/50 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-xs sm:text-sm">
          <p className="text-gray-500">&copy; 2025 HNUMarket. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

# HNUMarket - Vietnamese Ecommerce Platform

**Version**: 0.1.0 (MVP Phase 1)  
**Status**: ✅ Frontend MVP Complete | ✅ Backend API Complete  
**Last Updated**: Dec 22, 2025

---

## Tổng quan

HNUMarket là nền tảng thương mại điện tử Việt Nam được xây dựng với công nghệ web hiện đại, tập trung vào trải nghiệm người dùng, khám phá sản phẩm và tích hợp Messenger/Zalo cho thanh toán.

## Kiến trúc Dự án

```
HNUMarket/
├── HNUMarket-Storefront/    # Next.js 16 Frontend
├── HNUMarket-Backend/       # NestJS Backend API
└── docs/                    # Tài liệu dự án
```

## Tech Stack

### Frontend
- **Framework**: Next.js 16.1 (App Router)
- **Language**: TypeScript 5.7
- **UI**: React 19, Tailwind CSS 3.4
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod
- **Auth**: Supabase SSR

### Backend
- **Framework**: NestJS 10.4
- **Language**: TypeScript 5.7
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth + Passport JWT
- **Validation**: class-validator

## Tính năng Chính

### Đã Triển khai ✅
- Product catalog với 14 sản phẩm mẫu
- 8 danh mục sản phẩm
- Responsive design (mobile-first)
- Product cards với badges, ratings, variants
- Admin dashboard (products, posts, shipping, settings)
- Authentication với Supabase
- RESTful API endpoints
- Database schema hoàn chỉnh

### Đang Phát triển 🔄
- Shopping cart functionality
- Product detail pages
- Messenger/Zalo checkout integration
- Order management flow

## Cài đặt & Chạy

### Prerequisites
- Node.js 18+
- npm hoặc yarn
- Supabase account (cho database)

### Frontend Setup

```bash
cd HNUMarket-Storefront
npm install
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000)

### Backend Setup

```bash
cd HNUMarket-Backend
npm install

# Tạo file .env
cp .env.example .env
# Điền Supabase credentials

# Setup database (xem HNUMarket-Backend/database/README.md)
npm run start:dev
```

Backend chạy tại [http://localhost:3001](http://localhost:3001)

### Database Setup

1. Tạo Supabase project
2. Chạy SQL scripts trong `HNUMarket-Backend/database/`:
   - `01-schema.sql` - Tạo tables
   - `02-rls-policies.sql` - Row Level Security
   - `03-seed-data.sql` - Dữ liệu mẫu
3. Cấu hình `.env` với Supabase credentials

Chi tiết: `HNUMarket-Backend/database/README.md`

## Scripts

### Frontend
```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript checking
```

### Backend
```bash
npm run start:dev    # Development với watch mode
npm run build        # Build production
npm run start:prod   # Start production
npm run test         # Run tests
npm run lint         # Run ESLint
```

## API Endpoints

### Public
- `GET /api/health` - Health check
- `GET /api/storefront/products` - List products
- `GET /api/storefront/products/:slug` - Product detail
- `GET /api/storefront/categories` - List categories

### Authenticated
- `GET /api/auth/me` - Current user profile
- `GET /api/auth/admin/verify` - Verify admin access

### Admin (JWT + Admin required)
- `GET/POST/PATCH/DELETE /api/products` - Product CRUD
- `GET /api/admin/dashboard/*` - Dashboard statistics
- `GET/POST/PATCH/DELETE /api/posts` - Blog posts
- `GET/POST/PATCH /api/admin/shipping/*` - Shipping management
- `GET/PATCH /api/admin/settings` - App settings
- `POST /api/upload` - File uploads

## Cấu trúc Thư mục

### Frontend (`HNUMarket-Storefront/`)
```
app/              # Next.js App Router pages
components/        # React components (ui, layout, product, cart, admin)
lib/              # Utilities, API clients, Supabase setup
types/            # TypeScript type definitions
data/             # Mock data (products, categories)
public/           # Static assets
```

### Backend (`HNUMarket-Backend/`)
```
src/
  auth/           # Authentication module
  products/       # Products module (admin)
  storefront/     # Public storefront API
  dashboard/      # Admin dashboard
  posts/          # Blog posts
  shipping/       # Shipping management
  settings/       # App settings
  upload/         # File uploads
  common/         # Shared modules (Supabase, filters)
database/         # SQL scripts
```

## Tài liệu

Tài liệu đầy đủ trong thư mục `docs/`:

- **[project-overview-pdr.md](docs/project-overview-pdr.md)** - Tổng quan dự án, mục tiêu, tính năng
- **[codebase-summary.md](docs/codebase-summary.md)** - Tóm tắt codebase, cấu trúc files
- **[code-standards.md](docs/code-standards.md)** - Tiêu chuẩn code, conventions
- **[system-architecture.md](docs/system-architecture.md)** - Kiến trúc hệ thống, data flow
- **[design-guidelines.md](docs/design-guidelines.md)** - Design system, UI patterns

## Development Guidelines

### Code Standards
- TypeScript strict mode
- Functional components với React hooks
- PascalCase cho components, camelCase cho functions
- Use `@/` path aliases
- Lucide icons (không dùng emoji)
- Mobile-first responsive design
- Touch targets tối thiểu 44px

Chi tiết: `docs/code-standards.md`

### Git Workflow
- `main` - Production branch
- `develop` - Development branch
- `feature/*` - Feature branches
- Commit format: `type(scope): description`

## Roadmap

### Q4 2025 - Foundation ✅
- Frontend MVP với mock data
- Backend API scaffold
- Database schema
- Authentication setup

### Q1 2026 - Core Features 🔄
- Shopping cart implementation
- Product detail pages
- Checkout flow với Messenger
- Admin dashboard enhancements

### Q2 2026 - Production Ready 📋
- Payment gateway integration
- Email notifications
- Analytics integration
- Performance optimization
- SEO improvements

## Environment Variables

### Frontend (`.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Backend (`.env`)
```env
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
SUPABASE_JWT_SECRET=your-jwt-secret
PORT=3001
NODE_ENV=development
CORS_ORIGINS=http://localhost:3000
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

1. Đọc `docs/code-standards.md` trước khi code
2. Follow Git workflow conventions
3. Run `npm run lint` và `npm run type-check` trước khi commit
4. Test trên mobile device trước khi PR

## License

UNLICENSED - Private project

## Liên hệ & Hỗ trợ

- **Documentation**: Xem `docs/` directory
- **Issues**: Check existing documentation trước khi tạo issue mới
- **Database Setup**: `HNUMarket-Backend/database/README.md`

---

**Last Review**: Dec 22, 2025  
**Status**: ✅ MVP Complete, Ready for Phase 2  
**Next Milestone**: Shopping Cart & Checkout Implementation


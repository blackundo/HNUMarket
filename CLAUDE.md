# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HNUMarket is a Vietnamese e-commerce platform built as a monorepo with a Next.js 16 frontend and NestJS backend. The application uses Supabase for authentication and PostgreSQL database, with a focus on mobile-first design and Messenger/Zalo integration for checkout.

**Current Status**: MVP Phase 1 Complete (v0.1.0)
- Frontend: Product catalog, admin dashboard, authentication
- Backend: RESTful API with JWT auth, admin endpoints
- Database: 14+ SQL migration files with RLS policies

## Repository Structure

```
HNUMarket/
├── HNUMarket-Storefront/   # Next.js 16 frontend (port 3000)
├── HNUMarket-Backend/      # NestJS backend API (port 3001)
├── AGENTS.md               # AI agent guidelines (existing)
└── docker-compose.yml      # Docker setup
```

## Development Commands

### Frontend (HNUMarket-Storefront/)
```bash
npm run dev          # Start Next.js dev server (localhost:3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
npm run type-check   # TypeScript type checking without emitting files
```

### Backend (HNUMarket-Backend/)
```bash
npm run start:dev    # NestJS watch mode (localhost:3001/api)
npm run build        # Compile TypeScript to dist/
npm run start:prod   # Run production build
npm run test         # Jest unit tests
npm run test:watch   # Jest watch mode
npm run test:e2e     # End-to-end tests
npm run test:cov     # Test coverage report
npm run lint         # ESLint with auto-fix
```

### Database Setup (Required for first-time setup)
```bash
# 1. Create Supabase project at https://supabase.com
# 2. Run SQL migrations in order from HNUMarket-Backend/database/:
#    - 01-schema.sql (creates tables)
#    - 02-rls-policies.sql (Row Level Security)
#    - 03-seed-data.sql (sample data)
#    - 04+ other migrations as needed
# 3. Configure environment variables (see below)
```

## Architecture & Key Patterns

### Frontend Architecture
- **App Router**: Next.js 16 with React 19 and React Server Components
- **Path Aliases**: `@/` maps to project root (e.g., `@/components`, `@/lib`)
- **Authentication**: Supabase SSR with singleton browser client pattern
  - `lib/supabase/client.ts`: Singleton client prevents token refresh race conditions
  - `lib/supabase/auth-helpers.ts`: Server-side auth utilities
  - `contexts/auth-context.tsx`: Client-side auth state management
- **Admin Panel**: Built with Refine framework (@refinedev/core)
  - `lib/refine/data-provider.ts`: Maps Refine operations to NestJS REST API
  - `lib/refine/auth-provider.ts`: Integrates Supabase auth with Refine
- **API Integration**: All backend calls go through `lib/api/` modules
  - Each module exports typed functions (e.g., `lib/api/products.ts`)
  - Uses `getAuthHeaders()` for authenticated requests
- **Styling**: Tailwind CSS with shadcn/ui components, Lucide React icons

### Backend Architecture
- **Module Structure**: Feature-based NestJS modules (auth, products, storefront, etc.)
- **Global Prefix**: All endpoints prefixed with `/api`
- **Authentication**: JWT-based with Supabase integration
  - `auth/guards/jwt-auth.guard.ts`: Validates Supabase JWT tokens via Passport
  - `auth/strategies/supabase-jwt.strategy.ts`: Extracts user from Supabase token
  - `auth/decorators/`: Custom decorators for current user, admin role
- **Database**: Supabase PostgreSQL via `@supabase/supabase-js`
  - `common/supabase/`: Shared Supabase module with service/admin clients
  - Uses service role key for admin operations
- **Storage**: Cloudflare R2 integration via `common/storage/r2-storage.module.ts`
- **Validation**: Global validation pipe with class-validator and class-transformer
- **Error Handling**: Global HTTP exception filter at `common/filters/`

### API Endpoint Patterns
- **Public**: `/api/storefront/*` - Product catalog, categories (no auth)
- **Authenticated**: `/api/auth/*` - User profile, admin verification (JWT required)
- **Admin**: `/api/admin/*` - CRUD operations (JWT + admin role required)
- **Health**: `/api/health` - Service health check

### Database Schema Key Points
- 14+ migration files in `HNUMarket-Backend/database/`
- Row Level Security (RLS) policies enforce access control
- Normalized schema with separate tables for:
  - Product variants with multi-attribute support
  - Homepage sections for dynamic content
  - Shipping locations and rates
  - Orders with variant tracking
- Trigger functions enforce business rules (e.g., max attributes per product)

## Environment Configuration

### Frontend (.env.local in HNUMarket-Storefront/)
```env
NEXT_PUBLIC_SUPABASE_URL=        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Supabase anon/public key
NEXT_PUBLIC_API_URL=             # Backend API URL (default: http://localhost:3001/api)
NEXT_PUBLIC_GOOGLE_GENAI_API_KEY=# Google GenAI for AI features
NEXT_PUBLIC_GA_ID=               # Google Analytics (optional, production only)
```

### Backend (.env in HNUMarket-Backend/)
```env
SUPABASE_URL=          # Supabase project URL
SUPABASE_ANON_KEY=     # Supabase anon key
SUPABASE_SERVICE_KEY=  # Supabase service role key (admin privileges)
SUPABASE_JWT_SECRET=   # JWT secret from Supabase dashboard (for token validation)
PORT=3001
NODE_ENV=development
CORS_ORIGINS=          # Comma-separated (e.g., http://localhost:3000,https://app.com)
```

**Important**:
- Frontend uses `NEXT_PUBLIC_` prefix for client-side access
- Backend uses service role key for admin operations, never expose to frontend
- CORS must include frontend origin for API access

## Code Standards

### TypeScript
- Strict mode enabled in both projects
- Avoid `any` types; use explicit types or generics
- Frontend: `tsx` for components, `ts` for utilities
- Backend: DTOs with class-validator decorators

### Component Patterns (Frontend)
- Function components with hooks (no class components)
- PascalCase for components, camelCase for functions/variables
- Use Lucide icons, never emoji in UI
- Mobile-first responsive design (touch targets ≥ 44px)
- Tailwind utility classes, avoid inline styles

### API Patterns (Backend)
- DTOs with validation decorators for request/response
- Services contain business logic, controllers handle HTTP
- Use `@CurrentUser()` decorator to access authenticated user
- Use `@AdminGuard()` for admin-only endpoints
- Return consistent response format: `{ data: T, meta?: {...} }`

### Testing
- Backend: Jest tests colocated with source (`.spec.ts`)
- Test files should cover services and controllers
- Use `npm run test:watch` for TDD workflow
- Frontend: No test framework configured yet

## Common Development Workflows

### Adding a New Backend Endpoint
1. Create/update DTO in module (e.g., `products/dto/`)
2. Add method to service with business logic
3. Create controller method with appropriate guards
4. Update module imports if creating new module
5. Add corresponding frontend API client in `lib/api/`

### Adding Database Changes
1. Create numbered migration SQL file in `database/` (e.g., `13-my-feature.sql`)
2. Run migration in Supabase SQL editor
3. Update TypeScript types if schema changed
4. Add RLS policies if needed (security-critical)

### Working with Authentication
- Frontend: Use `useAuth()` hook from auth context
- Frontend API calls: Import `getAuthHeaders()` for authenticated requests
- Backend: Apply `@UseGuards(JwtAuthGuard)` and `@CurrentUser()` decorator
- Admin routes: Also apply `@AdminGuard()`

### Refine Admin Integration
- Admin pages use `@refinedev/core` hooks (`useTable`, `useForm`, etc.)
- Data provider at `lib/refine/data-provider.ts` maps to `/api/admin/*`
- Resources defined in admin layout with proper routing

## Deployment Notes

- Frontend: Next.js App Router requires Node.js 18+
- Backend: NestJS production build goes to `dist/`
- Database: Run all migrations in numerical order on fresh Supabase project
- Docker: Use `docker-compose.yml` for containerized setup (update lock files with `./update-locks-docker.sh`)

## Vietnamese Language Context

This is a Vietnamese e-commerce platform:
- UI text should be in Vietnamese where user-facing
- Code, comments, and documentation remain in English
- Product catalog and content are Vietnamese market-focused

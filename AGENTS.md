# Repository Guidelines

## Project Structure & Module Organization
- `HNUMarket-Storefront/`: Next.js 16 frontend (App Router). Key folders: `app/`, `components/`, `lib/`, `types/`, `data/`, `public/`.
- `HNUMarket-Backend/`: NestJS API. Source in `src/` (feature modules like `auth/`, `products/`, `storefront/`) and SQL in `database/`.
- `docs/`: architecture, code standards, and design guidelines.
- `plans/`: roadmap and planning artifacts.

## Build, Test, and Development Commands
From each package directory:
```bash
# Frontend
cd HNUMarket-Storefront
npm run dev        # Start Next.js dev server
npm run build      # Production build
npm run lint       # ESLint
npm run type-check # TypeScript check

# Backend
cd HNUMarket-Backend
npm run start:dev  # NestJS dev server (watch)
npm run build      # Compile to dist/
npm run test       # Jest unit tests
```

## Coding Style & Naming Conventions
- TypeScript strict mode; avoid `any` and add explicit return types.
- Indentation: 2 spaces, no tabs; line length target 80-100 (max 120).
- Frontend: React function components, Tailwind utility classes, Lucide icons (no emoji).
- Use `@/` path aliases in the frontend; prefer `PascalCase` components and `camelCase` functions.
- Backend: NestJS modules/services/controllers; DTOs with `class-validator`.

## Testing Guidelines
- Backend uses Jest; tests live in `HNUMarket-Backend/src/**/**.spec.ts`.
- Useful scripts: `npm run test`, `npm run test:watch`, `npm run test:e2e`, `npm run test:cov`.
- Frontend has no test runner configured; add tests alongside components if introduced.

## Commit & Pull Request Guidelines
- Commit format (preferred): `type(scope): short description`.
  - Types: `feat`, `fix`, `docs`, `refactor`, `test`, `perf`, `chore`.
  - Example: `fix(storefront): handle empty category`.
- Branches: `feature/*`, `fix/*`, `docs/*`, with `main` and `develop` as shared branches.
- PRs: include a concise summary, test commands run, linked issue (if any), and screenshots for UI changes. Note env/config updates explicitly.

## Environment & Configuration
- Frontend env: `HNUMarket-Storefront/.env.local` (e.g., `NEXT_PUBLIC_API_URL`).
- Backend env: `HNUMarket-Backend/.env` (Supabase keys, `PORT`, `CORS_ORIGINS`).
- Database setup scripts live in `HNUMarket-Backend/database/`.

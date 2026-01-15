/**
 * Admin Layout
 *
 * Base layout for admin section. Authentication is handled by middleware.
 * This layout only renders children - protected pages have their own
 * sidebar wrapper, while login page renders standalone.
 *
 * @layout /admin/*
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Authentication is handled by middleware (/lib/supabase/middleware.ts)
  // This layout just passes through children
  return <>{children}</>;
}

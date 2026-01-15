'use client';

import { HomepageSettingsList } from '@/components/admin/homepage-settings/homepage-settings-list';

/**
 * Admin Homepage Settings Page
 *
 * Manage homepage sections with drag-and-drop reordering, product selection,
 * layout customization, and banner configuration.
 * Admin-only page protected by middleware.
 *
 * @route /admin/homepage-settings
 */
export default function HomepageSettingsPage() {
  return <HomepageSettingsList />;
}

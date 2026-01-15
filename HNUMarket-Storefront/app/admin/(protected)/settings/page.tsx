'use client';

import { useEffect, useState } from 'react';
import { getSettings, updateSettings, clearPublicSettingsCache } from '@/lib/api/settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Record<string, any>>({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
    setLoading(false);
  };

  const handleChange = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates: Record<string, { value: any; category?: string }> = {};

      // General
      updates['site_name'] = { value: settings.site_name || '', category: 'general' };
      updates['site_description'] = { value: settings.site_description || '', category: 'general' };
      updates['currency'] = { value: settings.currency || 'KRW', category: 'general' };

      // Contact
      updates['contact_email'] = { value: settings.contact_email || '', category: 'contact' };
      updates['contact_phone'] = { value: settings.contact_phone || '', category: 'contact' };
      updates['contact_address'] = { value: settings.contact_address || '', category: 'contact' };

      // SEO
      updates['seo_title'] = { value: settings.seo_title || '', category: 'seo' };
      updates['seo_description'] = { value: settings.seo_description || '', category: 'seo' };

      // Social
      updates['social_facebook'] = { value: settings.social_facebook || '', category: 'social' };
      updates['social_instagram'] = { value: settings.social_instagram || '', category: 'social' };

      // Integration
      updates['messenger_page_id'] = { value: settings.messenger_page_id || '', category: 'integration' };

      // Cart notes
      updates['cart_items_notes'] = { value: settings.cart_items_notes || '', category: 'cart' };
      updates['cart_checkout_notes'] = { value: settings.cart_checkout_notes || '', category: 'cart' };

      await updateSettings(updates);
      // Clear cache so storefront gets fresh data
      clearPublicSettingsCache();
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-admin-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Settings</h1>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6">
        {/* General Settings */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold">General</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
              <Input
                value={settings.site_name || ''}
                onChange={(e) => handleChange('site_name', e.target.value)}
                placeholder="HNUMarket"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <Input
                value={settings.currency || ''}
                onChange={(e) => handleChange('currency', e.target.value)}
                placeholder="KRW"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Site Description</label>
              <textarea
                value={settings.site_description || ''}
                onChange={(e) => handleChange('site_description', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                rows={2}
                placeholder="Korean products in Vietnam"
              />
            </div>
          </div>
        </div>

        {/* Contact Settings */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold">Contact</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <Input
                type="email"
                value={settings.contact_email || ''}
                onChange={(e) => handleChange('contact_email', e.target.value)}
                placeholder="contact@hnumarket.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <Input
                value={settings.contact_phone || ''}
                onChange={(e) => handleChange('contact_phone', e.target.value)}
                placeholder="+84 XXX XXX XXX"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <Input
                value={settings.contact_address || ''}
                onChange={(e) => handleChange('contact_address', e.target.value)}
                placeholder="123 Street, District, City"
              />
            </div>
          </div>
        </div>

        {/* SEO Settings */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold">SEO</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
              <Input
                value={settings.seo_title || ''}
                onChange={(e) => handleChange('seo_title', e.target.value)}
                placeholder="HNUMarket - Korean Products in Vietnam"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
              <textarea
                value={settings.seo_description || ''}
                onChange={(e) => handleChange('seo_description', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                rows={3}
                placeholder="Shop authentic Korean products..."
              />
            </div>
          </div>
        </div>

        {/* Social Settings */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold">Social Media</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
              <Input
                value={settings.social_facebook || ''}
                onChange={(e) => handleChange('social_facebook', e.target.value)}
                placeholder="https://facebook.com/hnumarket"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
              <Input
                value={settings.social_instagram || ''}
                onChange={(e) => handleChange('social_instagram', e.target.value)}
                placeholder="https://instagram.com/hnumarket"
              />
            </div>
          </div>
        </div>

        {/* Integration Settings */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold">Integrations</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Messenger Page ID
              </label>
              <Input
                value={settings.messenger_page_id || ''}
                onChange={(e) => handleChange('messenger_page_id', e.target.value)}
                placeholder="123456789012345"
              />
              <p className="text-xs text-gray-500 mt-1">
                Facebook Page ID dùng cho tính năng liên hệ qua Messenger khi thanh toán.
                Tìm Page ID tại: Facebook Page → About → Page ID
              </p>
            </div>
          </div>
        </div>

        {/* Cart Notes Settings */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold">Lưu ý giỏ hàng</h2>
          <p className="text-sm text-gray-500">
            Tùy chỉnh các thông báo lưu ý hiển thị trong trang giỏ hàng.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lưu ý danh sách sản phẩm
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Mỗi dòng sẽ hiển thị như một bullet point. Để trống để ẩn.
              </p>
              <textarea
                value={settings.cart_items_notes || ''}
                onChange={(e) => handleChange('cart_items_notes', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono"
                rows={4}
                placeholder="Đơn hàng có sản phẩm lạnh sẽ được tách đơn và cộng thêm phí vận chuyển&#10;Mã thông quan cá nhân/Số hộ chiếu: đây là phần bắt buộc mới có thể thông quan được"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lưu ý khi thanh toán
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Mỗi dòng sẽ hiển thị như một mục lưu ý được đánh số. Để trống để ẩn.
              </p>
              <textarea
                value={settings.cart_checkout_notes || ''}
                onChange={(e) => handleChange('cart_checkout_notes', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono"
                rows={5}
                placeholder="Nếu khu vực giao hàng của quý khách trong thời gian cao điểm, vui lòng chờ thêm 1-3 tiếng&#10;Sau khi giao hàng, chúng tôi sẽ gửi thông báo thời gian giao&#10;Xin cảm ơn quý khách đã tin tưởng"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

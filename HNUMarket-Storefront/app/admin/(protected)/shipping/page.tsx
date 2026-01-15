'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  type ShippingLocation,
} from '@/lib/api/shipping';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Loader2, Edit2, X, Check } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

export default function ShippingPage() {
  const [locations, setLocations] = useState<ShippingLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formFee, setFormFee] = useState('');
  const [formOrder, setFormOrder] = useState('');

  // Edit state
  const [editName, setEditName] = useState('');
  const [editFee, setEditFee] = useState('');
  const [editOrder, setEditOrder] = useState('');

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const data = await getLocations();
      setLocations(data);
    } catch (error) {
      console.error('Failed to load locations:', error);
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!formName || !formFee) return;

    try {
      await createLocation({
        name: formName,
        fee: parseInt(formFee),
        displayOrder: formOrder ? parseInt(formOrder) : undefined,
      });
      setFormName('');
      setFormFee('');
      setFormOrder('');
      setShowForm(false);
      loadLocations();
    } catch (error) {
      console.error('Failed to create location:', error);
      toast.error('Không thể tạo địa điểm mới');
    }
  };

  const startEdit = (location: ShippingLocation) => {
    setEditingId(location.id);
    setEditName(location.name);
    setEditFee(location.fee.toString());
    setEditOrder(location.display_order.toString());
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditFee('');
    setEditOrder('');
  };

  const handleUpdate = async (id: string) => {
    try {
      await updateLocation(id, {
        name: editName,
        fee: parseInt(editFee),
        displayOrder: parseInt(editOrder),
      });
      setEditingId(null);
      loadLocations();
    } catch (error) {
      console.error('Failed to update location:', error);
      toast.error('Không thể cập nhật địa điểm');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Xóa địa điểm "${name}"?`)) return;

    try {
      await deleteLocation(id);
      loadLocations();
    } catch (error) {
      console.error('Failed to delete location:', error);
      toast.error('Không thể xóa địa điểm');
    }
  };

  const toggleActive = async (location: ShippingLocation) => {
    try {
      await updateLocation(location.id, {
        isActive: !location.is_active,
      });
      loadLocations();
    } catch (error) {
      console.error('Failed to toggle active:', error);
      toast.error('Không thể thay đổi trạng thái');
    }
  };

  // Group locations by fee
  const groupedLocations = useMemo(() => {
    const groups: Record<number, ShippingLocation[]> = {};

    locations.forEach((location) => {
      if (!groups[location.fee]) {
        groups[location.fee] = [];
      }
      groups[location.fee].push(location);
    });

    // Sort each group by display_order
    Object.keys(groups).forEach((fee) => {
      groups[Number(fee)].sort(
        (a, b) => a.display_order - b.display_order
      );
    });

    return groups;
  }, [locations]);

  // Get sorted fee groups
  const sortedFees = useMemo(() => {
    return Object.keys(groupedLocations)
      .map(Number)
      .sort((a, b) => a - b);
  }, [groupedLocations]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Địa điểm Giao hàng</h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý các địa điểm và phí vận chuyển
          </p>
        </div>
        <Button className="bg-admin-primary text-white hover:bg-admin-primary/80" onClick={() => setShowForm(true)} disabled={showForm}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm địa điểm
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-4 space-y-4 border-2 border-blue-600">
          <h3 className="font-semibold">Địa điểm giao hàng mới</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Tên địa điểm (VD: 홍도동)"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Phí vận chuyển (KRW)"
              value={formFee}
              onChange={(e) => setFormFee(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Thứ tự hiển thị"
              value={formOrder}
              onChange={(e) => setFormOrder(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreate}>Tạo địa điểm</Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Hủy
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {locations.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            Chưa có địa điểm nào. Nhấn &quot;Thêm địa điểm&quot; để tạo mới.
          </div>
        ) : (
          sortedFees.map((fee, feeIndex) => (
            <div key={fee} className={feeIndex > 0 ? 'mt-6' : ''}>
              {/* Fee Group Header */}
              <div className="bg-blue-50 px-6 py-3 border-b-2 border-blue-600">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-blue-700">
                    Phí: {formatCurrency(fee)}
                  </h3>
                  <span className="text-sm text-gray-600">
                    {groupedLocations[fee].length} địa điểm
                  </span>
                </div>
              </div>

              {/* Locations Table */}
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Thứ tự
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Địa điểm
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Phí ship
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {groupedLocations[fee].map((location) => (
                    <tr key={location.id} className="hover:bg-gray-50">
                      {editingId === location.id ? (
                        <>
                          <td className="px-6 py-4">
                            <Input
                              type="number"
                              value={editOrder}
                              onChange={(e) => setEditOrder(e.target.value)}
                              className="w-20"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                            />
                          </td>
                          <td className="px-6 py-4">
                            <Input
                              type="number"
                              value={editFee}
                              onChange={(e) => setEditFee(e.target.value)}
                            />
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${location.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                                }`}
                            >
                              {location.is_active ? 'Đang hoạt động' : 'Tạm ngưng'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUpdate(location.id)}
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={cancelEdit}
                            >
                              <X className="h-4 w-4 text-gray-600" />
                            </Button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {location.display_order}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {location.name}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {formatCurrency(location.fee)}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => toggleActive(location)}
                              className={`px-2 py-1 rounded-full text-xs cursor-pointer ${location.is_active
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                }`}
                            >
                              {location.is_active ? 'Đang hoạt động' : 'Tạm ngưng'}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEdit(location)}
                            >
                              <Edit2 className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleDelete(location.id, location.name)
                              }
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

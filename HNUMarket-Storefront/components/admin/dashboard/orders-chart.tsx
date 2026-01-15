'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { OrderStatusData } from '@/lib/api/dashboard';

interface OrdersChartProps {
  data: OrderStatusData[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#FBBF24',
  confirmed: '#3B82F6',
  processing: '#8B5CF6',
  shipped: '#10B981',
  delivered: '#059669',
  cancelled: '#EF4444',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  processing: 'Đang xử lý',
  shipped: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
};

export function OrdersChart({ data }: OrdersChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-4">Đơn hàng theo trạng thái</h3>
        <p className="text-sm text-gray-500 text-center py-10">
          Chưa có dữ liệu đơn hàng
        </p>
      </div>
    );
  }

  const chartData = data.map((entry) => ({
    ...entry,
    label: STATUS_LABELS[entry.status] || entry.status,
  }));

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-4">Đơn hàng theo trạng thái</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 0, right: 0, bottom: 16, left: 0 }}>
            <Pie
              data={chartData as any[]}
              cx="50%"
              cy="48%"
              innerRadius={60}
              outerRadius={75}
              paddingAngle={3}
              dataKey="count"
              nameKey="label"
              labelLine={false}
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.status}
                  fill={STATUS_COLORS[entry.status] || '#94A3B8'}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend verticalAlign="bottom" height={28} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

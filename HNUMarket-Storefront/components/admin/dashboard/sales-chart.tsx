'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import type { SalesData } from '@/lib/api/dashboard';

interface SalesChartProps {
  data: SalesData[];
}

export function SalesChart({ data }: SalesChartProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-4">Tổng quan doanh thu (30 ngày)</h3>
        <p className="text-sm text-gray-500 text-center py-10">
          Chưa có dữ liệu doanh thu
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-4">Tổng quan doanh thu (30 ngày)</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickFormatter={(value) => formatCurrency(value).replace('₫', '')}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value: any) => {
                // Handle array case (when multiple series)
                const actualValue = Array.isArray(value) ? value[0] : value;
                const numValue = typeof actualValue === 'number' ? actualValue : typeof actualValue === 'string' ? parseFloat(actualValue) || 0 : 0;
                return [formatCurrency(numValue), 'Revenue'];
              }}
              labelFormatter={formatDate}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#3B82F6"
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, AdminGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('stats')
  getStats() {
    return this.dashboardService.getStats();
  }

  @Get('sales')
  getSales() {
    return this.dashboardService.getSalesData();
  }

  @Get('orders')
  async getOrders() {
    const [statusData, recentOrders] = await Promise.all([
      this.dashboardService.getOrderStatusData(),
      this.dashboardService.getRecentOrders(),
    ]);
    return { statusData, recentOrders };
  }

  @Get('products')
  async getProducts() {
    const [topProducts, lowStockProducts] = await Promise.all([
      this.dashboardService.getTopProducts(),
      this.dashboardService.getLowStockProducts(),
    ]);
    return { topProducts, lowStockProducts };
  }
}

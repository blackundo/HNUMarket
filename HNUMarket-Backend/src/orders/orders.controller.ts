import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { AddOrderItemDto } from './dto/add-order-item.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { AuthService } from '../auth/auth.service';

/**
 * Orders Controller
 *
 * Handles HTTP endpoints for order management
 */
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly authService: AuthService,
  ) {}

  /**
   * Create a new order
   * Public endpoint (guest or authenticated)
   */
  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createOrderDto: CreateOrderDto, @Request() req?: any) {
    const userId = req?.user?.id;
    return this.ordersService.create(createOrderDto, userId);
  }

  /**
   * Get all orders (Admin only)
   */
  @Get()
  @UseGuards(JwtAuthGuard, AdminGuard)
  async findAll(@Query() query: OrderQueryDto) {
    return this.ordersService.findAll(query);
  }

  /**
   * Get current user's orders
   */
  @Get('my-orders')
  @UseGuards(JwtAuthGuard)
  async getMyOrders(@Request() req: any, @Query() query: OrderQueryDto) {
    const userId = req.user.id;
    return this.ordersService.findUserOrders(userId, query);
  }

  /**
   * Get order by ID (Admin or order owner)
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string, @Request() req: any) {
    const order = await this.ordersService.findOne(id);

    // Check if user is admin or order owner
    const isAdmin = await this.authService.isAdmin(req.user.id);
    const isOwner = order.user_id === req.user.id;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('Unauthorized to view this order');
    }

    return order;
  }

  /**
   * Get order by order number (Admin or order owner)
   */
  @Get('number/:orderNumber')
  async findByOrderNumber(@Param('orderNumber') orderNumber: string) {
    const order = await this.ordersService.findByOrderNumber(orderNumber);

    return order;
  }

  /**
   * Update order status (Admin only)
   */
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, updateStatusDto);
  }

  /**
   * Cancel order (Admin or order owner)
   */
  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  async cancel(@Param('id') id: string, @Request() req: any) {
    const order = await this.ordersService.findOne(id);

    // Check if user is admin or order owner
    const isAdmin = await this.authService.isAdmin(req.user.id);
    const isOwner = order.user_id === req.user.id;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('Unauthorized to cancel this order');
    }

    return this.ordersService.cancel(id);
  }

  /**
   * Add item to existing order (Admin only)
   */
  @Post(':id/items')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async addItem(@Param('id') id: string, @Body() dto: AddOrderItemDto) {
    return this.ordersService.addItemToOrder(id, dto);
  }

  /**
   * Update order item quantity (Admin only)
   */
  @Patch(':id/items/:itemId')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateOrderItemDto,
  ) {
    return this.ordersService.updateOrderItem(id, itemId, dto);
  }

  /**
   * Remove item from order (Admin only)
   */
  @Delete(':id/items/:itemId')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.OK)
  async removeItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.ordersService.removeOrderItem(id, itemId);
  }
}

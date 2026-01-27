import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { SupabaseAdminService } from '../common/supabase/supabase-admin.service';
import { R2StorageService } from '../common/storage/r2-storage.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { AddOrderItemDto } from './dto/add-order-item.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';

/**
 * Orders Service
 *
 * Handles order CRUD operations with normalized variant system
 */
@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private supabaseAdmin: SupabaseAdminService,
    private r2Storage: R2StorageService,
  ) { }

  /**
   * Generate unique order number (format: ORD-YYYYMMDD-XXXXX)
   */
  private generateOrderNumber(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');

    // Use timestamp-based random sequence
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const sequence = String((timestamp % 100000) + random).slice(-5).padStart(5, '0');

    return `ORD-${dateStr}-${sequence}`;
  }

  /**
   * Get variant display name from normalized structure
   */
  private async getVariantDisplayName(variantId: string): Promise<string> {
    const supabase = this.supabaseAdmin.getClient();

    const { data, error } = await supabase.rpc('get_variant_display_name', {
      p_variant_id: variantId,
    });

    if (error) {
      this.logger.warn(`Failed to get variant display name: ${error.message}`);
      return '';
    }

    return data || '';
  }

  /**
   * Get variant details including option values
   * Returns variant with normalized structure from junction tables
   */
  private async getVariantDetails(variantId: string) {
    const supabase = this.supabaseAdmin.getClient();

    // Get variant with all option values (normalized schema)
    // Structure: product_variants -> product_variant_option_values -> product_option_values -> product_options
    const { data: variant, error: variantError } = await supabase
      .from('product_variants')
      .select(`
        *,
        option_values:product_variant_option_values(
          option_value:product_option_values(
            id,
            value,
            option:product_options(
              id,
              name,
              position
            )
          )
        )
      `)
      .eq('id', variantId)
      .single();

    if (variantError || !variant) {
      throw new NotFoundException(`Variant not found: ${variantId}`);
    }

    return variant;
  }

  /**
   * Create a new order
   */
  async create(dto: CreateOrderDto, userId?: string) {
    const supabase = this.supabaseAdmin.getClient();

    // Validate items and calculate totals
    let subtotal = 0;
    const validatedItems = [];

    for (const item of dto.items) {
      // Get product details
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, name, price, stock')
        .eq('id', item.productId)
        .single();

      if (productError || !product) {
        throw new NotFoundException(`Product not found: ${item.productId}`);
      }

      let variantName = '';
      let actualPrice = product.price;
      let availableStock = product.stock;

      // If variant is specified, get variant details
      if (item.variantId) {
        const variant = await this.getVariantDetails(item.variantId);

        // Check if variant belongs to the product
        if (variant.product_id !== item.productId) {
          throw new BadRequestException(
            `Variant ${item.variantId} does not belong to product ${item.productId}`,
          );
        }

        // Build variant display name from option values (normalized schema)
        // Sort by option position to ensure consistent ordering (e.g., "Color / Size" not "Size / Color")
        const optionValues = variant.option_values
          .map((ov: any) => ({
            value: ov.option_value?.value,
            position: ov.option_value?.option?.position || 0,
          }))
          .filter((ov: any) => ov.value)
          .sort((a: any, b: any) => a.position - b.position)
          .map((ov: any) => ov.value);

        variantName = optionValues.join(' / ');

        // Use variant price if set, otherwise use product price
        actualPrice = variant.price || product.price;
        availableStock = variant.stock;
      }

      // Check stock availability
      if (availableStock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${product.name}${variantName ? ` (${variantName})` : ''}. Available: ${availableStock}, Requested: ${item.quantity}`,
        );
      }

      const totalPrice = item.unitPrice * item.quantity;
      subtotal += totalPrice;

      validatedItems.push({
        product_id: item.productId,
        variant_id: item.variantId || null,
        product_name: product.name,
        variant_name: variantName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: totalPrice,
      });
    }

    // Calculate final total
    const discount = dto.discount || 0;
    const total = subtotal + dto.shippingFee - discount;

    // Generate order number
    const orderNumber = this.generateOrderNumber();

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: userId || null,
        status: 'pending',
        subtotal,
        shipping_fee: dto.shippingFee,
        discount,
        total,
        shipping_address: dto.shippingAddress,
        billing_address: dto.billingAddress ?? null,
        payment_method: dto.paymentMethod,
        payment_status: 'pending',
        notes: dto.notes,
      })
      .select()
      .single();

    if (orderError) {
      this.logger.error(`Failed to create order: ${orderError.message}`);
      throw new Error(orderError.message);
    }

    // Add order items
    const itemsWithOrderId = validatedItems.map((item) => ({
      ...item,
      order_id: order.id,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsWithOrderId);

    if (itemsError) {
      // Rollback: delete the order
      await supabase.from('orders').delete().eq('id', order.id);
      this.logger.error(`Failed to create order items: ${itemsError.message}`);
      throw new Error(itemsError.message);
    }

    // Update stock for products and variants
    for (const item of dto.items) {
      if (item.variantId) {
        // Update variant stock
        await supabase.rpc('decrement_variant_stock', {
          p_variant_id: item.variantId,
          p_quantity: item.quantity,
        });
      } else {
        // Update product stock
        await supabase.rpc('decrement_product_stock', {
          p_product_id: item.productId,
          p_quantity: item.quantity,
        });
      }
    }

    this.logger.log(`Order created: ${order.id} (${orderNumber})`);
    return this.findOne(order.id);
  }

  /**
   * Find all orders with pagination and filters
   */
  async findAll(query: OrderQueryDto) {
    const supabase = this.supabaseAdmin.getClient();
    const {
      page = 1,
      limit = 20,
      search,
      status,
      paymentStatus,
      userId,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = query;

    let queryBuilder = supabase
      .from('orders')
      .select(
        `
        *,
        user:profiles(id, full_name, email),
        items:order_items(
          *,
          product:products(
            id,
            name,
            slug,
            images:product_images(url, alt_text, display_order)
          ),
          variant:product_variants(id, sku)
        )
      `,
        { count: 'exact' },
      );

    if (search) {
      queryBuilder = queryBuilder.or(
        `order_number.ilike.%${search}%,shipping_address->>fullName.ilike.%${search}%`,
      );
    }
    if (status) {
      queryBuilder = queryBuilder.eq('status', status);
    }
    if (paymentStatus) {
      queryBuilder = queryBuilder.eq('payment_status', paymentStatus);
    }
    if (userId) {
      queryBuilder = queryBuilder.eq('user_id', userId);
    }

    queryBuilder = queryBuilder
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range((page - 1) * limit, page * limit - 1);

    const { data, error, count } = await queryBuilder;

    if (error) {
      this.logger.error(`Failed to fetch orders: ${error.message}`);
      throw new Error(error.message);
    }

    return {
      data,
      meta: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  /**
   * Find single order by ID
   */
  async findOne(id: string) {
    const supabase = this.supabaseAdmin.getClient();

    const { data, error } = await supabase
      .from('orders')
      .select(
        `
        *,
        user:profiles(id, full_name, email, avatar_url),
        items:order_items(
          *,
          product:products(
            id,
            name,
            slug,
            price,
            images:product_images(url, alt_text, display_order)
          ),
          variant:product_variants(id, sku, price, stock)
        )
      `,
      )
      .eq('id', id)
      .single();

    if (error || !data) {
      this.logger.warn(`Order not found: ${id}`);
      throw new NotFoundException('Order not found');
    }

    return data;
  }

  /**
   * Transform image URLs to include R2 public URL prefix
   */
  private transformImageUrls(order: any): any {
    if (!order || !order.items) {
      return order;
    }

    return {
      ...order,
      items: order.items.map((item: any) => ({
        ...item,
        product: item.product ? {
          ...item.product,
          images: item.product.images?.map((img: any) => ({
            ...img,
            url: img.url ? this.r2Storage.getPublicUrl(img.url) : img.url,
          })),
        } : item.product,
      })),
    };
  }

  /**
   * Find order by order number
   */
  async findByOrderNumber(orderNumber: string) {
    const supabase = this.supabaseAdmin.getClient();

    const { data, error } = await supabase
      .from('orders')
      .select(
        `
        *,
        user:profiles(id, full_name, email, avatar_url),
        items:order_items(
          *,
          product:products(
            id,
            name,
            slug,
            price,
            images:product_images(url, alt_text, display_order)
          ),
          variant:product_variants(id, sku, price, stock)
        )
      `,
      )
      .eq('order_number', orderNumber)
      .single();

    if (error || !data) {
      this.logger.warn(`Order not found: ${orderNumber}`);
      throw new NotFoundException('Order not found');
    }

    return data;
  }

  /**
   * Find order by order number for receipt (with full image URLs)
   * Public endpoint - includes R2 public URL prefix for images
   */
  async findByOrderNumberForReceipt(orderNumber: string) {
    const order = await this.findByOrderNumber(orderNumber);
    return this.transformImageUrls(order);
  }

  /**
   * Update order status
   */
  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const supabase = this.supabaseAdmin.getClient();

    // Check order exists
    await this.findOne(id);

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.paymentStatus !== undefined)
      updateData.payment_status = dto.paymentStatus;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    const { error } = await supabase.from('orders').update(updateData).eq('id', id);

    if (error) {
      this.logger.error(`Failed to update order: ${error.message}`);
      throw new Error(error.message);
    }

    this.logger.log(`Order status updated: ${id}`);
    return this.findOne(id);
  }

  /**
   * Get user's orders
   */
  async findUserOrders(userId: string, query: OrderQueryDto) {
    return this.findAll({ ...query, userId });
  }

  /**
   * Recalculate order totals based on current items
   * Helper method for add/update/remove item operations
   */
  private async recalculateOrderTotals(orderId: string) {
    const supabase = this.supabaseAdmin.getClient();

    // Fetch order with all items
    const order = await this.findOne(orderId);

    // Calculate subtotal from all items
    const subtotal = order.items.reduce(
      (sum, item) => sum + (item.total_price || 0),
      0,
    );

    // Calculate total: subtotal + shipping - discount
    const total = subtotal + order.shipping_fee - order.discount;

    // Update order totals
    const { error } = await supabase
      .from('orders')
      .update({
        subtotal,
        total,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) {
      this.logger.error(`Failed to recalculate order totals: ${error.message}`);
      throw new Error(error.message);
    }

    this.logger.log(`Order totals recalculated: ${orderId}`);
  }

  /**
   * Add item to existing order (Admin only)
   * Only allowed for pending/confirmed orders
   */
  async addItemToOrder(orderId: string, dto: AddOrderItemDto) {
    const supabase = this.supabaseAdmin.getClient();

    // 1. Validate order exists and is editable
    const order = await this.findOne(orderId);
    if (!['pending', 'confirmed'].includes(order.status)) {
      throw new BadRequestException(
        `Order cannot be modified. Current status: ${order.status}. Only 'pending' or 'confirmed' orders can be edited.`,
      );
    }

    // 2. Get product details
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, price, stock')
      .eq('id', dto.productId)
      .single();

    if (productError || !product) {
      throw new NotFoundException(`Product not found: ${dto.productId}`);
    }

    let variantName = '';
    let actualPrice = product.price;
    let availableStock = product.stock;

    // 3. If variant specified, get variant details
    if (dto.variantId) {
      const variant = await this.getVariantDetails(dto.variantId);

      // Check variant belongs to product
      if (variant.product_id !== dto.productId) {
        throw new BadRequestException(
          `Variant ${dto.variantId} does not belong to product ${dto.productId}`,
        );
      }

      // Build variant display name from option values
      const optionValues = variant.option_values
        .map((ov: any) => ({
          value: ov.option_value?.value,
          position: ov.option_value?.option?.position || 0,
        }))
        .filter((ov: any) => ov.value)
        .sort((a: any, b: any) => a.position - b.position)
        .map((ov: any) => ov.value);

      variantName = optionValues.join(' / ');

      // Use variant price if set, otherwise product price
      actualPrice = variant.price || product.price;
      availableStock = variant.stock;
    }

    // 4. Check stock availability
    if (availableStock < dto.quantity) {
      throw new BadRequestException(
        `Insufficient stock for ${product.name}${variantName ? ` (${variantName})` : ''}. Available: ${availableStock}, Requested: ${dto.quantity}`,
      );
    }

    // 5. Check if item already exists in order
    const { data: existingItems } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)
      .eq('product_id', dto.productId)
      .eq('variant_id', dto.variantId || null);

    if (existingItems && existingItems.length > 0) {
      // Update existing item quantity
      const existingItem = existingItems[0];
      const newQuantity = existingItem.quantity + dto.quantity;

      // Check stock for increased quantity
      if (availableStock < dto.quantity) {
        throw new BadRequestException(
          `Insufficient stock. Available: ${availableStock}, Additional requested: ${dto.quantity}`,
        );
      }

      await supabase
        .from('order_items')
        .update({
          quantity: newQuantity,
          total_price: actualPrice * newQuantity,
        })
        .eq('id', existingItem.id);
    } else {
      // Insert new order item
      const totalPrice = actualPrice * dto.quantity;

      const { error: insertError } = await supabase
        .from('order_items')
        .insert({
          order_id: orderId,
          product_id: dto.productId,
          variant_id: dto.variantId || null,
          product_name: product.name,
          variant_name: variantName || null,
          quantity: dto.quantity,
          unit_price: actualPrice,
          total_price: totalPrice,
        });

      if (insertError) {
        this.logger.error(`Failed to insert order item: ${insertError.message}`);
        throw new Error(insertError.message);
      }
    }

    // 6. Decrement stock
    if (dto.variantId) {
      await supabase.rpc('decrement_variant_stock', {
        p_variant_id: dto.variantId,
        p_quantity: dto.quantity,
      });
    } else {
      await supabase.rpc('decrement_product_stock', {
        p_product_id: dto.productId,
        p_quantity: dto.quantity,
      });
    }

    // 7. Recalculate order totals
    await this.recalculateOrderTotals(orderId);

    this.logger.log(`Item added to order ${orderId}: ${product.name}`);
    return this.findOne(orderId);
  }

  /**
   * Update order item quantity (Admin only)
   * Only allowed for pending/confirmed orders
   */
  async updateOrderItem(orderId: string, itemId: string, dto: UpdateOrderItemDto) {
    const supabase = this.supabaseAdmin.getClient();

    // 1. Validate order exists and is editable
    const order = await this.findOne(orderId);
    if (!['pending', 'confirmed'].includes(order.status)) {
      throw new BadRequestException(
        `Order cannot be modified. Current status: ${order.status}. Only 'pending' or 'confirmed' orders can be edited.`,
      );
    }

    // 2. Find item in order
    const item = order.items.find((i) => i.id === itemId);
    if (!item) {
      throw new NotFoundException(`Order item not found: ${itemId}`);
    }

    // 3. Calculate quantity difference
    const quantityDiff = dto.quantity - item.quantity;

    if (quantityDiff === 0) {
      // No change needed
      return this.findOne(orderId);
    }

    // 4. If increasing quantity, check stock
    if (quantityDiff > 0) {
      let availableStock = 0;

      if (item.variant_id) {
        const { data: variant } = await supabase
          .from('product_variants')
          .select('stock')
          .eq('id', item.variant_id)
          .single();
        availableStock = variant?.stock || 0;
      } else {
        const { data: product } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.product_id)
          .single();
        availableStock = product?.stock || 0;
      }

      if (availableStock < quantityDiff) {
        throw new BadRequestException(
          `Insufficient stock for ${item.product_name}. Available: ${availableStock}, Additional requested: ${quantityDiff}`,
        );
      }
    }

    // 5. Update order item
    const newTotalPrice = item.unit_price * dto.quantity;

    const { error: updateError } = await supabase
      .from('order_items')
      .update({
        quantity: dto.quantity,
        total_price: newTotalPrice,
      })
      .eq('id', itemId);

    if (updateError) {
      this.logger.error(`Failed to update order item: ${updateError.message}`);
      throw new Error(updateError.message);
    }

    // 6. Adjust stock based on difference
    if (quantityDiff > 0) {
      // Need more stock - decrement
      if (item.variant_id) {
        await supabase.rpc('decrement_variant_stock', {
          p_variant_id: item.variant_id,
          p_quantity: quantityDiff,
        });
      } else {
        await supabase.rpc('decrement_product_stock', {
          p_product_id: item.product_id,
          p_quantity: quantityDiff,
        });
      }
    } else {
      // Returning stock - increment
      if (item.variant_id) {
        await supabase.rpc('increment_variant_stock', {
          p_variant_id: item.variant_id,
          p_quantity: Math.abs(quantityDiff),
        });
      } else {
        await supabase.rpc('increment_product_stock', {
          p_product_id: item.product_id,
          p_quantity: Math.abs(quantityDiff),
        });
      }
    }

    // 7. Recalculate order totals
    await this.recalculateOrderTotals(orderId);

    this.logger.log(`Order item updated: ${itemId} (quantity: ${item.quantity} → ${dto.quantity})`);
    return this.findOne(orderId);
  }

  /**
   * Remove item from order (Admin only)
   * Only allowed for pending/confirmed orders
   * Cannot remove last item (order must have at least 1 item)
   */
  async removeOrderItem(orderId: string, itemId: string) {
    const supabase = this.supabaseAdmin.getClient();

    // 1. Validate order exists and is editable
    const order = await this.findOne(orderId);
    if (!['pending', 'confirmed'].includes(order.status)) {
      throw new BadRequestException(
        `Order cannot be modified. Current status: ${order.status}. Only 'pending' or 'confirmed' orders can be edited.`,
      );
    }

    // 2. Find item in order
    const item = order.items.find((i) => i.id === itemId);
    if (!item) {
      throw new NotFoundException(`Order item not found: ${itemId}`);
    }

    // 3. Prevent removing last item
    if (order.items.length <= 1) {
      throw new BadRequestException(
        'Cannot remove the last item from order. Please cancel the order instead.',
      );
    }

    // 4. Restore stock
    if (item.variant_id) {
      await supabase.rpc('increment_variant_stock', {
        p_variant_id: item.variant_id,
        p_quantity: item.quantity,
      });
    } else {
      await supabase.rpc('increment_product_stock', {
        p_product_id: item.product_id,
        p_quantity: item.quantity,
      });
    }

    // 5. Delete order item
    const { error: deleteError } = await supabase
      .from('order_items')
      .delete()
      .eq('id', itemId);

    if (deleteError) {
      this.logger.error(`Failed to delete order item: ${deleteError.message}`);
      throw new Error(deleteError.message);
    }

    // 6. Recalculate order totals
    await this.recalculateOrderTotals(orderId);

    this.logger.log(`Order item removed: ${itemId} from order ${orderId}`);
    return this.findOne(orderId);
  }

  /**
   * Cancel order (only if status is pending or confirmed)
   */
  async cancel(id: string) {
    const supabase = this.supabaseAdmin.getClient();

    const order = await this.findOne(id);

    if (!['pending', 'confirmed'].includes(order.status)) {
      throw new BadRequestException(
        'Only pending or confirmed orders can be cancelled',
      );
    }

    // Restore stock
    const { data: items } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', id);

    if (items) {
      for (const item of items) {
        if (item.variant_id) {
          await supabase.rpc('increment_variant_stock', {
            p_variant_id: item.variant_id,
            p_quantity: item.quantity,
          });
        } else {
          await supabase.rpc('increment_product_stock', {
            p_product_id: item.product_id,
            p_quantity: item.quantity,
          });
        }
      }
    }

    // Update order status
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      this.logger.error(`Failed to cancel order: ${error.message}`);
      throw new Error(error.message);
    }

    this.logger.log(`Order cancelled: ${id}`);
    return this.findOne(id);
  }

}

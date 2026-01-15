import type { ProductUnitType } from '@/types';

/**
 * Vietnamese display names for product units
 * Used for rendering unit labels in UI
 */
export const UNIT_LABELS: Record<ProductUnitType, string> = {
  goi: 'Gói',
  loc: 'Lốc',
  thung: 'Thùng',
  chai: 'Chai',
  hop: 'Hộp',
  lon: 'Lon',
  kg: 'Kg',
  g: 'g',
  l: 'Lít',
  ml: 'ml',
  cai: 'Cái',
  bo: 'Bộ',
  tui: 'Túi',
  vi: 'Vỉ',
};

/**
 * Get Vietnamese display name for a unit
 *
 * @param unit - The ProductUnitType value
 * @returns Vietnamese display name
 *
 * @example
 * getUnitLabel('goi') // => "Gói"
 * getUnitLabel('thung') // => "Thùng"
 */
export function getUnitLabel(unit: ProductUnitType): string {
  return UNIT_LABELS[unit] || unit;
}

/**
 * Format variant display name with quantity
 *
 * @param unit - The variant's unit type
 * @param conversionRate - Conversion rate to base unit
 * @param baseUnit - Base unit for the product (default: 'goi')
 * @returns Formatted display name
 *
 * @example
 * formatVariantName('goi', 1) // => "1 Gói"
 * formatVariantName('loc', 6) // => "Lốc 6 gói"
 * formatVariantName('thung', 24) // => "Thùng 24 gói"
 * formatVariantName('chai', 1, 'chai') // => "1 Chai"
 */
export function formatVariantName(
  unit: ProductUnitType,
  conversionRate: number,
  baseUnit: ProductUnitType = 'goi'
): string {
  const unitLabel = getUnitLabel(unit);

  // For base unit or conversion rate of 1
  if (conversionRate === 1 || unit === baseUnit) {
    return `1 ${unitLabel}`;
  }

  const baseLabel = getUnitLabel(baseUnit).toLowerCase();
  return `${unitLabel} ${conversionRate} ${baseLabel}`;
}

/**
 * Calculate price per base unit for comparison
 *
 * @param price - Total price of the variant
 * @param conversionRate - Conversion rate to base unit
 * @returns Price per base unit, rounded to nearest integer
 *
 * @example
 * calculatePricePerUnit(28000, 6) // => 4667 (28000/6)
 * calculatePricePerUnit(110000, 24) // => 4583 (110000/24)
 */
export function calculatePricePerUnit(
  price: number,
  conversionRate: number
): number {
  if (conversionRate <= 0) return price;
  return Math.round(price / conversionRate);
}

/**
 * Calculate discount percentage compared to buying base units
 *
 * @param variantPrice - Price of the variant
 * @param baseUnitPrice - Price of one base unit
 * @param conversionRate - Conversion rate to base unit
 * @returns Discount percentage (0-100), or null if no discount
 *
 * @example
 * calculateBulkDiscount(28000, 5000, 6) // => 7 (7% discount)
 * // Because buying 6 individually = 30000, but loc 6 = 28000
 */
export function calculateBulkDiscount(
  variantPrice: number,
  baseUnitPrice: number,
  conversionRate: number
): number | null {
  if (conversionRate <= 1) return null;

  const individualTotalPrice = baseUnitPrice * conversionRate;
  const discount = ((individualTotalPrice - variantPrice) / individualTotalPrice) * 100;

  return discount > 0 ? Math.round(discount) : null;
}

/**
 * Format price per unit display
 *
 * @param price - Total price
 * @param conversionRate - Conversion rate
 * @param baseUnit - Base unit name (default: 'gói')
 * @returns Formatted string
 *
 * @example
 * formatPricePerUnit(28000, 6) // => "4,667₫/gói"
 * formatPricePerUnit(110000, 24) // => "4,583₫/gói"
 */
export function formatPricePerUnit(
  price: number,
  conversionRate: number,
  baseUnit: ProductUnitType = 'goi'
): string {
  const pricePerUnit = calculatePricePerUnit(price, conversionRate);
  const baseLabel = getUnitLabel(baseUnit).toLowerCase();
  return `${pricePerUnit.toLocaleString('vi-VN')}₫/${baseLabel}`;
}

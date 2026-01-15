/**
 * Vietnamese product unit types for grocery items
 * Used for ProductVariant unit field
 *
 * @description
 * These units represent common packaging and measurement units
 * used in Vietnamese grocery and convenience stores (bách hóa).
 *
 * @example
 * - Instant noodles: goi (pack), loc (bundle of 6), thung (carton of 24)
 * - Beverages: chai (bottle), lon (can), thung (case)
 * - Dry goods: kg, g, tui (bag), vi (blister pack)
 */
export enum ProductUnit {
  /** Gói - Package/pack (base unit for most products) */
  GOI = 'goi',

  /** Lốc - Bundle (usually 4-6 items packaged together) */
  LOC = 'loc',

  /** Thùng - Carton/case (bulk packaging, usually 12-24 items) */
  THUNG = 'thung',

  /** Chai - Bottle */
  CHAI = 'chai',

  /** Hộp - Box */
  HOP = 'hop',

  /** Lon - Can */
  LON = 'lon',

  /** Kilogram - Weight measurement */
  KG = 'kg',

  /** Gram - Weight measurement */
  G = 'g',

  /** Liter - Volume measurement */
  L = 'l',

  /** Milliliter - Volume measurement */
  ML = 'ml',

  /** Cái - Piece/item (individual unit) */
  CAI = 'cai',

  /** Bộ - Set (collection of items sold together) */
  BO = 'bo',

  /** Túi - Bag */
  TUI = 'tui',

  /** Vỉ - Blister pack (pharmaceutical/pill packaging) */
  VI = 'vi',
}

/**
 * Vietnamese display names for product units
 * Used for UI rendering
 */
export const UNIT_DISPLAY_NAMES: Record<ProductUnit, string> = {
  [ProductUnit.GOI]: 'Gói',
  [ProductUnit.LOC]: 'Lốc',
  [ProductUnit.THUNG]: 'Thùng',
  [ProductUnit.CHAI]: 'Chai',
  [ProductUnit.HOP]: 'Hộp',
  [ProductUnit.LON]: 'Lon',
  [ProductUnit.KG]: 'Kg',
  [ProductUnit.G]: 'g',
  [ProductUnit.L]: 'Lít',
  [ProductUnit.ML]: 'ml',
  [ProductUnit.CAI]: 'Cái',
  [ProductUnit.BO]: 'Bộ',
  [ProductUnit.TUI]: 'Túi',
  [ProductUnit.VI]: 'Vỉ',
};

/**
 * Get Vietnamese display name for a unit
 *
 * @param unit - The ProductUnit enum value
 * @returns Vietnamese display name
 *
 * @example
 * getUnitDisplayName(ProductUnit.GOI) // => "Gói"
 * getUnitDisplayName(ProductUnit.THUNG) // => "Thùng"
 */
export function getUnitDisplayName(unit: ProductUnit): string {
  return UNIT_DISPLAY_NAMES[unit] || unit;
}

/**
 * Check if a string is a valid ProductUnit value
 *
 * @param value - The string to check
 * @returns true if valid ProductUnit, false otherwise
 *
 * @example
 * isValidUnit('goi') // => true
 * isValidUnit('invalid') // => false
 */
export function isValidUnit(value: string): value is ProductUnit {
  return Object.values(ProductUnit).includes(value as ProductUnit);
}

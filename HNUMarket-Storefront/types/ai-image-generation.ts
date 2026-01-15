/**
 * AI Image Generation Types
 *
 * Type definitions for product AI image generation feature
 */

/**
 * Grocery Product Photography Themes
 */
export enum GroceryTheme {
  COZY_KITCHEN = 'COZY_KITCHEN',
  FRESH_VIBRANT = 'FRESH_VIBRANT',
  RUSTIC_WOOD = 'RUSTIC_WOOD',
  PREMIUM_MINIMALIST = 'PREMIUM_MINIMALIST',
}

/**
 * Tet (Lunar New Year) Photography Themes
 */
export enum TetTheme {
  TRADITIONAL = 'TRADITIONAL',
  LUXURY = 'LUXURY',
  MINIMALIST = 'MINIMALIST',
  NATURE = 'NATURE',
}

/**
 * All supported themes
 */
export type ProductTheme = GroceryTheme | TetTheme;

/**
 * Theme Display Information
 */
export interface ThemeInfo {
  id: ProductTheme;
  name: string;
  description: string;
  icon: string; // Lucide icon name
}

/**
 * Grocery theme-specific prompt templates
 */
export const THEME_PROMPTS: Record<GroceryTheme, string> = {
  [GroceryTheme.COZY_KITCHEN]: 'trong một căn bếp gia đình Việt Nam hiện đại và ấm cúng. Đặt trên mặt bàn đá marble sạch sẽ, xung quanh là các nguyên liệu tươi như hành lá, ớt, hoặc một chiếc thớt gỗ. Ánh sáng vàng nhẹ tạo cảm giác gần gũi.',
  [GroceryTheme.FRESH_VIBRANT]: 'trong một không gian nghệ thuật với các tia nước bắn (water splashes) hoặc lá xanh tươi mát xung quanh. Nền là màu gradient trang nhã. Ánh sáng rực rỡ, làm nổi bật độ tươi ngon và màu sắc tự nhiên của sản phẩm.',
  [GroceryTheme.RUSTIC_WOOD]: 'trên một mặt bàn gỗ mộc mạc, nền phía sau là tấm khăn trải bàn caro hoặc rổ tre đan. Tạo cảm giác thực phẩm thủ công, tự nhiên và an toàn. Ánh sáng tự nhiên chiếu từ cửa sổ side-light.',
  [GroceryTheme.PREMIUM_MINIMALIST]: 'trong một studio chuyên nghiệp với nền màu đơn sắc trung tính. Sử dụng các khối hình học (podium) để nâng cao sản phẩm. Đổ bóng mềm mại, tập trung hoàn toàn vào nhãn hiệu và bao bì.',
};

/**
 * Tet theme-specific prompt templates
 */
export const TET_THEME_PROMPTS: Record<TetTheme, string> = {
  [TetTheme.TRADITIONAL]: 'trong một khung cảnh Tết Nguyên Đán Việt Nam truyền thống ấm áp. Trang trí với hoa đào nở rộ, bánh chưng xanh, bao lì xì đỏ và câu đối đỏ. Ánh sáng tự nhiên, mềm mại.',
  [TetTheme.LUXURY]: 'trong một không gian sang trọng, quý phái mang phong cách Tết. Sử dụng tông màu vàng kim và đỏ thẫm. Có các chi tiết trang trí sơn mài, gốm sứ tinh xảo và ánh sáng studio chuyên nghiệp.',
  [TetTheme.MINIMALIST]: 'trên nền màu pastel nhẹ nhàng với các yếu tố Tết tinh tế như một cành đào nhỏ hoặc một phong bao lì xì. Phong cách hiện đại, sạch sẽ, tập trung hoàn toàn vào sản phẩm.',
  [TetTheme.NATURE]: 'đặt ngoài trời trong một khu vườn mùa xuân Việt Nam rực rỡ nắng vàng. Xung quanh là hoa mai vàng, cây quất và không khí tươi mới của mùa xuân.',
};

/**
 * Theme display configuration for Grocery
 */
export const THEME_CONFIG: ThemeInfo[] = [
  {
    id: GroceryTheme.COZY_KITCHEN,
    name: 'Bếp Gia Đình Ấm Cúng',
    description: 'Phù hợp đồ đóng gói, gia vị, gạo',
    icon: 'Sparkles',
  },
  {
    id: GroceryTheme.FRESH_VIBRANT,
    name: 'Siêu Thực & Tươi Mới',
    description: 'Phù hợp rau củ, trái cây, thực phẩm tươi',
    icon: 'Leaf',
  },
  {
    id: GroceryTheme.RUSTIC_WOOD,
    name: 'Rustic & Thủ Công',
    description: 'Phù hợp thực phẩm khô, đặc sản, trà, cafe',
    icon: 'Crown',
  },
  {
    id: GroceryTheme.PREMIUM_MINIMALIST,
    name: 'Sang Trọng & Tối Giản',
    description: 'Phù hợp hàng nhập khẩu, quà tặng cao cấp',
    icon: 'Zap',
  },
];

/**
 * Theme display configuration for Tet
 */
export const TET_THEME_CONFIG: ThemeInfo[] = [
  {
    id: TetTheme.TRADITIONAL,
    name: 'Tết Truyền Thống',
    description: 'Hoa đào, bánh chưng, bao lì xì đỏ',
    icon: 'Flower2',
  },
  {
    id: TetTheme.LUXURY,
    name: 'Tết Sang Trọng',
    description: 'Vàng kim, đỏ thẫm, sơn mài tinh xảo',
    icon: 'Crown',
  },
  {
    id: TetTheme.MINIMALIST,
    name: 'Tết Tối Giản',
    description: 'Pastel nhẹ nhàng, cành đào tinh tế',
    icon: 'Sparkles',
  },
  {
    id: TetTheme.NATURE,
    name: 'Tết Thiên Nhiên',
    description: 'Hoa mai vàng, cây quất, nắng xuân',
    icon: 'Sun',
  },
];

/**
 * Image Generation Request
 */
export interface ImageGenerationRequest {
  /** Base64 encoded source image */
  imageBase64: string;
  /** Selected theme */
  theme: ProductTheme;
  /** Number of images to generate (default: 4) */
  count?: number;
  /** Optional custom prompt addition */
  customPrompt?: string;
}

/**
 * Generated Image Result
 */
export interface GeneratedImage {
  /** Base64 encoded generated image */
  data: string;
  /** Data URL for display (data:image/jpeg;base64,...) */
  url: string;
  /** Theme used for generation */
  theme: ProductTheme;
  /** Timestamp of generation */
  generatedAt: Date;
}

/**
 * Image Generation Response
 */
export interface ImageGenerationResponse {
  /** Array of generated images */
  images: GeneratedImage[];
  /** Number of images generated */
  count: number;
  /** Theme used */
  theme: ProductTheme;
}

/**
 * Image Generation Error
 */
export interface ImageGenerationError {
  /** Error message */
  message: string;
  /** Error code (if available) */
  code?: string;
  /** Detailed error info */
  details?: unknown;
}

/**
 * Generation Status
 */
export type GenerationStatus =
  | 'idle'
  | 'uploading'
  | 'generating'
  | 'completed'
  | 'error';

/**
 * Component State for AI Image Generator
 */
export interface AIImageGeneratorState {
  /** Current status */
  status: GenerationStatus;
  /** Selected theme */
  selectedTheme: ProductTheme | null;
  /** Source image file */
  sourceImage: File | null;
  /** Source image preview URL */
  sourceImagePreview: string | null;
  /** Generated images */
  generatedImages: GeneratedImage[];
  /** Selected image index */
  selectedImageIndex: number | null;
  /** Error state */
  error: ImageGenerationError | null;
  /** Custom prompt */
  customPrompt: string;
}

/**
 * Helper function to check if theme is Tet theme
 */
export function isTetTheme(theme: ProductTheme): theme is TetTheme {
  return Object.values(TetTheme).includes(theme as TetTheme);
}

/**
 * Helper function to check if theme is Grocery theme
 */
export function isGroceryTheme(theme: ProductTheme): theme is GroceryTheme {
  return Object.values(GroceryTheme).includes(theme as GroceryTheme);
}

/**
 * Get theme display name from theme ID
 */
export function getThemeName(theme: ProductTheme): string {
  const allConfigs = [...THEME_CONFIG, ...TET_THEME_CONFIG];
  const themeInfo = allConfigs.find((config) => config.id === theme);
  return themeInfo?.name || 'Unknown Theme';
}

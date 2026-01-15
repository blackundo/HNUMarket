import { GoogleGenAI } from '@google/genai';
import type {
  ProductTheme,
  ImageGenerationRequest,
  ImageGenerationResponse,
  GeneratedImage,
  ImageGenerationError,
} from '@/types/ai-image-generation';
import { THEME_PROMPTS, TET_THEME_PROMPTS, isTetTheme, isGroceryTheme } from '@/types/ai-image-generation';

/**
 * AI Image Generation Service
 *
 * Handles AI-powered product image generation using Google GenAI
 */

/**
 * Get Google GenAI API key from environment
 */
function getApiKey(): string {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_GENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'Google GenAI API key not configured. Please add NEXT_PUBLIC_GOOGLE_GENAI_API_KEY to .env.local'
    );
  }

  return apiKey;
}

/**
 * Convert File to base64 string
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (data:image/jpeg;base64,)
      const base64 = result.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
      resolve(base64);
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Build complete prompt for image generation
 */
function buildPrompt(theme: ProductTheme, customPrompt: string = ''): string {
  let prompt = '';

  if (isTetTheme(theme)) {
    // Tet theme prompt
    prompt = `Tạo một bức ảnh chụp sản phẩm chuyên nghiệp với tỷ lệ khung hình 1:1 (hình vuông). Đối tượng chính là vật thể trong hình ảnh được cung cấp.

YÊU CẦU QUAN TRỌNG:
1. Hãy giữ nguyên hình dáng và đặc điểm nhận dạng của sản phẩm.
2. Đặt sản phẩm này ${TET_THEME_PROMPTS[theme]}

Vì năm nay là năm 2026 (Năm Bính Ngọ - Con Ngựa), hãy thêm các chi tiết tinh tế liên quan đến hình tượng con ngựa vàng may mắn hoặc họa tiết ngựa cách điệu trong nền (không che khuất sản phẩm).

Chất lượng hình ảnh phải sắc nét, độ phân giải cao, 4k, photorealistic, --ar 1:1.`;
  } else if (isGroceryTheme(theme)) {
    // Grocery theme prompt
    prompt = `Tạo một bức ảnh quảng cáo sản phẩm chuyên nghiệp cho trang web thương mại điện tử với tỷ lệ khung hình 1:1 (hình vuông).
Đối tượng chính là sản phẩm thực phẩm/tạp hóa trong hình ảnh được cung cấp.

YÊU CẦU QUAN TRỌNG:
1. Giữ nguyên hình dạng, nhãn hiệu, logo và màu sắc gốc của sản phẩm.
2. Đặt sản phẩm ở vị trí trung tâm, tuyệt đối không có bất kỳ vật thể nào được che khuất hoặc đè lên bề mặt sản phẩm.
3. Bối cảnh xung quanh: Sản phẩm được đặt ${THEME_PROMPTS[theme]}

Thông số kỹ thuật: Chất lượng photorealistic, độ phân giải 4k, sắc nét đến từng chi tiết, ánh sáng studio chuyên nghiệp, độ sâu trường ảnh (depth of field) tập trung vào sản phẩm chính, --ar 1:1.`;
  }

  if (customPrompt && customPrompt.trim().length > 0) {
    prompt += `\nYêu cầu bổ sung chi tiết từ người dùng: ${customPrompt}`;
  }

  return prompt;
}

/**
 * Generate single image using Google GenAI
 */
async function generateSingleImage(
  cleanBase64: string,
  theme: ProductTheme,
  customPrompt: string = ''
): Promise<string> {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });

  const prompt = buildPrompt(theme, customPrompt);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    // Parse response to find generated image
    for (const candidate of response.candidates || []) {
      if (!candidate.content?.parts) continue;

      for (const part of candidate.content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/jpeg;base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error('No image found in API response');
  } catch (error) {
    console.error('Gemini API Error:', error);

    if (error instanceof Error) {
      throw new Error(`Image generation failed: ${error.message}`);
    }

    throw new Error('Image generation failed: Unknown error');
  }
}

/**
 * Generate multiple product images with AI
 *
 * @param request - Image generation request
 * @returns Promise resolving to generated images
 * @throws ImageGenerationError on failure
 */
export async function generateProductImages(
  request: ImageGenerationRequest
): Promise<ImageGenerationResponse> {
  const { imageBase64, theme, count = 4, customPrompt = '' } = request;

  // Clean base64 string (remove data URL prefix if present)
  const cleanBase64 = imageBase64.replace(
    /^data:image\/(png|jpeg|jpg|webp);base64,/,
    ''
  );

  try {
    // Execute parallel image generation
    const generatePromises = Array.from({ length: count }, () =>
      generateSingleImage(cleanBase64, theme, customPrompt)
    );

    const imageUrls = await Promise.all(generatePromises);

    // Convert to GeneratedImage objects
    const generatedImages: GeneratedImage[] = imageUrls.map((url) => ({
      data: url.replace(/^data:image\/jpeg;base64,/, ''),
      url,
      theme,
      generatedAt: new Date(),
    }));

    return {
      images: generatedImages,
      count: generatedImages.length,
      theme,
    };
  } catch (error) {
    console.error('Failed to generate product images:', error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Unknown error occurred during image generation';

    throw {
      message: errorMessage,
      code: 'GENERATION_FAILED',
      details: error,
    } as ImageGenerationError;
  }
}

/**
 * Convert generated image data URL to File for upload
 */
export function dataUrlToFile(dataUrl: string, filename: string): File {
  // Extract base64 data
  const base64Data = dataUrl.split(',')[1];
  const byteString = atob(base64Data);

  // Convert to byte array
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  // Create blob and file
  const blob = new Blob([ab], { type: 'image/jpeg' });
  return new File([blob], filename, { type: 'image/jpeg' });
}

/**
 * Validate image file before generation
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload JPG, PNG, or WebP image.',
    };
  }

  // Check file size (max 10MB for conversion to base64)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size too large. Please upload image smaller than 10MB.',
    };
  }

  return { valid: true };
}

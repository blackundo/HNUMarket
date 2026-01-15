import { GoogleGenAI } from '@google/genai';

/**
 * AI Text Generation Service
 *
 * Handles AI-powered text generation for blog editor using Google Gemini API
 */

export interface TextGenerationRequest {
  prompt: string;
  context?: string; // Optional existing content for context
  maxTokens?: number;
  temperature?: number;
}

export interface TextGenerationResponse {
  content: string;
  generatedAt: Date;
}

export interface TextGenerationError {
  message: string;
  code: string;
  details?: unknown;
}

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
 * Build complete prompt for text generation
 */
function buildPrompt(request: TextGenerationRequest): string {
  const systemInstruction = `Bạn là một trợ lý viết nội dung chuyên nghiệp cho blog và bài viết.

YÊU CẦU:
1. Tạo nội dung bằng tiếng Việt
2. Viết theo phong cách chuyên nghiệp, dễ đọc, hấp dẫn
3. Sử dụng HTML formatting phù hợp: <h2>, <h3>, <p>, <ul>, <ol>, <strong>, <em>
4. Chia thành các đoạn văn ngắn gọn, dễ theo dõi
5. Sử dụng bullet points và numbered lists khi phù hợp
6. Không thêm tiêu đề h1 (chỉ dùng h2, h3)
7. Trả về CHỈ nội dung HTML, không có giải thích hay văn bản bên ngoài

CHÚ Ý:
- KHÔNG bao giờ bắt đầu với "Dưới đây là..." hoặc "Đây là..."
- KHÔNG thêm giải thích về cách sử dụng nội dung
- Chỉ trả về HTML content thuần túy`;

  let userPrompt = request.prompt;

  if (request.context && request.context.trim().length > 0) {
    userPrompt = `Context hiện tại:\n${request.context}\n\nYêu cầu: ${request.prompt}`;
  }

  return `${systemInstruction}\n\n${userPrompt}`;
}

/**
 * Generate text content using Google Gemini
 *
 * @param request - Text generation request
 * @returns Promise resolving to generated text
 * @throws TextGenerationError on failure
 */
export async function generateText(
  request: TextGenerationRequest
): Promise<TextGenerationResponse> {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });

  const prompt = buildPrompt(request);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        maxOutputTokens: request.maxTokens || 2048,
        temperature: request.temperature || 0.4,
      },
    });

    // Extract generated text from response
    let generatedText = '';

    for (const candidate of response.candidates || []) {
      if (!candidate.content?.parts) continue;

      for (const part of candidate.content.parts) {
        if (part.text) {
          generatedText += part.text;
        }
      }
    }

    if (!generatedText || generatedText.trim().length === 0) {
      throw new Error('No text generated from API');
    }

    // Clean up the response - remove any meta commentary
    generatedText = generatedText.trim();

    // Remove common prefixes that AI might add
    const unwantedPrefixes = [
      /^Dưới đây là.*?:/i,
      /^Đây là.*?:/i,
      /^Nội dung.*?:/i,
      /^Bài viết.*?:/i,
    ];

    for (const prefix of unwantedPrefixes) {
      generatedText = generatedText.replace(prefix, '').trim();
    }

    return {
      content: generatedText,
      generatedAt: new Date(),
    };
  } catch (error) {
    console.error('Gemini API Error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred during text generation';

    throw {
      message: errorMessage,
      code: 'GENERATION_FAILED',
      details: error,
    } as TextGenerationError;
  }
}

/**
 * Validate text generation request
 */
export function validateTextRequest(request: TextGenerationRequest): {
  valid: boolean;
  error?: string;
} {
  // Check prompt length
  if (!request.prompt || request.prompt.trim().length === 0) {
    return {
      valid: false,
      error: 'Prompt không được để trống',
    };
  }

  if (request.prompt.length > 2000) {
    return {
      valid: false,
      error: 'Prompt quá dài (tối đa 2000 ký tự)',
    };
  }

  // Validate optional parameters
  if (request.maxTokens !== undefined && (request.maxTokens < 100 || request.maxTokens > 4096)) {
    return {
      valid: false,
      error: 'maxTokens phải trong khoảng 100-4096',
    };
  }

  if (
    request.temperature !== undefined &&
    (request.temperature < 0 || request.temperature > 2)
  ) {
    return {
      valid: false,
      error: 'temperature phải trong khoảng 0-2',
    };
  }

  return { valid: true };
}

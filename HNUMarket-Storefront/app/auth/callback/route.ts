import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Email Confirmation Callback Route
 *
 * Handles email confirmation links from Supabase.
 * When user clicks the confirmation link in their email,
 * Supabase redirects them here with a token.
 *
 * @see https://supabase.com/docs/guides/auth/auth-helpers/nextjs#email-confirmation
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const next = requestUrl.searchParams.get('next') || '/';

  // Check for error params from Supabase first
  const error = requestUrl.searchParams.get('error');
  const errorCode = requestUrl.searchParams.get('error_code');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // Handle Supabase errors
  if (error) {
    const loginUrl = new URL('/auth/login', requestUrl.origin);

    // Map specific error codes to user-friendly Vietnamese messages
    if (errorCode === 'otp_expired') {
      loginUrl.searchParams.set('error', 'email_link_expired');
      loginUrl.searchParams.set('message', 'Link xác nhận đã hết hạn. Vui lòng đăng ký lại hoặc yêu cầu gửi lại email xác nhận.');
    } else if (error === 'access_denied') {
      loginUrl.searchParams.set('error', 'access_denied');
      loginUrl.searchParams.set('message', 'Xác nhận email thất bại. Vui lòng thử lại.');
    } else {
      loginUrl.searchParams.set('error', 'email_confirmation_failed');
      loginUrl.searchParams.set('message', errorDescription || 'Có lỗi xảy ra khi xác nhận email.');
    }

    return NextResponse.redirect(loginUrl);
  }

  // Verify OTP token
  if (token_hash && type) {
    const supabase = await createClient();

    const { error: verifyError } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    });

    if (!verifyError) {
      // Email confirmed successfully
      const successUrl = new URL('/auth/login', requestUrl.origin);
      successUrl.searchParams.set('success', 'email_confirmed');
      successUrl.searchParams.set('message', 'Email đã được xác nhận thành công! Bạn có thể đăng nhập ngay bây giờ.');
      return NextResponse.redirect(successUrl);
    }

    // Handle OTP verification errors
    const errorUrl = new URL('/auth/login', requestUrl.origin);
    errorUrl.searchParams.set('error', 'verification_failed');
    errorUrl.searchParams.set('message', 'Link xác nhận không hợp lệ hoặc đã hết hạn.');
    return NextResponse.redirect(errorUrl);
  }

  // Missing required params
  const errorUrl = new URL('/auth/login', requestUrl.origin);
  errorUrl.searchParams.set('error', 'invalid_request');
  errorUrl.searchParams.set('message', 'Yêu cầu không hợp lệ.');
  return NextResponse.redirect(errorUrl);
}


'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { resetPassword } = useAuth();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Check if we have token from email link
    useEffect(() => {
        const token_hash = searchParams.get('token_hash');
        const type = searchParams.get('type');

        if (!token_hash || type !== 'recovery') {
            setError('Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!password.trim() || !confirmPassword.trim()) {
            setError('Vui lòng nhập đầy đủ thông tin');
            return;
        }

        if (password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        if (password !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }

        setIsLoading(true);

        const success = await resetPassword(password);

        if (success) {
            setSuccess(true);
            // Redirect to login after 2 seconds
            setTimeout(() => {
                router.push('/auth/login?message=password_reset_success');
            }, 2000);
        } else {
            setIsLoading(false);
        }
    };

    const token_hash = searchParams.get('token_hash');
    const type = searchParams.get('type');

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 py-12 sm:py-16">
                <div className="max-w-md mx-auto px-4 sm:px-6">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-semibold text-gray-900">
                                        Đặt lại mật khẩu thành công!
                                    </h2>
                                    <p className="mt-2 text-sm text-gray-600">
                                        Bạn sẽ được chuyển đến trang đăng nhập...
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (!token_hash || type !== 'recovery') {
        return (
            <div className="min-h-screen bg-gray-50 py-12 sm:py-16">
                <div className="max-w-md mx-auto px-4 sm:px-6">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                                    <AlertCircle className="w-8 h-8 text-red-600" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-semibold text-gray-900">
                                        Link không hợp lệ
                                    </h2>
                                    <p className="mt-2 text-sm text-gray-600">
                                        {error || 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.'}
                                    </p>
                                </div>
                                <Button asChild className="mt-4">
                                    <Link href="/auth/forgot-password">
                                        Yêu cầu link mới
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 sm:py-16">
            <div className="max-w-md mx-auto px-4 sm:px-6">
                <Card>
                    <CardHeader className="space-y-1">
                        <div className="flex items-center justify-center mb-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                <Lock className="w-6 h-6 text-primary" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl text-center">Đặt lại mật khẩu</CardTitle>
                        <CardDescription className="text-center">
                            Nhập mật khẩu mới của bạn
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start gap-2">
                                    <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                    <p className="text-sm">{error}</p>
                                </div>
                            )}
                            <div className="space-y-2">
                                <label htmlFor="password" className="text-sm font-medium">
                                    Mật khẩu mới
                                </label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                                <p className="text-xs text-gray-500">Tối thiểu 6 ký tự</p>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="confirmPassword" className="text-sm font-medium">
                                    Xác nhận mật khẩu
                                </label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col space-y-4">
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                            </Button>
                            <p className="text-sm text-center text-gray-600">
                                <Link href="/auth/login" className="text-primary hover:underline">
                                    Quay lại đăng nhập
                                </Link>
                            </p>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 py-12 sm:py-16">
                <div className="max-w-md mx-auto px-4 sm:px-6">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">Đang tải...</div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}

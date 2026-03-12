'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { bootstrapUserAction } from '@/modules/auth/server-actions';

export default function AuthCallbackPage() {
    const router = useRouter();

    useEffect(() => {
        const performBootstrap = async () => {
            try {
                await bootstrapUserAction({
                    openId: 'ou_demo_operator',
                    name: '田中 太郎',
                    email: 'taro@example.com',
                });
                router.push('/dashboard');
            } catch (error) {
                console.error(error);
                router.push('/login?error=bootstrap_failed');
            }
        };

        void performBootstrap();
    }, [router]);

    return (
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-gray-50">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
            <p className="text-sm font-medium text-gray-600">認証情報を処理しています...</p>
        </div>
    );
}

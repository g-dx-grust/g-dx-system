'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginProgressStrip } from '@/components/auth/login-progress-strip';
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
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f4efe6] px-4">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.94),transparent_34%),radial-gradient(circle_at_top_right,rgba(191,219,254,0.32),transparent_28%),linear-gradient(135deg,#f4efe6_0%,#ece7dd_46%,#f8f4ed_100%)]" />
                <div className="absolute left-[10%] top-16 h-72 w-72 rounded-full border border-white/35 bg-white/20 blur-3xl" />
                <div className="absolute right-[-8%] top-20 h-80 w-80 rounded-full bg-[#d8e4ef]/70 blur-3xl" />
            </div>

            <div className="relative w-full max-w-[460px]">
                <LoginProgressStrip />
            </div>
        </div>
    );
}

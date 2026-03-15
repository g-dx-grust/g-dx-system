import { LoginCard } from '@/modules/auth/ui/login-card';

interface LoginPageProps {
    searchParams?: {
        error?: string;
    };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
    return (
        <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-white px-4">
            {/* 背景装飾 */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-blue-50 opacity-60" />
                <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-slate-100 opacity-60" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full border border-gray-100 opacity-40" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full border border-gray-100 opacity-40" />
            </div>
            <LoginCard errorMessage={searchParams?.error} />
        </div>
    );
}

import { LoginCard } from '@/modules/auth/ui/login-card';

interface LoginPageProps {
    searchParams?: {
        error?: string;
    };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-50">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-x-0 top-0 h-28 border-b border-slate-200/80 bg-white/85" />
                <div className="absolute left-[-8%] top-24 h-64 w-64 rounded-full bg-slate-100/80 blur-3xl" />
                <div className="absolute right-[-10%] bottom-16 h-72 w-72 rounded-full bg-white blur-3xl" />
                <div className="absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 bg-slate-200/70 lg:block" />
            </div>

            <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
                <LoginCard errorMessage={searchParams?.error} />
            </div>
        </div>
    );
}

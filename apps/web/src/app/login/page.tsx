import { LoginCard } from '@/modules/auth/ui/login-card';

interface LoginPageProps {
    searchParams?: {
        error?: string;
    };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
    return (
        <div className="relative min-h-screen overflow-hidden bg-[#f4efe6]">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.94),transparent_34%),radial-gradient(circle_at_top_right,rgba(191,219,254,0.32),transparent_28%),linear-gradient(135deg,#f4efe6_0%,#ece7dd_46%,#f8f4ed_100%)]" />
                <div className="absolute left-[8%] top-12 h-72 w-72 rounded-full border border-white/35 bg-white/20 blur-3xl" />
                <div className="absolute right-[-6%] top-20 h-80 w-80 rounded-full bg-[#d8e4ef]/70 blur-3xl" />
                <div className="absolute bottom-[-12%] left-1/2 h-[20rem] w-[20rem] -translate-x-1/2 rounded-full bg-white/45 blur-3xl" />
                <div className="absolute inset-y-0 left-[12%] hidden w-px bg-slate-300/40 lg:block" />
                <div className="absolute inset-y-0 right-[12%] hidden w-px bg-white/45 lg:block" />
            </div>

            <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
                <LoginCard errorMessage={searchParams?.error} />
            </div>
        </div>
    );
}

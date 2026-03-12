import { LoginCard } from '@/modules/auth/ui/login-card';

interface LoginPageProps {
    searchParams?: {
        error?: string;
    };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 px-4">
            <LoginCard errorMessage={searchParams?.error} />
        </div>
    );
}

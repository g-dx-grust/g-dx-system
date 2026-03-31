import { redirect } from 'next/navigation';

interface AuthCallbackPageProps {
    searchParams?: Record<string, string | string[] | undefined>;
}

export default function AuthCallbackPage({ searchParams }: AuthCallbackPageProps) {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(searchParams ?? {})) {
        if (typeof value === 'string') {
            params.set(key, value);
            continue;
        }

        if (Array.isArray(value)) {
            for (const entry of value) {
                params.append(key, entry);
            }
        }
    }

    const destination = params.toString()
        ? `/api/v1/auth/lark/callback?${params.toString()}`
        : '/api/v1/auth/lark/callback';

    redirect(destination);
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AuthGuardProps {
    children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
        // Scaffold implementation:
        // In a real application, check for a valid session token (e.g., from cookies or context)
        // and verify that the user has the required roles/scopes for `pathname`.

        // For demonstration, we simply pretend the user is authenticated 
        // but occasionally someone might hit unauthorized if we wanted to test it.
        const hasSession = true;
        const hasRequiredScope = true;

        if (!hasSession) {
            router.push('/login');
        } else if (!hasRequiredScope) {
            router.push('/unauthorized');
        } else {
            setIsAuthorized(true);
        }
    }, [router, pathname]);

    // Show nothing (or a loader) until authorization state is determined
    if (isAuthorized === null) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
            </div>
        );
    }

    return <>{children}</>;
}

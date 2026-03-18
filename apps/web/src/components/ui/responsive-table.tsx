'use client';

import { useState, useEffect } from 'react';

interface ResponsiveTableProps {
    children: React.ReactNode;
    mobileCards: React.ReactNode;
}

export function ResponsiveTable({ children, mobileCards }: ResponsiveTableProps) {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const mql = window.matchMedia('(max-width: 767px)');
        setIsMobile(mql.matches);
        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        mql.addEventListener('change', handler);
        return () => mql.removeEventListener('change', handler);
    }, []);

    if (isMobile) {
        return <>{mobileCards}</>;
    }

    return <>{children}</>;
}

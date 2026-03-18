'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from './sidebar';
import { BottomNavigation } from './bottom-navigation';

interface LayoutShellProps {
    header: React.ReactNode;
    children: React.ReactNode;
    activeBusinessScope: string;
}

const STORAGE_KEY = 'gdx_sidebar_collapsed';

export function LayoutShell({ header, children, activeBusinessScope }: LayoutShellProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    // localStorage から状態を復元
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === 'true') setIsCollapsed(true);
    }, []);

    function toggle() {
        setIsCollapsed((prev) => {
            localStorage.setItem(STORAGE_KEY, String(!prev));
            return !prev;
        });
    }

    return (
        <div className="flex h-screen w-full overflow-hidden bg-white text-gray-900 font-sans">
            <div className="hidden md:flex">
                <Sidebar isCollapsed={isCollapsed} onToggle={toggle} activeBusinessScope={activeBusinessScope} />
            </div>
            <div className="flex flex-1 flex-col overflow-hidden min-w-0">
                {header}
                <main className="flex-1 overflow-y-auto bg-gray-50 px-3 py-3 pb-20 md:px-6 md:py-5 md:pb-5">
                    {children}
                </main>
            </div>
            <BottomNavigation activeBusinessScope={activeBusinessScope} />
        </div>
    );
}

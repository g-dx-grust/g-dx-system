'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

const LOGIN_START_URL = '/api/v1/auth/lark/start';

export function LoginStartButton() {
    const [isStarting, setIsStarting] = useState(false);
    const timeoutRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (timeoutRef.current !== null) {
                window.clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    function handleClick() {
        if (isStarting) return;

        setIsStarting(true);

        // Give the browser one frame to paint the pending state before leaving the page.
        timeoutRef.current = window.setTimeout(() => {
            window.location.assign(LOGIN_START_URL);
        }, 80);
    }

    return (
        <div className="space-y-3">
            <Button
                type="button"
                onClick={handleClick}
                disabled={isStarting}
                className="h-12 w-full rounded-xl bg-[#1B4F72] text-sm font-medium tracking-wide text-white shadow-sm transition-all hover:bg-[#154060] hover:shadow-md disabled:cursor-wait disabled:opacity-90"
                size="lg"
            >
                <svg className="mr-2.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.5 14.5h-2.25v-4.25H9.75v4.25H7.5v-9h2.25v3.25h4.5V7.5H16.5v9z" />
                </svg>
                {isStarting ? 'Opening Lark auth...' : 'Continue with Lark'}
            </Button>

            <div
                className={`overflow-hidden transition-all duration-200 ${
                    isStarting ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0'
                }`}
                aria-live="polite"
            >
                <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                    <div className="flex items-center gap-3">
                        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-blue-500" />
                        <span>Opening the authentication flow. Please wait...</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

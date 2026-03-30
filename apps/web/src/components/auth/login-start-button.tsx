'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LarkGlyph, LoginProgressStrip } from '@/components/auth/login-progress-strip';

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
        timeoutRef.current = window.setTimeout(() => {
            window.location.assign(LOGIN_START_URL);
        }, 80);
    }

    if (isStarting) {
        return <LoginProgressStrip className="border-slate-200 bg-slate-50/90 shadow-none" />;
    }

    return (
        <Button
            type="button"
            onClick={handleClick}
            className="group h-14 w-full rounded-[22px] bg-slate-950 px-4 text-white shadow-[0_20px_45px_-28px_rgba(15,23,42,0.78)] transition-colors hover:bg-slate-900"
            size="lg"
        >
            <span className="flex w-full items-center gap-3 text-left">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/12">
                    <LarkGlyph />
                </span>
                <span className="min-w-0 flex-1 text-sm font-semibold text-white">
                    Larkでログイン
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-white/80 transition-transform duration-200 group-hover:translate-x-0.5" />
            </span>
        </Button>
    );
}

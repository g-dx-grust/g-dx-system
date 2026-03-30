'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LOGIN_START_URL = '/api/v1/auth/lark/start';
const AUTH_FLOW_LABELS = ['認証', '確認', '開始'];

function LarkGlyph({ className = 'h-4 w-4' }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.5 14.5h-2.25v-4.25H9.75v4.25H7.5v-9h2.25v3.25h4.5V7.5H16.5v9z" />
        </svg>
    );
}

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

        // Paint the calm pending state once before leaving the page.
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
                className="group h-12 w-full rounded-xl bg-slate-900 px-4 text-white shadow-sm transition-colors hover:bg-slate-800 disabled:cursor-wait disabled:bg-slate-900 disabled:opacity-100"
                size="lg"
            >
                <span className="flex w-full items-center gap-3 text-left">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/10">
                        <LarkGlyph />
                    </span>

                    <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-white">
                            {isStarting ? '接続中' : 'Lark でログイン'}
                        </span>
                        <span className="block text-[11px] text-white/65">
                            {isStarting ? '認証画面へ移動します' : '社内アカウントで認証'}
                        </span>
                    </span>

                    {isStarting ? (
                        <span className="login-quiet-button-indicator shrink-0" aria-hidden="true">
                            <span className="login-quiet-button-indicator-bar" />
                        </span>
                    ) : (
                        <ArrowRight className="h-4 w-4 shrink-0 text-white/75 transition-transform duration-200 group-hover:translate-x-0.5" />
                    )}
                </span>
            </Button>

            <div
                className={`overflow-hidden transition-all duration-200 ${
                    isStarting ? 'max-h-56 opacity-100' : 'max-h-0 opacity-0'
                }`}
                aria-live="polite"
            >
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-sm font-medium text-slate-900">接続準備中</p>
                            <p className="text-xs text-slate-500">認証画面へ切り替わります。</p>
                        </div>
                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-500">
                            Lark
                        </span>
                    </div>

                    <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-4">
                        <div className="flex items-center gap-4">
                            <div className="flex w-14 shrink-0 flex-col items-center gap-2">
                                <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-[11px] font-semibold text-white">
                                    G-DX
                                </div>
                            </div>

                            <div className="relative flex-1">
                                <div className="login-quiet-line" />
                                <div className="login-quiet-line-pulse" />
                                <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center justify-between px-1">
                                    <span className="login-quiet-dot bg-slate-300" />
                                    <span className="login-quiet-dot login-quiet-dot-active" />
                                    <span className="login-quiet-dot bg-slate-300" />
                                </div>
                            </div>

                            <div className="flex w-14 shrink-0 flex-col items-center gap-2">
                                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#1B4F72] text-white">
                                    <LarkGlyph />
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-2">
                            {AUTH_FLOW_LABELS.map((label, index) => (
                                <div
                                    key={label}
                                    className={`rounded-lg border px-2 py-2 text-center text-[11px] ${
                                        index === 1
                                            ? 'border-slate-300 bg-slate-50 text-slate-700'
                                            : 'border-slate-200 bg-white text-slate-400'
                                    }`}
                                >
                                    {label}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

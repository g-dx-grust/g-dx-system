'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LOGIN_START_URL = '/api/v1/auth/lark/start';
const AUTH_FLOW_STEPS = [
    { label: '接続', caption: '認証先を準備' },
    { label: '認証', caption: 'Larkへ移動' },
    { label: '入室', caption: 'ダッシュボードへ' },
];

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

        // Give the browser one frame to paint the pending state before leaving the page.
        timeoutRef.current = window.setTimeout(() => {
            window.location.assign(LOGIN_START_URL);
        }, 80);
    }

    return (
        <div className="space-y-4">
            <Button
                type="button"
                onClick={handleClick}
                disabled={isStarting}
                className="group h-14 w-full rounded-2xl bg-[#1B4F72] px-4 text-white shadow-sm transition-all hover:bg-[#154060] hover:shadow-md disabled:cursor-wait disabled:bg-[#123851] disabled:opacity-100"
                size="lg"
            >
                <span className="flex w-full items-center gap-3 text-left">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/15">
                        <LarkGlyph />
                    </span>

                    <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold tracking-[0.01em] text-white">
                            {isStarting ? 'Larkへ接続中' : 'Larkでログイン'}
                        </span>
                        <span className="block text-[11px] text-white/75">
                            {isStarting ? '認証画面を開いています' : '社内アカウントで続行'}
                        </span>
                    </span>

                    {isStarting ? (
                        <span className="login-auth-button-meter shrink-0" aria-hidden="true">
                            <span className="login-auth-button-meter-bar" />
                        </span>
                    ) : (
                        <ArrowRight className="h-4 w-4 shrink-0 text-white/75 transition-transform duration-200 group-hover:translate-x-0.5" />
                    )}
                </span>
            </Button>

            <div
                className={`overflow-hidden transition-all duration-300 ${
                    isStarting ? 'max-h-80 translate-y-0 opacity-100' : 'max-h-0 -translate-y-2 opacity-0'
                }`}
                aria-live="polite"
            >
                <div className="login-auth-panel rounded-[1.5rem] border border-sky-100/80 px-4 py-4 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.55)]">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-sm font-semibold text-slate-900">認証ページを開いています</p>
                            <p className="mt-1 text-xs leading-5 text-slate-500">
                                ページが切り替わるまで、そのままお待ちください。
                            </p>
                        </div>
                        <div className="rounded-full border border-sky-100 bg-white/75 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-sky-700">
                            認証中
                        </div>
                    </div>

                    <div className="mt-4 overflow-hidden rounded-[1.25rem] border border-white/70 bg-white/70 p-4 backdrop-blur-sm">
                        <div className="relative flex items-center gap-3">
                            <div className="flex w-16 shrink-0 flex-col items-center gap-2">
                                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/20">
                                    <ShieldCheck className="h-5 w-5" />
                                </div>
                                <span className="text-[11px] font-semibold tracking-[0.2em] text-slate-500">G-DX</span>
                            </div>

                            <div className="relative flex-1">
                                <div className="login-auth-rail" />
                                <div className="login-auth-beam" />
                                <div className="login-auth-travel" />

                                <div className="absolute inset-x-3 top-1/2 flex -translate-y-1/2 items-center justify-between">
                                    <span className="h-2.5 w-2.5 rounded-full bg-slate-300/90" />
                                    <span className="h-2.5 w-2.5 rounded-full bg-sky-300/90 shadow-[0_0_0_4px_rgba(224,242,254,0.95)]" />
                                    <span className="h-2.5 w-2.5 rounded-full bg-[#1B4F72]/40" />
                                </div>

                                <div className="mt-6 grid grid-cols-3 gap-2">
                                    {AUTH_FLOW_STEPS.map((step, index) => (
                                        <div
                                            key={step.label}
                                            className="login-auth-step rounded-2xl px-2 py-2 text-center"
                                            style={{ animationDelay: `${index * 180}ms` }}
                                        >
                                            <div className="text-[11px] font-semibold text-slate-700">{step.label}</div>
                                            <div className="mt-1 text-[10px] leading-4 text-slate-500">{step.caption}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex w-16 shrink-0 flex-col items-center gap-2">
                                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#1B4F72] text-white shadow-lg shadow-[#1B4F72]/20">
                                    <LarkGlyph className="h-5 w-5" />
                                </div>
                                <span className="text-[11px] font-semibold tracking-[0.12em] text-[#1B4F72]">Lark</span>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-white">
                            <div>
                                <p className="text-xs font-semibold tracking-[0.12em] text-sky-200">安全な認証</p>
                                <p className="mt-1 text-sm font-medium">認証後にダッシュボードへ移動します</p>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-300">
                                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_6px_rgba(74,222,128,0.18)]" />
                                <span>処理中</span>
                            </div>
                        </div>

                        <span className="sr-only">Lark認証ページを開いています。ページが切り替わるまで、そのままお待ちください。</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

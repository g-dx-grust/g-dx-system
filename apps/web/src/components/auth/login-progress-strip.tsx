import { cn } from '@/lib/utils';

export function LarkGlyph({ className = 'h-4 w-4' }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.5 14.5h-2.25v-4.25H9.75v4.25H7.5v-9h2.25v3.25h4.5V7.5H16.5v9z" />
        </svg>
    );
}

export function LoginProgressStrip({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                'flex items-center gap-4 rounded-[22px] border border-slate-200/90 bg-white/90 px-4 py-4 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.35)] backdrop-blur',
                className,
            )}
            role="status"
            aria-live="polite"
        >
            <span className="sr-only">ログイン処理中</span>

            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-950 text-[11px] font-semibold tracking-[0.18em] text-white">
                GDX
            </div>

            <div className="min-w-0 flex-1">
                <div className="login-auth-progress-track">
                    <div className="login-auth-progress-stream" />
                </div>
            </div>

            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#1B4F72] text-white shadow-inner">
                <LarkGlyph />
            </div>
        </div>
    );
}

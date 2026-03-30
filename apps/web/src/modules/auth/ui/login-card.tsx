import Image from 'next/image';
import { LoginStartButton } from '@/components/auth/login-start-button';

interface LoginCardProps {
    errorMessage?: string;
}

const ERROR_MESSAGES: Record<string, string> = {
    local_login_failed:
        'ログインに失敗しました。PostgreSQL の設定と認証情報を確認してください。',
    bootstrap_failed:
        'ログイン後の初期処理に失敗しました。時間をおいて再度お試しください。',
    auth_not_configured:
        'Lark 認証の設定が完了していません。管理者に確認してください。',
    lark_auth_denied:
        'Lark 認証がキャンセルされました。内容を確認して再度お試しください。',
    missing_code:
        'Lark 認証コードを受け取れませんでした。もう一度ログインしてください。',
    state_mismatch:
        '認証状態の確認に失敗しました。ブラウザを更新して再度お試しください。',
    token_exchange_failed:
        'Lark の認証処理に失敗しました。ネットワーク設定をご確認ください。',
    userinfo_failed:
        'Lark のユーザー情報を取得できませんでした。設定をご確認ください。',
};

export function LoginCard({ errorMessage }: LoginCardProps) {
    return (
        <div className="relative z-10 flex w-full max-w-[460px] flex-col items-center gap-6">
            <div className="w-full rounded-[34px] border border-white/70 bg-white/88 px-8 py-10 shadow-[0_32px_90px_-60px_rgba(15,23,42,0.45)] backdrop-blur">
                <div className="flex flex-col items-center gap-6 text-center">
                    <div className="rounded-[30px] border border-slate-200/90 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-9 py-7 shadow-[0_20px_45px_-38px_rgba(15,23,42,0.42)]">
                        <Image
                            src="/gdxlogo__1_.png"
                            alt="G-DX ロゴ"
                            width={188}
                            height={72}
                            priority
                            className="h-auto w-[188px]"
                        />
                    </div>

                    <div className="space-y-2">
                        <p className="text-[11px] font-medium tracking-[0.28em] text-slate-400">
                            G-DX SYSTEM
                        </p>
                        <h1 className="text-2xl font-semibold tracking-[0.08em] text-slate-900">
                            ログイン
                        </h1>
                    </div>
                </div>

                <div className="mt-8 rounded-[28px] border border-slate-200/90 bg-slate-50/88 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
                    {errorMessage ? (
                        <div className="mb-4 rounded-[20px] border border-red-100 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                            {ERROR_MESSAGES[errorMessage] ??
                                'ログインに失敗しました。設定と認証状態をご確認ください。'}
                        </div>
                    ) : null}

                    <LoginStartButton />
                </div>
            </div>

            <p className="text-xs tracking-[0.18em] text-slate-400">© 2026 G-DX Inc.</p>
        </div>
    );
}

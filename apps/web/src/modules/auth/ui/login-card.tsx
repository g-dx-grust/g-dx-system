import Image from 'next/image';
import { LoginStartButton } from '@/components/auth/login-start-button';

interface LoginCardProps {
    errorMessage?: string;
}

const ERROR_MESSAGES: Record<string, string> = {
    local_login_failed:
        'ログインに失敗しました。PostgreSQL の接続設定と認証情報を確認してください。',
    bootstrap_failed:
        'ログイン処理の初期化で問題が発生しました。時間をおいてから再度お試しください。',
    auth_not_configured:
        'Lark 認証の設定が完了していません。管理者に確認してください。',
    lark_auth_denied:
        'Lark 認証がキャンセルされました。内容を確認してから再度お試しください。',
    missing_code:
        'Lark 認証コードを受け取れませんでした。もう一度ログインしてください。',
    state_mismatch:
        '認証状態の確認に失敗しました。ブラウザを更新してから再度お試しください。',
    token_exchange_failed:
        'Lark の認証処理で問題が発生しました。ネットワーク設定をご確認ください。',
    userinfo_failed:
        'Lark のユーザー情報取得に失敗しました。設定内容を確認してください。',
};

export function LoginCard({ errorMessage }: LoginCardProps) {
    return (
        <div className="relative z-10 flex w-full max-w-[420px] flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-4 text-center">
                <div className="rounded-[28px] border border-slate-200 bg-white px-8 py-6 shadow-sm">
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
                    <p className="text-xs font-medium tracking-[0.24em] text-slate-400">
                        G-DX SYSTEM
                    </p>
                    <p className="text-sm leading-7 text-slate-500">
                        営業活動と承認の確認を、落ち着いた手順で始めます。
                    </p>
                </div>
            </div>

            <div className="w-full rounded-[24px] border border-slate-200 bg-white px-6 py-6 shadow-[0_24px_60px_-54px_rgba(15,23,42,0.28)]">
                <div className="mb-5 space-y-1">
                    <h1 className="text-lg font-semibold text-slate-900">ログイン</h1>
                    <p className="text-sm text-slate-500">Lark で認証します。</p>
                </div>

                {errorMessage ? (
                    <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                        {ERROR_MESSAGES[errorMessage] ??
                            'ログインに失敗しました。設定内容と認証状態を確認してください。'}
                    </div>
                ) : null}

                <LoginStartButton />

                <p className="mt-4 text-xs text-slate-400">
                    認証後にダッシュボードへ移動します。
                </p>
            </div>

            <p className="text-xs text-slate-300">© 2026 G-DX Inc.</p>
        </div>
    );
}

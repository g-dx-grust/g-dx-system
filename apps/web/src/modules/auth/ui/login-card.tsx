import Image from 'next/image';
import { LoginStartButton } from '@/components/auth/login-start-button';

interface LoginCardProps {
    errorMessage?: string;
}

const ERROR_MESSAGES: Record<string, string> = {
    local_login_failed:
        'ログインに失敗しました。PostgreSQL へ接続できているか、設定値が正しいかを確認してください。',
    bootstrap_failed:
        'ログイン処理中にユーザー初期化で失敗しました。しばらく待ってから再度お試しください。',
    auth_not_configured:
        'Lark 認証が設定されていません。環境変数の設定を確認してください。',
    lark_auth_denied:
        'Lark 認証がキャンセルされました。内容をご確認のうえ、再度お試しください。',
    missing_code:
        'Lark 認証コードを受け取れませんでした。再度ログインしてください。',
    state_mismatch:
        '認証セッションが一致しませんでした。ブラウザを更新して再度お試しください。',
    token_exchange_failed:
        'Lark のトークン取得に失敗しました。ネットワーク状態と設定を確認してください。',
    userinfo_failed:
        'Lark のユーザー情報取得に失敗しました。設定と権限を確認してください。',
};

export function LoginCard({ errorMessage }: LoginCardProps) {
    return (
        <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-10">
            <div className="flex flex-col items-center gap-5">
                <div className="relative">
                    <div className="absolute -inset-3 rounded-2xl bg-white opacity-80 blur-xl" />
                    <Image
                        src="/gdxlogo__1_.png"
                        alt="G-DX ロゴ"
                        width={200}
                        height={80}
                        priority
                        className="relative drop-shadow-md"
                        style={{ objectFit: 'contain' }}
                    />
                </div>
                <div className="text-center">
                    <p className="text-sm font-medium uppercase tracking-widest text-gray-400">
                        Management System
                    </p>
                </div>
            </div>

            <div className="w-full rounded-2xl border border-gray-100 bg-white px-8 py-8 shadow-xl shadow-gray-100/80">
                <div className="mb-6 text-center">
                    <h2 className="text-lg font-semibold text-gray-800">ログイン</h2>
                    <p className="mt-1 text-sm text-gray-400">
                        Lark アカウントでサインインしてください
                    </p>
                </div>

                {errorMessage ? (
                    <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                        {ERROR_MESSAGES[errorMessage] ??
                            'ログインに失敗しました。設定と認証状態をご確認ください。'}
                    </div>
                ) : null}

                <LoginStartButton />
            </div>

            <p className="text-xs text-gray-300">© 2026 G DX Inc. All rights reserved.</p>
        </div>
    );
}

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface LoginCardProps {
    errorMessage?: string;
}

const ERROR_MESSAGES: Record<string, string> = {
    local_login_failed: 'ログインに失敗しました。PostgreSQLが起動しているか、スキーマが適用されているか確認してください。',
    bootstrap_failed: 'ログインに失敗しました。しばらくしてから再度お試しください。',
};

export function LoginCard({ errorMessage }: LoginCardProps) {
    return (
        <div className="flex w-full max-w-sm flex-col items-center gap-8">
            {/* Logo */}
            <div className="flex flex-col items-center gap-3">
                <Image
                    src="/logo.png"
                    alt="G-DX ロゴ"
                    width={72}
                    height={72}
                    priority
                    className="drop-shadow-sm"
                />
                <div className="text-center">
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900">G-DX 管理システム</h1>
                    <p className="mt-1 text-sm text-gray-500">Larkアカウントでログインしてください</p>
                </div>
            </div>

            {/* Card */}
            <div className="w-full rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                {errorMessage ? (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {ERROR_MESSAGES[errorMessage] ?? 'ログインに失敗しました。再度お試しください。'}
                    </div>
                ) : null}

                <Button
                    asChild
                    className="h-11 w-full rounded-lg bg-[#1B4F72] text-white hover:bg-[#154060] font-medium text-sm"
                    size="lg"
                >
                    <Link href="/api/v1/auth/lark/start">
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.5 14.5h-2.25v-4.25H9.75v4.25H7.5v-9h2.25v3.25h4.5V7.5H16.5v9z" />
                        </svg>
                        Larkでログイン
                    </Link>
                </Button>
            </div>

            <p className="text-xs text-gray-400">© 2026 G DX Inc. All rights reserved.</p>
        </div>
    );
}

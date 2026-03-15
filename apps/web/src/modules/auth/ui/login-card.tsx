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
        <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-10">
            {/* ロゴ */}
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
                    <p className="text-sm font-medium tracking-widest text-gray-400 uppercase">Management System</p>
                </div>
            </div>

            {/* カード */}
            <div className="w-full rounded-2xl border border-gray-100 bg-white px-8 py-8 shadow-xl shadow-gray-100/80">
                <div className="mb-6 text-center">
                    <h2 className="text-lg font-semibold text-gray-800">ログイン</h2>
                    <p className="mt-1 text-sm text-gray-400">Larkアカウントで続けてください</p>
                </div>

                {errorMessage ? (
                    <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                        {ERROR_MESSAGES[errorMessage] ?? 'ログインに失敗しました。再度お試しください。'}
                    </div>
                ) : null}

                <Button
                    asChild
                    className="h-12 w-full rounded-xl bg-[#1B4F72] text-white hover:bg-[#154060] font-medium text-sm tracking-wide shadow-sm transition-all hover:shadow-md"
                    size="lg"
                >
                    <Link href="/api/v1/auth/lark/start">
                        <svg className="mr-2.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.5 14.5h-2.25v-4.25H9.75v4.25H7.5v-9h2.25v3.25h4.5V7.5H16.5v9z" />
                        </svg>
                        Larkでログイン
                    </Link>
                </Button>
            </div>

            <p className="text-xs text-gray-300">© 2026 G DX Inc. All rights reserved.</p>
        </div>
    );
}

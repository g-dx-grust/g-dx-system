import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';

export default function UnauthorizedPage() {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-50 px-4">
            <Card className="w-full max-w-md border-red-100 shadow-sm">
                <CardHeader className="space-y-2 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                        <ShieldAlert className="h-6 w-6 text-red-600" />
                    </div>
                    <CardTitle className="text-2xl font-semibold tracking-tight text-gray-900">
                        アクセス権限がありません
                    </CardTitle>
                    <CardDescription className="text-gray-500">
                        このページを閲覧する権限がありません。管理者にお問い合わせください。
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md bg-gray-50 p-4 text-sm text-gray-600">
                        <p>管理者に以下の情報をご確認ください：</p>
                        <ul className="mt-2 list-inside list-disc">
                            <li>Lark アカウントの有効性</li>
                            <li>システム利用ロールの割り当て</li>
                            <li>対象事業へのアクセス権付与</li>
                        </ul>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-center gap-4">
                    <Button asChild variant="outline">
                        <Link href="/login">サインイン画面へ</Link>
                    </Button>
                    <Button asChild>
                        {/* Ideally this would be a support link */}
                        <Link href="mailto:admin@example.com">管理者へ連絡</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

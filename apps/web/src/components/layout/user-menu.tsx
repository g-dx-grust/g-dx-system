'use client';

import { useTransition } from 'react';
import { LogOut, User, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter, usePathname } from 'next/navigation';
import { logoutAction } from '@/modules/auth/server-actions';

interface UserMenuProps {
    name: string;
    email: string;
    avatarUrl?: string | null;
    isAdmin?: boolean;
}

export function UserMenu({ name, email, avatarUrl, isAdmin = false }: UserMenuProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    const fallback = name
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'DX';

    return (
        // key={pathname} でページ遷移時にコンポーネントをリセット → 自動で閉じる
        <DropdownMenu key={pathname}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 ring-2 ring-gray-200 hover:ring-gray-400 transition-all" disabled={isPending}>
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={avatarUrl ?? ''} alt={`${name}のアバター`} referrerPolicy="no-referrer" />
                        <AvatarFallback className="bg-gray-700 text-white text-xs font-semibold">
                            {fallback}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel className="font-normal">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={avatarUrl ?? ''} alt={`${name}のアバター`} referrerPolicy="no-referrer" />
                            <AvatarFallback className="bg-gray-700 text-white text-xs font-semibold">
                                {fallback}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col space-y-0.5">
                            <p className="text-sm font-medium leading-none">{name}</p>
                            <p className="text-xs leading-none text-muted-foreground">{email}</p>
                        </div>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>プロフィール</span>
                </DropdownMenuItem>
                {isAdmin && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push('/admin')}>
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            <span>管理者設定</span>
                        </DropdownMenuItem>
                    </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={() =>
                        startTransition(async () => {
                            await logoutAction();
                            router.push('/login');
                            router.refresh();
                        })
                    }
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>ログアウト</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

export interface MemberPersonalViewOption {
    userId: string;
    userName: string;
    isCurrentUser?: boolean;
}

interface MemberPersonalViewSelectorProps {
    options: MemberPersonalViewOption[];
    value: string;
}

export function MemberPersonalViewSelector({
    options,
    value,
}: MemberPersonalViewSelectorProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    return (
        <label className="grid gap-1 text-sm text-gray-600">
            <span>個人ビュー</span>
            <select
                value={value}
                disabled={isPending}
                onChange={(event) => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.set('member', event.target.value);
                    const query = params.toString();

                    startTransition(() => {
                        router.push(query.length > 0 ? `${pathname}?${query}` : pathname);
                    });
                }}
                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-auto sm:min-w-[220px]"
            >
                {options.map((option) => (
                    <option key={option.userId} value={option.userId}>
                        {option.userName}
                        {option.isCurrentUser ? ' (自分)' : ''}
                    </option>
                ))}
            </select>
        </label>
    );
}

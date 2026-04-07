'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Activity,
    Banknote,
    Briefcase,
    Building2,
    ChevronLeft,
    ChevronRight,
    FileText as JetContractIcon,
    History,
    MapPin,
    PhoneCall,
    ScrollText,
    ShieldCheck,
    Target,
    TrendingUp,
    User,
    Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const commonNavigation = [
    {
        name: 'ダッシュボード',
        items: [
            { name: '商談ダッシュボード', href: '/dashboard/deals', icon: TrendingUp },
            { name: '入金ダッシュボード', href: '/dashboard/payments', icon: Banknote },
            { name: '活動ダッシュボード', href: '/dashboard/activity', icon: Activity },
            { name: '個人ダッシュボード', href: '/dashboard/personal', icon: User },
            { name: 'KPI目標設定', href: '/dashboard/settings/kpi', icon: Target },
        ],
    },
    {
        name: '顧客管理',
        items: [
            { name: '会社', href: '/customers/companies', icon: Building2 },
        ],
    },
    {
        name: '営業管理',
        items: [
            { name: '商談', href: '/sales/deals', icon: Briefcase },
            { name: '契約', href: '/sales/contracts', icon: ScrollText },
            { name: 'アライアンス', href: '/sales/alliances', icon: Users },
            { name: '承認', href: '/sales/approvals', icon: ShieldCheck },
        ],
    },
    {
        name: 'コールシステム',
        items: [
            { name: '会社コールリスト', href: '/calls/company-list', icon: Building2 },
            { name: 'コールキュー', href: '/calls/queue', icon: PhoneCall },
            { name: 'コール履歴', href: '/calls/history', icon: History },
        ],
    },
];

const jetNavigation = [
    {
        name: '施設事業管理',
        items: [
            { name: '施設一覧', href: '/jet/facilities', icon: MapPin },
            { name: 'JET契約', href: '/jet/contracts', icon: JetContractIcon },
        ],
    },
];

interface SidebarProps {
    isCollapsed?: boolean;
    onToggle?: () => void;
    activeBusinessScope?: string;
}

export function Sidebar({ isCollapsed = false, onToggle, activeBusinessScope }: SidebarProps) {
    const pathname = usePathname();
    const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

    const navigation = [
        ...commonNavigation,
        ...(activeBusinessScope === 'WATER_SAVING' ? jetNavigation : []),
    ];

    return (
        <div className={cn('flex h-full flex-col border-r bg-white transition-all duration-200', isCollapsed ? 'w-14' : 'w-64')}>
            <div className="flex h-14 shrink-0 items-center gap-2 border-b px-3">
                {isCollapsed ? (
                    <Link href="/dashboard/deals" className="flex shrink-0 items-center justify-center" title="G-DX System">
                        <Image src="/gdxlogo__1_.png" alt="G-DX" width={32} height={32} className="object-contain" />
                    </Link>
                ) : (
                    <Link href="/dashboard/deals" className="flex flex-1 items-center overflow-hidden">
                        <Image src="/gdxlogo__1_.png" alt="G-DX System" width={120} height={36} className="object-contain" />
                    </Link>
                )}
                <button
                    onClick={onToggle}
                    className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
                    title={isCollapsed ? 'サイドバーを開く' : 'サイドバーを閉じる'}
                >
                    {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-4">
                <nav className="space-y-5">
                    {navigation.map((group) => (
                        <div key={group.name}>
                            {isCollapsed ? (
                                <div className="mb-1 border-t border-gray-200" />
                            ) : (
                                <h3 className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-gray-400">{group.name}</h3>
                            )}
                            <div className="space-y-0.5">
                                {group.items.map((item) => {
                                    const ItemIcon = item.icon;
                                    const active = isActive(item.href);
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            title={isCollapsed ? item.name : undefined}
                                            className={cn(
                                                'flex items-center rounded-md py-2 text-sm font-normal transition-colors',
                                                isCollapsed ? 'justify-center px-2' : 'gap-3 px-3',
                                                active ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-100',
                                            )}
                                        >
                                            <ItemIcon className={cn('h-4 w-4 shrink-0', active ? 'text-gray-900' : 'text-gray-500')} />
                                            {!isCollapsed && item.name}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>
            </div>

            {!isCollapsed ? (
                <div className="border-t p-3">
                    <p className="text-xs text-gray-400">© 2026 G-DX Inc.</p>
                </div>
            ) : null}
        </div>
    );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
    Activity,
    Banknote,
    Briefcase,
    Building2,
    FileText,
    History,
    MapPin,
    MoreHorizontal,
    PhoneCall,
    Plus,
    ScrollText,
    ShieldCheck,
    Target,
    TrendingUp,
    User,
    Users,
    X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const primaryTabs = [
    { name: 'ダッシュ', href: '/dashboard/deals', icon: TrendingUp },
    { name: '会社', href: '/customers/companies', icon: Building2 },
    { name: '商談', href: '/sales/deals', icon: Briefcase },
    { name: 'コール', href: '/calls/queue', icon: PhoneCall },
];

const moreItems = [
    { name: '契約', href: '/sales/contracts', icon: ScrollText },
    { name: 'アライアンス', href: '/sales/alliances', icon: Users },
    { name: '承認', href: '/sales/approvals', icon: ShieldCheck },
    { name: '会社コール', href: '/calls/company-list', icon: Building2 },
    { name: '履歴', href: '/calls/history', icon: History },
    { name: '入金', href: '/dashboard/payments', icon: Banknote },
    { name: '活動', href: '/dashboard/activity', icon: Activity },
    { name: '個人', href: '/dashboard/personal', icon: User },
    { name: 'KPI設定', href: '/dashboard/settings/kpi', icon: Target },
];

const jetItems = [
    { name: '施設一覧', href: '/jet/facilities', icon: MapPin },
    { name: 'JET契約', href: '/jet/contracts', icon: FileText },
];

interface BottomNavigationProps {
    activeBusinessScope: string;
}

export function BottomNavigation({ activeBusinessScope }: BottomNavigationProps) {
    const pathname = usePathname();
    const [isMoreOpen, setIsMoreOpen] = useState(false);
    const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

    const extraItems = [
        ...moreItems,
        ...(activeBusinessScope === 'WATER_SAVING' ? jetItems : []),
    ];

    return (
        <>
            {/* FAB: 新規商談登録 - ボトムナビ + セーフエリアの上に配置 */}
            <Link
                href="/sales/deals/new"
                className="fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg active:bg-blue-700 md:hidden"
                style={{ bottom: 'calc(4.5rem + env(safe-area-inset-bottom))' }}
                aria-label="新規商談登録"
            >
                <Plus className="h-6 w-6" />
            </Link>

            {isMoreOpen ? (
                <div className="fixed inset-0 z-40 md:hidden" onClick={() => setIsMoreOpen(false)}>
                    <div className="absolute inset-0 bg-black/30" />
                    <div
                        className="absolute left-0 right-0 rounded-t-2xl bg-white px-4 pt-3 shadow-lg"
                        style={{
                            bottom: 'calc(3.5rem + env(safe-area-inset-bottom))',
                            paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))',
                        }}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="mb-3 flex items-center justify-between">
                            <p className="text-sm font-semibold text-gray-900">その他メニュー</p>
                            <button
                                onClick={() => setIsMoreOpen(false)}
                                className="flex h-11 w-11 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 active:bg-gray-100"
                                aria-label="Close"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {extraItems.map((item) => {
                                const Icon = item.icon;
                                const active = isActive(item.href);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsMoreOpen(false)}
                                        className={cn(
                                            'flex flex-col items-center gap-1.5 rounded-lg px-2 py-3 text-xs transition-colors active:bg-gray-100',
                                            active ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50',
                                        )}
                                    >
                                        <Icon className="h-5 w-5" />
                                        <span className="text-center leading-tight">{item.name}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ) : null}

            <nav
                className="fixed bottom-0 left-0 right-0 z-30 border-t bg-white md:hidden"
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
                <div className="flex items-stretch justify-around">
                    {primaryTabs.map((tab) => {
                        const Icon = tab.icon;
                        const active = isActive(tab.href);
                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className={cn(
                                    'flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors active:bg-gray-50',
                                    active ? 'text-blue-600' : 'text-gray-500',
                                )}
                            >
                                <Icon className={cn('h-5 w-5', active ? 'text-blue-600' : undefined)} />
                                {tab.name}
                            </Link>
                        );
                    })}
                    <button
                        onClick={() => setIsMoreOpen((current) => !current)}
                        className={cn(
                            'flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors active:bg-gray-50',
                            isMoreOpen ? 'text-blue-600' : 'text-gray-500',
                        )}
                    >
                        <MoreHorizontal className="h-5 w-5" />
                        その他
                    </button>
                </div>
            </nav>
        </>
    );
}

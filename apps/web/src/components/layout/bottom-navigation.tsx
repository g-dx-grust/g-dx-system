'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Building2, Briefcase, PhoneCall, TrendingUp, MoreHorizontal, ScrollText, History, MapPin, FileText, User, Target, Banknote, Activity, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const primaryTabs = [
    { name: 'ダッシュボード', href: '/dashboard/deals', icon: TrendingUp },
    { name: '会社', href: '/customers/companies', icon: Building2 },
    { name: '案件', href: '/sales/deals', icon: Briefcase },
    { name: 'コール', href: '/calls/queue', icon: PhoneCall },
];

const moreItems = [
    { name: '契約', href: '/sales/contracts', icon: ScrollText },
    { name: '会社コールリスト', href: '/calls/company-list', icon: Building2 },
    { name: 'コール履歴', href: '/calls/history', icon: History },
    { name: '入金ダッシュボード', href: '/dashboard/payments', icon: Banknote },
    { name: '活動ダッシュボード', href: '/dashboard/activity', icon: Activity },
    { name: '個人ダッシュボード', href: '/dashboard/personal', icon: User },
    { name: 'KPI目標設定', href: '/dashboard/settings/kpi', icon: Target },
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
            {/* More menu overlay */}
            {isMoreOpen && (
                <div className="fixed inset-0 z-40 md:hidden" onClick={() => setIsMoreOpen(false)}>
                    <div className="absolute inset-0 bg-black/30" />
                    <div
                        className="absolute bottom-16 left-0 right-0 rounded-t-2xl bg-white px-4 pb-4 pt-3 shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-3 flex items-center justify-between">
                            <p className="text-sm font-semibold text-gray-900">その他メニュー</p>
                            <button
                                onClick={() => setIsMoreOpen(false)}
                                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100"
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
                                            'flex flex-col items-center gap-1.5 rounded-lg px-2 py-3 text-xs transition-colors',
                                            active ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
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
            )}

            {/* Bottom tab bar */}
            <nav className="fixed bottom-0 left-0 right-0 z-30 border-t bg-white md:hidden">
                <div className="flex items-stretch justify-around">
                    {primaryTabs.map((tab) => {
                        const Icon = tab.icon;
                        const active = isActive(tab.href);
                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className={cn(
                                    'flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
                                    active ? 'text-blue-600' : 'text-gray-500'
                                )}
                            >
                                <Icon className={cn('h-5 w-5', active && 'text-blue-600')} />
                                {tab.name}
                            </Link>
                        );
                    })}
                    <button
                        onClick={() => setIsMoreOpen((prev) => !prev)}
                        className={cn(
                            'flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
                            isMoreOpen ? 'text-blue-600' : 'text-gray-500'
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

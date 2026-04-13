'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export type DashboardTabKey = 'LARK_SUPPORT' | 'WATER_SAVING' | 'ALL';

export interface DashboardScopeTab {
    key: DashboardTabKey;
    label: string;
}

interface DashboardScopeTabsProps {
    tabs: DashboardScopeTab[];
    activeTab: DashboardTabKey;
}

export function DashboardScopeTabs({ tabs, activeTab }: DashboardScopeTabsProps) {
    const searchParams = useSearchParams();

    function buildHref(tabKey: DashboardTabKey): string {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tabKey);
        return `?${params.toString()}`;
    }

    return (
        <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
            {tabs.map((tab) => (
                <Link
                    key={tab.key}
                    href={buildHref(tab.key)}
                    className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                        activeTab === tab.key
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    {tab.label}
                </Link>
            ))}
        </div>
    );
}

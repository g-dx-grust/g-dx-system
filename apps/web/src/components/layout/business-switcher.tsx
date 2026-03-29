'use client';

import { useState, useEffect, useTransition } from 'react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { updateActiveBusinessScopeAction } from '@/modules/auth/server-actions';
import type { BusinessScopeType } from '@g-dx/contracts';
import { BusinessScope } from '@g-dx/contracts';

interface BusinessSwitcherProps {
    activeBusinessScope: BusinessScopeType;
    availableScopes: BusinessScopeType[];
}

const ALL_TAB = 'all' as const;
type TabValue = typeof ALL_TAB | BusinessScopeType;

interface TabDef {
    value: TabValue;
    label: string;
    shortLabel: string;
}

const STORAGE_KEY = 'gdx_active_tab';

export function BusinessSwitcher({ activeBusinessScope, availableScopes }: BusinessSwitcherProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const [selectedTab, setSelectedTab] = useState<TabValue>(activeBusinessScope);

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY) as TabValue | null;
        if (saved === ALL_TAB) {
            setSelectedTab(ALL_TAB);
        } else {
            setSelectedTab(activeBusinessScope);
        }
    }, [activeBusinessScope]);

    const handleSelect = (tab: TabValue) => {
        if (isPending) return;

        if (tab === ALL_TAB) {
            const firstScope = availableScopes[0];
            if (!firstScope) return;
            setSelectedTab(ALL_TAB);
            localStorage.setItem(STORAGE_KEY, ALL_TAB);
            startTransition(async () => {
                await updateActiveBusinessScopeAction(firstScope);
                router.refresh();
            });
            return;
        }

        if (!availableScopes.includes(tab)) return;
        setSelectedTab(tab);
        localStorage.setItem(STORAGE_KEY, tab);
        startTransition(async () => {
            await updateActiveBusinessScopeAction(tab);
            router.refresh();
        });
    };

    const tabs: TabDef[] = [
        { value: ALL_TAB, label: '全案件', shortLabel: '全案件' },
        ...(availableScopes.includes(BusinessScope.LARK_SUPPORT)
            ? [{ value: BusinessScope.LARK_SUPPORT as TabValue, label: 'G-DX（Lark導入支援）', shortLabel: 'G-DX' }]
            : []),
        ...(availableScopes.includes(BusinessScope.WATER_SAVING)
            ? [{ value: BusinessScope.WATER_SAVING as TabValue, label: 'JET（節水器具）', shortLabel: 'JET' }]
            : []),
    ];

    return (
        <div className="scrollbar-none flex items-center gap-3 overflow-x-auto border-b border-transparent">
            {tabs.map((tab) => {
                const isActive = tab.value === selectedTab;

                return (
                    <button
                        key={tab.value}
                        onClick={() => handleSelect(tab.value)}
                        disabled={isPending}
                        className={cn(
                            'relative shrink-0 px-1 pb-2 text-sm font-medium transition-colors',
                            isActive
                                ? 'border-b-2 border-gray-900 text-gray-900'
                                : 'text-gray-500 hover:text-gray-700',
                            isPending && 'opacity-50 cursor-not-allowed'
                        )}
                    >
                        <span className="md:hidden">{tab.shortLabel}</span>
                        <span className="hidden md:inline">{tab.label}</span>
                    </button>
                );
            })}
        </div>
    );
}

'use client';

import { Search, X } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import type { SearchResultItem } from '@g-dx/contracts';

const TYPE_COLORS = {
    company: 'text-sky-600',
    contact: 'text-violet-600',
    deal: 'text-emerald-600',
} as const;

const TYPE_LABELS = {
    company: '会社',
    contact: '担当者',
    deal: '案件',
} as const;

export function MobileSearchButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResultItem[]>([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const search = useCallback(async (q: string) => {
        if (q.length < 2) {
            abortRef.current?.abort();
            setResults([]);
            return;
        }
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        setLoading(true);
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
            if (!res.ok) return;
            const json = await res.json();
            setResults(json.data ?? []);
        } catch (err) {
            if ((err as Error).name === 'AbortError') return;
        } finally {
            if (abortRef.current === controller) setLoading(false);
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => search(value), 300);
    };

    const handleClose = () => {
        setIsOpen(false);
        setQuery('');
        setResults([]);
        abortRef.current?.abort();
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleClose();
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    });

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="flex h-11 w-11 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 active:bg-gray-100 md:hidden"
                aria-label="検索"
            >
                <Search className="h-4 w-4" />
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex flex-col bg-white md:hidden" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
                    {/* 検索バー */}
                    <div className="flex h-14 shrink-0 items-center gap-2 border-b px-3">
                        <Search className="h-4 w-4 shrink-0 text-gray-400" />
                        <input
                            ref={inputRef}
                            type="search"
                            value={query}
                            onChange={handleChange}
                            placeholder="顧客・案件を検索..."
                            className="h-full flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                        />
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 active:bg-gray-100"
                            aria-label="閉じる"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* 結果 */}
                    <div className="flex-1 overflow-y-auto">
                        {query.length < 2 ? (
                            <p className="px-4 py-6 text-sm text-gray-400">2文字以上入力して検索</p>
                        ) : loading ? (
                            <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                                検索中...
                            </div>
                        ) : results.length === 0 ? (
                            <p className="px-4 py-6 text-sm text-gray-500">「{query}」に一致する結果がありません</p>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {results.map((item) => (
                                    <li key={`${item.type}-${item.id}`}>
                                        <Link
                                            href={item.href}
                                            onClick={handleClose}
                                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50"
                                        >
                                            <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${TYPE_COLORS[item.type]} bg-gray-100`}>
                                                {TYPE_LABELS[item.type]}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium text-gray-900">{item.title}</p>
                                                <p className="truncate text-xs text-gray-500">{item.subtitle}</p>
                                            </div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

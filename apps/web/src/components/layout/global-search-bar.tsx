'use client';

import { Search, Building2, User, Briefcase, X } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { SearchResultItem } from '@g-dx/contracts';

const TYPE_ICONS = {
    company: Building2,
    contact: User,
    deal: Briefcase,
} as const;

const TYPE_COLORS = {
    company: 'text-sky-600',
    contact: 'text-violet-600',
    deal: 'text-emerald-600',
} as const;

export function GlobalSearchBar() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResultItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const search = useCallback(async (q: string) => {
        if (q.length < 2) {
            abortRef.current?.abort();
            setResults([]);
            setOpen(false);
            return;
        }

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
                signal: controller.signal,
            });
            if (!res.ok) return;
            const json = await res.json();
            setResults(json.data ?? []);
            setOpen(true);
        } catch (error) {
            if ((error as Error).name === 'AbortError') {
                return;
            }
        } finally {
            if (abortRef.current === controller) {
                setLoading(false);
            }
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => search(value), 300);
    };

    const handleClear = () => {
        setQuery('');
        setResults([]);
        setOpen(false);
    };

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            abortRef.current?.abort();
            document.removeEventListener('mousedown', handler);
        };
    }, []);

    return (
        <div ref={containerRef} className="relative w-64 sm:w-80">
            <div className="relative flex items-center">
                <Search className="absolute left-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                    type="search"
                    value={query}
                    onChange={handleChange}
                    onFocus={() => query.length >= 2 && setOpen(true)}
                    placeholder="顧客・案件を検索..."
                    className="h-9 w-full rounded-md border border-gray-200 bg-gray-50 pl-9 pr-8 text-sm text-gray-900 outline-none focus:border-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-200 transition-colors"
                />
                {query && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-2 text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>

            {open && (
                <div className="absolute left-0 top-full z-50 mt-1.5 w-full min-w-[320px] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                    {loading ? (
                        <div className="flex items-center justify-center gap-2 py-4 text-sm text-gray-500">
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                            検索中...
                        </div>
                    ) : results.length === 0 ? (
                        <div className="py-4 text-center text-sm text-gray-500">
                            「{query}」に一致する結果がありません
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {results.map((item) => {
                                const Icon = TYPE_ICONS[item.type];
                                const color = TYPE_COLORS[item.type];
                                return (
                                    <li key={`${item.type}-${item.id}`}>
                                        <Link
                                            href={item.href}
                                            onClick={() => setOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                                        >
                                            <Icon className={`h-4 w-4 shrink-0 ${color}`} />
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium text-gray-900">{item.title}</p>
                                                <p className="truncate text-xs text-gray-500">{item.subtitle}</p>
                                            </div>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}

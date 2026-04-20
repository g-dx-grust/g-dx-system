'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check, Search, Plus, Loader2 } from 'lucide-react';

interface SearchableSelectOption {
    value: string;
    label: string;
}

interface SearchableSelectProps {
    name: string;
    options: SearchableSelectOption[];
    placeholder?: string;
    required?: boolean;
    defaultValue?: string;
    onCreate?: (query: string) => Promise<{ id: string; label: string }>;
}

export function SearchableSelect({
    name,
    options: initialOptions,
    placeholder = '-- 選択 --',
    required = false,
    defaultValue = '',
    onCreate,
}: SearchableSelectProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(defaultValue);
    const [options, setOptions] = useState(initialOptions);
    const [creating, setCreating] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    const filtered = options.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase())
    );

    const selectedLabel = options.find((o) => o.value === selected)?.label;

    useEffect(() => {
        if (open) {
            setTimeout(() => searchRef.current?.focus(), 0);
        } else {
            setSearch('');
        }
    }, [open]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    async function handleCreate() {
        if (!onCreate || !search.trim() || creating) return;
        setCreating(true);
        try {
            const created = await onCreate(search.trim());
            setOptions((prev) => [...prev, { value: created.id, label: created.label }]);
            setSelected(created.id);
            setOpen(false);
        } catch {
            // silent — caller shows error via redirect/toast
        } finally {
            setCreating(false);
        }
    }

    return (
        <div ref={containerRef} className="relative">
            <input type="hidden" name={name} value={selected} required={required} />
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
                <span className={selectedLabel ? 'text-gray-900' : 'text-gray-400'}>
                    {selectedLabel ?? placeholder}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
            </button>

            {open && (
                <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
                    <div className="flex items-center border-b border-gray-100 px-3 py-2">
                        <Search className="mr-2 h-4 w-4 shrink-0 text-gray-400" />
                        <input
                            ref={searchRef}
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="検索..."
                            className="w-full text-sm outline-none placeholder:text-gray-400"
                        />
                    </div>
                    <ul className="max-h-56 overflow-y-auto py-1">
                        <li
                            className="cursor-pointer px-3 py-2 text-sm text-gray-400 hover:bg-gray-50"
                            onClick={() => { setSelected(''); setOpen(false); }}
                        >
                            {placeholder}
                        </li>
                        {filtered.length === 0 && onCreate && search.trim() ? (
                            <li>
                                <button
                                    type="button"
                                    onClick={handleCreate}
                                    disabled={creating}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                                >
                                    {creating
                                        ? <Loader2 className="h-4 w-4 animate-spin" />
                                        : <Plus className="h-4 w-4" />
                                    }
                                    {creating ? '作成中...' : `＋ 新規作成「${search.trim()}」`}
                                </button>
                            </li>
                        ) : filtered.length === 0 ? (
                            <li className="px-3 py-2 text-sm text-gray-400">該当なし</li>
                        ) : (
                            <>
                                {filtered.map((opt) => (
                                    <li
                                        key={opt.value}
                                        className="flex cursor-pointer items-center justify-between px-3 py-2 text-sm text-gray-900 hover:bg-gray-50"
                                        onClick={() => { setSelected(opt.value); setOpen(false); }}
                                    >
                                        {opt.label}
                                        {selected === opt.value && (
                                            <Check className="h-4 w-4 text-blue-600" />
                                        )}
                                    </li>
                                ))}
                                {onCreate && search.trim() && (
                                    <li>
                                        <button
                                            type="button"
                                            onClick={handleCreate}
                                            disabled={creating}
                                            className="flex w-full items-center gap-2 border-t border-gray-100 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                                        >
                                            {creating
                                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                                : <Plus className="h-4 w-4" />
                                            }
                                            {creating ? '作成中...' : `＋ 新規作成「${search.trim()}」`}
                                        </button>
                                    </li>
                                )}
                            </>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}

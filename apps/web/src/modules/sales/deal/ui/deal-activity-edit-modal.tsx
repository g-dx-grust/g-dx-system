'use client';

import { useState, useEffect } from 'react';
import { Pencil, X } from 'lucide-react';
import type { DealActivityItem } from '@g-dx/contracts';
import { ActivityForm } from './deal-activity-form';

interface DealActivityEditModalProps {
    dealId: string;
    activity: DealActivityItem;
    activityUpdated?: boolean;
}

export function DealActivityEditButton({ dealId, activity, activityUpdated = false }: DealActivityEditModalProps) {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (activityUpdated) setOpen(false);
    }, [activityUpdated]);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="shrink-0 flex h-7 w-7 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="編集"
            >
                <Pencil className="h-3.5 w-3.5" />
            </button>

            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
                    onClick={() => setOpen(false)}
                >
                    <div className="absolute inset-0 bg-black/40" />
                    <div
                        className="relative z-10 w-full overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:max-w-lg sm:rounded-2xl"
                        style={{ maxHeight: '90dvh' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-gray-100 px-4 pb-3 pt-4">
                            <h2 className="text-sm font-semibold text-gray-900">活動を編集</h2>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100"
                                aria-label="閉じる"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="p-4">
                            <ActivityForm
                                dealId={dealId}
                                editActivity={activity}
                                onClose={() => setOpen(false)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

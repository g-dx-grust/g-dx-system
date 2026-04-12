'use client';

import { useState, useEffect } from 'react';
import { PenLine, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ActivityForm } from './deal-activity-form';

interface ActivityLogModalProps {
    dealId: string;
    /** サーバーアクション成功後に true になる → モーダルを自動クローズ */
    activityAdded?: boolean;
}

export function ActivityLogModal({ dealId, activityAdded = false }: ActivityLogModalProps) {
    const [open, setOpen] = useState(false);

    // Server Action 成功後にページが再レンダリングされ activityAdded=true になったら閉じる
    useEffect(() => {
        if (activityAdded) {
            setOpen(false);
        }
    }, [activityAdded]);

    return (
        <>
            <Button
                type="button"
                size="sm"
                onClick={() => setOpen(true)}
                className="bg-blue-600 text-white hover:bg-blue-700"
            >
                <PenLine className="mr-1.5 h-4 w-4" />
                活動を記録
            </Button>

            {open && (
                /* backdrop */
                <div
                    className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
                    onClick={() => setOpen(false)}
                >
                    <div className="absolute inset-0 bg-black/40" />

                    {/* sheet (mobile) / dialog (desktop) */}
                    <div
                        className="relative z-10 w-full overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:max-w-lg sm:rounded-2xl"
                        style={{ maxHeight: '90dvh' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* ヘッダー */}
                        <div className="flex items-center justify-between border-b border-gray-100 px-4 pb-3 pt-4">
                            <h2 className="text-sm font-semibold text-gray-900">活動を記録</h2>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 active:bg-gray-100"
                                aria-label="閉じる"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* フォーム本体 */}
                        <div className="p-4">
                            <ActivityForm dealId={dealId} compact />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

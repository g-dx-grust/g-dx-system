'use client';

import { useRef } from 'react';
import { Trash2 } from 'lucide-react';
import { deleteDealAction } from '@/modules/sales/deal/server-actions';

interface DealDeleteButtonProps {
    dealId: string;
    dealName: string;
}

export function DealDeleteButton({ dealId, dealName }: DealDeleteButtonProps) {
    const formRef = useRef<HTMLFormElement>(null);

    function handleSubmit(e: React.FormEvent) {
        if (!window.confirm(`「${dealName}」を削除してもよいですか？\nこの操作は元に戻せません。`)) {
            e.preventDefault();
        }
    }

    return (
        <form ref={formRef} action={deleteDealAction} onSubmit={handleSubmit}>
            <input type="hidden" name="dealId" value={dealId} />
            <button
                type="submit"
                className="flex items-center gap-1.5 rounded-md border border-red-200 px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 hover:border-red-300"
            >
                <Trash2 className="h-4 w-4" />
                案件を削除
            </button>
        </form>
    );
}

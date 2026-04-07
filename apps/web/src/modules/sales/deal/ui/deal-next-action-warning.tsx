'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface DealNextActionWarningProps {
    detailsId: string;
    inputId: string;
}

function clearNoNextActionParam() {
    const url = new URL(window.location.href);
    url.searchParams.delete('noNextAction');
    window.history.replaceState({}, '', url.toString());
}

export function DealNextActionWarning({
    detailsId,
    inputId,
}: DealNextActionWarningProps) {
    const [visible, setVisible] = useState(true);

    if (!visible) return null;

    return (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-medium">
                次回アクションが設定されていません。設定しますか？
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
                <Button
                    type="button"
                    size="sm"
                    className="bg-amber-600 text-white hover:bg-amber-700"
                    onClick={() => {
                        const details = document.getElementById(
                            detailsId,
                        ) as HTMLDetailsElement | null;
                        const input = document.getElementById(
                            inputId,
                        ) as HTMLInputElement | null;

                        details?.setAttribute('open', '');
                        window.requestAnimationFrame(() => {
                            input?.scrollIntoView({
                                behavior: 'smooth',
                                block: 'center',
                            });
                            input?.focus();
                        });

                        clearNoNextActionParam();
                        setVisible(false);
                    }}
                >
                    次回アクションを設定
                </Button>
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-amber-300 bg-white text-amber-900 hover:bg-amber-100"
                    onClick={() => {
                        clearNoNextActionParam();
                        setVisible(false);
                    }}
                >
                    後で設定する
                </Button>
            </div>
        </div>
    );
}

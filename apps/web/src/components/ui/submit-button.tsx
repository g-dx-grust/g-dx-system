'use client';

import { useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import type { ComponentProps } from 'react';

type ButtonProps = ComponentProps<typeof Button>;

interface SubmitButtonProps extends Omit<ButtonProps, 'type'> {
    pendingText?: string;
}

/**
 * サーバーアクション対応の送信ボタン。
 * フォーム送信中は disabled になり、pendingText を表示します。
 */
export function SubmitButton({ children, pendingText, disabled, ...props }: SubmitButtonProps) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={disabled || pending} {...props}>
            {pending ? (
                <span className="inline-flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {pendingText ?? '保存中...'}
                </span>
            ) : children}
        </Button>
    );
}

/**
 * フォーム送信が開始されたとき、最も近い <details> 要素を自動的に閉じます。
 * <form> の直接子として配置してください。
 */
export function FormAutoClose() {
    const ref = useRef<HTMLSpanElement>(null);
    const { pending } = useFormStatus();

    useEffect(() => {
        if (pending && ref.current) {
            const details = ref.current.closest('details');
            if (details) {
                details.removeAttribute('open');
            }
        }
    }, [pending]);

    return <span ref={ref} className="hidden" aria-hidden />;
}

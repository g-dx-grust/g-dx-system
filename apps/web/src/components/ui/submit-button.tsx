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
            {pending ? (pendingText ?? '保存中...') : children}
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

'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { NotificationItem, NotificationListResponse, NotificationUnreadCountResponse } from '@g-dx/contracts';
import { Button } from '@/components/ui/button';

interface NotificationMenuProps {
    initialUnreadCount: number;
}

export function NotificationMenu({ initialUnreadCount }: NotificationMenuProps) {
    const router = useRouter();
    const containerRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
    const [busyNotificationId, setBusyNotificationId] = useState<string | null>(null);
    const [markingAll, setMarkingAll] = useState(false);

    useEffect(() => {
        setUnreadCount(initialUnreadCount);
    }, [initialUnreadCount]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!open) return;
        void refreshNotifications();
    }, [open]);

    async function refreshNotifications() {
        setLoading(true);
        try {
            const [notificationsRes, unreadCountRes] = await Promise.all([
                fetch('/api/v1/notifications?page=1&pageSize=8', { cache: 'no-store' }),
                fetch('/api/v1/notifications/unread-count', { cache: 'no-store' }),
            ]);

            if (notificationsRes.ok) {
                const notificationsJson = (await notificationsRes.json()) as NotificationListResponse;
                setNotifications(notificationsJson.data ?? []);
            }

            if (unreadCountRes.ok) {
                const unreadCountJson = (await unreadCountRes.json()) as NotificationUnreadCountResponse;
                setUnreadCount(unreadCountJson.data?.count ?? 0);
            }
        } finally {
            setLoading(false);
        }
    }

    async function markNotificationRead(notificationId: string) {
        setBusyNotificationId(notificationId);
        try {
            const response = await fetch(`/api/v1/notifications/${notificationId}/read`, {
                method: 'POST',
            });
            if (!response.ok) return false;

            setNotifications((current) =>
                current.map((item) =>
                    item.id === notificationId
                        ? { ...item, isRead: true, readAt: new Date().toISOString() }
                        : item,
                ),
            );
            setUnreadCount((current) => Math.max(0, current - 1));
            return true;
        } finally {
            setBusyNotificationId(null);
        }
    }

    async function handleMarkAllRead() {
        setMarkingAll(true);
        try {
            const response = await fetch('/api/v1/notifications', { method: 'POST' });
            if (!response.ok) return;

            setNotifications((current) =>
                current.map((item) => ({
                    ...item,
                    isRead: true,
                    readAt: item.readAt ?? new Date().toISOString(),
                })),
            );
            setUnreadCount(0);
            router.refresh();
        } finally {
            setMarkingAll(false);
        }
    }

    async function handleNotificationClick(item: NotificationItem) {
        if (!item.isRead) {
            await markNotificationRead(item.id);
        }

        const href = resolveNotificationHref(item);
        if (href) {
            setOpen(false);
            router.push(href);
            router.refresh();
        }
    }

    return (
        <div ref={containerRef} className="relative">
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="relative rounded-full"
                onClick={() => setOpen((current) => !current)}
                aria-label="Notifications"
            >
                <Bell className="h-5 w-5 text-gray-600" />
                {unreadCount > 0 ? (
                    <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                ) : null}
            </Button>

            {open ? (
                <div className="absolute right-0 top-full z-50 mt-2 w-[360px] max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 bg-white shadow-lg">
                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                        <div>
                            <p className="text-sm font-semibold text-gray-900">通知</p>
                            <p className="text-xs text-gray-500">未読 {unreadCount} 件</p>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs"
                            disabled={markingAll || unreadCount === 0}
                            onClick={() => void handleMarkAllRead()}
                        >
                            <CheckCheck className="mr-1 h-4 w-4" />
                            すべて既読
                        </Button>
                    </div>

                    <div className="max-h-[420px] overflow-y-auto">
                        {loading ? (
                            <div className="px-4 py-8 text-center text-sm text-gray-500">通知を読み込み中です...</div>
                        ) : notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-sm text-gray-500">通知はありません。</div>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {notifications.map((item) => (
                                    <li key={item.id}>
                                        <button
                                            type="button"
                                            className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                                                item.isRead ? 'bg-white' : 'bg-blue-50/60'
                                            }`}
                                            onClick={() => void handleNotificationClick(item)}
                                            disabled={busyNotificationId === item.id}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <p className="text-sm font-medium text-gray-900">{item.title}</p>
                                                {!item.isRead ? (
                                                    <span className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-blue-500" />
                                                ) : null}
                                            </div>
                                            {item.body ? (
                                                <p className="text-sm text-gray-600">{item.body}</p>
                                            ) : null}
                                            <div className="flex items-center justify-between gap-3 text-xs text-gray-400">
                                                <span>{formatNotificationDate(item.createdAt)}</span>
                                                <span>{NOTIFICATION_TYPE_LABELS[item.notificationType] ?? item.notificationType}</span>
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function resolveNotificationHref(item: NotificationItem): string | null {
    if (item.linkUrl) return item.linkUrl;
    if (item.relatedEntityType === 'approval_request' && item.relatedEntityId) {
        return `/sales/approvals/${item.relatedEntityId}`;
    }
    if (item.relatedEntityType === 'deal' && item.relatedEntityId) {
        return `/sales/deals/${item.relatedEntityId}`;
    }
    if (item.relatedEntityType === 'company' && item.relatedEntityId) {
        return `/customers/companies/${item.relatedEntityId}`;
    }
    return null;
}

function formatNotificationDate(value: string): string {
    return new Date(value).toLocaleString('ja-JP', {
        timeZone: 'Asia/Tokyo',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
    APPROVAL_REQUESTED: '承認依頼',
    APPROVAL_APPROVED: '承認済み',
    APPROVAL_REJECTED: '却下',
    APPROVAL_RETURNED: '差し戻し',
    APPROVAL_DEADLINE: '期限通知',
    KPI_SUBMITTED: 'KPI入力',
    CRM_SYNC_FAILED: 'CRM同期失敗',
    AI_GENERATION_COMPLETE: 'AI生成完了',
    AI_GENERATION_FAILED: 'AI生成失敗',
};

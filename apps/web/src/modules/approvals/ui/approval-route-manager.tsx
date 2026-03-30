'use client';

import { useState } from 'react';
import type { ApprovalRouteItem, ApprovalTypeValue } from '@g-dx/contracts';
import type { ScopeUserItem } from '../infrastructure/approval-repository';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SubmitButton } from '@/components/ui/submit-button';
import { APPROVAL_TYPE_LABELS, APPROVAL_TYPE_OPTIONS } from './approval-ui';
import {
    createApprovalRouteAction,
    updateApprovalRouteAction,
    toggleApprovalRouteAction,
    deleteApprovalRouteAction,
} from '../server-actions';

interface ApprovalRouteManagerProps {
    routes: ApprovalRouteItem[];
    users: ScopeUserItem[];
    canManage: boolean;
    created?: boolean;
    updated?: boolean;
    deleted?: boolean;
}

export function ApprovalRouteManager({
    routes,
    users,
    canManage,
    created = false,
    updated = false,
    deleted = false,
}: ApprovalRouteManagerProps) {
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const grouped = APPROVAL_TYPE_OPTIONS.reduce<Record<ApprovalTypeValue, ApprovalRouteItem[]>>(
        (acc, type) => {
            acc[type] = routes.filter((r) => r.approvalType === type);
            return acc;
        },
        { PRE_MEETING: [], ESTIMATE_PRESENTATION: [], TECH_REVIEW: [] },
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold text-gray-900">承認ルート管理</h1>
                    <p className="text-sm text-gray-500">承認者 / 順序設定</p>
                </div>
                {canManage && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        onClick={() => setShowAddForm((v) => !v)}
                    >
                        {showAddForm ? 'キャンセル' : '＋ ルートを追加'}
                    </Button>
                )}
            </div>

            {(created || updated || deleted) && (
                <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {created ? 'ルートを追加しました。' : updated ? 'ルートを更新しました。' : 'ルートを削除しました。'}
                </div>
            )}

            {/* 追加フォーム */}
            {canManage && showAddForm && (
                <Card className="border-blue-200 bg-blue-50 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base text-gray-900">新規ルートを追加</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form
                            action={async (fd) => {
                                await createApprovalRouteAction(fd);
                                setShowAddForm(false);
                            }}
                            className="grid gap-4 sm:grid-cols-2"
                        >
                            <label className="grid gap-2 text-sm font-medium text-gray-700">
                                承認種別 <span className="text-red-500">*</span>
                                <select
                                    name="approvalType"
                                    required
                                    className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    {APPROVAL_TYPE_OPTIONS.map((t) => (
                                        <option key={t} value={t}>{APPROVAL_TYPE_LABELS[t]}</option>
                                    ))}
                                </select>
                            </label>

                            <label className="grid gap-2 text-sm font-medium text-gray-700">
                                ルート名 <span className="text-red-500">*</span>
                                <input
                                    name="routeName"
                                    required
                                    placeholder="例：営業マネージャー承認"
                                    className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                />
                            </label>

                            <label className="grid gap-2 text-sm font-medium text-gray-700">
                                承認者 <span className="text-red-500">*</span>
                                <select
                                    name="approverUserId"
                                    required
                                    className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    <option value="">選択してください</option>
                                    {users.map((u) => (
                                        <option key={u.id} value={u.id}>{u.displayName}</option>
                                    ))}
                                </select>
                            </label>

                            <label className="grid gap-2 text-sm font-medium text-gray-700">
                                順序
                                <input
                                    name="routeOrder"
                                    type="number"
                                    min="1"
                                    defaultValue="1"
                                    className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                />
                            </label>

                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 sm:col-span-2">
                                <input type="checkbox" name="allowSelfApproval" className="h-4 w-4 rounded border-gray-300" />
                                自己承認を許可する
                            </label>

                            <div className="flex justify-end gap-2 sm:col-span-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowAddForm(false)}
                                >
                                    キャンセル
                                </Button>
                                <SubmitButton
                                    size="sm"
                                    pendingText="追加中..."
                                    className="bg-blue-600 text-white hover:bg-blue-700"
                                >
                                    追加する
                                </SubmitButton>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* 承認種別カード */}
            <div className="grid gap-6 xl:grid-cols-3">
                {APPROVAL_TYPE_OPTIONS.map((approvalType) => (
                    <Card key={approvalType} className="border-gray-200 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-base text-gray-900">
                                {APPROVAL_TYPE_LABELS[approvalType]}
                            </CardTitle>
                            <CardDescription>{grouped[approvalType].length} ルート</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {grouped[approvalType].length === 0 ? (
                                <p className="text-sm text-gray-400">ルートが設定されていません。</p>
                            ) : (
                                grouped[approvalType].map((route) => (
                                    <div
                                        key={route.id}
                                        className={`rounded-lg border p-4 ${route.isActive ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'}`}
                                    >
                                        {editingId === route.id ? (
                                            /* 編集フォーム */
                                            <form action={updateApprovalRouteAction} className="space-y-3">
                                                <input type="hidden" name="routeId" value={route.id} />
                                                <input type="hidden" name="isActive" value={String(route.isActive)} />

                                                <label className="grid gap-1 text-xs font-medium text-gray-600">
                                                    ルート名
                                                    <input
                                                        name="routeName"
                                                        defaultValue={route.routeName}
                                                        required
                                                        className="h-8 rounded-md border border-gray-300 bg-white px-2 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                    />
                                                </label>

                                                <label className="grid gap-1 text-xs font-medium text-gray-600">
                                                    承認者
                                                    <select
                                                        name="approverUserId"
                                                        defaultValue={route.approverUserId}
                                                        className="h-8 rounded-md border border-gray-300 bg-white px-2 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                    >
                                                        {users.map((u) => (
                                                            <option key={u.id} value={u.id}>{u.displayName}</option>
                                                        ))}
                                                    </select>
                                                </label>

                                                <label className="grid gap-1 text-xs font-medium text-gray-600">
                                                    順序
                                                    <input
                                                        name="routeOrder"
                                                        type="number"
                                                        min="1"
                                                        defaultValue={route.routeOrder}
                                                        className="h-8 w-20 rounded-md border border-gray-300 bg-white px-2 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                    />
                                                </label>

                                                <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
                                                    <input
                                                        type="checkbox"
                                                        name="allowSelfApproval"
                                                        defaultChecked={route.allowSelfApproval}
                                                        className="h-3.5 w-3.5 rounded border-gray-300"
                                                    />
                                                    自己承認を許可
                                                </label>

                                                <div className="flex gap-2 pt-1">
                                                    <SubmitButton
                                                        size="sm"
                                                        pendingText="保存中..."
                                                        className="bg-blue-600 text-white hover:bg-blue-700"
                                                    >
                                                        保存
                                                    </SubmitButton>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => setEditingId(null)}
                                                    >
                                                        キャンセル
                                                    </Button>
                                                </div>
                                            </form>
                                        ) : deletingId === route.id ? (
                                            /* 削除確認 */
                                            <div className="space-y-3">
                                                <p className="text-sm font-medium text-red-700">
                                                    「{route.routeName}」を削除しますか？
                                                </p>
                                                <p className="text-xs text-gray-500">この操作は元に戻せません。</p>
                                                <div className="flex gap-2">
                                                    <form action={deleteApprovalRouteAction}>
                                                        <input type="hidden" name="routeId" value={route.id} />
                                                        <SubmitButton
                                                            size="sm"
                                                            pendingText="削除中..."
                                                            className="bg-red-600 text-white hover:bg-red-700"
                                                        >
                                                            削除する
                                                        </SubmitButton>
                                                    </form>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => setDeletingId(null)}
                                                    >
                                                        キャンセル
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            /* 表示 */
                                            <div className="space-y-2">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900">
                                                            Step {route.routeOrder}：{route.routeName}
                                                        </p>
                                                        <p className="text-sm text-gray-600">{route.approverName}</p>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1">
                                                        <Badge variant={route.isActive ? 'success' : 'outline'}>
                                                            {route.isActive ? '有効' : '停止中'}
                                                        </Badge>
                                                        {route.allowSelfApproval && (
                                                            <Badge variant="warning">自己承認可</Badge>
                                                        )}
                                                    </div>
                                                </div>

                                                {canManage && (
                                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-7 px-2.5 text-xs"
                                                            onClick={() => { setEditingId(route.id); setDeletingId(null); }}
                                                        >
                                                            編集
                                                        </Button>

                                                        <form action={toggleApprovalRouteAction}>
                                                            <input type="hidden" name="routeId" value={route.id} />
                                                            <input type="hidden" name="isActive" value={String(route.isActive)} />
                                                            <SubmitButton
                                                                size="sm"
                                                                variant="outline"
                                                                pendingText="..."
                                                                className={`h-7 px-2.5 text-xs ${route.isActive ? 'text-yellow-700 hover:bg-yellow-50' : 'text-green-700 hover:bg-green-50'}`}
                                                            >
                                                                {route.isActive ? '停止' : '有効化'}
                                                            </SubmitButton>
                                                        </form>

                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-7 px-2.5 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                                                            onClick={() => { setDeletingId(route.id); setEditingId(null); }}
                                                        >
                                                            削除
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

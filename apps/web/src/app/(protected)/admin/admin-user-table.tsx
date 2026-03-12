'use client';

import { useState, useTransition } from 'react';
import { ShieldCheck, X, Plus, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { assignRoleAction, removeRoleAction, createUserAction } from './server-actions';

interface RoleOption {
    id: string;
    code: string;
    name: string;
}

interface BusinessUnit {
    id: string;
    code: string;
    name: string;
}

interface UserRow {
    id: string;
    name: string;
    email: string;
    status: string;
    lastLoginAt: string | null;
    roles: RoleOption[];
    businesses: BusinessUnit[];
}

interface Props {
    users: UserRow[];
    roleOptions: RoleOption[];
    businessUnits: BusinessUnit[];
    currentUserId: string;
}

const ROLE_LABELS: Record<string, string> = {
    SUPER_ADMIN: 'スーパー管理者',
    ADMIN: '管理者',
    MANAGER: 'マネージャー',
    OPERATOR: 'オペレーター',
    VIEWER: '閲覧者',
};

const STATUS_LABELS: Record<string, string> = {
    active: '有効',
    inactive: '無効',
    suspended: '停止中',
};

export function AdminUserTable({ users, roleOptions, businessUnits, currentUserId }: Props) {
    const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    function handleCreateSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const form = e.currentTarget;
        startTransition(async () => {
            const result = await createUserAction(formData);
            if (result.success) {
                setShowCreateForm(false);
                setCreateError(null);
                form.reset();
            } else {
                setCreateError(result.error ?? 'エラーが発生しました');
            }
        });
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <ShieldCheck className="h-6 w-6 text-gray-700" />
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">管理者設定</h1>
                        <p className="text-sm text-gray-500">ユーザーのロールと権限を管理します</p>
                    </div>
                </div>
                <Button
                    type="button"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => { setShowCreateForm(!showCreateForm); setCreateError(null); }}
                >
                    <UserPlus className="h-4 w-4" />
                    ユーザー追加
                </Button>
            </div>

            {showCreateForm && (
                <Card className="shadow-sm border-gray-300">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base text-gray-900">新規ユーザー追加</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreateSubmit} className="space-y-4">
                            {createError && (
                                <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{createError}</p>
                            )}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        名前 <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                                        placeholder="山田 太郎"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        メールアドレス <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                                        placeholder="taro@example.com"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Lark Open ID <span className="text-gray-400 font-normal text-xs">（任意）</span>
                                </label>
                                <input
                                    type="text"
                                    name="larkOpenId"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                                    placeholder="ou_xxxxxxxxxxxxxxxx"
                                />
                                <p className="mt-1 text-xs text-gray-400">入力するとLarkログイン時に自動連携されます</p>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-2">ロール</p>
                                    <div className="space-y-1.5">
                                        {roleOptions.map((role) => (
                                            <label key={role.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                                <input type="checkbox" name="roleId" value={role.id} className="rounded border-gray-300" />
                                                {ROLE_LABELS[role.code] ?? role.code}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-2">所属部門</p>
                                    <div className="space-y-1.5">
                                        {businessUnits.map((bu) => (
                                            <label key={bu.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                                <input type="checkbox" name="businessUnitId" value={bu.id} className="rounded border-gray-300" />
                                                {bu.name}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => { setShowCreateForm(false); setCreateError(null); }}
                                >
                                    キャンセル
                                </Button>
                                <Button type="submit" size="sm" disabled={isPending}>
                                    {isPending ? '追加中...' : '追加する'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base text-gray-900">ユーザー一覧</CardTitle>
                    <CardDescription>全 {users.length} 件</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-gray-100">
                        {users.map((user) => (
                            <div key={user.id} className="px-6 py-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-medium text-gray-900">{user.name}</span>
                                            <span className="text-xs text-gray-400">{user.email}</span>
                                            <span className={`text-xs px-1.5 py-0.5 rounded ${user.status === 'active' ? 'bg-gray-100 text-gray-600' : 'bg-red-50 text-red-600'}`}>
                                                {STATUS_LABELS[user.status] ?? user.status}
                                            </span>
                                            {user.id === currentUserId && (
                                                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-900 text-white">あなた</span>
                                            )}
                                        </div>
                                        <div className="mt-1 flex flex-wrap gap-1.5">
                                            {user.roles.length === 0 ? (
                                                <span className="text-xs text-gray-400">ロールなし</span>
                                            ) : (
                                                user.roles.map((role) => (
                                                    <span key={role.id} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-gray-200 bg-gray-50 text-gray-700">
                                                        {ROLE_LABELS[role.code] ?? role.code}
                                                        <form action={removeRoleAction} className="inline">
                                                            <input type="hidden" name="userId" value={user.id} />
                                                            <input type="hidden" name="roleId" value={role.id} />
                                                            <button type="submit" className="text-gray-400 hover:text-red-500 leading-none">
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        </form>
                                                    </span>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="shrink-0 gap-1"
                                        onClick={() => setExpandedUserId(expandedUserId === user.id ? null : user.id)}
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                        ロール付与
                                    </Button>
                                </div>

                                {expandedUserId === user.id && (
                                    <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 p-3">
                                        <p className="mb-2 text-xs font-medium text-gray-600">付与するロールを選択</p>
                                        <div className="flex flex-wrap gap-2">
                                            {roleOptions
                                                .filter((r) => !user.roles.some((ur) => ur.id === r.id))
                                                .map((role) => (
                                                    <form key={role.id} action={assignRoleAction}>
                                                        <input type="hidden" name="userId" value={user.id} />
                                                        <input type="hidden" name="roleId" value={role.id} />
                                                        <Button type="submit" size="sm" variant="outline" className="h-7 text-xs">
                                                            {ROLE_LABELS[role.code] ?? role.code}
                                                        </Button>
                                                    </form>
                                                ))}
                                            {roleOptions.filter((r) => !user.roles.some((ur) => ur.id === r.id)).length === 0 && (
                                                <span className="text-xs text-gray-400">全てのロールが付与済みです</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

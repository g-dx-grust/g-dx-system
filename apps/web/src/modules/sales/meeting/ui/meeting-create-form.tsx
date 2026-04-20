'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { createMeetingAction } from '@/modules/sales/meeting/server-actions';
import type { MeetingActivityType, MeetingCounterpartyType } from '@g-dx/contracts';

interface SelectOption {
    value: string;
    label: string;
}

interface UserOption {
    id: string;
    name: string;
}

interface MeetingCreateFormProps {
    companies: SelectOption[];
    alliances: SelectOption[];
    users: UserOption[];
    currentUserId: string;
    onCreateCompany?: (name: string) => Promise<{ id: string; label: string }>;
    onCreateAlliance?: (name: string) => Promise<{ id: string; label: string }>;
    errorMessage?: string;
}

const selectClassName =
    'h-10 rounded-md border border-gray-300 px-3 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

const ACTIVITY_TYPE_OPTIONS: { value: MeetingActivityType; label: string }[] = [
    { value: 'VISIT', label: '訪問' },
    { value: 'ONLINE', label: 'オンライン' },
    { value: 'CALL', label: '電話' },
    { value: 'OTHER', label: 'その他' },
];

const COUNTERPARTY_TYPE_OPTIONS: { value: MeetingCounterpartyType; label: string }[] = [
    { value: 'COMPANY', label: '案件会社' },
    { value: 'ALLIANCE', label: 'アライアンス' },
    { value: 'NONE', label: 'なし' },
];

export function MeetingCreateForm({
    companies,
    alliances,
    users,
    currentUserId,
    onCreateCompany,
    onCreateAlliance,
    errorMessage,
}: MeetingCreateFormProps) {
    const [counterpartyType, setCounterpartyType] = useState<MeetingCounterpartyType>('NONE');

    return (
        <Card className="border-gray-200 shadow-sm">
            <CardHeader>
                <CardDescription>面談登録</CardDescription>
            </CardHeader>
            <CardContent>
                {errorMessage ? (
                    <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {errorMessage}
                    </div>
                ) : null}

                <form action={createMeetingAction} className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        <span>日時 <span className="text-red-500">*</span></span>
                        <Input name="meetingDate" type="datetime-local" required />
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        <span>種別 <span className="text-red-500">*</span></span>
                        <select name="activityType" required defaultValue="VISIT" className={selectClassName}>
                            {ACTIVITY_TYPE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </label>

                    <div className="grid gap-2 text-sm font-medium text-gray-700 md:col-span-2">
                        <span>相手タイプ <span className="text-red-500">*</span></span>
                        <div className="flex gap-4">
                            {COUNTERPARTY_TYPE_OPTIONS.map((opt) => (
                                <label key={opt.value} className="flex cursor-pointer items-center gap-2 font-normal">
                                    <input
                                        type="radio"
                                        name="counterpartyType"
                                        value={opt.value}
                                        checked={counterpartyType === opt.value}
                                        onChange={() => setCounterpartyType(opt.value)}
                                        className="accent-blue-600"
                                    />
                                    {opt.label}
                                </label>
                            ))}
                        </div>
                    </div>

                    {counterpartyType === 'COMPANY' && (
                        <div className="grid gap-2 text-sm font-medium text-gray-700 md:col-span-2">
                            <span>相手会社 <span className="text-red-500">*</span></span>
                            <SearchableSelect
                                name="companyId"
                                options={companies}
                                placeholder="-- 会社を選択 --"
                                required
                                onCreate={onCreateCompany}
                            />
                        </div>
                    )}

                    {counterpartyType === 'ALLIANCE' && (
                        <div className="grid gap-2 text-sm font-medium text-gray-700 md:col-span-2">
                            <span>相手アライアンス <span className="text-red-500">*</span></span>
                            <SearchableSelect
                                name="allianceId"
                                options={alliances}
                                placeholder="-- アライアンスを選択 --"
                                required
                                onCreate={onCreateAlliance}
                            />
                        </div>
                    )}

                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        相手氏名
                        <Input name="contactName" placeholder="例: 山田 太郎" />
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        役職
                        <Input name="contactRole" placeholder="例: 営業部長" />
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-gray-700 md:col-span-2">
                        目的
                        <textarea
                            name="purpose"
                            rows={2}
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            placeholder="面談の目的を入力..."
                        />
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-gray-700 md:col-span-2">
                        要約
                        <textarea
                            name="summary"
                            rows={3}
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            placeholder="面談内容の要約..."
                        />
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        次アクション日
                        <Input name="nextActionDate" type="date" />
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        次アクション内容
                        <Input name="nextActionContent" placeholder="提案書を送付など" />
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        担当者
                        <select name="ownerUserId" defaultValue={currentUserId} className={selectClassName}>
                            {users.map((u) => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                    </label>

                    <div className="flex flex-col-reverse gap-2 md:col-span-2 md:flex-row md:justify-end">
                        <Button asChild variant="outline" className="w-full px-6 md:w-auto">
                            <Link href="/sales/meetings">キャンセル</Link>
                        </Button>
                        <SubmitButton className="w-full bg-blue-600 px-6 text-white hover:bg-blue-700 md:w-auto" pendingText="登録中...">
                            面談を登録
                        </SubmitButton>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

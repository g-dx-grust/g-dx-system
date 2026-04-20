'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { updateMeetingAction, deleteMeetingAction } from '@/modules/sales/meeting/server-actions';
import type { MeetingActivityType, MeetingCounterpartyType, MeetingItem } from '@g-dx/contracts';

interface SelectOption {
    value: string;
    label: string;
}

interface UserOption {
    id: string;
    name: string;
}

interface MeetingEditFormProps {
    meeting: MeetingItem;
    companies: SelectOption[];
    alliances: SelectOption[];
    users: UserOption[];
    onCreateCompany?: (name: string) => Promise<{ id: string; label: string }>;
    onCreateAlliance?: (name: string) => Promise<{ id: string; label: string }>;
    updated?: boolean;
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

function toLocalDatetimeValue(iso: string): string {
    try {
        const d = new Date(iso);
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
        return '';
    }
}

export function MeetingEditForm({
    meeting,
    companies,
    alliances,
    users,
    onCreateCompany,
    onCreateAlliance,
    updated = false,
}: MeetingEditFormProps) {
    const [counterpartyType, setCounterpartyType] = useState<MeetingCounterpartyType>(
        meeting.counterpartyType,
    );

    return (
        <Card className="border-gray-200 shadow-sm">
            <CardHeader>
                <CardTitle className="text-base">面談情報を編集</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {updated && (
                    <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                        更新しました。
                    </div>
                )}

                <form action={updateMeetingAction} className="grid gap-4 md:grid-cols-2">
                    <input type="hidden" name="meetingId" value={meeting.id} />

                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        <span>日時 <span className="text-red-500">*</span></span>
                        <Input
                            name="meetingDate"
                            type="datetime-local"
                            required
                            defaultValue={toLocalDatetimeValue(meeting.meetingDate)}
                        />
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        <span>種別 <span className="text-red-500">*</span></span>
                        <select name="activityType" required defaultValue={meeting.activityType} className={selectClassName}>
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
                                defaultValue={meeting.companyId ?? ''}
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
                                defaultValue={meeting.allianceId ?? ''}
                                onCreate={onCreateAlliance}
                            />
                        </div>
                    )}

                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        相手氏名
                        <Input name="contactName" defaultValue={meeting.contactName ?? ''} placeholder="例: 山田 太郎" />
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        役職
                        <Input name="contactRole" defaultValue={meeting.contactRole ?? ''} placeholder="例: 営業部長" />
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-gray-700 md:col-span-2">
                        目的
                        <textarea
                            name="purpose"
                            rows={2}
                            defaultValue={meeting.purpose ?? ''}
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            placeholder="面談の目的..."
                        />
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-gray-700 md:col-span-2">
                        要約
                        <textarea
                            name="summary"
                            rows={3}
                            defaultValue={meeting.summary ?? ''}
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            placeholder="面談内容の要約..."
                        />
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        次アクション日
                        <Input name="nextActionDate" type="date" defaultValue={meeting.nextActionDate ?? ''} />
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        次アクション内容
                        <Input name="nextActionContent" defaultValue={meeting.nextActionContent ?? ''} placeholder="提案書を送付など" />
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        担当者
                        <select name="ownerUserId" defaultValue={meeting.ownerUserId} className={selectClassName}>
                            {users.map((u) => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                    </label>

                    <div className="flex justify-end md:col-span-2">
                        <SubmitButton className="bg-blue-600 px-6 text-white hover:bg-blue-700" pendingText="更新中...">
                            更新する
                        </SubmitButton>
                    </div>
                </form>

                <div className="border-t border-gray-200 pt-4">
                    <p className="mb-2 text-sm font-medium text-gray-700">削除</p>
                    <form action={deleteMeetingAction}>
                        <input type="hidden" name="meetingId" value={meeting.id} />
                        <Button
                            type="submit"
                            variant="outline"
                            className="border-red-200 text-red-600 hover:bg-red-50"
                            onClick={(e) => {
                                if (!confirm('この面談を削除しますか？')) e.preventDefault();
                            }}
                        >
                            この面談を削除
                        </Button>
                    </form>
                </div>
            </CardContent>
        </Card>
    );
}

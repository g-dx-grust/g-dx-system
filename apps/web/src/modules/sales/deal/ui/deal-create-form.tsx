import Link from 'next/link';
import type { DealStageKey } from '@g-dx/contracts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { createDealAction } from '@/modules/sales/deal/server-actions';

interface CompanyOption {
    id: string;
    name: string;
}

interface StageOption {
    key: DealStageKey;
    label: string;
}

interface SelectOption {
    value: string;
    label: string;
}

interface UserOption {
    id: string;
    name: string;
}

interface DealDefaults {
    companyId?: string;
    memo?: string;
    nextActionDate?: string;
    nextActionContent?: string;
}

interface DealCreateFormProps {
    companies: CompanyOption[];
    stages: StageOption[];
    acquisitionMethods: SelectOption[];
    showJetFields: boolean;
    jetDealStatuses: SelectOption[];
    jetCreditStatuses: SelectOption[];
    jetStatus2Options: SelectOption[];
    allianceOptions?: SelectOption[];
    users?: UserOption[];
    currentUserId?: string;
    errorMessage?: string;
    defaults?: DealDefaults;
    fromMeetingId?: string;
}

const selectClassName =
    'h-10 rounded-md border border-gray-300 px-3 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

const DEAL_TYPE_OPTIONS = [
    'G-DX導入支援（フルカスタム開発）',
    'G-DX導入支援（Lark×業界パッケージ）',
    'G-DX導入支援（Lark構築）',
    'G-DX導入支援（伴走メイン）',
    '節水商材',
    'JET導入',
    'JET×Lark',
] as const;

export function DealCreateForm({
    companies,
    stages,
    acquisitionMethods,
    showJetFields,
    jetDealStatuses,
    jetCreditStatuses,
    jetStatus2Options,
    allianceOptions = [],
    users = [],
    currentUserId,
    errorMessage,
    defaults,
    fromMeetingId,
}: DealCreateFormProps) {
    const defaultStage = stages[0]?.key;
    const companyOptions = companies.map((c) => ({ value: c.id, label: c.name }));

    return (
        <Card className="border-gray-200 shadow-sm">
            <CardHeader>
                <CardDescription>
                    案件登録
                </CardDescription>
            </CardHeader>
            <CardContent>
                {errorMessage ? (
                    <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {errorMessage}
                    </div>
                ) : null}

                <form action={createDealAction} className="grid gap-4 md:grid-cols-2">
                    {fromMeetingId ? (
                        <input type="hidden" name="fromMeeting" value={fromMeetingId} />
                    ) : null}
                    <label className="grid gap-2 text-sm font-medium text-gray-700 md:col-span-2">
                        <span>案件名 <span className="text-red-500">*</span></span>
                        <select name="name" required defaultValue="" className={selectClassName}>
                            <option value="" disabled>-- 案件種別を選択 --</option>
                            {DEAL_TYPE_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </label>

                    <div className="grid gap-2 text-sm font-medium text-gray-700">
                        <span>会社 <span className="text-red-500">*</span></span>
                        <SearchableSelect
                            name="companyId"
                            options={companyOptions}
                            placeholder="-- 会社を選択 --"
                            required
                            defaultValue={defaults?.companyId}
                        />
                    </div>

                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        <span>ステージ <span className="text-red-500">*</span></span>
                        <select
                            name="stage"
                            required
                            defaultValue={defaultStage}
                            className={selectClassName}
                        >
                            {stages.map((stage) => (
                                <option key={stage.key} value={stage.key}>
                                    {stage.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        獲得方法
                        <select name="acquisitionMethod" defaultValue="" className={selectClassName}>
                            <option value="">-- 獲得方法を選択 --</option>
                            {acquisitionMethods.map((method) => (
                                <option key={method.value} value={method.value}>
                                    {method.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        次回アクション日時
                        <div className="flex gap-2">
                            <Input name="nextActionDate" type="date" className="flex-1" defaultValue={defaults?.nextActionDate} />
                            <Input name="nextActionTime" type="time" className="w-32" />
                        </div>
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-gray-700 md:col-span-2">
                        次回アクション内容
                        <Input name="nextActionContent" placeholder="提案書を送付、訪問予定など" defaultValue={defaults?.nextActionContent} />
                    </label>

                    {users.length > 0 && (
                        <label className="grid gap-2 text-sm font-medium text-gray-700">
                            担当者
                            <select name="ownerUserId" defaultValue={currentUserId ?? ''} className={selectClassName}>
                                <option value="">-- 自分 (作成者) --</option>
                                {users.map((u) => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                        </label>
                    )}

                    {showJetFields ? (
                        <>
                            <div className="md:col-span-2">
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    JET 専用項目
                                </p>
                            </div>

                            <label className="grid gap-2 text-sm font-medium text-gray-700">
                                JET案件ステータス
                                <select name="jetDealStatus" defaultValue="" className={selectClassName}>
                                    <option value="">-- ステータスを選択 --</option>
                                    {jetDealStatuses.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="grid gap-2 text-sm font-medium text-gray-700">
                                JET与信ステータス
                                <select name="jetCreditStatus" defaultValue="" className={selectClassName}>
                                    <option value="">-- 与信ステータスを選択 --</option>
                                    {jetCreditStatuses.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="grid gap-2 text-sm font-medium text-gray-700 md:col-span-2">
                                JETステータス2
                                <select name="jetStatus2" defaultValue="" className={selectClassName}>
                                    <option value="">-- ステータス2を選択 --</option>
                                    {jetStatus2Options.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </>
                    ) : null}

                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        金額
                        <Input name="amount" type="number" min="0" placeholder="1000000" />
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-gray-700">
                        クローズ予定日
                        <Input name="expectedCloseDate" type="date" />
                    </label>

                    <label className="grid gap-2 text-sm font-medium text-gray-700 md:col-span-2">
                        ソース
                        <Input name="source" placeholder="例: インバウンド、紹介、広告など" />
                    </label>

                    {allianceOptions.length > 0 ? (
                        <label className="grid gap-2 text-sm font-medium text-gray-700 md:col-span-2">
                            アライアンス（任意）
                            <select name="allianceId" defaultValue="" className={selectClassName}>
                                <option value="">-- アライアンスなし --</option>
                                {allianceOptions.map((a) => (
                                    <option key={a.value} value={a.value}>{a.label}</option>
                                ))}
                            </select>
                        </label>
                    ) : null}

                    <label className="grid gap-2 text-sm font-medium text-gray-700 md:col-span-2">
                        メモ
                        <textarea
                            name="memo"
                            rows={4}
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            placeholder="案件に関するメモを入力..."
                            defaultValue={defaults?.memo}
                        />
                    </label>

                    <div className="flex flex-col-reverse gap-2 md:col-span-2 md:flex-row md:justify-end">
                        <Button asChild variant="outline" className="w-full px-6 md:w-auto">
                            <Link href="/sales/deals">キャンセル</Link>
                        </Button>
                        <SubmitButton className="w-full bg-blue-600 px-6 text-white hover:bg-blue-700 md:w-auto" pendingText="登録中...">
                            案件を登録
                        </SubmitButton>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

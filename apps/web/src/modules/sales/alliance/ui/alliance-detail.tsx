import Link from 'next/link';
import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import type { AllianceDetail, AllianceReferralType, AllianceStatus, AllianceType } from '@g-dx/contracts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';
import { linkAllianceToDealAction, unlinkAllianceFromDealAction, updateAllianceAction } from '@/modules/sales/alliance/server-actions';

interface AllianceDetailViewProps {
    alliance: AllianceDetail;
    availableDeals: { id: string; name: string; companyName: string }[];
    created?: boolean;
    updated?: boolean;
    linked?: boolean;
    unlinked?: boolean;
}

const TYPE_LABELS: Record<AllianceType, string> = {
    COMPANY: '法人',
    INDIVIDUAL: '個人',
};

const STATUS_LABELS: Record<AllianceStatus, string> = {
    PROSPECT: '候補',
    ACTIVE: 'アクティブ',
    INACTIVE: '非アクティブ',
};

const STATUS_COLORS: Record<AllianceStatus, string> = {
    PROSPECT: 'bg-gray-100 text-gray-600',
    ACTIVE: 'bg-blue-100 text-blue-700',
    INACTIVE: 'bg-gray-50 text-gray-400',
};

const REFERRAL_LABELS: Record<AllianceReferralType, string> = {
    INTRODUCER: '紹介者',
    PARTNER: 'パートナー',
    ADVISOR: 'アドバイザー',
};

const REFERRAL_COLORS: Record<AllianceReferralType, string> = {
    INTRODUCER: 'bg-purple-100 text-purple-700',
    PARTNER: 'bg-blue-100 text-blue-700',
    ADVISOR: 'bg-green-100 text-green-700',
};

const selectClassName =
    'h-10 rounded-md border border-gray-300 px-3 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

export function AllianceDetailView({
    alliance,
    availableDeals,
    created = false,
    updated = false,
    linked = false,
    unlinked = false,
}: AllianceDetailViewProps) {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-semibold text-gray-900">{alliance.name}</h1>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[alliance.relationshipStatus]}`}>
                            {STATUS_LABELS[alliance.relationshipStatus]}
                        </span>
                        <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                            {TYPE_LABELS[alliance.allianceType]}
                        </span>
                    </div>
                    {alliance.contactPersonName ? (
                        <p className="text-sm text-gray-500">担当: {alliance.contactPersonName}</p>
                    ) : null}
                </div>
                <Button asChild variant="outline" className="px-5">
                    <Link href="/sales/alliances">一覧へ戻る</Link>
                </Button>
            </div>

            {created ? (
                <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                    アライアンスを登録しました。
                </div>
            ) : null}
            {updated ? (
                <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                    アライアンス情報を更新しました。
                </div>
            ) : null}
            {linked ? (
                <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    案件を紐付けました。
                </div>
            ) : null}
            {unlinked ? (
                <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                    案件の紐付けを解除しました。
                </div>
            ) : null}

            <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
                {/* 基本情報 */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg text-gray-900">アライアンス情報</CardTitle>
                        <CardDescription>基本情報</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <InfoItem label="名前" value={alliance.name} />
                        <InfoItem label="種別" value={TYPE_LABELS[alliance.allianceType]} />
                        <InfoItem label="ステータス" value={STATUS_LABELS[alliance.relationshipStatus]} />
                        <InfoItem label="担当者名" value={alliance.contactPersonName ?? '-'} />
                        <InfoItem label="役職" value={alliance.contactPersonRole ?? '-'} />
                        <InfoItem label="メールアドレス" value={alliance.contactPersonEmail ?? '-'} />
                        <InfoItem label="電話番号" value={alliance.contactPersonPhone ?? '-'} />
                        {alliance.agreementSummary ? (
                            <InfoItem label="合意・約束内容" value={alliance.agreementSummary} className="sm:col-span-2" />
                        ) : null}
                        {alliance.notes ? (
                            <InfoItem label="備考" value={alliance.notes} className="sm:col-span-2" />
                        ) : null}
                        <InfoItem label="登録日時" value={new Date(alliance.createdAt).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })} />
                        <InfoItem label="更新日時" value={new Date(alliance.updatedAt).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })} />
                    </CardContent>
                </Card>

                {/* 紐付き案件数 */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg text-gray-900">紐付き案件</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-gray-900">{alliance.linkedDealCount}</p>
                        <p className="mt-1 text-sm text-gray-500">件の案件と紐付き済み</p>
                    </CardContent>
                </Card>
            </div>

            {/* 編集フォーム */}
            <details className="group rounded-lg border border-gray-200 bg-white shadow-sm">
                <summary className="flex cursor-pointer select-none list-none items-center justify-between px-6 py-4 [&::-webkit-details-marker]:hidden">
                    <div>
                        <p className="text-lg font-semibold text-gray-900">アライアンスを編集</p>
                        <p className="mt-0.5 text-sm text-gray-500">クリックして基本情報を編集</p>
                    </div>
                    <ChevronDown className="h-5 w-5 text-gray-400 transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <div className="border-t border-gray-100 px-6 pb-6 pt-5">
                    <form action={updateAllianceAction} className="grid gap-4 md:grid-cols-2">
                        <input type="hidden" name="allianceId" value={alliance.id} />

                        <label className="grid gap-2 text-sm font-medium text-gray-700 md:col-span-2">
                            名前
                            <Input name="name" defaultValue={alliance.name} />
                        </label>

                        <label className="grid gap-2 text-sm font-medium text-gray-700">
                            種別
                            <select name="allianceType" defaultValue={alliance.allianceType} className={selectClassName}>
                                <option value="COMPANY">法人</option>
                                <option value="INDIVIDUAL">個人</option>
                            </select>
                        </label>

                        <label className="grid gap-2 text-sm font-medium text-gray-700">
                            ステータス
                            <select name="relationshipStatus" defaultValue={alliance.relationshipStatus} className={selectClassName}>
                                <option value="PROSPECT">候補</option>
                                <option value="ACTIVE">アクティブ</option>
                                <option value="INACTIVE">非アクティブ</option>
                            </select>
                        </label>

                        <label className="grid gap-2 text-sm font-medium text-gray-700">
                            担当者名
                            <Input name="contactPersonName" defaultValue={alliance.contactPersonName ?? ''} />
                        </label>

                        <label className="grid gap-2 text-sm font-medium text-gray-700">
                            役職
                            <Input name="contactPersonRole" defaultValue={alliance.contactPersonRole ?? ''} />
                        </label>

                        <label className="grid gap-2 text-sm font-medium text-gray-700">
                            メールアドレス
                            <Input name="contactPersonEmail" type="email" defaultValue={alliance.contactPersonEmail ?? ''} />
                        </label>

                        <label className="grid gap-2 text-sm font-medium text-gray-700">
                            電話番号
                            <Input name="contactPersonPhone" defaultValue={alliance.contactPersonPhone ?? ''} />
                        </label>

                        <label className="grid gap-2 text-sm font-medium text-gray-700 md:col-span-2">
                            合意・約束内容
                            <textarea
                                name="agreementSummary"
                                rows={3}
                                defaultValue={alliance.agreementSummary ?? ''}
                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            />
                        </label>

                        <label className="grid gap-2 text-sm font-medium text-gray-700 md:col-span-2">
                            備考
                            <textarea
                                name="notes"
                                rows={3}
                                defaultValue={alliance.notes ?? ''}
                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            />
                        </label>

                        <div className="flex items-center justify-end md:col-span-2">
                            <SubmitButton className="bg-blue-600 px-8 text-white hover:bg-blue-700">
                                保存
                            </SubmitButton>
                        </div>
                    </form>
                </div>
            </details>

            {/* 紐付き案件一覧 */}
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg text-gray-900">紐付き案件一覧</CardTitle>
                    <CardDescription>このアライアンスに関連する案件</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {alliance.linkedDeals.length === 0 ? (
                        <div className="px-6 py-8 text-center text-sm text-gray-500">紐付き案件がありません</div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="border-b border-gray-200 bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">案件名</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">会社</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">紹介種別</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">メモ</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {alliance.linkedDeals.map((deal) => (
                                    <tr key={deal.dealId} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <Link href={`/sales/deals/${deal.dealId}`} className="font-medium text-gray-900 hover:underline">
                                                {deal.dealName}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{deal.companyName}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${REFERRAL_COLORS[deal.referralType]}`}>
                                                {REFERRAL_LABELS[deal.referralType]}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">{deal.note ?? '-'}</td>
                                        <td className="px-4 py-3 text-right">
                                            <form action={unlinkAllianceFromDealAction}>
                                                <input type="hidden" name="allianceId" value={alliance.id} />
                                                <input type="hidden" name="dealId" value={deal.dealId} />
                                                <button
                                                    type="submit"
                                                    className="text-xs text-red-600 hover:underline"
                                                    onClick={(e) => {
                                                        if (!confirm('紐付けを解除しますか？')) e.preventDefault();
                                                    }}
                                                >
                                                    解除
                                                </button>
                                            </form>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </CardContent>
            </Card>

            {/* 案件紐付けフォーム */}
            {availableDeals.length > 0 ? (
                <details className="group rounded-lg border border-gray-200 bg-white shadow-sm">
                    <summary className="flex cursor-pointer select-none list-none items-center justify-between px-6 py-4 [&::-webkit-details-marker]:hidden">
                        <div>
                            <p className="text-lg font-semibold text-gray-900">案件を紐付ける</p>
                            <p className="mt-0.5 text-sm text-gray-500">案件とアライアンスを紐付ける</p>
                        </div>
                        <ChevronDown className="h-5 w-5 text-gray-400 transition-transform duration-200 group-open:rotate-180" />
                    </summary>
                    <div className="border-t border-gray-100 px-6 pb-6 pt-5">
                        <form action={linkAllianceToDealAction} className="grid gap-4 md:grid-cols-2">
                            <input type="hidden" name="allianceId" value={alliance.id} />

                            <label className="grid gap-2 text-sm font-medium text-gray-700 md:col-span-2">
                                案件を選択 <span className="text-red-500">*</span>
                                <select name="dealId" required className={selectClassName}>
                                    <option value="">-- 案件を選択 --</option>
                                    {availableDeals.map((deal) => (
                                        <option key={deal.id} value={deal.id}>
                                            {deal.name}（{deal.companyName}）
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="grid gap-2 text-sm font-medium text-gray-700">
                                紹介種別 <span className="text-red-500">*</span>
                                <select name="referralType" required defaultValue="INTRODUCER" className={selectClassName}>
                                    <option value="INTRODUCER">紹介者</option>
                                    <option value="PARTNER">パートナー</option>
                                    <option value="ADVISOR">アドバイザー</option>
                                </select>
                            </label>

                            <label className="grid gap-2 text-sm font-medium text-gray-700">
                                メモ
                                <Input name="note" placeholder="補足情報など" />
                            </label>

                            <div className="flex items-center justify-end md:col-span-2">
                                <SubmitButton className="bg-blue-600 px-8 text-white hover:bg-blue-700" pendingText="紐付け中...">
                                    案件を紐付ける
                                </SubmitButton>
                            </div>
                        </form>
                    </div>
                </details>
            ) : null}
        </div>
    );
}

interface InfoItemProps {
    label: string;
    value?: string;
    children?: ReactNode;
    className?: string;
}

function InfoItem({ label, value, children, className }: InfoItemProps) {
    return (
        <div className={className}>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-gray-900">
                {children ?? value}
            </p>
        </div>
    );
}

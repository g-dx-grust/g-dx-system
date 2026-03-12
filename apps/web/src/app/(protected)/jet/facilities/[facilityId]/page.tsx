import { redirect } from 'next/navigation';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { isAppError } from '@/shared/server/errors';
import { getFacilityDetail } from '@/modules/jet/facility/infrastructure/facility-repository';
import { updateFacilityAction } from '@/modules/jet/facility/server-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface Props {
    params: { facilityId: string };
    searchParams?: { updated?: string; created?: string };
}

const CONTRACT_STATUS_LABELS: Record<string, string> = {
    CONTRACTED: '契約中',
    INVOICED: '請求済み',
    PAID: '入金済み',
    ACTIVE_SERVICE: 'サービス中',
    TERMINATED: '解約済み',
    CANCELLED: 'キャンセル',
};

const REBATE_STATUS_LABELS: Record<string, string> = {
    PENDING: '未処理',
    PROCESSED: '処理済み',
    NOT_APPLICABLE: '対象外',
};

export default async function FacilityDetailPage({ params, searchParams }: Props) {
    const session = await getAuthenticatedAppSession();
    if (!session) redirect('/login');
    if (session.activeBusinessScope !== 'WATER_SAVING') redirect('/dashboard/deals');

    let facility;
    try {
        facility = await getFacilityDetail(params.facilityId);
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'NOT_FOUND')) redirect('/jet/facilities');
        throw error;
    }

    const isUpdated = searchParams?.updated === '1' || searchParams?.created === '1';

    return (
        <div className="space-y-6">
            {/* ヘッダー */}
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-gray-400" />
                        <h1 className="text-2xl font-semibold text-gray-900">{facility.name}</h1>
                    </div>
                    <p className="text-sm text-gray-500">
                        <Link href={`/customers/companies/${facility.companyId}`} className="hover:underline">
                            {facility.companyName}
                        </Link>
                    </p>
                </div>
                <Button asChild variant="outline" className="px-5">
                    <Link href="/jet/facilities">一覧へ戻る</Link>
                </Button>
            </div>

            {isUpdated && (
                <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                    施設情報を{searchParams?.created === '1' ? '登録' : '更新'}しました。
                </div>
            )}

            <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
                {/* 基本情報 */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg text-gray-900">基本情報</CardTitle>
                        <CardDescription>施設の基本情報です。</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <InfoItem label="施設名" value={facility.name} />
                        <InfoItem label="会社">
                            <Link href={`/customers/companies/${facility.companyId}`} className="hover:underline text-gray-900">
                                {facility.companyName}
                            </Link>
                        </InfoItem>
                        <InfoItem label="電話番号" value={facility.mainPhone ?? '-'} />
                        <InfoItem label="管理者名" value={facility.managerName ?? '-'} />
                        <InfoItem
                            label="住所"
                            value={[facility.postalCode, facility.prefecture, facility.city, facility.addressLine1].filter(Boolean).join(' ') || '-'}
                            className="sm:col-span-2"
                        />
                        {facility.memo && <InfoItem label="メモ" value={facility.memo} className="sm:col-span-2" />}
                        <InfoItem label="登録日" value={new Date(facility.createdAt).toLocaleDateString('ja-JP')} />
                        <InfoItem label="更新日" value={new Date(facility.updatedAt).toLocaleDateString('ja-JP')} />
                    </CardContent>
                </Card>

                {/* 編集フォーム */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg text-gray-900">施設情報を編集</CardTitle>
                        <CardDescription>基本情報を更新します。</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form action={updateFacilityAction} className="flex flex-col gap-3">
                            <input type="hidden" name="facilityId" value={facility.id} />
                            <label className="grid gap-1.5 text-sm font-medium text-gray-700">
                                施設名<Input name="name" defaultValue={facility.name} required />
                            </label>
                            <label className="grid gap-1.5 text-sm font-medium text-gray-700">
                                管理者名<Input name="managerName" defaultValue={facility.managerName ?? ''} />
                            </label>
                            <label className="grid gap-1.5 text-sm font-medium text-gray-700">
                                電話番号<Input name="mainPhone" defaultValue={facility.mainPhone ?? ''} />
                            </label>
                            <label className="grid gap-1.5 text-sm font-medium text-gray-700">
                                都道府県<Input name="prefecture" defaultValue={facility.prefecture ?? ''} />
                            </label>
                            <label className="grid gap-1.5 text-sm font-medium text-gray-700">
                                市区町村<Input name="city" defaultValue={facility.city ?? ''} />
                            </label>
                            <label className="grid gap-1.5 text-sm font-medium text-gray-700">
                                番地<Input name="addressLine1" defaultValue={facility.addressLine1 ?? ''} />
                            </label>
                            <label className="grid gap-1.5 text-sm font-medium text-gray-700">
                                メモ
                                <textarea
                                    name="memo"
                                    rows={3}
                                    defaultValue={facility.memo ?? ''}
                                    className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                />
                            </label>
                            <Button type="submit" className="w-full bg-blue-600 text-white hover:bg-blue-700">保存</Button>
                        </form>
                    </CardContent>
                </Card>
            </div>

            {/* 関連JET契約 */}
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg text-gray-900">関連JET契約</CardTitle>
                    <CardDescription>この施設に紐づく契約の一覧です。</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {facility.relatedContracts.length === 0 ? (
                        <div className="px-6 py-8 text-center text-sm text-gray-500">関連する契約がありません。</div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50 text-left text-gray-500">
                                <tr>
                                    <th className="px-6 py-3 font-medium">契約名</th>
                                    <th className="px-6 py-3 font-medium">ステータス</th>
                                    <th className="px-6 py-3 font-medium text-right">金額</th>
                                    <th className="px-6 py-3 font-medium">サービス期間</th>
                                    <th className="px-6 py-3 font-medium">解約日</th>
                                    <th className="px-6 py-3 font-medium">リベート</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white text-gray-700">
                                {facility.relatedContracts.map((c) => (
                                    <tr key={c.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-3 font-medium text-gray-900">
                                            <Link href={`/sales/contracts/${c.id}`} className="hover:underline">
                                                {c.title}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                                                {CONTRACT_STATUS_LABELS[c.contractStatus] ?? c.contractStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            {c.amount !== null ? `¥${c.amount.toLocaleString()}` : '-'}
                                        </td>
                                        <td className="px-6 py-3 text-gray-500">
                                            {c.serviceStartDate ?? '-'} ~ {c.serviceEndDate ?? '-'}
                                        </td>
                                        <td className="px-6 py-3">
                                            {c.terminationDate ? (
                                                <span className="text-red-600">{c.terminationDate}</span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3">
                                            {c.rebateRequired ? (
                                                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${c.rebateStatus === 'PROCESSED' ? 'bg-emerald-100 text-emerald-700'
                                                        : c.rebateStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-700'
                                                            : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                    {c.rebateStatus ? REBATE_STATUS_LABELS[c.rebateStatus] : '-'}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400">不要</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

import type { ReactNode } from 'react';

interface InfoItemProps { label: string; value?: string; children?: ReactNode; className?: string; }
function InfoItem({ label, value, children, className }: InfoItemProps) {
    return (
        <div className={className}>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
            <p className="mt-1.5 text-sm text-gray-900">{children ?? value}</p>
        </div>
    );
}

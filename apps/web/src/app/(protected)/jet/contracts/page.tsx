import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { isAppError } from '@/shared/server/errors';
import { listJetContracts } from '@/modules/jet/contract/infrastructure/jet-contract-repository';
import { FileText } from 'lucide-react';

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

const GDX_REFERRAL_LABELS: Record<string, string> = {
    POSSIBLE: '紹介可能',
    REFERRED: '紹介済み',
    NOT_APPLICABLE: '対象外',
};

export default async function JetContractsPage() {
    const session = await getAuthenticatedAppSession();
    if (!session) redirect('/login');
    if (session.activeBusinessScope !== 'WATER_SAVING') redirect('/dashboard/deals');

    let jetContracts;
    try {
        jetContracts = await listJetContracts(session.activeBusinessScope);
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        throw error;
    }

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="flex items-center gap-2 text-2xl font-semibold text-gray-900">
                    <FileText className="h-6 w-6 text-gray-500" />
                    JET 契約一覧
                </h1>
                <p className="text-sm text-gray-500">節水事業の契約をリベート・GDX紹介状態とあわせて管理します。</p>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                {jetContracts.length === 0 ? (
                    <div className="py-16 text-center text-sm text-gray-500">JET契約がありません。</div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50 text-left text-gray-500 whitespace-nowrap">
                            <tr>
                                <th className="px-5 py-3 font-medium">契約名</th>
                                <th className="px-5 py-3 font-medium">ステータス</th>
                                <th className="px-5 py-3 font-medium">会社</th>
                                <th className="px-5 py-3 font-medium">施設</th>
                                <th className="px-5 py-3 font-medium">担当</th>
                                <th className="px-5 py-3 font-medium text-right">金額</th>
                                <th className="px-5 py-3 font-medium">サービス期間</th>
                                <th className="px-5 py-3 font-medium">解約日</th>
                                <th className="px-5 py-3 font-medium">リベート</th>
                                <th className="px-5 py-3 font-medium">GDX紹介</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white text-gray-700">
                            {jetContracts.map((c) => (
                                <tr key={c.id} className="hover:bg-gray-50">
                                    <td className="px-5 py-3 font-medium text-gray-900 whitespace-nowrap">
                                        <Link href={`/sales/contracts/${c.id}`} className="hover:underline">
                                            {c.title}
                                        </Link>
                                        {c.contractNumber && (
                                            <span className="ml-1 text-xs text-gray-400">#{c.contractNumber}</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3 whitespace-nowrap">
                                        <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                                            {CONTRACT_STATUS_LABELS[c.contractStatus] ?? c.contractStatus}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 whitespace-nowrap">
                                        <Link href={`/customers/companies/${c.company.id}`} className="hover:underline text-gray-600">
                                            {c.company.name}
                                        </Link>
                                    </td>
                                    <td className="px-5 py-3 whitespace-nowrap">
                                        {c.facility ? (
                                            <Link href={`/jet/facilities/${c.facility.id}`} className="hover:underline text-gray-600">
                                                {c.facility.name}
                                            </Link>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3 whitespace-nowrap">{c.ownerUser.name}</td>
                                    <td className="px-5 py-3 text-right whitespace-nowrap">
                                        {c.amount !== null ? `¥${c.amount.toLocaleString()}` : '-'}
                                    </td>
                                    <td className="px-5 py-3 whitespace-nowrap text-gray-500">
                                        {c.serviceStartDate ?? '-'} ~ {c.serviceEndDate ?? '-'}
                                    </td>
                                    <td className="px-5 py-3 whitespace-nowrap">
                                        {c.terminationDate ? (
                                            <span className="text-red-600">{c.terminationDate}</span>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3 whitespace-nowrap">
                                        {c.rebateRequired ? (
                                            <div className="flex flex-col gap-0.5">
                                                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${c.rebateStatus === 'PROCESSED' ? 'bg-emerald-100 text-emerald-700'
                                                        : c.rebateStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-700'
                                                            : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                    {c.rebateStatus ? REBATE_STATUS_LABELS[c.rebateStatus] : '-'}
                                                </span>
                                                {c.rebateAmount !== null && (
                                                    <span className="text-xs text-gray-500">¥{c.rebateAmount.toLocaleString()}</span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 text-xs">不要</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3 whitespace-nowrap">
                                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${c.gdxReferralStatus === 'REFERRED' ? 'bg-blue-100 text-blue-700'
                                                : c.gdxReferralStatus === 'POSSIBLE' ? 'bg-gray-200 text-gray-600'
                                                    : 'bg-gray-100 text-gray-400'
                                            }`}>
                                            {c.gdxReferralStatus ? GDX_REFERRAL_LABELS[c.gdxReferralStatus] : '-'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

import { redirect } from 'next/navigation';
import { AllianceCreateForm } from '@/modules/sales/alliance/ui/alliance-create-form';
import { getAuthenticatedAppSession } from '@/shared/server/session';

export default async function NewAlliancePage() {
    const session = await getAuthenticatedAppSession();
    if (!session) redirect('/login');

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-2xl font-semibold text-gray-900">アライアンス登録</h1>
                <p className="text-sm text-gray-500">新しいアライアンス（紹介者・パートナー・協力者）を登録します</p>
            </div>
            <AllianceCreateForm />
        </div>
    );
}

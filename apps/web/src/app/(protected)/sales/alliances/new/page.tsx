import { redirect } from 'next/navigation';
import { AllianceCreateForm } from '@/modules/sales/alliance/ui/alliance-create-form';
import { getMeeting } from '@/modules/sales/meeting/application/get-meeting';
import { getAuthenticatedAppSession } from '@/shared/server/session';

interface NewAlliancePageProps {
    searchParams?: { fromMeeting?: string };
}

export default async function NewAlliancePage({ searchParams }: NewAlliancePageProps) {
    const session = await getAuthenticatedAppSession();
    if (!session) redirect('/login');

    let allianceDefaults: { contactPersonName?: string; contactPersonRole?: string; notes?: string } | undefined;
    const fromMeetingId = searchParams?.fromMeeting;
    if (fromMeetingId) {
        const meeting = await getMeeting(fromMeetingId).catch(() => null);
        if (meeting) {
            allianceDefaults = {
                contactPersonName: meeting.contactName ?? undefined,
                contactPersonRole: meeting.contactRole ?? undefined,
                notes: meeting.summary ?? undefined,
            };
        }
    }

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-2xl font-semibold text-gray-900">アライアンス登録</h1>
                <p className="text-sm text-gray-500">新しいアライアンス（紹介者・パートナー・協力者）を登録します</p>
            </div>
            <AllianceCreateForm defaults={allianceDefaults} fromMeetingId={fromMeetingId} />
        </div>
    );
}

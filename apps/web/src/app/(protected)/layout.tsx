import { redirect } from 'next/navigation';
import { GlobalLayout } from '@/components/layout/global-layout';
import { getAuthenticatedAppSession } from '@/shared/server/session';

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getAuthenticatedAppSession();
    if (!session) {
        redirect('/login');
    }

    return (
        <GlobalLayout activeBusinessScope={session.activeBusinessScope} session={session}>
            {children}
        </GlobalLayout>
    );
}

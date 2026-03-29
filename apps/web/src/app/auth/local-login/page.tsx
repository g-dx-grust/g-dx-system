import { redirect } from 'next/navigation';
import { appConfig } from '@g-dx/config';
import { bootstrapUser } from '@/modules/auth/application/bootstrap-user';

export default async function LocalLoginPage() {
    if (appConfig.app.env !== 'local') {
        redirect('/login');
    }

    try {
        await bootstrapUser({
            openId: 'ou_local_operator',
            name: 'Local Operator',
            email: 'local-operator@example.com',
        });
    } catch {
        redirect('/login?error=local_login_failed');
    }

    redirect('/dashboard/deals');
}

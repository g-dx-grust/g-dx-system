'use server';

import { redirect } from 'next/navigation';
import { bootstrapUser } from '@/modules/auth/application/bootstrap-user';
import {
    clearSession,
    getAuthenticatedAppSession,
    setActiveBusinessScopeCookie,
} from '@/shared/server/session';
import { isBusinessScopeType } from '@/shared/constants/business-scopes';

export async function bootstrapUserAction(profile: { openId: string; name: string; email: string }) {
    return bootstrapUser(profile);
}

export async function logoutAction() {
    await clearSession();
}

export async function updateActiveBusinessScopeAction(nextScope: string) {
    if (!isBusinessScopeType(nextScope)) {
        throw new Error('Invalid business scope');
    }

    const session = await getAuthenticatedAppSession();
    if (!session) {
        redirect('/login');
    }

    if (!session.businessMemberships.some((membership) => membership.code === nextScope)) {
        throw new Error('Forbidden business scope');
    }

    await setActiveBusinessScopeCookie(nextScope);
}

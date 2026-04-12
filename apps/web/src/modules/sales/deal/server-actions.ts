'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { createDeal } from '@/modules/sales/deal/application/create-deal';
import { updateDeal } from '@/modules/sales/deal/application/update-deal';
import { changeDealStage } from '@/modules/sales/deal/application/change-deal-stage';
import { createDealActivity } from '@/modules/sales/deal/application/create-deal-activity';
import { deleteDeal } from '@/modules/sales/deal/application/delete-deal';
import { saveLarkSettings } from '@/modules/sales/deal/application/save-lark-settings';
import { getDashboardScopeTag } from '@/modules/sales/deal/infrastructure/dashboard-cache';
import { getDashboardSummaryCacheKey } from '@/modules/sales/deal/application/get-dashboard-summary';
import { getPersonalDashboardDataCacheKey } from '@/modules/sales/deal/application/get-personal-dashboard-data';
import { getPersonalActionListCacheKey } from '@/modules/sales/deal/application/get-personal-action-list';
import { getDashboardAlertsCacheKey } from '@/modules/sales/deal/application/get-dashboard-alerts';
import { getTeamKpiTargetSummaryCacheKey } from '@/modules/sales/deal/application/get-team-kpi-target-summary';
import { getMonthlyActivityStatsCacheKey } from '@/modules/sales/deal/application/get-monthly-activity-stats';
import { getRollingKpiCacheKey } from '@/modules/sales/deal/application/get-rolling-kpi';
import { redisDelete } from '@/shared/server/redis-cache';
import { getTokyoTodayStr } from '@/shared/server/date-jst';
import { getDealNextActionSnapshot } from '@/modules/sales/deal/infrastructure/deal-repository';
import { linkDealToAlliance } from '@/modules/sales/alliance/application/link-deal';
import { isAppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import type {
    BusinessScopeType,
    DealActivityType,
    DealStageKey,
    MeetingTargetType,
    NegotiationOutcome,
    VisitCategory,
} from '@g-dx/contracts';

function readString(formData: FormData, key: string): string | undefined {
    const value = formData.get(key);
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

function revalidateDashboardPaths(scope?: BusinessScopeType, userId?: string) {
    revalidatePath('/dashboard/deals');
    revalidatePath('/dashboard/activity');
    revalidatePath('/dashboard/personal');
    if (!scope) return;

    revalidateTag(getDashboardScopeTag(scope));

    // Purge all Redis dashboard caches for this scope.
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const today = getTokyoTodayStr();

    const keysToDelete: string[] = [
        getDashboardSummaryCacheKey(scope),
        getRollingKpiCacheKey(scope),
        getTeamKpiTargetSummaryCacheKey(scope, currentMonth),
        getMonthlyActivityStatsCacheKey(scope, now.getFullYear(), now.getMonth() + 1),
        // Team-level alerts (admin/manager view)
        getDashboardAlertsCacheKey(scope, null),
    ];

    if (userId) {
        keysToDelete.push(
            getPersonalDashboardDataCacheKey(scope, userId, currentMonth),
            getPersonalActionListCacheKey(scope, userId, today),
            getDashboardAlertsCacheKey(scope, userId),
        );
    }

    void redisDelete(...keysToDelete);
}

export async function createDealAction(formData: FormData) {
    const name = readString(formData, 'name');
    const companyId = readString(formData, 'companyId');
    const stage = readString(formData, 'stage') as DealStageKey | undefined;

    if (!name || !companyId || !stage) {
        redirect('/sales/deals/new?error=validation');
    }

    const session = await getAuthenticatedAppSession();
    if (!session) redirect('/login');

    const amountRaw = readString(formData, 'amount');
    const amount = amountRaw ? Number(amountRaw) : undefined;

    const allianceId = readString(formData, 'allianceId');

    try {
        const result = await createDeal({
            businessScope: session.activeBusinessScope,
            companyId,
            name,
            stage,
            amount: amount !== undefined && !isNaN(amount) ? amount : undefined,
            expectedCloseDate: readString(formData, 'expectedCloseDate'),
            nextActionDate: readString(formData, 'nextActionDate') ?? null,
            nextActionContent: readString(formData, 'nextActionContent') ?? null,
            ownerUserId: session.user.id,
            source: readString(formData, 'source'),
            memo: readString(formData, 'memo'),
        });

        if (allianceId) {
            await linkDealToAlliance({ allianceId, dealId: result.id, referralType: 'INTRODUCER' }).catch(() => {});
        }

        revalidatePath('/sales/deals');
        revalidateDashboardPaths(session.activeBusinessScope, session.user.id);
        revalidatePath(`/customers/companies/${companyId}`);
        redirect(`/sales/deals/${result.id}?created=1`);
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        if (isAppError(error, 'VALIDATION_ERROR')) redirect('/sales/deals/new?error=pipeline');
        throw error;
    }
}

export async function updateDealAction(formData: FormData) {
    const dealId = readString(formData, 'dealId');
    if (!dealId) redirect('/sales/deals');
    const session = await getAuthenticatedAppSession();
    if (!session) redirect('/login');

    const amountRaw = readString(formData, 'amount');
    const amount = amountRaw !== undefined ? (amountRaw === '' ? null : Number(amountRaw)) : undefined;

    try {
        await updateDeal(dealId, {
            name: readString(formData, 'name'),
            amount: amount !== undefined && (amount === null || !isNaN(amount)) ? amount : undefined,
            expectedCloseDate: readString(formData, 'expectedCloseDate') ?? null,
            ownerUserId: readString(formData, 'ownerUserId'),
            source: readString(formData, 'source') ?? null,
            memo: readString(formData, 'memo') ?? null,
            acquisitionMethod: readString(formData, 'acquisitionMethod') ?? null,
            nextActionDate: readString(formData, 'nextActionDate') ?? null,
            nextActionContent: readString(formData, 'nextActionContent') ?? null,
        });
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        if (isAppError(error, 'NOT_FOUND')) redirect('/sales/deals');
        throw error;
    }

    revalidatePath('/sales/deals');
    revalidatePath(`/sales/deals/${dealId}`);
    revalidateDashboardPaths(session.activeBusinessScope, session.user.id);
    redirect(`/sales/deals/${dealId}?updated=1`);
}

export async function changeDealStageAction(formData: FormData) {
    const dealId = readString(formData, 'dealId');
    const toStage = readString(formData, 'toStage') as DealStageKey | undefined;
    if (!dealId || !toStage) redirect('/sales/deals');
    const session = await getAuthenticatedAppSession();
    if (!session) redirect('/login');

    let result;
    try {
        result = await changeDealStage(dealId, { toStage });
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        if (isAppError(error, 'NOT_FOUND')) redirect('/sales/deals');
        throw error;
    }

    revalidatePath('/sales/deals');
    revalidatePath(`/sales/deals/${dealId}`);
    revalidateDashboardPaths(session.activeBusinessScope, session.user.id);

    if (result.currentStage === 'CONTRACTED') {
        const { getDealForContractRedirect } = await import('@/modules/sales/deal/application/get-deal-for-contract-redirect');
        const dealInfo = await getDealForContractRedirect(dealId);
        if (dealInfo) {
            const params = new URLSearchParams();
            params.set('dealId', dealId);
            params.set('companyId', dealInfo.companyId);
            if (dealInfo.title) params.set('title', dealInfo.title);
            if (dealInfo.amount !== null) params.set('amount', String(dealInfo.amount));
            redirect(`/sales/contracts/new?${params.toString()}`);
        }
    }

    redirect(`/sales/deals/${dealId}?staged=1`);
}

export async function createDealActivityAction(formData: FormData) {
    const dealId = readString(formData, 'dealId');
    const activityType = readString(formData, 'activityType') as DealActivityType | undefined;
    const activityDate = readString(formData, 'activityDate');
    if (!dealId || !activityType || !activityDate) redirect(`/sales/deals/${dealId ?? ''}`);
    const session = await getAuthenticatedAppSession();
    if (!session) redirect('/login');

    const meetingCountRaw = readString(formData, 'meetingCount');
    const meetingCount = meetingCountRaw ? Math.max(1, parseInt(meetingCountRaw, 10)) : 1;
    const visitCategoryRaw = readString(formData, 'visitCategory');
    const targetTypeRaw = readString(formData, 'targetType');
    const visitCategory =
        visitCategoryRaw === 'NEW' || visitCategoryRaw === 'REPEAT'
            ? (visitCategoryRaw as VisitCategory)
            : undefined;
    const targetType =
        targetTypeRaw === 'INDIVIDUAL' || targetTypeRaw === 'CORPORATE'
            ? (targetTypeRaw as MeetingTargetType)
            : undefined;
    const isNegotiation = formData.get('isNegotiation') === 'on';
    const negotiationOutcomeRaw = readString(formData, 'negotiationOutcome');
    const negotiationOutcome =
        negotiationOutcomeRaw === 'POSITIVE' ||
        negotiationOutcomeRaw === 'NEUTRAL' ||
        negotiationOutcomeRaw === 'NEGATIVE' ||
        negotiationOutcomeRaw === 'PENDING'
            ? (negotiationOutcomeRaw as NegotiationOutcome)
            : undefined;

    const nextActionDate = readString(formData, 'nextActionDate') ?? null;
    const nextActionContent = readString(formData, 'nextActionContent') ?? null;

    try {
        await createDealActivity({
            dealId,
            activityType,
            activityDate,
            summary: readString(formData, 'summary'),
            meetingCount,
            visitCategory,
            targetType,
            isNegotiation,
            negotiationOutcome,
            competitorInfo: readString(formData, 'competitorInfo'),
        });
        if (nextActionDate !== null || nextActionContent !== null) {
            await updateDeal(dealId, { nextActionDate, nextActionContent });
        }
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        throw error;
    }

    const nextAction = await getDealNextActionSnapshot(dealId);
    revalidatePath(`/sales/deals/${dealId}`);
    revalidateDashboardPaths(session.activeBusinessScope, session.user.id);
    const params = new URLSearchParams();
    params.set('activityAdded', '1');
    if (!nextAction.nextActionDate) {
        params.set('noNextAction', '1');
    }
    redirect(`/sales/deals/${dealId}?${params.toString()}`);
}

export async function saveLarkSettingsAction(formData: FormData) {
    const dealId = readString(formData, 'dealId');
    if (!dealId) redirect('/sales/deals');

    const larkChatId = readString(formData, 'larkChatId') ?? null;
    const larkCalendarId = readString(formData, 'larkCalendarId') ?? null;

    try {
        await saveLarkSettings({ dealId, larkChatId, larkCalendarId });
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        throw error;
    }

    revalidatePath(`/sales/deals/${dealId}`);
    redirect(`/sales/deals/${dealId}?larkSaved=1`);
}

export async function deleteDealAction(formData: FormData) {
    const dealId = readString(formData, 'dealId');
    if (!dealId) redirect('/sales/deals');
    const session = await getAuthenticatedAppSession();
    if (!session) redirect('/login');

    try {
        await deleteDeal(dealId);
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        throw error;
    }

    revalidatePath('/sales/deals');
    revalidateDashboardPaths(session.activeBusinessScope, session.user.id);
    redirect('/sales/deals?deleted=1');
}

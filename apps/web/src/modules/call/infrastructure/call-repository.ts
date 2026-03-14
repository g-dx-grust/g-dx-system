import { db } from '@g-dx/database';
import { callCampaigns, callLogs, callTargets, companies, contacts, users } from '@g-dx/database/schema';
import { and, desc, eq, ilike, or } from 'drizzle-orm';
import type { BusinessScopeType, CallListItem, CallQueueItem, CallQueueTargetStatus, CallResult } from '@g-dx/contracts';
import { AppError } from '@/shared/server/errors';
import { findBusinessUnitByScope } from '@/modules/sales/shared/infrastructure/sales-shared';

async function getOrCreateManualCampaign(businessUnitId: string, actorUserId: string): Promise<string> {
    const existing = await db
        .select({ id: callCampaigns.id })
        .from(callCampaigns)
        .where(and(eq(callCampaigns.businessUnitId, businessUnitId), eq(callCampaigns.targetSourceType, 'manual')))
        .limit(1);
    if (existing.length > 0) return existing[0].id;
    const id = crypto.randomUUID();
    await db.insert(callCampaigns).values({
        id, businessUnitId, name: '手動コールキュー', status: 'active',
        targetSourceType: 'manual', ownerUserId: actorUserId,
        createdByUserId: actorUserId, updatedByUserId: actorUserId,
    });
    return id;
}

// ─── Queue (callTargets) ──────────────────────────────────────────────────────

export async function listCallQueue(businessScope: BusinessScopeType): Promise<CallQueueItem[]> {
    const businessUnit = await findBusinessUnitByScope(businessScope);
    if (!businessUnit) throw new AppError('BUSINESS_SCOPE_FORBIDDEN');

    const rows = await db
        .select({
            id: callTargets.id,
            companyId: companies.id,
            companyName: companies.displayName,
            contactId: contacts.id,
            contactName: contacts.fullName,
            phoneNumber: callTargets.phoneNumber,
            priority: callTargets.priority,
            targetStatus: callTargets.targetStatus,
            scheduledAt: callTargets.scheduledAt,
            targetAttributes: callTargets.targetAttributes,
            assignedUserName: users.displayName,
            createdAt: callTargets.createdAt,
        })
        .from(callTargets)
        .innerJoin(callCampaigns, eq(callTargets.campaignId, callCampaigns.id))
        .innerJoin(companies, eq(callTargets.companyId, companies.id))
        .leftJoin(contacts, eq(callTargets.contactId, contacts.id))
        .leftJoin(users, eq(callTargets.assignedUserId, users.id))
        .where(and(
            eq(callCampaigns.businessUnitId, businessUnit.id),
            eq(callTargets.targetStatus, 'pending'),
        ))
        .orderBy(callTargets.priority, desc(callTargets.createdAt));

    return rows.map((row) => ({
        id: row.id,
        companyId: row.companyId,
        companyName: row.companyName,
        contactId: row.contactId ?? null,
        contactName: row.contactName ?? null,
        phoneNumber: row.phoneNumber,
        priority: row.priority,
        targetStatus: row.targetStatus as CallQueueTargetStatus,
        scheduledAt: row.scheduledAt?.toISOString() ?? null,
        notes: (row.targetAttributes as { notes?: string } | null)?.notes ?? null,
        assignedUserName: row.assignedUserName ?? 'Unknown',
        createdAt: row.createdAt.toISOString(),
    }));
}

export async function addToCallQueue(
    businessScope: BusinessScopeType,
    input: { companyId: string; contactId?: string; phoneNumber: string; scheduledAt?: string; notes?: string; assignedUserId: string; actorUserId: string }
): Promise<{ id: string }> {
    const businessUnit = await findBusinessUnitByScope(businessScope);
    if (!businessUnit) throw new AppError('BUSINESS_SCOPE_FORBIDDEN');
    const campaignId = await getOrCreateManualCampaign(businessUnit.id, input.actorUserId);
    const id = crypto.randomUUID();
    await db.insert(callTargets).values({
        id, campaignId, businessUnitId: businessUnit.id,
        companyId: input.companyId, contactId: input.contactId ?? null,
        assignedUserId: input.assignedUserId, phoneNumber: input.phoneNumber,
        priority: 0, targetStatus: 'pending',
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
        targetAttributes: input.notes ? { notes: input.notes } : null,
    });
    return { id };
}

export async function completeCallTarget(targetId: string): Promise<void> {
    await db.update(callTargets).set({ targetStatus: 'completed', updatedAt: new Date() }).where(eq(callTargets.id, targetId));
}

export async function cancelCallTarget(targetId: string): Promise<void> {
    await db.update(callTargets).set({ targetStatus: 'cancelled', updatedAt: new Date() }).where(eq(callTargets.id, targetId));
}

// ─── History (callLogs) ───────────────────────────────────────────────────────

export interface CallHistoryFilters { keyword?: string; result?: CallResult; }

export async function listCallHistory(businessScope: BusinessScopeType, filters: CallHistoryFilters = {}): Promise<{ data: CallListItem[]; total: number }> {
    const businessUnit = await findBusinessUnitByScope(businessScope);
    if (!businessUnit) throw new AppError('BUSINESS_SCOPE_FORBIDDEN');

    const rows = await db
        .select({
            id: callLogs.id, calledAt: callLogs.startedAt, durationSec: callLogs.durationSec,
            resultCode: callLogs.resultCode, summary: callLogs.summary,
            companyId: companies.id, companyName: companies.displayName,
            contactId: contacts.id, contactName: contacts.fullName, userId: users.id, userName: users.displayName,
        })
        .from(callLogs)
        .innerJoin(companies, eq(callLogs.companyId, companies.id))
        .leftJoin(contacts, eq(callLogs.contactId, contacts.id))
        .innerJoin(users, eq(callLogs.userId, users.id))
        .where(and(
            eq(callLogs.businessUnitId, businessUnit.id),
            filters.result ? eq(callLogs.resultCode, filters.result) : undefined,
            filters.keyword ? or(ilike(companies.displayName, `%${filters.keyword}%`)) : undefined,
        ))
        .orderBy(desc(callLogs.startedAt));

    return {
        data: rows.map((row) => ({
            id: row.id, businessScope: businessScope as BusinessScopeType,
            calledAt: row.calledAt.toISOString(),
            company: { id: row.companyId, name: row.companyName },
            contact: row.contactId ? { id: row.contactId, name: row.contactName ?? '' } : null,
            assignedUser: { id: row.userId, name: row.userName ?? 'Unknown' },
            result: row.resultCode as CallResult, durationSec: row.durationSec,
            summary: row.summary ?? null,
        })),
        total: rows.length,
    };
}

export async function recordCall(businessScope: BusinessScopeType, input: {
    callTargetId?: string; companyId: string; contactId?: string; dealId?: string;
    result: CallResult; notes?: string; nextCallDatetime?: string; actorUserId: string;
}): Promise<{ id: string }> {
    const businessUnit = await findBusinessUnitByScope(businessScope);
    if (!businessUnit) throw new AppError('BUSINESS_SCOPE_FORBIDDEN');
    const id = crypto.randomUUID();
    const targetId = input.callTargetId || null;
    const contactId = input.contactId || null;
    const dealId = input.dealId || null;
    const summary = input.notes || null;
    const nextCallDt = input.nextCallDatetime ? new Date(input.nextCallDatetime) : null;
    await db.insert(callLogs).values({
        id, businessUnitId: businessUnit.id, callTargetId: targetId,
        companyId: input.companyId, contactId, dealId,
        userId: input.actorUserId, direction: 'outbound',
        resultCode: input.result, summary,
        nextCallDatetime: nextCallDt,
    });
    if (targetId) {
        await completeCallTarget(targetId);
        if (nextCallDt) {
            await db.update(callTargets)
                .set({ nextCallbackAt: nextCallDt, updatedAt: new Date() })
                .where(eq(callTargets.id, targetId));
        }
    }
    return { id };
}

export async function listCallHistoryByCompany(businessScope: BusinessScopeType, companyId: string): Promise<CallListItem[]> {
    const businessUnit = await findBusinessUnitByScope(businessScope);
    if (!businessUnit) throw new AppError('BUSINESS_SCOPE_FORBIDDEN');

    const rows = await db
        .select({
            id: callLogs.id, calledAt: callLogs.startedAt, durationSec: callLogs.durationSec,
            resultCode: callLogs.resultCode, summary: callLogs.summary,
            companyId: companies.id, companyName: companies.displayName,
            contactId: contacts.id, contactName: contacts.fullName,
            userId: users.id, userName: users.displayName,
        })
        .from(callLogs)
        .innerJoin(companies, eq(callLogs.companyId, companies.id))
        .leftJoin(contacts, eq(callLogs.contactId, contacts.id))
        .innerJoin(users, eq(callLogs.userId, users.id))
        .where(and(
            eq(callLogs.businessUnitId, businessUnit.id),
            eq(callLogs.companyId, companyId),
        ))
        .orderBy(desc(callLogs.startedAt))
        .limit(20);

    return rows.map((row) => ({
        id: row.id, businessScope: businessScope as BusinessScopeType,
        calledAt: row.calledAt.toISOString(),
        company: { id: row.companyId, name: row.companyName },
        contact: row.contactId ? { id: row.contactId, name: row.contactName ?? '' } : null,
        assignedUser: { id: row.userId, name: row.userName ?? 'Unknown' },
        result: row.resultCode as CallResult, durationSec: row.durationSec,
        summary: row.summary ?? null,
    }));
}

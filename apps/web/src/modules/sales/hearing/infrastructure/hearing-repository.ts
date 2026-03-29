import { db } from '@g-dx/database';
import { hearingRecords, deals } from '@g-dx/database/schema';
import { and, eq } from 'drizzle-orm';
import type { BusinessScopeType, HearingRecord, HearingCompletionStatus, UpdateHearingRequest } from '@g-dx/contracts';
import { AppError } from '@/shared/server/errors';
import { findBusinessUnitByScope } from '@/modules/sales/shared/infrastructure/sales-shared';

function mapRow(row: typeof hearingRecords.$inferSelect): HearingRecord {
    return {
        id: row.id,
        dealId: row.dealId,
        gapCurrentSituation: row.gapCurrentSituation,
        gapIdealState: row.gapIdealState,
        gapEffectGoal: row.gapEffectGoal,
        gapAgreementMemo: row.gapAgreementMemo,
        gapCompleted: row.gapCompleted,
        targetUserSegments: row.targetUserSegments,
        targetIdEstimate: row.targetIdEstimate,
        targetPlanCandidate: row.targetPlanCandidate,
        targetCompleted: row.targetCompleted,
        scopeIsStandard: row.scopeIsStandard,
        scopeOptionRequirements: row.scopeOptionRequirements,
        scopeTechLiaisonFlag: row.scopeTechLiaisonFlag,
        scopeCompleted: row.scopeCompleted,
        subsidyInsuranceStatus: row.subsidyInsuranceStatus,
        subsidyCompanyCategory: row.subsidyCompanyCategory,
        subsidyApplicableProgram: row.subsidyApplicableProgram,
        subsidyLaborConsultantOk: row.subsidyLaborConsultantOk,
        subsidyCompleted: row.subsidyCompleted,
        decisionApproverInfo: row.decisionApproverInfo,
        decisionTimeline: row.decisionTimeline,
        decisionNextMeetingAttendee: row.decisionNextMeetingAttendee,
        decisionCriteria: row.decisionCriteria,
        decisionNextPlan: row.decisionNextPlan,
        decisionCompleted: row.decisionCompleted,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
    };
}

async function verifyDealScope(dealId: string, businessUnitId: string): Promise<void> {
    const [deal] = await db
        .select({ id: deals.id })
        .from(deals)
        .where(and(eq(deals.id, dealId), eq(deals.businessUnitId, businessUnitId)))
        .limit(1);
    if (!deal) throw new AppError('NOT_FOUND', 'Deal was not found in the active business scope.');
}

export async function getHearingRecord(
    dealId: string,
    businessScope: BusinessScopeType,
): Promise<HearingRecord | null> {
    const businessUnit = await findBusinessUnitByScope(businessScope);
    if (!businessUnit) throw new AppError('BUSINESS_SCOPE_FORBIDDEN');

    await verifyDealScope(dealId, businessUnit.id);

    const [row] = await db
        .select()
        .from(hearingRecords)
        .where(eq(hearingRecords.dealId, dealId))
        .limit(1);

    return row ? mapRow(row) : null;
}

export async function upsertHearingRecord(
    dealId: string,
    businessScope: BusinessScopeType,
    input: UpdateHearingRequest,
    actorUserId: string,
): Promise<HearingRecord> {
    const businessUnit = await findBusinessUnitByScope(businessScope);
    if (!businessUnit) throw new AppError('BUSINESS_SCOPE_FORBIDDEN');

    await verifyDealScope(dealId, businessUnit.id);

    const [existing] = await db
        .select({ id: hearingRecords.id })
        .from(hearingRecords)
        .where(eq(hearingRecords.dealId, dealId))
        .limit(1);

    if (existing) {
        const [updated] = await db
            .update(hearingRecords)
            .set({
                ...input,
                updatedAt: new Date(),
                updatedByUserId: actorUserId,
            })
            .where(eq(hearingRecords.id, existing.id))
            .returning();
        return mapRow(updated);
    }

    const [created] = await db
        .insert(hearingRecords)
        .values({
            dealId,
            businessUnitId: businessUnit.id,
            ...input,
            createdByUserId: actorUserId,
            updatedByUserId: actorUserId,
        })
        .returning();
    return mapRow(created);
}

export function computeHearingCompletion(record: HearingRecord): HearingCompletionStatus {
    const flags = [
        record.gapCompleted,
        record.targetCompleted,
        record.scopeCompleted,
        record.subsidyCompleted,
        record.decisionCompleted,
    ];
    const completedCount = flags.filter(Boolean).length;
    return {
        gapCompleted: record.gapCompleted,
        targetCompleted: record.targetCompleted,
        scopeCompleted: record.scopeCompleted,
        subsidyCompleted: record.subsidyCompleted,
        decisionCompleted: record.decisionCompleted,
        allCompleted: completedCount === 5,
        completedCount,
        totalCount: 5,
    };
}

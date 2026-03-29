import { db } from '@g-dx/database';
import {
    auditLogs,
    businessUnits,
    companies,
    contacts,
    dealActivities,
    dealStageHistory,
    deals,
    pipelineStages,
    pipelines,
    userBusinessMemberships,
    users,
} from '@g-dx/database/schema';
import { and, count, desc, eq, gte, inArray, isNotNull, isNull, lte, sql, sum } from 'drizzle-orm';
import type { BusinessScopeType, DealCompanyStat, DealDashboardSummary, DealDetail, DealListItem, DealNextActionItem, DealOwnerStat, DealStageSummary, DealStageKey, DealStatus } from '@g-dx/contracts';
import { sendGroupMessage, buildStageChangeMessage } from '@/lib/lark/larkMessaging';
import { createCalendarEvent, buildNextActionCalendarParams } from '@/lib/lark/larkCalendar';
import type {
    ChangeDealStageInput,
    ChangedDealStage,
    CreateDealInput,
    CreatedDeal,
    DealListFilters,
    DealListResult,
    PipelineBoardColumn,
    PipelineDefinition,
    UpdateDealInput,
    UpdatedDeal,
} from '../domain/deal';
import { findBusinessUnitByScope, nextAuditId } from '../../shared/infrastructure/sales-shared';
import { AppError } from '@/shared/server/errors';

type DealAttributes = { memo?: string };

// ─── List ─────────────────────────────────────────────────────────────────────

export async function listDeals(filters: DealListFilters): Promise<DealListResult> {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
    const offset = (page - 1) * pageSize;

    const businessUnit = await findBusinessUnitByScope(filters.businessScope);
    if (!businessUnit) throw new AppError('BUSINESS_SCOPE_FORBIDDEN');

    const whereClause = and(
        eq(deals.businessUnitId, businessUnit.id),
        isNull(deals.deletedAt),
        filters.keyword ? sql`${deals.title} ilike ${`%${filters.keyword}%`}` : undefined,
        filters.stage ? eq(pipelineStages.stageKey, filters.stage) : undefined,
        filters.ownerUserId ? eq(deals.ownerUserId, filters.ownerUserId) : undefined,
        filters.companyId ? eq(deals.companyId, filters.companyId) : undefined,
    );

    const [rows, [{ total }]] = await Promise.all([
        db
            .select({
                id: deals.id,
                name: deals.title,
                stageKey: pipelineStages.stageKey,
                amount: deals.amount,
                expectedCloseDate: deals.expectedCloseDate,
                companyId: companies.id,
                companyName: companies.displayName,
                ownerUserId: deals.ownerUserId,
                ownerUserName: users.displayName,
                businessScopeCode: businessUnits.code,
            })
            .from(deals)
            .innerJoin(businessUnits, eq(deals.businessUnitId, businessUnits.id))
            .innerJoin(companies, eq(deals.companyId, companies.id))
            .innerJoin(pipelineStages, eq(deals.currentStageId, pipelineStages.id))
            .leftJoin(users, eq(deals.ownerUserId, users.id))
            .where(whereClause)
            .orderBy(desc(deals.updatedAt))
            .limit(pageSize)
            .offset(offset),
        db
            .select({ total: count() })
            .from(deals)
            .innerJoin(pipelineStages, eq(deals.currentStageId, pipelineStages.id))
            .where(whereClause),
    ]);

    return {
        data: rows.map((row): DealListItem => ({
            id: row.id,
            businessScope: row.businessScopeCode as BusinessScopeType,
            name: row.name,
            company: { id: row.companyId, name: row.companyName },
            stage: row.stageKey as DealStageKey,
            amount: row.amount !== null ? Number(row.amount) : null,
            ownerUser: { id: row.ownerUserId, name: row.ownerUserName ?? 'Unknown User' },
            expectedCloseDate: row.expectedCloseDate,
        })),
        meta: { page, pageSize, total: Number(total) },
    };
}

// ─── Detail ───────────────────────────────────────────────────────────────────

export async function getDealDetail(dealId: string, businessScope: BusinessScopeType): Promise<DealDetail> {
    const businessUnit = await findBusinessUnitByScope(businessScope);
    if (!businessUnit) throw new AppError('BUSINESS_SCOPE_FORBIDDEN');

    const [row] = await db
        .select({
            id: deals.id,
            name: deals.title,
            stageKey: pipelineStages.stageKey,
            dealStatus: deals.dealStatus,
            amount: deals.amount,
            expectedCloseDate: deals.expectedCloseDate,
            sourceCode: deals.sourceCode,
            acquisitionMethod: deals.acquisitionMethod,
            nextActionDate: deals.nextActionDate,
            nextActionContent: deals.nextActionContent,
            larkChatId: deals.larkChatId,
            larkCalendarId: deals.larkCalendarId,
            dealAttributes: deals.dealAttributes,
            companyId: companies.id,
            companyName: companies.displayName,
            primaryContactId: contacts.id,
            primaryContactName: contacts.fullName,
            ownerUserId: deals.ownerUserId,
            ownerUserName: users.displayName,
            businessScopeCode: businessUnits.code,
            createdAt: deals.createdAt,
            updatedAt: deals.updatedAt,
        })
        .from(deals)
        .innerJoin(businessUnits, eq(deals.businessUnitId, businessUnits.id))
        .innerJoin(companies, eq(deals.companyId, companies.id))
        .innerJoin(pipelineStages, eq(deals.currentStageId, pipelineStages.id))
        .leftJoin(users, eq(deals.ownerUserId, users.id))
        .leftJoin(contacts, eq(deals.primaryContactId, contacts.id))
        .where(and(
            eq(deals.id, dealId),
            eq(deals.businessUnitId, businessUnit.id),
            isNull(deals.deletedAt),
        ))
        .limit(1);

    if (!row) throw new AppError('NOT_FOUND', 'Deal was not found in the active business scope.');

    const attributes = (row.dealAttributes ?? {}) as DealAttributes;

    return {
        id: row.id,
        businessScope: row.businessScopeCode as BusinessScopeType,
        company: { id: row.companyId, name: row.companyName },
        primaryContact: row.primaryContactId
            ? { id: row.primaryContactId, name: row.primaryContactName ?? 'Unknown' }
            : null,
        name: row.name,
        stage: row.stageKey as DealStageKey,
        status: row.dealStatus as DealStatus,
        amount: row.amount !== null ? Number(row.amount) : null,
        expectedCloseDate: row.expectedCloseDate,
        ownerUser: { id: row.ownerUserId, name: row.ownerUserName ?? 'Unknown User' },
        source: row.sourceCode ?? null,
        memo: attributes.memo ?? null,
        acquisitionMethod: row.acquisitionMethod ?? null,
        nextActionDate: row.nextActionDate ?? null,
        nextActionContent: row.nextActionContent ?? null,
        larkChatId: row.larkChatId ?? null,
        larkCalendarId: row.larkCalendarId ?? null,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
    };
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createDeal(input: CreateDealInput): Promise<CreatedDeal> {
    const businessUnit = await findBusinessUnitByScope(input.businessScope);
    if (!businessUnit) throw new AppError('BUSINESS_SCOPE_FORBIDDEN');

    const [stage] = await db
        .select({
            id: pipelineStages.id,
            stageKey: pipelineStages.stageKey,
            pipelineId: pipelineStages.pipelineId,
            isClosedWon: pipelineStages.isClosedWon,
            isClosedLost: pipelineStages.isClosedLost,
        })
        .from(pipelineStages)
        .innerJoin(pipelines, eq(pipelineStages.pipelineId, pipelines.id))
        .where(and(
            eq(pipelines.businessUnitId, businessUnit.id),
            eq(pipelines.isDefault, true),
            eq(pipelineStages.stageKey, input.stage),
        ))
        .limit(1);

    if (!stage) {
        throw new AppError('VALIDATION_ERROR', `Stage "${input.stage}" does not exist in the active pipeline.`);
    }

    const dealStatus = stage.isClosedWon ? 'won' : stage.isClosedLost ? 'lost' : 'open';
    const wonAt = stage.isClosedWon ? new Date() : null;
    const lostAt = stage.isClosedLost ? new Date() : null;

    const result = await db.transaction(async (tx) => {
        const [created] = await tx
            .insert(deals)
            .values({
                businessUnitId: businessUnit.id,
                companyId: input.companyId,
                primaryContactId: input.primaryContactId ?? null,
                ownerUserId: input.ownerUserId,
                pipelineId: stage.pipelineId,
                currentStageId: stage.id,
                title: input.name.trim(),
                dealStatus,
                amount: input.amount !== undefined ? String(input.amount) : null,
                currencyCode: 'JPY',
                expectedCloseDate: input.expectedCloseDate ?? null,
                wonAt,
                lostAt,
                sourceCode: input.source?.trim() || null,
                dealAttributes: input.memo ? { memo: input.memo } : null,
                createdByUserId: input.actorUserId,
                updatedByUserId: input.actorUserId,
            })
            .returning({ id: deals.id, title: deals.title, createdAt: deals.createdAt });

        await tx.insert(dealStageHistory).values({
            dealId: created.id,
            fromStageId: null,
            toStageId: stage.id,
            changedByUserId: input.actorUserId,
            snapshotAmount: input.amount !== undefined ? String(input.amount) : null,
        });

        await tx.insert(auditLogs).values({
            id: nextAuditId(),
            tableName: 'deals',
            recordPk: created.id,
            action: 'create',
            businessUnitId: businessUnit.id,
            actorUserId: input.actorUserId,
            sourceType: 'web',
            afterData: {
                title: created.title,
                stage: input.stage,
                companyId: input.companyId,
                businessScope: input.businessScope,
            },
        });

        return created;
    });

    return {
        id: result.id,
        businessScope: input.businessScope,
        name: result.title,
        stage: input.stage,
        createdAt: result.createdAt.toISOString(),
    };
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateDeal(input: UpdateDealInput): Promise<UpdatedDeal> {
    const businessUnit = await findBusinessUnitByScope(input.businessScope);
    if (!businessUnit) throw new AppError('BUSINESS_SCOPE_FORBIDDEN');

    const updatedAt = new Date();

    const result = await db.transaction(async (tx) => {
        const [existing] = await tx
            .select({
                id: deals.id,
                title: deals.title,
                amount: deals.amount,
                sourceCode: deals.sourceCode,
                ownerUserId: deals.ownerUserId,
                dealAttributes: deals.dealAttributes,
            })
            .from(deals)
            .where(and(
                eq(deals.id, input.dealId),
                eq(deals.businessUnitId, businessUnit.id),
                isNull(deals.deletedAt),
            ))
            .limit(1);

        if (!existing) throw new AppError('NOT_FOUND', 'Deal was not found in the active business scope.');

        const currentAttributes = (existing.dealAttributes ?? {}) as DealAttributes;
        const nextAttributes: DealAttributes = {
            ...currentAttributes,
            ...(input.memo !== undefined ? { memo: input.memo ?? undefined } : {}),
        };

        await tx
            .update(deals)
            .set({
                ...(input.name !== undefined && { title: input.name.trim() }),
                ...(input.amount !== undefined && { amount: input.amount !== null ? String(input.amount) : null }),
                ...(input.expectedCloseDate !== undefined && { expectedCloseDate: input.expectedCloseDate }),
                ...(input.ownerUserId !== undefined && { ownerUserId: input.ownerUserId }),
                ...(input.source !== undefined && { sourceCode: input.source }),
                ...(input.primaryContactId !== undefined && { primaryContactId: input.primaryContactId }),
                ...(input.memo !== undefined && { dealAttributes: nextAttributes }),
                ...(input.acquisitionMethod !== undefined && { acquisitionMethod: input.acquisitionMethod }),
                ...(input.nextActionDate !== undefined && { nextActionDate: input.nextActionDate }),
                ...(input.nextActionContent !== undefined && { nextActionContent: input.nextActionContent }),
                updatedAt,
                updatedByUserId: input.actorUserId,
            })
            .where(eq(deals.id, input.dealId));

        await tx.insert(auditLogs).values({
            id: nextAuditId(),
            tableName: 'deals',
            recordPk: input.dealId,
            action: 'update',
            businessUnitId: businessUnit.id,
            actorUserId: input.actorUserId,
            sourceType: 'web',
            beforeData: {
                title: existing.title,
                amount: existing.amount !== null ? Number(existing.amount) : null,
                sourceCode: existing.sourceCode ?? null,
                ownerUserId: existing.ownerUserId,
            },
            afterData: {
                title: input.name ?? existing.title,
                amount: input.amount !== undefined ? input.amount : (existing.amount !== null ? Number(existing.amount) : null),
                sourceCode: input.source !== undefined ? input.source : (existing.sourceCode ?? null),
                ownerUserId: input.ownerUserId ?? existing.ownerUserId,
            },
        });

        return { id: input.dealId, updatedAt };
    });

    // Larkカレンダー: 次回アクション日/内容が更新された場合にイベントを作成 (fire-and-forget)
    const nextActionUpdated = input.nextActionDate !== undefined || input.nextActionContent !== undefined;
    if (nextActionUpdated) {
        getDealLarkContext(result.id).then((dealCtx) => {
            if (!dealCtx?.nextActionDate || !dealCtx.nextActionContent) return;
            const calendarId = dealCtx.larkCalendarId ?? 'primary';
            const params = buildNextActionCalendarParams({
                calendarId,
                companyName: dealCtx.companyName,
                dealName: dealCtx.title,
                nextActionContent: dealCtx.nextActionContent,
                nextActionDate: dealCtx.nextActionDate,
                assigneeName: dealCtx.ownerName,
            });
            return createCalendarEvent(params);
        }).catch((err) => console.error('[Lark] calendar event (update deal) failed:', err));
    }

    return { id: result.id, updatedAt: result.updatedAt.toISOString() };
}

// ─── Stage transition ─────────────────────────────────────────────────────────

export async function changeDealStage(input: ChangeDealStageInput): Promise<ChangedDealStage> {
    const businessUnit = await findBusinessUnitByScope(input.businessScope);
    if (!businessUnit) throw new AppError('BUSINESS_SCOPE_FORBIDDEN');

    const updatedAt = new Date();

    const result = await db.transaction(async (tx) => {
        const [deal] = await tx
            .select({
                id: deals.id,
                dealStatus: deals.dealStatus,
                currentStageId: deals.currentStageId,
                pipelineId: deals.pipelineId,
                amount: deals.amount,
                currentStageKey: pipelineStages.stageKey,
            })
            .from(deals)
            .innerJoin(pipelineStages, eq(deals.currentStageId, pipelineStages.id))
            .where(and(
                eq(deals.id, input.dealId),
                eq(deals.businessUnitId, businessUnit.id),
                isNull(deals.deletedAt),
            ))
            .limit(1);

        if (!deal) throw new AppError('NOT_FOUND', 'Deal was not found in the active business scope.');

        if (deal.dealStatus !== 'open') {
            throw new AppError('INVALID_STAGE_TRANSITION', 'Cannot change stage of a closed deal.');
        }

        const [toStage] = await tx
            .select({
                id: pipelineStages.id,
                stageKey: pipelineStages.stageKey,
                isClosedWon: pipelineStages.isClosedWon,
                isClosedLost: pipelineStages.isClosedLost,
            })
            .from(pipelineStages)
            .where(and(
                eq(pipelineStages.pipelineId, deal.pipelineId),
                eq(pipelineStages.stageKey, input.toStage),
            ))
            .limit(1);

        if (!toStage) {
            throw new AppError('INVALID_STAGE_TRANSITION', `Stage "${input.toStage}" does not exist in this pipeline.`);
        }

        const newDealStatus = toStage.isClosedWon ? 'won' : toStage.isClosedLost ? 'lost' : 'open';

        await tx.update(deals).set({
            currentStageId: toStage.id,
            dealStatus: newDealStatus,
            updatedAt,
            updatedByUserId: input.actorUserId,
            ...(toStage.isClosedWon && { wonAt: updatedAt }),
            ...(toStage.isClosedLost && { lostAt: updatedAt }),
        }).where(eq(deals.id, input.dealId));

        await tx.insert(dealStageHistory).values({
            dealId: input.dealId,
            fromStageId: deal.currentStageId,
            toStageId: toStage.id,
            changedByUserId: input.actorUserId,
            changeNote: input.note ?? null,
            snapshotAmount: deal.amount,
        });

        await tx.insert(auditLogs).values({
            id: nextAuditId(),
            tableName: 'deals',
            recordPk: input.dealId,
            action: 'update',
            businessUnitId: businessUnit.id,
            actorUserId: input.actorUserId,
            sourceType: 'web',
            beforeData: { stage: deal.currentStageKey, status: deal.dealStatus },
            afterData: { stage: toStage.stageKey, status: newDealStatus },
        });

        return {
            id: deal.id,
            previousStage: deal.currentStageKey as DealStageKey,
            currentStage: toStage.stageKey as DealStageKey,
            updatedAt,
        };
    });

    // Lark通知: ステージ変更 (fire-and-forget)
    getDealLarkContext(input.dealId).then((dealCtx) => {
        if (!dealCtx?.larkChatId) return;
        const STAGE_LABELS: Record<string, string> = {
            APO_ACQUIRED: 'アポ獲得',
            NEGOTIATING: '商談中・見積提示',
            ALLIANCE: 'アライアンス',
            PENDING: 'ペンディング',
            APO_CANCELLED: 'アポキャン',
            LOST: '失注・不明',
            CONTRACTED: '契約済み',
        };
        const message = buildStageChangeMessage({
            dealName: dealCtx.title,
            oldStage: STAGE_LABELS[result.previousStage] ?? result.previousStage,
            newStage: STAGE_LABELS[result.currentStage] ?? result.currentStage,
            assigneeName: dealCtx.ownerName,
            updatedAt: result.updatedAt.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
        });
        return sendGroupMessage(dealCtx.larkChatId, message);
    }).catch((err) => console.error('[Lark] stage change notification failed:', err));

    return {
        id: result.id,
        previousStage: result.previousStage,
        currentStage: result.currentStage,
        updatedAt: result.updatedAt.toISOString(),
    };
}

// ─── Stage history ──────────────────────────────────────────────────────────

export interface DealStageHistoryItem {
    id: string;
    fromStageName: string | null;
    toStageName: string;
    changedByName: string | null;
    changedAt: string;
    changeNote: string | null;
    snapshotAmount: number | null;
}

export async function getDealStageHistory(
    dealId: string,
    businessScope: BusinessScopeType
): Promise<DealStageHistoryItem[]> {
    const businessUnit = await findBusinessUnitByScope(businessScope);
    if (!businessUnit) throw new AppError('BUSINESS_SCOPE_FORBIDDEN');

    // Verify the deal belongs to this business scope
    const [deal] = await db
        .select({ id: deals.id })
        .from(deals)
        .where(and(eq(deals.id, dealId), eq(deals.businessUnitId, businessUnit.id), isNull(deals.deletedAt)))
        .limit(1);
    if (!deal) throw new AppError('NOT_FOUND', 'Deal was not found in the active business scope.');

    const toStages = await db.select().from(pipelineStages);
    const toStageMap = new Map(toStages.map((s) => [s.id, s.name]));

    const rows = await db
        .select({
            id: dealStageHistory.id,
            fromStageId: dealStageHistory.fromStageId,
            toStageId: dealStageHistory.toStageId,
            changedByName: users.displayName,
            changedAt: dealStageHistory.changedAt,
            changeNote: dealStageHistory.changeNote,
            snapshotAmount: dealStageHistory.snapshotAmount,
        })
        .from(dealStageHistory)
        .leftJoin(users, eq(dealStageHistory.changedByUserId, users.id))
        .where(eq(dealStageHistory.dealId, dealId))
        .orderBy(desc(dealStageHistory.changedAt));

    return rows.map((row) => ({
        id: row.id,
        fromStageName: row.fromStageId ? (toStageMap.get(row.fromStageId) ?? null) : null,
        toStageName: toStageMap.get(row.toStageId) ?? row.toStageId,
        changedByName: row.changedByName ?? null,
        changedAt: row.changedAt.toISOString(),
        changeNote: row.changeNote ?? null,
        snapshotAmount: row.snapshotAmount !== null ? Number(row.snapshotAmount) : null,
    }));
}

// ─── Pipeline definition ──────────────────────────────────────────────────────

export async function getPipeline(businessScope: BusinessScopeType): Promise<PipelineDefinition> {
    const businessUnit = await findBusinessUnitByScope(businessScope);
    if (!businessUnit) throw new AppError('BUSINESS_SCOPE_FORBIDDEN');

    const stages = await db
        .select({
            stageKey: pipelineStages.stageKey,
            name: pipelineStages.name,
            stageOrder: pipelineStages.stageOrder,
        })
        .from(pipelineStages)
        .innerJoin(pipelines, eq(pipelineStages.pipelineId, pipelines.id))
        .where(and(
            eq(pipelines.businessUnitId, businessUnit.id),
            eq(pipelines.isDefault, true),
            eq(pipelines.isActive, true),
        ))
        .orderBy(pipelineStages.stageOrder);

    return {
        businessScope,
        stages: stages.map((s) => ({
            key: s.stageKey as DealStageKey,
            label: s.name,
            order: s.stageOrder,
        })),
    };
}

// ─── Pipeline board ───────────────────────────────────────────────────────────

export async function getPipelineBoard(
    businessScope: BusinessScopeType,
    ownerUserId?: string
): Promise<PipelineBoardColumn[]> {
    const businessUnit = await findBusinessUnitByScope(businessScope);
    if (!businessUnit) throw new AppError('BUSINESS_SCOPE_FORBIDDEN');

    const stageRows = await db
        .select({
            id: pipelineStages.id,
            stageKey: pipelineStages.stageKey,
            stageOrder: pipelineStages.stageOrder,
        })
        .from(pipelineStages)
        .innerJoin(pipelines, eq(pipelineStages.pipelineId, pipelines.id))
        .where(and(
            eq(pipelines.businessUnitId, businessUnit.id),
            eq(pipelines.isDefault, true),
            eq(pipelines.isActive, true),
        ))
        .orderBy(pipelineStages.stageOrder);

    if (stageRows.length === 0) return [];

    const dealRows = await db
        .select({
            id: deals.id,
            title: deals.title,
            amount: deals.amount,
            currentStageId: deals.currentStageId,
        })
        .from(deals)
        .where(and(
            eq(deals.businessUnitId, businessUnit.id),
            eq(deals.dealStatus, 'open'),
            isNull(deals.deletedAt),
            ownerUserId ? eq(deals.ownerUserId, ownerUserId) : undefined,
        ))
        .orderBy(desc(deals.updatedAt));

    const dealsByStage = new Map<string, Array<{ id: string; name: string; amount: number | null }>>();
    for (const stage of stageRows) {
        dealsByStage.set(stage.id, []);
    }
    for (const deal of dealRows) {
        dealsByStage.get(deal.currentStageId)?.push({
            id: deal.id,
            name: deal.title,
            amount: deal.amount !== null ? Number(deal.amount) : null,
        });
    }

    return stageRows.map((stage) => ({
        stage: stage.stageKey as DealStageKey,
        deals: dealsByStage.get(stage.id) ?? [],
    }));
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

const ACTIVE_STAGES = ['APO_ACQUIRED', 'NEGOTIATING', 'ALLIANCE'];
const STALLED_STAGES = ['PENDING', 'APO_CANCELLED', 'LOST'];
const CONTRACTED_STAGES = ['CONTRACTED'];

export async function getDashboardSummary(businessScope: BusinessScopeType): Promise<DealDashboardSummary> {
    const businessUnit = await findBusinessUnitByScope(businessScope);
    if (!businessUnit) throw new AppError('BUSINESS_SCOPE_FORBIDDEN');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    const [stageRows, allDeals, activeMembers, nextActionDeals] = await Promise.all([
        db
            .select({ id: pipelineStages.id, stageKey: pipelineStages.stageKey, name: pipelineStages.name, stageOrder: pipelineStages.stageOrder })
            .from(pipelineStages)
            .innerJoin(pipelines, eq(pipelineStages.pipelineId, pipelines.id))
            .where(and(eq(pipelines.businessUnitId, businessUnit.id), eq(pipelines.isDefault, true)))
            .orderBy(pipelineStages.stageOrder),
        db
            .select({
                id: deals.id,
                stageId: deals.currentStageId,
                amount: deals.amount,
                ownerUserId: deals.ownerUserId,
                ownerName: users.displayName,
                dealStatus: deals.dealStatus,
                companyId: deals.companyId,
                companyName: companies.displayName,
            })
            .from(deals)
            .leftJoin(users, eq(deals.ownerUserId, users.id))
            .leftJoin(companies, eq(deals.companyId, companies.id))
            .where(and(eq(deals.businessUnitId, businessUnit.id), isNull(deals.deletedAt))),
        db
            .select({ userId: userBusinessMemberships.userId, displayName: users.displayName })
            .from(userBusinessMemberships)
            .innerJoin(users, eq(userBusinessMemberships.userId, users.id))
            .where(and(
                eq(userBusinessMemberships.businessUnitId, businessUnit.id),
                eq(userBusinessMemberships.membershipStatus, 'active'),
            )),
        db
            .select({
                id: deals.id,
                title: deals.title,
                amount: deals.amount,
                nextActionDate: deals.nextActionDate,
                nextActionContent: deals.nextActionContent,
                acquisitionMethod: deals.acquisitionMethod,
                stageId: deals.currentStageId,
                ownerUserId: deals.ownerUserId,
                ownerName: users.displayName,
                companyName: companies.displayName,
            })
            .from(deals)
            .leftJoin(users, eq(deals.ownerUserId, users.id))
            .innerJoin(companies, eq(deals.companyId, companies.id))
            .where(and(
                eq(deals.businessUnitId, businessUnit.id),
                isNull(deals.deletedAt),
                isNotNull(deals.nextActionDate),
                lte(deals.nextActionDate, weekEndStr),
                gte(deals.nextActionDate, todayStr),
            )),
    ]);

    const stageMap = new Map(stageRows.map((s) => [s.id, s]));

    // Aggregate by stage
    const stageCounts = new Map<string, { count: number; totalAmount: number }>();
    let totalDeals = 0;
    let activeCount = 0; let activeAmount = 0;
    let stalledCount = 0; let stalledAmount = 0;
    let contractedCount = 0; let contractedAmount = 0;

    for (const deal of allDeals) {
        const stage = stageMap.get(deal.stageId);
        if (!stage) continue;
        totalDeals++;
        const amount = deal.amount !== null ? Number(deal.amount) : 0;
        const existing = stageCounts.get(stage.stageKey) ?? { count: 0, totalAmount: 0 };
        stageCounts.set(stage.stageKey, { count: existing.count + 1, totalAmount: existing.totalAmount + amount });
        if (ACTIVE_STAGES.includes(stage.stageKey)) { activeCount++; activeAmount += amount; }
        else if (CONTRACTED_STAGES.includes(stage.stageKey)) { contractedCount++; contractedAmount += amount; }
        else { stalledCount++; stalledAmount += amount; }
    }

    const byStage: DealStageSummary[] = stageRows.map((s) => ({
        stageKey: s.stageKey as DealStageKey,
        stageName: s.name,
        count: stageCounts.get(s.stageKey)?.count ?? 0,
        totalAmount: stageCounts.get(s.stageKey)?.totalAmount ?? 0,
    }));

    // Per-owner stats
    const ownerMap = new Map<string, { name: string; total: number; active: number; contracted: number; amount: number }>();
    for (const deal of allDeals) {
        const stage = stageMap.get(deal.stageId);
        if (!stage) continue;
        const entry = ownerMap.get(deal.ownerUserId) ?? { name: deal.ownerName ?? 'Unknown', total: 0, active: 0, contracted: 0, amount: 0 };
        entry.total++;
        const dealAmount = deal.amount !== null ? Number(deal.amount) : 0;
        if (ACTIVE_STAGES.includes(stage.stageKey)) entry.active++;
        if (CONTRACTED_STAGES.includes(stage.stageKey)) entry.contracted++;
        entry.amount += dealAmount;
        ownerMap.set(deal.ownerUserId, entry);
    }

    // §6: 案件を持たないアクティブメンバーも一覧に含める
    for (const member of activeMembers) {
        if (!ownerMap.has(member.userId)) {
            ownerMap.set(member.userId, { name: member.displayName ?? 'Unknown', total: 0, active: 0, contracted: 0, amount: 0 });
        }
    }

    const byOwner: DealOwnerStat[] = Array.from(ownerMap.entries()).map(([id, v]) => ({
        ownerUserId: id,
        ownerName: v.name,
        totalDeals: v.total,
        activeDeals: v.active,
        contractedDeals: v.contracted,
        totalAmount: v.amount,
    })).sort((a, b) => b.totalDeals - a.totalDeals);

    // Per-company stats
    const companyMap = new Map<string, { name: string; total: number; active: number; amount: number }>();
    for (const deal of allDeals) {
        const stage = stageMap.get(deal.stageId);
        if (!stage) continue;
        const entry = companyMap.get(deal.companyId) ?? { name: deal.companyName ?? 'Unknown', total: 0, active: 0, amount: 0 };
        entry.total++;
        if (ACTIVE_STAGES.includes(stage.stageKey)) { entry.active++; entry.amount += deal.amount !== null ? Number(deal.amount) : 0; }
        companyMap.set(deal.companyId, entry);
    }
    const byCompany: DealCompanyStat[] = Array.from(companyMap.entries()).map(([id, v]) => ({
        companyId: id,
        companyName: v.name,
        totalDeals: v.total,
        activeDeals: v.active,
        totalAmount: v.amount,
    })).sort((a, b) => b.totalAmount - a.totalAmount).slice(0, 10);

    // 前回アクション情報を各案件について取得
    const dealIds = nextActionDeals.map((d) => d.id);
    const nextActionDealIds = nextActionDeals.map((deal) => deal.id);
    const lastActivitiesMap = new Map<string, { summary: string | null; date: string | null }>();
    if (nextActionDealIds.length > 0) {
        const lastActivityRows = await db
            .select({
                dealId: dealActivities.dealId,
                summary: dealActivities.summary,
                activityDate: dealActivities.activityDate,
                createdAt: dealActivities.createdAt,
            })
            .from(dealActivities)
            .where(inArray(dealActivities.dealId, nextActionDealIds))
            .orderBy(desc(dealActivities.activityDate), desc(dealActivities.createdAt));

        for (const row of lastActivityRows) {
            if (!lastActivitiesMap.has(row.dealId)) {
                lastActivitiesMap.set(row.dealId, {
                    summary: row.summary,
                    date: row.activityDate,
                });
            }
        }
    }

    const toNextActionItem = (row: typeof nextActionDeals[0]): DealNextActionItem => {
        const stage = stageMap.get(row.stageId);
        const lastActivity = lastActivitiesMap.get(row.id);
        return {
            dealId: row.id,
            dealName: row.title,
            companyName: row.companyName,
            stageKey: (stage?.stageKey ?? 'LOST') as DealStageKey,
            stageName: stage?.name ?? '-',
            amount: row.amount !== null ? Number(row.amount) : null,
            ownerName: row.ownerName ?? '-',
            ownerUserId: row.ownerUserId ?? '',
            acquisitionMethod: row.acquisitionMethod ?? null,
            nextActionDate: row.nextActionDate ?? '',
            nextActionContent: row.nextActionContent ?? null,
            lastActivitySummary: lastActivity?.summary ?? null,
            lastActivityDate: lastActivity?.date ?? null,
        };
    };

    const nextActionsToday = nextActionDeals.filter((d) => d.nextActionDate === todayStr).map(toNextActionItem);
    const nextActionsTomorrow = nextActionDeals.filter((d) => d.nextActionDate === tomorrowStr).map(toNextActionItem);
    const nextActionsThisWeek = nextActionDeals.filter((d) => d.nextActionDate && d.nextActionDate > tomorrowStr).map(toNextActionItem);

    return {
        totalDeals,
        activeGroup: { count: activeCount, totalAmount: activeAmount },
        stalledGroup: { count: stalledCount, totalAmount: stalledAmount },
        contractedGroup: { count: contractedCount, totalAmount: contractedAmount },
        byStage,
        nextActionsToday,
        nextActionsTomorrow,
        nextActionsThisWeek,
        byOwner,
        byCompany,
    };
}

// ─── Lark 設定 ────────────────────────────────────────────────────────────────

export async function updateDealLarkSettings(input: {
    dealId: string;
    larkChatId: string | null;
    larkCalendarId: string | null;
    actorUserId: string;
}): Promise<void> {
    await db
        .update(deals)
        .set({
            larkChatId: input.larkChatId,
            larkCalendarId: input.larkCalendarId,
            updatedAt: new Date(),
            updatedByUserId: input.actorUserId,
        })
        .where(and(eq(deals.id, input.dealId), isNull(deals.deletedAt)));
}

// ─── Lark 通知用 コンテキスト取得 ─────────────────────────────────────────────

export interface DealLarkContext {
    id: string;
    title: string;
    larkChatId: string | null;
    larkCalendarId: string | null;
    nextActionDate: string | null;
    nextActionContent: string | null;
    companyName: string;
    ownerName: string;
    stageName: string;
}

export async function getDealLarkContext(dealId: string): Promise<DealLarkContext | null> {
    const [row] = await db
        .select({
            id: deals.id,
            title: deals.title,
            larkChatId: deals.larkChatId,
            larkCalendarId: deals.larkCalendarId,
            nextActionDate: deals.nextActionDate,
            nextActionContent: deals.nextActionContent,
            companyName: companies.displayName,
            ownerName: users.displayName,
            stageName: pipelineStages.name,
        })
        .from(deals)
        .innerJoin(companies, eq(deals.companyId, companies.id))
        .leftJoin(users, eq(deals.ownerUserId, users.id))
        .innerJoin(pipelineStages, eq(deals.currentStageId, pipelineStages.id))
        .where(and(eq(deals.id, dealId), isNull(deals.deletedAt)))
        .limit(1);

    if (!row) return null;
    return {
        id: row.id,
        title: row.title,
        larkChatId: row.larkChatId ?? null,
        larkCalendarId: row.larkCalendarId ?? null,
        nextActionDate: row.nextActionDate ?? null,
        nextActionContent: row.nextActionContent ?? null,
        companyName: row.companyName,
        ownerName: row.ownerName ?? 'Unknown',
        stageName: row.stageName,
    };
}

// ─── Cron: 本日の次回アクション案件一覧 ──────────────────────────────────────

export interface DealDailyAlert {
    id: string;
    title: string;
    larkChatId: string;
    nextActionContent: string | null;
    companyName: string;
    ownerName: string;
}

export async function getDealsWithTodayNextAction(todayStr: string): Promise<DealDailyAlert[]> {
    const rows = await db
        .select({
            id: deals.id,
            title: deals.title,
            larkChatId: deals.larkChatId,
            nextActionContent: deals.nextActionContent,
            companyName: companies.displayName,
            ownerName: users.displayName,
        })
        .from(deals)
        .innerJoin(companies, eq(deals.companyId, companies.id))
        .leftJoin(users, eq(deals.ownerUserId, users.id))
        .where(and(
            isNull(deals.deletedAt),
            eq(deals.nextActionDate, todayStr),
            isNotNull(deals.larkChatId),
        ));

    return rows
        .filter((r) => r.larkChatId !== null)
        .map((r) => ({
            id: r.id,
            title: r.title,
            larkChatId: r.larkChatId!,
            nextActionContent: r.nextActionContent ?? null,
            companyName: r.companyName,
            ownerName: r.ownerName ?? 'Unknown',
        }));
}

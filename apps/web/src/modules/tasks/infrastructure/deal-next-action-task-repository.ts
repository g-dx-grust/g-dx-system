import { db } from '@g-dx/database';
import { companies, deals, pipelineStages, tasks } from '@g-dx/database/schema';
import { and, desc, eq, isNotNull, isNull, lte, sql } from 'drizzle-orm';
import type { PersonalNextActionItem } from '@g-dx/contracts';

const DEAL_NEXT_ACTION_TASK_TYPE = 'DEAL_NEXT_ACTION';
const TASK_STATUS_OPEN = 'OPEN';
const TASK_STATUS_CANCELLED = 'CANCELLED';

function toJstStartOfDay(date: string): Date {
    return new Date(`${date}T00:00:00+09:00`);
}

function buildTaskTitle(companyName: string, dealName: string): string {
    return `${companyName} / ${dealName}`;
}

export async function syncDealNextActionTaskForDeal(
    dealId: string,
    actorUserId?: string,
): Promise<void> {
    const [deal] = await db
        .select({
            id: deals.id,
            businessUnitId: deals.businessUnitId,
            companyId: deals.companyId,
            ownerUserId: deals.ownerUserId,
            dealName: deals.title,
            companyName: companies.displayName,
            dueDate: deals.nextActionDate,
            description: deals.nextActionContent,
            dealStatus: deals.dealStatus,
            deletedAt: deals.deletedAt,
        })
        .from(deals)
        .innerJoin(companies, eq(deals.companyId, companies.id))
        .where(eq(deals.id, dealId))
        .limit(1);

    const existingTasks = await db
        .select({
            id: tasks.id,
        })
        .from(tasks)
        .where(
            and(
                eq(tasks.dealId, dealId),
                eq(tasks.taskType, DEAL_NEXT_ACTION_TASK_TYPE),
                isNull(tasks.deletedAt),
            ),
        )
        .orderBy(desc(tasks.updatedAt), desc(tasks.createdAt));

    const shouldHaveActiveTask =
        !!deal &&
        deal.deletedAt === null &&
        deal.dealStatus === 'open' &&
        !!deal.ownerUserId &&
        !!deal.dueDate &&
        !!deal.description;

    if (!shouldHaveActiveTask) {
        if (existingTasks.length === 0) return;

        await db
            .update(tasks)
            .set({
                status: TASK_STATUS_CANCELLED,
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(tasks.dealId, dealId),
                    eq(tasks.taskType, DEAL_NEXT_ACTION_TASK_TYPE),
                    isNull(tasks.deletedAt),
                ),
            );
        return;
    }

    const dueAt = toJstStartOfDay(deal.dueDate!);
    const title = buildTaskTitle(deal.companyName, deal.dealName);
    const primaryTask = existingTasks[0];

    if (!primaryTask) {
        await db.insert(tasks).values({
            businessUnitId: deal.businessUnitId,
            companyId: deal.companyId,
            contactId: null,
            dealId: deal.id,
            callTargetId: null,
            assignedUserId: deal.ownerUserId!,
            createdByUserId: actorUserId ?? deal.ownerUserId!,
            taskType: DEAL_NEXT_ACTION_TASK_TYPE,
            status: TASK_STATUS_OPEN,
            title,
            description: deal.description,
            dueAt,
        });
        return;
    }

    await db
        .update(tasks)
        .set({
            companyId: deal.companyId,
            assignedUserId: deal.ownerUserId!,
            status: TASK_STATUS_OPEN,
            title,
            description: deal.description,
            dueAt,
            completedAt: null,
            updatedAt: new Date(),
        })
        .where(eq(tasks.id, primaryTask.id));

    if (existingTasks.length > 1) {
        const duplicateIds = existingTasks.slice(1).map((task) => task.id);
        for (const duplicateId of duplicateIds) {
            await db
                .update(tasks)
                .set({
                    status: TASK_STATUS_CANCELLED,
                    updatedAt: new Date(),
                })
                .where(eq(tasks.id, duplicateId));
        }
    }
}

export async function listPersonalDealNextActionTasks(
    userId: string,
    businessUnitId: string,
    today: string,
    endOfWindow: string,
): Promise<PersonalNextActionItem[]> {
    const rows = await db
        .select({
            dealId: deals.id,
            dealName: deals.title,
            companyName: companies.displayName,
            stageKey: pipelineStages.stageKey,
            stageName: pipelineStages.name,
            amount: deals.amount,
            nextActionDate: sql<string>`to_char(${tasks.dueAt} AT TIME ZONE 'Asia/Tokyo', 'YYYY-MM-DD')`,
            nextActionContent: tasks.description,
        })
        .from(tasks)
        .innerJoin(deals, eq(tasks.dealId, deals.id))
        .innerJoin(companies, eq(deals.companyId, companies.id))
        .innerJoin(pipelineStages, eq(deals.currentStageId, pipelineStages.id))
        .where(
            and(
                eq(tasks.assignedUserId, userId),
                eq(tasks.businessUnitId, businessUnitId),
                eq(tasks.taskType, DEAL_NEXT_ACTION_TASK_TYPE),
                eq(tasks.status, TASK_STATUS_OPEN),
                isNull(tasks.deletedAt),
                isNull(deals.deletedAt),
                eq(deals.dealStatus, 'open'),
                isNotNull(tasks.dueAt),
                lte(sql`date(${tasks.dueAt} AT TIME ZONE 'Asia/Tokyo')`, endOfWindow),
            ),
        )
        .orderBy(tasks.dueAt);

    return rows.map((row) => {
        let urgency: PersonalNextActionItem['urgency'];
        if (row.nextActionDate < today) urgency = 'OVERDUE';
        else if (row.nextActionDate === today) urgency = 'TODAY';
        else urgency = 'THIS_WEEK';

        return {
            dealId: row.dealId,
            dealName: row.dealName,
            companyName: row.companyName,
            stageKey: row.stageKey,
            stageName: row.stageName,
            amount: row.amount !== null ? parseFloat(row.amount) : null,
            nextActionDate: row.nextActionDate,
            nextActionContent: row.nextActionContent,
            urgency,
        };
    });
}

export async function syncAllDealNextActionTasks(actorUserId?: string): Promise<number> {
    const dealRows = await db
        .select({ id: deals.id })
        .from(deals)
        .orderBy(deals.createdAt);

    for (const deal of dealRows) {
        await syncDealNextActionTaskForDeal(deal.id, actorUserId);
    }

    return dealRows.length;
}

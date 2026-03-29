import { db } from '@g-dx/database';
import {
    approvalRequests,
    approvalCheckItems,
    approvalRoutes,
    deals,
    companies,
    users,
} from '@g-dx/database/schema';
import { and, count, desc, eq, inArray } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import type {
    ApprovalRequestDetail,
    ApprovalRequestListItem,
    ApprovalCheckItem,
    ApprovalRouteItem,
    CreateApprovalRequest,
    DecideApprovalRequest,
    ApprovalStatusValue,
    ApprovalTypeValue,
    PaginationMeta,
} from '@g-dx/contracts';
import { AppError } from '@/shared/server/errors';
import { findBusinessUnitByScope } from '@/modules/sales/shared/infrastructure/sales-shared';
import { createNotification } from '@/modules/notifications/infrastructure/notification-repository';
import type { BusinessScopeType } from '@g-dx/contracts';

// ─── Mappers ────────────────────────────────────────────────────────────────

function mapCheckItem(row: typeof approvalCheckItems.$inferSelect): ApprovalCheckItem {
    return {
        id: row.id,
        itemCode: row.itemCode,
        inputValue: row.inputValue,
        checkResult: row.checkResult,
        comment: row.comment,
        evidenceFileUrl: row.evidenceFileUrl,
        customerReaction: row.customerReaction,
    };
}

const DECISION_NOTIFICATION_TYPES = {
    APPROVED: 'APPROVAL_APPROVED',
    REJECTED: 'APPROVAL_REJECTED',
    RETURNED: 'APPROVAL_RETURNED',
} as const;

const DECISION_STATUS_TEXT: Record<string, string> = {
    APPROVED: '承認済み',
    REJECTED: '却下',
    RETURNED: '差し戻し',
};

const APPROVAL_TYPE_TEXT: Record<string, string> = {
    PRE_MEETING: '事前準備承認',
    ESTIMATE_PRESENTATION: '見積提示承認',
    TECH_REVIEW: '技術確認',
};

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function listApprovalRequests(
    businessScope: BusinessScopeType,
    filters: {
        page?: number;
        pageSize?: number;
        approvalType?: string;
        approvalStatus?: string;
        dealId?: string;
        applicantUserId?: string;
        approverUserId?: string;
    },
): Promise<{ data: ApprovalRequestListItem[]; meta: PaginationMeta }> {
    const businessUnit = await findBusinessUnitByScope(businessScope);
    if (!businessUnit) throw new AppError('BUSINESS_SCOPE_FORBIDDEN');

    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
    const offset = (page - 1) * pageSize;

    const conditions = [eq(approvalRequests.businessUnitId, businessUnit.id)];
    if (filters.approvalType) conditions.push(eq(approvalRequests.approvalType, filters.approvalType));
    if (filters.approvalStatus) conditions.push(eq(approvalRequests.approvalStatus, filters.approvalStatus));
    if (filters.dealId) conditions.push(eq(approvalRequests.dealId, filters.dealId));
    if (filters.applicantUserId) conditions.push(eq(approvalRequests.applicantUserId, filters.applicantUserId));
    if (filters.approverUserId) conditions.push(eq(approvalRequests.approverUserId, filters.approverUserId));
    const applicantUser = alias(users, 'approval_applicant_user');
    const approverUser = alias(users, 'approval_approver_user');

    const rows = await db
        .select({
            id: approvalRequests.id,
            dealId: approvalRequests.dealId,
            dealTitle: deals.title,
            companyName: companies.displayName,
            approvalType: approvalRequests.approvalType,
            approvalStatus: approvalRequests.approvalStatus,
            applicantUserId: approvalRequests.applicantUserId,
            applicantName: applicantUser.displayName,
            approverUserId: approvalRequests.approverUserId,
            approverName: approverUser.displayName,
            appliedAt: approvalRequests.appliedAt,
            decidedAt: approvalRequests.decidedAt,
            deadlineAt: approvalRequests.deadlineAt,
            meetingDate: approvalRequests.meetingDate,
        })
        .from(approvalRequests)
        .innerJoin(deals, eq(approvalRequests.dealId, deals.id))
        .innerJoin(companies, eq(deals.companyId, companies.id))
        .innerJoin(applicantUser, eq(approvalRequests.applicantUserId, applicantUser.id))
        .leftJoin(approverUser, eq(approvalRequests.approverUserId, approverUser.id))
        .where(and(...conditions))
        .orderBy(desc(approvalRequests.appliedAt))
        .limit(pageSize)
        .offset(offset);

    const [{ total }] = await db
        .select({ total: count() })
        .from(approvalRequests)
        .where(and(...conditions));

    return {
        data: rows.map((row) => ({
            id: row.id,
            dealId: row.dealId,
            dealTitle: row.dealTitle,
            companyName: row.companyName,
            approvalType: row.approvalType as ApprovalTypeValue,
            approvalStatus: row.approvalStatus as ApprovalStatusValue,
            applicantUserId: row.applicantUserId,
            applicantName: row.applicantName ?? 'Unknown',
            approverUserId: row.approverUserId ?? null,
            approverName: row.approverName ?? null,
            appliedAt: row.appliedAt.toISOString(),
            decidedAt: row.decidedAt?.toISOString() ?? null,
            deadlineAt: row.deadlineAt?.toISOString() ?? null,
            meetingDate: row.meetingDate ?? null,
        })),
        meta: { page, pageSize, total: Number(total) },
    };
}

export async function getApprovalRequestDetail(
    approvalId: string,
    businessScope: BusinessScopeType,
): Promise<ApprovalRequestDetail> {
    const businessUnit = await findBusinessUnitByScope(businessScope);
    if (!businessUnit) throw new AppError('BUSINESS_SCOPE_FORBIDDEN');

    const [row] = await db
        .select({
            id: approvalRequests.id,
            dealId: approvalRequests.dealId,
            dealTitle: deals.title,
            companyName: companies.displayName,
            approvalType: approvalRequests.approvalType,
            approvalStatus: approvalRequests.approvalStatus,
            applicantUserId: approvalRequests.applicantUserId,
            applicantName: users.displayName,
            approverUserId: approvalRequests.approverUserId,
            appliedAt: approvalRequests.appliedAt,
            decidedAt: approvalRequests.decidedAt,
            deadlineAt: approvalRequests.deadlineAt,
            meetingDate: approvalRequests.meetingDate,
            decisionComment: approvalRequests.decisionComment,
            expiryReason: approvalRequests.expiryReason,
            snapshotData: approvalRequests.snapshotData,
            createdAt: approvalRequests.createdAt,
            updatedAt: approvalRequests.updatedAt,
        })
        .from(approvalRequests)
        .innerJoin(deals, eq(approvalRequests.dealId, deals.id))
        .innerJoin(companies, eq(deals.companyId, companies.id))
        .innerJoin(users, eq(approvalRequests.applicantUserId, users.id))
        .where(
            and(
                eq(approvalRequests.id, approvalId),
                eq(approvalRequests.businessUnitId, businessUnit.id),
            )
        )
        .limit(1);

    if (!row) throw new AppError('NOT_FOUND', 'Approval request was not found.');

    const checkItemRows = await db
        .select()
        .from(approvalCheckItems)
        .where(eq(approvalCheckItems.approvalRequestId, approvalId));

    // Fetch approver name separately if exists
    let approverName: string | null = null;
    if (row.approverUserId) {
        const [approver] = await db
            .select({ name: users.displayName })
            .from(users)
            .where(eq(users.id, row.approverUserId))
            .limit(1);
        approverName = approver?.name ?? null;
    }

    return {
        id: row.id,
        dealId: row.dealId,
        dealTitle: row.dealTitle,
        companyName: row.companyName,
        approvalType: row.approvalType as ApprovalTypeValue,
        approvalStatus: row.approvalStatus as ApprovalStatusValue,
        applicantUserId: row.applicantUserId,
        applicantName: row.applicantName ?? 'Unknown',
        approverUserId: row.approverUserId ?? null,
        approverName,
        appliedAt: row.appliedAt.toISOString(),
        decidedAt: row.decidedAt?.toISOString() ?? null,
        deadlineAt: row.deadlineAt?.toISOString() ?? null,
        meetingDate: row.meetingDate ?? null,
        decisionComment: row.decisionComment,
        expiryReason: row.expiryReason,
        snapshotData: row.snapshotData as Record<string, unknown> | null,
        checkItems: checkItemRows.map(mapCheckItem),
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
    };
}

export async function createApprovalRequest(
    businessScope: BusinessScopeType,
    applicantUserId: string,
    input: CreateApprovalRequest,
): Promise<{ id: string }> {
    const businessUnit = await findBusinessUnitByScope(businessScope);
    if (!businessUnit) throw new AppError('BUSINESS_SCOPE_FORBIDDEN');

    // Verify deal belongs to business unit
    const [deal] = await db
        .select({
            id: deals.id,
            title: deals.title,
        })
        .from(deals)
        .where(and(eq(deals.id, input.dealId), eq(deals.businessUnitId, businessUnit.id)))
        .limit(1);
    if (!deal) throw new AppError('NOT_FOUND', 'Deal was not found in the active business scope.');

    // Look up approver from routes
    const [route] = await db
        .select({ approverUserId: approvalRoutes.approverUserId })
        .from(approvalRoutes)
        .where(
            and(
                eq(approvalRoutes.businessUnitId, businessUnit.id),
                eq(approvalRoutes.approvalType, input.approvalType),
                eq(approvalRoutes.isActive, true),
            )
        )
        .orderBy(approvalRoutes.routeOrder)
        .limit(1);

    const [created] = await db
        .insert(approvalRequests)
        .values({
            businessUnitId: businessUnit.id,
            dealId: input.dealId,
            approvalType: input.approvalType,
            applicantUserId,
            approverUserId: route?.approverUserId ?? null,
            meetingDate: input.meetingDate ?? null,
            snapshotData: input.snapshotData ?? null,
        })
        .returning({ id: approvalRequests.id });

    if (input.checkItems && input.checkItems.length > 0) {
        await db.insert(approvalCheckItems).values(
            input.checkItems.map((item) => ({
                approvalRequestId: created.id,
                itemCode: item.itemCode,
                inputValue: item.inputValue ?? null,
                checkResult: item.checkResult ?? null,
                comment: item.comment ?? null,
                evidenceFileUrl: item.evidenceFileUrl ?? null,
                customerReaction: item.customerReaction ?? null,
            }))
        );
    }

    if (route?.approverUserId) {
        await createNotification({
            businessUnitId: businessUnit.id,
            recipientUserId: route.approverUserId,
            notificationType: 'APPROVAL_REQUESTED',
            title: `承認依頼: ${deal.title}`,
            body: `${APPROVAL_TYPE_TEXT[input.approvalType] ?? input.approvalType} の承認依頼が届いています。`,
            relatedEntityType: 'approval_request',
            relatedEntityId: created.id,
            linkUrl: `/sales/approvals/${created.id}`,
        });
    }

    return { id: created.id };
}

export async function decideApprovalRequest(
    approvalId: string,
    businessScope: BusinessScopeType,
    approverUserId: string,
    input: DecideApprovalRequest,
): Promise<void> {
    const businessUnit = await findBusinessUnitByScope(businessScope);
    if (!businessUnit) throw new AppError('BUSINESS_SCOPE_FORBIDDEN');

    const [existing] = await db
        .select({
            id: approvalRequests.id,
            approvalType: approvalRequests.approvalType,
            approvalStatus: approvalRequests.approvalStatus,
            applicantUserId: approvalRequests.applicantUserId,
            approverUserId: approvalRequests.approverUserId,
            dealTitle: deals.title,
        })
        .from(approvalRequests)
        .innerJoin(deals, eq(approvalRequests.dealId, deals.id))
        .where(
            and(
                eq(approvalRequests.id, approvalId),
                eq(approvalRequests.businessUnitId, businessUnit.id),
            )
        )
        .limit(1);

    if (!existing) throw new AppError('NOT_FOUND', 'Approval request was not found.');
    if (existing.approvalStatus !== 'PENDING') {
        throw new AppError('VALIDATION_ERROR', 'Only pending approval requests can be decided.');
    }

    // Self-approval check: denied by default unless route allows it
    if (existing.applicantUserId === approverUserId) {
        const [route] = await db
            .select({ allowSelfApproval: approvalRoutes.allowSelfApproval })
            .from(approvalRequests)
            .innerJoin(
                approvalRoutes,
                and(
                    eq(approvalRoutes.businessUnitId, businessUnit.id),
                    eq(approvalRoutes.approvalType, approvalRequests.approvalType),
                    eq(approvalRoutes.approverUserId, approverUserId),
                )
            )
            .where(eq(approvalRequests.id, approvalId))
            .limit(1);

        if (!route?.allowSelfApproval) {
            throw new AppError('SELF_APPROVAL_DENIED', 'Self-approval is not permitted for this approval type.');
        }
    }

    const statusMap: Record<string, string> = {
        APPROVED: 'APPROVED',
        REJECTED: 'REJECTED',
        RETURNED: 'RETURNED',
    };

    await db
        .update(approvalRequests)
        .set({
            approvalStatus: statusMap[input.decision],
            approverUserId,
            decidedAt: new Date(),
            decisionComment: input.comment ?? null,
            updatedAt: new Date(),
        })
        .where(eq(approvalRequests.id, approvalId));

    await createNotification({
        businessUnitId: businessUnit.id,
        recipientUserId: existing.applicantUserId,
        notificationType: DECISION_NOTIFICATION_TYPES[input.decision],
        title: `承認結果: ${existing.dealTitle}`,
        body: `${APPROVAL_TYPE_TEXT[existing.approvalType] ?? existing.approvalType} が ${DECISION_STATUS_TEXT[input.decision]} になりました。`,
        relatedEntityType: 'approval_request',
        relatedEntityId: approvalId,
        linkUrl: `/sales/approvals/${approvalId}`,
    });
}

export async function expireApprovalRequests(
    dealId: string,
    approvalType: string,
    reason: string,
): Promise<void> {
    await db
        .update(approvalRequests)
        .set({
            approvalStatus: 'EXPIRED',
            expiryReason: reason,
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(approvalRequests.dealId, dealId),
                eq(approvalRequests.approvalType, approvalType),
                inArray(approvalRequests.approvalStatus, ['PENDING', 'APPROVED']),
            )
        );
}

export async function listApprovalRoutes(
    businessScope: BusinessScopeType,
): Promise<ApprovalRouteItem[]> {
    const businessUnit = await findBusinessUnitByScope(businessScope);
    if (!businessUnit) throw new AppError('BUSINESS_SCOPE_FORBIDDEN');

    const rows = await db
        .select({
            id: approvalRoutes.id,
            approvalType: approvalRoutes.approvalType,
            routeName: approvalRoutes.routeName,
            approverUserId: approvalRoutes.approverUserId,
            approverName: users.displayName,
            routeOrder: approvalRoutes.routeOrder,
            allowSelfApproval: approvalRoutes.allowSelfApproval,
            isActive: approvalRoutes.isActive,
        })
        .from(approvalRoutes)
        .innerJoin(users, eq(approvalRoutes.approverUserId, users.id))
        .where(eq(approvalRoutes.businessUnitId, businessUnit.id))
        .orderBy(approvalRoutes.approvalType, approvalRoutes.routeOrder);

    return rows.map((row) => ({
        id: row.id,
        approvalType: row.approvalType as ApprovalRouteItem['approvalType'],
        routeName: row.routeName,
        approverUserId: row.approverUserId,
        approverName: row.approverName ?? 'Unknown',
        routeOrder: row.routeOrder,
        allowSelfApproval: row.allowSelfApproval,
        isActive: row.isActive,
    }));
}

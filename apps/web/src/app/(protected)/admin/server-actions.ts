'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '@g-dx/database';
import { users, roles, userRoleAssignments, userBusinessMemberships } from '@g-dx/database/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import {
    saveDashboardAlertLarkChatId,
    saveDashboardSectionsConfig,
    DEFAULT_DASHBOARD_SECTIONS,
    type DashboardSectionKey,
} from '@/modules/admin/infrastructure/app-settings-repository';
import { syncAllDealNextActionTasks } from '@/modules/tasks/infrastructure/deal-next-action-task-repository';

export async function assignRoleAction(formData: FormData) {
    const session = await getAuthenticatedAppSession();
    if (!session) redirect('/login');
    const isAdmin = session.user.roles.some((r) => r === 'SUPER_ADMIN' || r === 'ADMIN');
    if (!isAdmin) redirect('/unauthorized');

    const targetUserId = formData.get('userId') as string;
    const roleId = formData.get('roleId') as string;
    if (!targetUserId || !roleId) return;

    await db.insert(userRoleAssignments).values({
        userId: targetUserId,
        roleId,
        grantedByUserId: session.user.id,
    }).onConflictDoNothing();

    revalidatePath('/admin');
}

export async function createUserAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
    const session = await getAuthenticatedAppSession();
    if (!session) return { success: false, error: '認証エラー' };
    const isAdmin = session.user.roles.some((r) => r === 'SUPER_ADMIN' || r === 'ADMIN');
    if (!isAdmin) return { success: false, error: '権限がありません' };

    const name = (formData.get('name') as string)?.trim();
    const email = (formData.get('email') as string)?.trim();
    const larkOpenId = (formData.get('larkOpenId') as string)?.trim() || null;
    const roleIds = formData.getAll('roleId') as string[];
    const businessUnitIds = formData.getAll('businessUnitId') as string[];

    if (!name || !email) return { success: false, error: '名前とメールアドレスは必須です' };

    try {
        // 同一 email のユーザーが既存かチェック（重複作成防止）
        const [existingByEmail] = await db
            .select({ id: users.id, larkOpenId: users.larkOpenId })
            .from(users)
            .where(and(eq(users.email, email), isNull(users.deletedAt)))
            .limit(1);

        if (existingByEmail) {
            // larkOpenId あり → Lark ログイン済みユーザーと重複
            // larkOpenId なし → 管理画面で既に作成済み
            const hint = existingByEmail.larkOpenId
                ? '（Lark ログイン済みユーザーと重複）'
                : '（管理画面で既に作成済み）';
            return { success: false, error: `同じメールアドレスのユーザーが既に存在します${hint}` };
        }

        // larkOpenId が指定された場合は重複チェック
        if (larkOpenId) {
            const [existingByLarkId] = await db
                .select({ id: users.id })
                .from(users)
                .where(and(eq(users.larkOpenId, larkOpenId), isNull(users.deletedAt)))
                .limit(1);
            if (existingByLarkId) {
                return { success: false, error: '指定した Lark Open ID は既に別ユーザーに紐付いています' };
            }
        }

        const [newUser] = await db.insert(users).values({
            larkOpenId,
            displayName: name,
            email,
            status: 'active',
        }).returning({ id: users.id });

        for (const roleId of roleIds) {
            await db.insert(userRoleAssignments).values({
                userId: newUser.id,
                roleId,
                grantedByUserId: session.user.id,
            }).onConflictDoNothing();
        }

        for (let i = 0; i < businessUnitIds.length; i++) {
            await db.insert(userBusinessMemberships).values({
                userId: newUser.id,
                businessUnitId: businessUnitIds[i],
                membershipStatus: 'active',
                isDefault: i === 0,
            });
        }

        revalidatePath('/admin');
        return { success: true };
    } catch (e) {
        console.error('[Admin] Create user error:', e);
        return { success: false, error: 'ユーザーの作成に失敗しました。Lark Open ID が重複している可能性があります。' };
    }
}

export async function removeRoleAction(formData: FormData) {
    const session = await getAuthenticatedAppSession();
    if (!session) redirect('/login');
    const isAdmin = session.user.roles.some((r) => r === 'SUPER_ADMIN' || r === 'ADMIN');
    if (!isAdmin) redirect('/unauthorized');

    const targetUserId = formData.get('userId') as string;
    const roleId = formData.get('roleId') as string;
    if (!targetUserId || !roleId) return;

    await db.delete(userRoleAssignments).where(
        and(
            eq(userRoleAssignments.userId, targetUserId),
            eq(userRoleAssignments.roleId, roleId),
        )
    );

    revalidatePath('/admin');
}

export async function saveDashboardAlertChatSettingsAction(formData: FormData) {
    const session = await getAuthenticatedAppSession();
    if (!session) redirect('/login');
    const isAdmin = session.user.roles.some((r) => r === 'SUPER_ADMIN' || r === 'ADMIN');
    if (!isAdmin) redirect('/unauthorized');

    const chatIdRaw = formData.get('dashboardAlertLarkChatId');
    const chatId = typeof chatIdRaw === 'string' ? chatIdRaw.trim() : '';

    await saveDashboardAlertLarkChatId(chatId || null, session.user.id);

    revalidatePath('/admin');
    redirect('/admin?settingsSaved=1');
}

export async function deleteUserAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
    const session = await getAuthenticatedAppSession();
    if (!session) return { success: false, error: '認証エラー' };
    const isAdmin = session.user.roles.some((r) => r === 'SUPER_ADMIN' || r === 'ADMIN');
    if (!isAdmin) return { success: false, error: '権限がありません' };

    const targetUserId = (formData.get('userId') as string)?.trim();
    if (!targetUserId) return { success: false, error: 'ユーザーIDが不正です' };
    if (targetUserId === session.user.id) return { success: false, error: '自分自身は削除できません' };

    try {
        await db
            .update(users)
            .set({ deletedAt: new Date() })
            .where(and(eq(users.id, targetUserId), isNull(users.deletedAt)));

        revalidatePath('/admin');
        return { success: true };
    } catch (e) {
        console.error('[Admin] Delete user error:', e);
        return { success: false, error: 'ユーザーの削除に失敗しました' };
    }
}

export async function toggleAiSummaryAction(formData: FormData) {
    const session = await getAuthenticatedAppSession();
    if (!session) redirect('/login');
    const isAdmin = session.user.roles.some((r) => r === 'SUPER_ADMIN' || r === 'ADMIN');
    if (!isAdmin) redirect('/unauthorized');

    const targetUserId = formData.get('userId') as string;
    const businessUnitId = formData.get('businessUnitId') as string;
    const newValue = formData.get('receiveAiSummary') === 'true';
    if (!targetUserId || !businessUnitId) return;

    await db
        .update(userBusinessMemberships)
        .set({ receiveAiSummary: newValue })
        .where(
            and(
                eq(userBusinessMemberships.userId, targetUserId),
                eq(userBusinessMemberships.businessUnitId, businessUnitId),
            ),
        );

    revalidatePath('/admin');
}

export async function saveDashboardSectionsAction(formData: FormData) {
    const session = await getAuthenticatedAppSession();
    if (!session) redirect('/login');
    const isSuperAdmin = session.user.roles.some((r) => r === 'SUPER_ADMIN');
    if (!isSuperAdmin) redirect('/unauthorized');

    const sectionKeys = Object.keys(DEFAULT_DASHBOARD_SECTIONS) as DashboardSectionKey[];
    const config = Object.fromEntries(
        sectionKeys.map((key) => [key, formData.get(`section_${key}`) === 'on']),
    ) as Record<DashboardSectionKey, boolean>;

    await saveDashboardSectionsConfig(config, session.user.id);

    revalidatePath('/dashboard/deals');
    revalidatePath('/admin');
    redirect('/admin?sectionsSaved=1');
}

export async function resyncDealNextActionTasksAction() {
    const session = await getAuthenticatedAppSession();
    if (!session) redirect('/login');
    const isAdmin = session.user.roles.some((r) => r === 'SUPER_ADMIN' || r === 'ADMIN');
    if (!isAdmin) redirect('/unauthorized');

    const syncedCount = await syncAllDealNextActionTasks(session.user.id);

    revalidatePath('/admin');
    revalidatePath('/dashboard/deals');
    revalidatePath('/dashboard/personal');
    revalidatePath('/sales/deals');
    redirect(`/admin?tasksResynced=${syncedCount}`);
}

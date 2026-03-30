'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '@g-dx/database';
import { users, roles, userRoleAssignments, userBusinessMemberships } from '@g-dx/database/schema';
import { eq, and, isNull, isNotNull } from 'drizzle-orm';
import { getAuthenticatedAppSession } from '@/shared/server/session';

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
            isNull(userRoleAssignments.businessUnitId),
            isNull(userRoleAssignments.expiresAt),
        )
    );

    revalidatePath('/admin');
}

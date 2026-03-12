import { redirect } from 'next/navigation';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { db } from '@g-dx/database';
import { users, roles, userRoleAssignments, userBusinessMemberships, businessUnits } from '@g-dx/database/schema';
import { eq, isNull } from 'drizzle-orm';
import { AdminUserTable } from './admin-user-table';

export default async function AdminPage() {
    const session = await getAuthenticatedAppSession();
    if (!session) redirect('/login');

    const isAdmin = session.user.roles.some((r) => r === 'SUPER_ADMIN' || r === 'ADMIN');
    if (!isAdmin) redirect('/unauthorized');

    const [allUsers, allRoles, allRoleAssignments, allMemberships, allBusinessUnits] = await Promise.all([
        db.select({ id: users.id, name: users.displayName, email: users.email, status: users.status, lastLoginAt: users.lastLoginAt }).from(users).where(isNull(users.deletedAt)),
        db.select({ id: roles.id, code: roles.code, name: roles.name }).from(roles).orderBy(roles.sortOrder),
        db.select({ userId: userRoleAssignments.userId, roleId: userRoleAssignments.roleId, businessUnitId: userRoleAssignments.businessUnitId }).from(userRoleAssignments).where(isNull(userRoleAssignments.expiresAt)),
        db.select({ userId: userBusinessMemberships.userId, businessUnitId: userBusinessMemberships.businessUnitId, isDefault: userBusinessMemberships.isDefault }).from(userBusinessMemberships).where(eq(userBusinessMemberships.membershipStatus, 'active')),
        db.select({ id: businessUnits.id, code: businessUnits.code, name: businessUnits.name }).from(businessUnits).where(eq(businessUnits.isActive, true)),
    ]);

    const userList = allUsers.map((u) => {
        const roleIds = allRoleAssignments.filter((a) => a.userId === u.id).map((a) => a.roleId);
        const userRoles = allRoles.filter((r) => roleIds.includes(r.id));
        const membershipUnitIds = allMemberships.filter((m) => m.userId === u.id).map((m) => m.businessUnitId);
        const userBusinesses = allBusinessUnits.filter((b) => membershipUnitIds.includes(b.id));
        return {
            id: u.id,
            name: u.name ?? '（名前なし）',
            email: u.email ?? '',
            status: u.status ?? 'inactive',
            lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
            roles: userRoles.map((r) => ({ id: r.id, code: r.code, name: r.name })),
            businesses: userBusinesses.map((b) => ({ id: b.id, code: b.code, name: b.name })),
        };
    });

    const roleOptions = allRoles.map((r) => ({ id: r.id, code: r.code, name: r.name }));

    const businessUnitOptions = allBusinessUnits.map((b) => ({ id: b.id, code: b.code, name: b.name }));

    return <AdminUserTable users={userList} roleOptions={roleOptions} businessUnits={businessUnitOptions} currentUserId={session.user.id} />;
}

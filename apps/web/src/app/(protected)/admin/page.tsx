import { redirect } from 'next/navigation';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { db } from '@g-dx/database';
import { users, roles, userRoleAssignments, userBusinessMemberships, businessUnits } from '@g-dx/database/schema';
import { eq, isNull } from 'drizzle-orm';
import { AdminUserTable } from './admin-user-table';
import { AdminSystemSettings } from './admin-system-settings';
import {
    getDashboardAlertLarkChatId,
    getDashboardSectionsConfig,
} from '@/modules/admin/infrastructure/app-settings-repository';

interface AdminPageProps {
    searchParams?: {
        settingsSaved?: string;
        sectionsSaved?: string;
        tasksResynced?: string;
    };
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
    const session = await getAuthenticatedAppSession();
    if (!session) redirect('/login');

    const isAdmin = session.user.roles.some((r) => r === 'SUPER_ADMIN' || r === 'ADMIN');
    if (!isAdmin) redirect('/unauthorized');

    const isSuperAdmin = session.user.roles.some((r) => r === 'SUPER_ADMIN');

    const [allUsers, allRoles, allRoleAssignments, allMemberships, allBusinessUnits, dashboardAlertLarkChatId, dashboardSections] = await Promise.all([
        db.select({ id: users.id, name: users.displayName, email: users.email, status: users.status, lastLoginAt: users.lastLoginAt }).from(users).where(isNull(users.deletedAt)),
        db.select({ id: roles.id, code: roles.code, name: roles.name }).from(roles).orderBy(roles.sortOrder),
        db.select({ userId: userRoleAssignments.userId, roleId: userRoleAssignments.roleId, businessUnitId: userRoleAssignments.businessUnitId }).from(userRoleAssignments).where(isNull(userRoleAssignments.expiresAt)),
        db.select({ userId: userBusinessMemberships.userId, businessUnitId: userBusinessMemberships.businessUnitId, isDefault: userBusinessMemberships.isDefault, receiveAiSummary: userBusinessMemberships.receiveAiSummary }).from(userBusinessMemberships).where(eq(userBusinessMemberships.membershipStatus, 'active')),
        db.select({ id: businessUnits.id, code: businessUnits.code, name: businessUnits.name }).from(businessUnits).where(eq(businessUnits.isActive, true)),
        getDashboardAlertLarkChatId(),
        isSuperAdmin ? getDashboardSectionsConfig() : Promise.resolve(undefined),
    ]);

    const userList = allUsers.map((u) => {
        const roleIds = allRoleAssignments.filter((a) => a.userId === u.id).map((a) => a.roleId);
        const userRoles = allRoles.filter((r) => roleIds.includes(r.id));
        const userMemberships = allMemberships.filter((m) => m.userId === u.id);
        const userBusinesses = userMemberships.map((m) => {
            const bu = allBusinessUnits.find((b) => b.id === m.businessUnitId);
            if (!bu) return null;
            return { id: bu.id, code: bu.code, name: bu.name, receiveAiSummary: m.receiveAiSummary };
        }).filter((b): b is NonNullable<typeof b> => b !== null);
        return {
            id: u.id,
            name: u.name ?? '（名前なし）',
            email: u.email ?? '',
            status: u.status ?? 'inactive',
            lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
            roles: userRoles.map((r) => ({ id: r.id, code: r.code, name: r.name })),
            businesses: userBusinesses,
        };
    });

    const roleOptions = allRoles.map((r) => ({ id: r.id, code: r.code, name: r.name }));

    const businessUnitOptions = allBusinessUnits.map((b) => ({ id: b.id, code: b.code, name: b.name }));

    const tasksResyncedParam = searchParams?.tasksResynced;
    const tasksResyncedCount =
        tasksResyncedParam && !Number.isNaN(Number.parseInt(tasksResyncedParam, 10))
            ? Number.parseInt(tasksResyncedParam, 10)
            : null;

    return (
        <div className="space-y-6">
            <AdminSystemSettings
                dashboardAlertLarkChatId={dashboardAlertLarkChatId}
                settingsSaved={searchParams?.settingsSaved === '1'}
                sectionsSaved={searchParams?.sectionsSaved === '1'}
                tasksResyncedCount={tasksResyncedCount}
                isSuperAdmin={isSuperAdmin}
                dashboardSections={dashboardSections}
            />
            <AdminUserTable
                users={userList}
                roleOptions={roleOptions}
                businessUnits={businessUnitOptions}
                currentUserId={session.user.id}
            />
        </div>
    );
}

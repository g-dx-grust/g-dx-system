import { config } from 'dotenv';
config({ path: '../../apps/web/.env.local' });

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq, and, isNull } from 'drizzle-orm';
import * as schema from '../schema';

const TARGET_EMAIL = 'shoji@n-grust.co.jp';

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool, { schema });
const { users, roles, userRoleAssignments } = schema;

async function main() {
    // 1. Ensure SUPER_ADMIN role exists
    console.log('Ensuring SUPER_ADMIN role exists...');
    await db.insert(roles).values({
        code: 'SUPER_ADMIN',
        name: 'スーパー管理者',
        isSystemRole: true,
        sortOrder: 0,
    }).onConflictDoNothing({ target: roles.code });

    // 2. Find user by email
    const [user] = await db
        .select({ id: users.id, name: users.displayName, email: users.email })
        .from(users)
        .where(eq(users.email, TARGET_EMAIL))
        .limit(1);

    if (!user) {
        console.error(`❌ User not found: ${TARGET_EMAIL}`);
        console.error('   → Lark でログインしてからユーザーが作成されます。一度ログインしてからもう一度実行してください。');
        await pool.end();
        process.exit(1);
    }

    console.log(`✅ User found: ${user.name} (${user.email}) [id: ${user.id}]`);

    // 3. Find SUPER_ADMIN role ID
    const [superAdminRole] = await db
        .select({ id: roles.id })
        .from(roles)
        .where(eq(roles.code, 'SUPER_ADMIN'))
        .limit(1);

    if (!superAdminRole) {
        console.error('❌ SUPER_ADMIN role not found after insert — should not happen');
        await pool.end();
        process.exit(1);
    }

    // 4. Check if already assigned
    const [existing] = await db
        .select({ id: userRoleAssignments.id })
        .from(userRoleAssignments)
        .where(
            and(
                eq(userRoleAssignments.userId, user.id),
                eq(userRoleAssignments.roleId, superAdminRole.id),
                isNull(userRoleAssignments.businessUnitId),
                isNull(userRoleAssignments.expiresAt),
            )
        )
        .limit(1);

    if (existing) {
        console.log('ℹ️  SUPER_ADMIN は既に付与されています。');
    } else {
        await db.insert(userRoleAssignments).values({
            userId: user.id,
            roleId: superAdminRole.id,
        });
        console.log('✅ SUPER_ADMIN を付与しました。');
    }

    console.log('\n完了。次回ログイン時（またはセッション更新後）から有効になります。');
    await pool.end();
    process.exit(0);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});

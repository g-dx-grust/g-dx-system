/**
 * 重複ユーザー統合スクリプト
 *
 * 【問題】
 *   管理画面で larkOpenId なしで作成したユーザーと、
 *   後から Lark ログインで生成されたユーザーが同一 email で2件共存するケース。
 *
 * 【正規ユーザーの定義】
 *   larkOpenId が設定されているユーザーを "canonical（正）" とする。
 *   larkOpenId=NULL のユーザーを "ghost（ゴースト）" とする。
 *
 * 【実行方法】
 *   # 確認のみ（破壊的変更なし）
 *   pnpm --filter @g-dx/database exec tsx scripts/deduplicate-users.ts
 *
 *   # 実際に統合を実行
 *   pnpm --filter @g-dx/database exec tsx scripts/deduplicate-users.ts --execute
 *
 * 【統合内容】
 *   1. ghost ユーザーの role assignments を canonical に移行
 *   2. ghost ユーザーの business memberships を canonical に移行
 *   3. ghost ユーザーの deals（ownerUserId）を canonical に更新
 *   4. ghost ユーザーの deal_activities を canonical に更新
 *   5. ghost ユーザーの contracts（ownerUserId）を canonical に更新
 *   6. ghost ユーザーを soft delete（deletedAt を設定）
 */

import { config } from 'dotenv';
config({ path: '../../apps/web/.env.local' });

import { db } from '../src/db';
import {
    users,
    userRoleAssignments,
    userBusinessMemberships,
    deals,
    dealActivities,
    contracts,
} from '../schema';
import { eq, isNull, isNotNull, and, inArray } from 'drizzle-orm';

const EXECUTE = process.argv.includes('--execute');

interface DuplicatePair {
    email: string;
    ghostId: string;
    ghostName: string | null;
    canonicalId: string;
    canonicalName: string | null;
    canonicalLarkOpenId: string;
}

async function findDuplicatePairs(): Promise<DuplicatePair[]> {
    // larkOpenId=NULL のユーザーを取得
    const ghosts = await db
        .select({ id: users.id, email: users.email, displayName: users.displayName })
        .from(users)
        .where(and(isNull(users.larkOpenId), isNull(users.deletedAt)));

    if (ghosts.length === 0) {
        return [];
    }

    const ghostEmails = ghosts.map((g) => g.email).filter((e): e is string => e !== null);
    if (ghostEmails.length === 0) {
        return [];
    }

    // 同一 email で larkOpenId あり のユーザーを取得
    const canonicals = await db
        .select({ id: users.id, email: users.email, displayName: users.displayName, larkOpenId: users.larkOpenId })
        .from(users)
        .where(
            and(
                isNotNull(users.larkOpenId),
                isNull(users.deletedAt),
                inArray(users.email, ghostEmails),
            )
        );

    const canonicalByEmail = new Map(canonicals.map((c) => [c.email, c]));

    const pairs: DuplicatePair[] = [];
    for (const ghost of ghosts) {
        if (!ghost.email) continue;
        const canonical = canonicalByEmail.get(ghost.email);
        if (!canonical) continue;

        pairs.push({
            email: ghost.email,
            ghostId: ghost.id,
            ghostName: ghost.displayName,
            canonicalId: canonical.id,
            canonicalName: canonical.displayName,
            canonicalLarkOpenId: canonical.larkOpenId!,
        });
    }

    return pairs;
}

async function printReport(pairs: DuplicatePair[]) {
    console.log('\n======================================');
    console.log('  重複ユーザー dry-run レポート');
    console.log(`  モード: ${EXECUTE ? '【実行】' : '【確認のみ / dry-run】'}`);
    console.log('======================================\n');

    if (pairs.length === 0) {
        console.log('✅ 重複ユーザーは見つかりませんでした。\n');
        return;
    }

    console.log(`⚠️  ${pairs.length} 件の重複ペアが見つかりました:\n`);
    for (const p of pairs) {
        console.log(`  Email: ${p.email}`);
        console.log(`    Ghost    (削除対象): id=${p.ghostId}  name=${p.ghostName}`);
        console.log(`    Canonical (正規ユーザー): id=${p.canonicalId}  name=${p.canonicalName}  larkOpenId=${p.canonicalLarkOpenId}`);
        console.log('');
    }
}

async function mergeUser(pair: DuplicatePair) {
    const { ghostId, canonicalId } = pair;

    console.log(`  統合中: ${pair.email} (ghost=${ghostId} → canonical=${canonicalId})`);

    // 1. role assignments: ghost → canonical に付け替え（重複する roleId は skip）
    const ghostRoles = await db
        .select({ roleId: userRoleAssignments.roleId, businessUnitId: userRoleAssignments.businessUnitId })
        .from(userRoleAssignments)
        .where(eq(userRoleAssignments.userId, ghostId));

    for (const ra of ghostRoles) {
        await db
            .insert(userRoleAssignments)
            .values({ userId: canonicalId, roleId: ra.roleId, businessUnitId: ra.businessUnitId, grantedByUserId: null })
            .onConflictDoNothing();
    }
    await db.delete(userRoleAssignments).where(eq(userRoleAssignments.userId, ghostId));

    // 2. business memberships: ghost → canonical に付け替え（重複する businessUnitId は skip）
    const ghostMemberships = await db
        .select({ businessUnitId: userBusinessMemberships.businessUnitId, isDefault: userBusinessMemberships.isDefault })
        .from(userBusinessMemberships)
        .where(eq(userBusinessMemberships.userId, ghostId));

    for (const mem of ghostMemberships) {
        await db
            .insert(userBusinessMemberships)
            .values({ userId: canonicalId, businessUnitId: mem.businessUnitId, membershipStatus: 'active', isDefault: mem.isDefault ?? false })
            .onConflictDoNothing();
    }
    await db.delete(userBusinessMemberships).where(eq(userBusinessMemberships.userId, ghostId));

    // 3. deals の ownerUserId を更新
    await db
        .update(deals)
        .set({ ownerUserId: canonicalId, updatedAt: new Date() })
        .where(eq(deals.ownerUserId, ghostId));

    // 4. deal_activities の userId を更新
    await db
        .update(dealActivities)
        .set({ userId: canonicalId })
        .where(eq(dealActivities.userId, ghostId));

    // 5. contracts の ownerUserId を更新
    await db
        .update(contracts)
        .set({ ownerUserId: canonicalId, updatedAt: new Date() })
        .where(eq(contracts.ownerUserId, ghostId));

    // 6. ghost ユーザーを soft delete
    await db
        .update(users)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(eq(users.id, ghostId));

    console.log(`  ✅ 完了: ${pair.email}`);
}

async function main() {
    const pairs = await findDuplicatePairs();
    await printReport(pairs);

    if (!EXECUTE || pairs.length === 0) {
        if (!EXECUTE && pairs.length > 0) {
            console.log('実際に統合するには --execute フラグを付けて再実行してください。');
        }
        process.exit(0);
    }

    console.log('\n--- 統合を開始します ---\n');
    for (const pair of pairs) {
        await mergeUser(pair);
    }
    console.log(`\n✅ ${pairs.length} 件の重複ユーザーを統合しました。`);
    process.exit(0);
}

main().catch((err) => {
    console.error('エラー:', err);
    process.exit(1);
});

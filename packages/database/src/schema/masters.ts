import { boolean, integer, pgTable, primaryKey, text } from 'drizzle-orm/pg-core';

export const masterIndustry = pgTable('master_industry', {
    industryCode: text('業種コード').primaryKey(),
    majorCategory: text('大分類').notNull(),
    minorCategory: text('中分類').notNull(),
    displayName: text('表示名').notNull(),
    sortOrder: integer('並び順').notNull(),
});

export const masterAcquisitionMethod = pgTable('master_acquisition_method', {
    acquisitionMethodCode: text('獲得方法コード').primaryKey(),
    displayName: text('表示名').notNull(),
    category: text('カテゴリ').notNull(),
    businessUnitScope: text('事業部スコープ').notNull(),
    sortOrder: integer('並び順').notNull(),
    noteDescription: text('備考・説明').notNull(),
});

export const masterJetDealStatus = pgTable('master_jet_deal_status', {
    statusCode: text('ステータスコード').primaryKey(),
    displayName: text('表示名').notNull(),
    description: text('説明').notNull(),
    uiColorHex: text('UIカラー（hex）').notNull(),
    sortOrder: integer('並び順').notNull(),
    isClosedStatus: boolean('終了ステータス').notNull(),
});

export const masterJetCreditStatus = pgTable('master_jet_credit_status', {
    creditProgressCode: text('与信進捗コード').primaryKey(),
    displayName: text('表示名').notNull(),
    description: text('説明').notNull(),
    uiColorHex: text('UIカラー（hex）').notNull(),
    sortOrder: integer('並び順').notNull(),
});

export const masterJetStatus2 = pgTable('master_jet_status2', {
    status2Code: text('ステータス2コード').primaryKey(),
    displayName: text('表示名').notNull(),
    category: text('カテゴリ').notNull(),
    description: text('説明').notNull(),
    uiColorHex: text('UIカラー（hex）').notNull(),
    sortOrder: integer('並び順').notNull(),
});

export const masterCallResult = pgTable('master_call_result', {
    resultCode: text('結果コード').primaryKey(),
    displayName: text('表示名').notNull(),
    category: text('カテゴリ').notNull(),
    recommendedNextAction: text('次アクション推奨').notNull(),
    uiColorHex: text('UIカラー（hex）').notNull(),
    sortOrder: integer('並び順').notNull(),
    operationDescription: text('備考・運用説明').notNull(),
});

export const masterLeadSource = pgTable('master_lead_source', {
    leadSourceCode: text('流入経路コード').primaryKey(),
    displayName: text('表示名').notNull(),
    category: text('カテゴリ').notNull(),
    sortOrder: integer('並び順').notNull(),
});

export const masterPipelineStage = pgTable(
    'master_pipeline_stage',
    {
        pipelineCode: text('パイプラインコード').notNull(),
        stageKey: text('ステージキー').notNull(),
        stageName: text('ステージ名').notNull(),
        description: text('説明').notNull(),
        uiColorHex: text('UIカラー（hex）').notNull(),
        sortOrder: integer('並び順').notNull(),
        isClosedStage: boolean('終了ステージ（受注/失注）').notNull(),
    },
    (table) => [
        primaryKey({ columns: [table.pipelineCode, table.stageKey] }),
    ],
);

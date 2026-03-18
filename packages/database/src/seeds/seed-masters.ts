import { access, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { config } from 'dotenv';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from '../../schema';

const seedDir = dirname(fileURLToPath(import.meta.url));
const envFilePath = resolve(seedDir, '../../../../apps/web/.env.local');
const fallbackMasterDir = resolve(seedDir, '../../../../masters');

config({ path: envFilePath });

const {
    masterIndustry,
    masterAcquisitionMethod,
    masterJetDealStatus,
    masterJetCreditStatus,
    masterJetStatus2,
    masterCallResult,
    masterPipelineStage,
    masterLeadSource,
} = schema;

type MasterIndustryRow = typeof masterIndustry.$inferInsert;
type MasterAcquisitionMethodRow = typeof masterAcquisitionMethod.$inferInsert;
type MasterJetDealStatusRow = typeof masterJetDealStatus.$inferInsert;
type MasterJetCreditStatusRow = typeof masterJetCreditStatus.$inferInsert;
type MasterJetStatus2Row = typeof masterJetStatus2.$inferInsert;
type MasterCallResultRow = typeof masterCallResult.$inferInsert;
type MasterPipelineStageRow = typeof masterPipelineStage.$inferInsert;
type MasterLeadSourceRow = typeof masterLeadSource.$inferInsert;

const pool = new Pool({ connectionString: getRequiredEnv('DATABASE_URL') });
const db = drizzle(pool, { schema });

const masterIndustryHeaders = ['業種コード', '大分類', '中分類', '表示名', '並び順'] as const;
const masterAcquisitionMethodHeaders = ['獲得方法コード', '表示名', 'カテゴリ', '事業部スコープ', '並び順', '備考・説明'] as const;
const masterJetDealStatusHeaders = ['ステータスコード', '表示名', '説明', 'UIカラー（hex）', '並び順', '終了ステータス'] as const;
const masterJetCreditStatusHeaders = ['与信進捗コード', '表示名', '説明', 'UIカラー（hex）', '並び順'] as const;
const masterJetStatus2Headers = ['ステータス2コード', '表示名', 'カテゴリ', '説明', 'UIカラー（hex）', '並び順'] as const;
const masterCallResultHeaders = ['結果コード', '表示名', 'カテゴリ', '次アクション推奨', 'UIカラー（hex）', '並び順', '備考・運用説明'] as const;
const masterLeadSourceHeaders = ['流入経路コード', '表示名', 'カテゴリ', '並び順'] as const;
const masterPipelineStageHeaders = ['パイプラインコード', 'ステージキー', 'ステージ名', '説明', 'UIカラー（hex）', '並び順', '終了ステージ（受注/失注）'] as const;

type CsvHeaders = readonly string[];
type CsvRecord<THeaders extends CsvHeaders> = Record<THeaders[number], string>;

function getRequiredEnv(name: string): string {
    const value = process.env[name]?.trim();
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }

    return value;
}

async function resolveCsvPath(fileName: string): Promise<string> {
    const candidates = [resolve(seedDir, fileName), resolve(fallbackMasterDir, fileName)];

    for (const candidate of candidates) {
        try {
            await access(candidate);
            return candidate;
        } catch {
            continue;
        }
    }

    throw new Error(`CSV file not found: ${fileName}`);
}

function parseCsv(content: string): string[][] {
    const normalized = content.replace(/^\uFEFF/, '');
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let inQuotes = false;

    for (let index = 0; index < normalized.length; index += 1) {
        const char = normalized[index];

        if (inQuotes) {
            if (char === '"') {
                if (normalized[index + 1] === '"') {
                    currentField += '"';
                    index += 1;
                } else {
                    inQuotes = false;
                }
            } else {
                currentField += char;
            }
            continue;
        }

        if (char === '"') {
            inQuotes = true;
            continue;
        }

        if (char === ',') {
            currentRow.push(currentField);
            currentField = '';
            continue;
        }

        if (char === '\n') {
            currentRow.push(currentField);
            rows.push(currentRow);
            currentRow = [];
            currentField = '';
            continue;
        }

        if (char === '\r') {
            continue;
        }

        currentField += char;
    }

    if (inQuotes) {
        throw new Error('Invalid CSV: unterminated quoted field.');
    }

    if (currentField.length > 0 || currentRow.length > 0) {
        currentRow.push(currentField);
        rows.push(currentRow);
    }

    return rows.filter((row) => row.some((field) => field.length > 0));
}

async function readCsvRecords<const THeaders extends CsvHeaders>(
    fileName: string,
    expectedHeaders: THeaders,
): Promise<Array<CsvRecord<THeaders>>> {
    const filePath = await resolveCsvPath(fileName);
    const content = await readFile(filePath, 'utf8');
    const rows = parseCsv(content);

    if (rows.length === 0) {
        throw new Error(`CSV file is empty: ${fileName}`);
    }

    const headerRow = rows[0].map((value) => value.trim());
    const headerIndexes: Array<readonly [THeaders[number], number]> = expectedHeaders.map((header) => {
        const columnIndex = headerRow.indexOf(header);
        if (columnIndex === -1) {
            throw new Error(`Missing header "${header}" in ${fileName}`);
        }

        return [header, columnIndex] as const;
    });

    return rows
        .slice(1)
        .filter((row) => row.some((value) => value.trim().length > 0))
        .map((row) => {
            const record = {} as CsvRecord<THeaders>;

            for (const [header, columnIndex] of headerIndexes) {
                record[header] = (row[columnIndex] ?? '').trim();
            }

            return record;
        });
}

function parseInteger(value: string, context: string): number {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) {
        throw new Error(`Invalid integer for ${context}: "${value}"`);
    }

    return parsed;
}

function parseBoolean(value: string, context: string): boolean {
    const normalized = value.trim().toLowerCase();

    if (normalized === 'true' || normalized === '1') {
        return true;
    }

    if (normalized === 'false' || normalized === '0') {
        return false;
    }

    throw new Error(`Invalid boolean for ${context}: "${value}"`);
}

async function loadMasterIndustryRows(): Promise<MasterIndustryRow[]> {
    const records = await readCsvRecords('master_industry.csv', masterIndustryHeaders);
    return records.map((record, index) => ({
        industryCode: record['業種コード'],
        majorCategory: record['大分類'],
        minorCategory: record['中分類'],
        displayName: record['表示名'],
        sortOrder: parseInteger(record['並び順'], `master_industry.csv row ${index + 2} 並び順`),
    }));
}

async function loadMasterAcquisitionMethodRows(): Promise<MasterAcquisitionMethodRow[]> {
    const records = await readCsvRecords('master_acquisition_method.csv', masterAcquisitionMethodHeaders);
    return records.map((record, index) => ({
        acquisitionMethodCode: record['獲得方法コード'],
        displayName: record['表示名'],
        category: record['カテゴリ'],
        businessUnitScope: record['事業部スコープ'],
        sortOrder: parseInteger(record['並び順'], `master_acquisition_method.csv row ${index + 2} 並び順`),
        noteDescription: record['備考・説明'],
    }));
}

async function loadMasterJetDealStatusRows(): Promise<MasterJetDealStatusRow[]> {
    const records = await readCsvRecords('master_jet_deal_status.csv', masterJetDealStatusHeaders);
    return records.map((record, index) => ({
        statusCode: record['ステータスコード'],
        displayName: record['表示名'],
        description: record['説明'],
        uiColorHex: record['UIカラー（hex）'],
        sortOrder: parseInteger(record['並び順'], `master_jet_deal_status.csv row ${index + 2} 並び順`),
        isClosedStatus: parseBoolean(record['終了ステータス'], `master_jet_deal_status.csv row ${index + 2} 終了ステータス`),
    }));
}

async function loadMasterJetCreditStatusRows(): Promise<MasterJetCreditStatusRow[]> {
    const records = await readCsvRecords('master_jet_credit_status.csv', masterJetCreditStatusHeaders);
    return records.map((record, index) => ({
        creditProgressCode: record['与信進捗コード'],
        displayName: record['表示名'],
        description: record['説明'],
        uiColorHex: record['UIカラー（hex）'],
        sortOrder: parseInteger(record['並び順'], `master_jet_credit_status.csv row ${index + 2} 並び順`),
    }));
}

async function loadMasterJetStatus2Rows(): Promise<MasterJetStatus2Row[]> {
    const records = await readCsvRecords('master_jet_status2.csv', masterJetStatus2Headers);
    return records.map((record, index) => ({
        status2Code: record['ステータス2コード'],
        displayName: record['表示名'],
        category: record['カテゴリ'],
        description: record['説明'],
        uiColorHex: record['UIカラー（hex）'],
        sortOrder: parseInteger(record['並び順'], `master_jet_status2.csv row ${index + 2} 並び順`),
    }));
}

async function loadMasterCallResultRows(): Promise<MasterCallResultRow[]> {
    const records = await readCsvRecords('master_call_result.csv', masterCallResultHeaders);
    return records.map((record, index) => ({
        resultCode: record['結果コード'],
        displayName: record['表示名'],
        category: record['カテゴリ'],
        recommendedNextAction: record['次アクション推奨'],
        uiColorHex: record['UIカラー（hex）'],
        sortOrder: parseInteger(record['並び順'], `master_call_result.csv row ${index + 2} 並び順`),
        operationDescription: record['備考・運用説明'],
    }));
}

async function loadMasterLeadSourceRows(): Promise<MasterLeadSourceRow[]> {
    const records = await readCsvRecords('master_lead_source.csv', masterLeadSourceHeaders);
    return records.map((record, index) => ({
        leadSourceCode: record['流入経路コード'],
        displayName: record['表示名'],
        category: record['カテゴリ'],
        sortOrder: parseInteger(record['並び順'], `master_lead_source.csv row ${index + 2} 並び順`),
    }));
}

async function loadMasterPipelineStageRows(): Promise<MasterPipelineStageRow[]> {
    const records = await readCsvRecords('master_pipeline_stage.csv', masterPipelineStageHeaders);
    return records.map((record, index) => ({
        pipelineCode: record['パイプラインコード'],
        stageKey: record['ステージキー'],
        stageName: record['ステージ名'],
        description: record['説明'],
        uiColorHex: record['UIカラー（hex）'],
        sortOrder: parseInteger(record['並び順'], `master_pipeline_stage.csv row ${index + 2} 並び順`),
        isClosedStage: parseBoolean(record['終了ステージ（受注/失注）'], `master_pipeline_stage.csv row ${index + 2} 終了ステージ（受注/失注）`),
    }));
}

async function main() {
    console.log('Loading master CSV files...');

    const [
        industryRows,
        acquisitionMethodRows,
        jetDealStatusRows,
        jetCreditStatusRows,
        jetStatus2Rows,
        callResultRows,
        leadSourceRows,
        pipelineStageRows,
    ] = await Promise.all([
        loadMasterIndustryRows(),
        loadMasterAcquisitionMethodRows(),
        loadMasterJetDealStatusRows(),
        loadMasterJetCreditStatusRows(),
        loadMasterJetStatus2Rows(),
        loadMasterCallResultRows(),
        loadMasterLeadSourceRows(),
        loadMasterPipelineStageRows(),
    ]);

    await db.transaction(async (tx) => {
        console.log('Truncating master tables...');
        await tx.execute(
            sql.raw(`
                TRUNCATE TABLE
                    master_industry,
                    master_acquisition_method,
                    master_jet_deal_status,
                    master_jet_credit_status,
                    master_jet_status2,
                    master_call_result,
                    master_lead_source,
                    master_pipeline_stage
                CASCADE
            `),
        );

        console.log('Inserting master_industry...');
        if (industryRows.length > 0) {
            await tx.insert(masterIndustry).values(industryRows);
        }

        console.log('Inserting master_acquisition_method...');
        if (acquisitionMethodRows.length > 0) {
            await tx.insert(masterAcquisitionMethod).values(acquisitionMethodRows);
        }

        console.log('Inserting master_jet_deal_status...');
        if (jetDealStatusRows.length > 0) {
            await tx.insert(masterJetDealStatus).values(jetDealStatusRows);
        }

        console.log('Inserting master_jet_credit_status...');
        if (jetCreditStatusRows.length > 0) {
            await tx.insert(masterJetCreditStatus).values(jetCreditStatusRows);
        }

        console.log('Inserting master_jet_status2...');
        if (jetStatus2Rows.length > 0) {
            await tx.insert(masterJetStatus2).values(jetStatus2Rows);
        }

        console.log('Inserting master_call_result...');
        if (callResultRows.length > 0) {
            await tx.insert(masterCallResult).values(callResultRows);
        }

        console.log('Inserting master_lead_source...');
        if (leadSourceRows.length > 0) {
            await tx.insert(masterLeadSource).values(leadSourceRows);
        }

        console.log('Inserting master_pipeline_stage...');
        if (pipelineStageRows.length > 0) {
            await tx.insert(masterPipelineStage).values(pipelineStageRows);
        }
    });

    console.log(
        [
            `master_industry=${industryRows.length}`,
            `master_acquisition_method=${acquisitionMethodRows.length}`,
            `master_jet_deal_status=${jetDealStatusRows.length}`,
            `master_jet_credit_status=${jetCreditStatusRows.length}`,
            `master_jet_status2=${jetStatus2Rows.length}`,
            `master_call_result=${callResultRows.length}`,
            `master_lead_source=${leadSourceRows.length}`,
            `master_pipeline_stage=${pipelineStageRows.length}`,
        ].join(', '),
    );
    console.log('Master seeding completed successfully.');
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await pool.end();
    });

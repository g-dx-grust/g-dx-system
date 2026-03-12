import { assertPermission } from '@/shared/server/authorization';
import { AppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { listIndustryOptions } from '@/modules/master/infrastructure/form-master-repository';
import type { CompanyImportPreparedRow, CompanyImportPreview, TsrFieldMapping } from '../domain/company-import';
import { normalizeCompanyName } from '../domain/normalize-company-name';
import {
    findExistingCompanyMatches,
    listTsrFieldMappings,
    parseTsrCompanyCsv,
} from '../infrastructure/company-import-repository';

function summarizePreparedRows(rows: CompanyImportPreparedRow[]) {
    return rows.reduce(
        (summary, row) => {
            if (row.status === 'new') summary.newCount += 1;
            if (row.status === 'duplicate') summary.duplicateCount += 1;
            if (row.status === 'skip') summary.skipCount += 1;
            return summary;
        },
        {
            totalRows: rows.length,
            newCount: 0,
            duplicateCount: 0,
            skipCount: 0,
            previewCount: Math.min(rows.length, 10),
        },
    );
}

function escapeCsvField(value: string): string {
    if (/[",\r\n]/.test(value)) {
        return `"${value.replace(/"/g, '""')}"`;
    }

    return value;
}

export async function getCompanyImportFieldMappings(): Promise<TsrFieldMapping[]> {
    return listTsrFieldMappings();
}

export function buildCompanyImportTemplateCsv(fieldMappings: TsrFieldMapping[]): string {
    const headers = fieldMappings
        .filter((mapping) => mapping.tsrFieldName && mapping.priority !== '不要')
        .map((mapping) => mapping.tsrFieldName);

    const sampleValues: Record<string, string> = {
        '法人名/商号': 'サンプル株式会社',
        '法人名/商号(カナ)': 'サンプルカブシキガイシャ',
        'HP': 'https://example.com',
        '上場/未上場': '未上場',
        '代表者氏名': '山田 太郎',
        '会社住所': '東京都千代田区丸の内1-1-1',
        '本社：電話番号': '03-0000-0000',
        '設立年月日': '2020/01/01',
        '資本金': '10,000,000',
        '従業員数': '50人',
        '営業種目': 'SaaS',
        '売上①': '100000000',
        '概況': 'サンプルの会社概要です。',
        'リストID': 'TSR-000001',
        'ISメモ': '初回接触予定',
        'ISメモ2': '',
    };

    const lines = [
        headers.map(escapeCsvField).join(','),
        headers.map((header) => escapeCsvField(sampleValues[header] ?? '')).join(','),
    ];

    return `\uFEFF${lines.join('\r\n')}\r\n`;
}

export async function prepareTsrCompanyImport(file: File): Promise<{
    fileName: string;
    activeBusinessScope: CompanyImportPreview['activeBusinessScope'];
    rows: CompanyImportPreparedRow[];
    summary: CompanyImportPreview['summary'];
}> {
    const session = await getAuthenticatedAppSession();
    if (!session) {
        throw new AppError('UNAUTHORIZED');
    }

    assertPermission(session, 'customer.company.create');

    const mappings = await listTsrFieldMappings();
    const industryOptions = await listIndustryOptions();
    const parsedRows = await parseTsrCompanyCsv(
        file,
        mappings,
        industryOptions.map((industry) => industry.label),
    );

    const normalizedNames = parsedRows
        .map((row) => row.name ? normalizeCompanyName(row.name) : null)
        .filter((value): value is string => Boolean(value));
    const existingMatches = await findExistingCompanyMatches(
        [...new Set(normalizedNames)],
        session.activeBusinessScope,
    );

    const seenNames = new Set<string>();
    const rows = parsedRows.map((row) => {
        if (!row.name || !row.normalizedName) {
            return {
                ...row,
                status: 'skip',
                note: '会社名がないためスキップします。',
            } satisfies CompanyImportPreparedRow;
        }

        if (seenNames.has(row.normalizedName)) {
            return {
                ...row,
                status: 'skip',
                note: 'CSV 内で会社名が重複しているためスキップします。',
            } satisfies CompanyImportPreparedRow;
        }
        seenNames.add(row.normalizedName);

        const existingMatch = existingMatches.get(row.normalizedName);
        if (existingMatch?.existsInActiveScope) {
            return {
                ...row,
                status: 'duplicate',
                note: `既存会社「${existingMatch.companyName}」が現在の事業部に登録済みです。`,
            } satisfies CompanyImportPreparedRow;
        }

        if (existingMatch) {
            return {
                ...row,
                status: 'new',
                note: `既存会社「${existingMatch.companyName}」へ現在の事業部プロフィールを追加します。`,
            } satisfies CompanyImportPreparedRow;
        }

        return {
            ...row,
            status: 'new',
            note: '新規会社として登録します。',
        } satisfies CompanyImportPreparedRow;
    });

    return {
        fileName: file.name,
        activeBusinessScope: session.activeBusinessScope,
        rows,
        summary: summarizePreparedRows(rows),
    };
}

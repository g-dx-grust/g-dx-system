import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { BusinessScopeType } from '@g-dx/contracts';
import { db } from '@g-dx/database';
import { businessUnits, companies, companyBusinessProfiles } from '@g-dx/database/schema';
import { asc, eq, inArray } from 'drizzle-orm';
import type { TsrFieldMapping, TsrParsedCompanyRow } from '../domain/company-import';
import { normalizeCompanyName } from '../domain/normalize-company-name';

interface ExistingCompanyMatch {
    companyId: string;
    companyName: string;
    existsInActiveScope: boolean;
}

type CsvRecord = Record<string, string>;

const REQUIRED_TSR_HEADER = '法人名/商号';
const TSR_FIELD_MAPPING_FILE_NAME = 'tsr_field_mapping.csv';

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

    return rows.filter((row) => row.some((field) => field.trim().length > 0));
}

function toCsvRecords(rows: string[][]): CsvRecord[] {
    if (rows.length === 0) {
        return [];
    }

    const headers = rows[0].map((value) => value.trim());

    return rows
        .slice(1)
        .map((row) => {
            const record: CsvRecord = {};
            headers.forEach((header, index) => {
                record[header] = (row[index] ?? '').trim();
            });
            return record;
        })
        .filter((record) => Object.values(record).some((value) => value.length > 0));
}

async function resolveTsrFieldMappingPath(): Promise<string> {
    const candidates = [
        resolve(process.cwd(), 'masters', TSR_FIELD_MAPPING_FILE_NAME),
        resolve(process.cwd(), '..', '..', 'masters', TSR_FIELD_MAPPING_FILE_NAME),
    ];

    for (const candidate of candidates) {
        try {
            await access(candidate);
            return candidate;
        } catch {
            continue;
        }
    }

    throw new Error(`TSR field mapping file not found: ${TSR_FIELD_MAPPING_FILE_NAME}`);
}

function decodeCsvBuffer(bytes: Uint8Array): string {
    const encodings = ['utf-8', 'shift-jis', 'windows-31j'] as const;

    for (const encoding of encodings) {
        try {
            const decoded = new TextDecoder(encoding).decode(bytes);
            if (decoded.includes(REQUIRED_TSR_HEADER)) {
                return decoded;
            }
        } catch {
            continue;
        }
    }

    return new TextDecoder('utf-8').decode(bytes);
}

function findMappedSourceField(mappings: TsrFieldMapping[], targetMatcher: (systemTarget: string) => boolean): string | null {
    return mappings.find((mapping) => targetMatcher(mapping.systemTarget))?.tsrFieldName ?? null;
}

function normalizeFieldValue(value: string | undefined): string | null {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
}

function extractPrimaryIndustry(rawIndustry: string | null, masterIndustryLabels: string[]): string | null {
    if (!rawIndustry) {
        return null;
    }

    const [primaryIndustry] = rawIndustry
        .split(/[\n,，、/／;；|｜]+/)
        .map((part) => part.trim())
        .filter(Boolean);

    if (!primaryIndustry) {
        return null;
    }

    const exactMatch = masterIndustryLabels.find((label) => label === primaryIndustry);
    if (exactMatch) {
        return exactMatch;
    }

    const fuzzyMatch = masterIndustryLabels.find(
        (label) => label.includes(primaryIndustry) || primaryIndustry.includes(label),
    );

    return fuzzyMatch ?? primaryIndustry;
}

export async function listTsrFieldMappings(): Promise<TsrFieldMapping[]> {
    const filePath = await resolveTsrFieldMappingPath();
    const content = await readFile(filePath, 'utf8');
    const rows = toCsvRecords(parseCsv(content));

    return rows.map((row) => ({
        tsrFieldName: row['TSR項目名'] ?? '',
        systemTarget: row['システム格納先'] ?? '',
        priority: row['取込優先度'] ?? '',
        note: row['備考・変換ルール'] ?? '',
    }));
}

export async function parseTsrCompanyCsv(file: File, mappings: TsrFieldMapping[], masterIndustryLabels: string[]): Promise<TsrParsedCompanyRow[]> {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const content = decodeCsvBuffer(bytes);
    const rows = toCsvRecords(parseCsv(content));

    const nameField = findMappedSourceField(mappings, (target) => target === 'companies.displayName');
    const websiteField = findMappedSourceField(mappings, (target) => target === 'companies.website');
    const addressField = findMappedSourceField(mappings, (target) => target === 'companies.addressLine1');
    const phoneField = findMappedSourceField(mappings, (target) => target === 'companies.mainPhone');
    const industryField = findMappedSourceField(mappings, (target) => target.includes('industry'));

    if (!nameField) {
        throw new Error('TSR field mapping does not define a source column for companies.displayName.');
    }

    return rows
        .map((row, index) => {
            const name = normalizeFieldValue(row[nameField]);
            const website = websiteField ? normalizeFieldValue(row[websiteField]) : null;
            const address = addressField ? normalizeFieldValue(row[addressField]) : null;
            const phone = phoneField ? normalizeFieldValue(row[phoneField]) : null;
            const industry = industryField
                ? extractPrimaryIndustry(normalizeFieldValue(row[industryField]), masterIndustryLabels)
                : null;

            return {
                rowNumber: index + 2,
                name,
                normalizedName: name ? normalizeCompanyName(name) : null,
                industry,
                phone,
                website,
                address,
            } satisfies TsrParsedCompanyRow;
        })
        .filter((row) => row.name || row.industry || row.phone || row.website || row.address);
}

export async function findExistingCompanyMatches(
    normalizedNames: string[],
    activeBusinessScope: BusinessScopeType,
): Promise<Map<string, ExistingCompanyMatch>> {
    if (normalizedNames.length === 0) {
        return new Map();
    }

    const rows = await db
        .select({
            normalizedName: companies.normalizedName,
            companyId: companies.id,
            companyName: companies.displayName,
            businessScope: businessUnits.code,
        })
        .from(companies)
        .leftJoin(companyBusinessProfiles, eq(companyBusinessProfiles.companyId, companies.id))
        .leftJoin(businessUnits, eq(companyBusinessProfiles.businessUnitId, businessUnits.id))
        .where(inArray(companies.normalizedName, normalizedNames))
        .orderBy(asc(companies.displayName));

    const matches = new Map<string, ExistingCompanyMatch>();

    for (const row of rows) {
        const current = matches.get(row.normalizedName);
        const existsInActiveScope = current?.existsInActiveScope === true || row.businessScope === activeBusinessScope;

        matches.set(row.normalizedName, {
            companyId: row.companyId,
            companyName: row.companyName,
            existsInActiveScope,
        });
    }

    return matches;
}

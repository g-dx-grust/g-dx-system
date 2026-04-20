'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { ApiErrorCode } from '@g-dx/contracts';
import { prepareTsrCompanyImport } from '@/modules/customer-management/company/application/company-import';
import { createCompany } from '@/modules/customer-management/company/application/create-company';
import { updateCompany } from '@/modules/customer-management/company/application/update-company';
import { bulkCreateCompanies } from '@/modules/customer-management/company/infrastructure/company-repository';
import { normalizeCompanyName } from '@/modules/customer-management/company/domain/normalize-company-name';
import type { CompanyImportLogItem, CompanyImportPreview, CompanyImportResult } from '@/modules/customer-management/company/domain/company-import';
import { assertPermission } from '@/shared/server/authorization';
import { AppError, isAppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';

interface CompanyCreateValues {
    name: string;
    industry?: string;
    phone?: string;
    website?: string;
    postalCode?: string;
    address?: string;
    tags?: string[];
    leadSource?: string;
    ownerUserId?: string;
}

type CompanyCreateExecutionResult =
    | {
        ok: true;
        company: Awaited<ReturnType<typeof createCompany>>;
    }
    | {
        ok: false;
        code: ApiErrorCode;
        message: string;
    };

function readOptionalString(formData: FormData, key: string): string | undefined {
    const value = formData.get(key);
    if (typeof value !== 'string') {
        return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

function readCsvFile(formData: FormData): File {
    const file = formData.get('file');
    if (!(file instanceof File) || file.size === 0) {
        throw new Error('CSV file is required.');
    }
    return file;
}

function buildCompanyCreateValues(formData: FormData): CompanyCreateValues | null {
    const name = readOptionalString(formData, 'name');
    if (!name) {
        return null;
    }

    const tagsRaw = readOptionalString(formData, 'tags');
    const tags = tagsRaw ? tagsRaw.split(',').map((tag) => tag.trim()).filter(Boolean) : [];

    return {
        name,
        industry: readOptionalString(formData, 'industry'),
        phone: readOptionalString(formData, 'phone'),
        website: readOptionalString(formData, 'website'),
        postalCode: readOptionalString(formData, 'postalCode'),
        address: readOptionalString(formData, 'address'),
        tags,
        leadSource: readOptionalString(formData, 'leadSource'),
        ownerUserId: readOptionalString(formData, 'ownerUserId'),
    };
}

async function executeCompanyCreate(values: CompanyCreateValues): Promise<CompanyCreateExecutionResult> {
    try {
        const company = await createCompany({
            name: values.name,
            industry: values.industry,
            phone: values.phone,
            website: values.website,
            postalCode: values.postalCode,
            address: values.address,
            tags: values.tags ?? [],
            leadSource: values.leadSource,
            ownerUserId: values.ownerUserId,
        });

        return {
            ok: true,
            company,
        };
    } catch (error) {
        if (isAppError(error)) {
            return {
                ok: false,
                code: error.code,
                message: error.message,
            };
        }

        throw error;
    }
}

function getCompanyCreateFailureMessage(code: ApiErrorCode, defaultMessage: string): string {
    switch (code) {
        case 'UNAUTHORIZED':
            return 'ログインが必要です。';
        case 'FORBIDDEN':
        case 'BUSINESS_SCOPE_FORBIDDEN':
            return '会社登録の権限がありません。';
        case 'DUPLICATE_COMPANY':
            return '同名の会社が現在の事業部に既に存在します。';
        case 'VALIDATION_ERROR':
            return '入力内容に不備があります。';
        default:
            return defaultMessage;
    }
}

export async function createCompanyAction(formData: FormData) {
    const values = buildCompanyCreateValues(formData);
    if (!values) {
        redirect('/customers/companies/new?error=validation');
    }

    const result = await executeCompanyCreate(values);

    if (!result.ok) {
        if (result.code === 'UNAUTHORIZED') {
            redirect('/login');
        }

        if (result.code === 'FORBIDDEN' || result.code === 'BUSINESS_SCOPE_FORBIDDEN') {
            redirect('/unauthorized');
        }

        if (result.code === 'DUPLICATE_COMPANY') {
            redirect('/customers/companies/new?error=duplicate');
        }

        throw new Error(getCompanyCreateFailureMessage(result.code, result.message));
    }

    revalidatePath('/customers/companies');
    redirect('/customers/companies?created=1');
}

export async function previewTsrCompanyImportAction(formData: FormData): Promise<CompanyImportPreview> {
    const file = readCsvFile(formData);
    const prepared = await prepareTsrCompanyImport(file);

    return {
        fileName: prepared.fileName,
        activeBusinessScope: prepared.activeBusinessScope,
        summary: prepared.summary,
        previewRows: prepared.rows.slice(0, 10),
    };
}

export async function executeTsrCompanyImportAction(formData: FormData): Promise<CompanyImportResult> {
    const session = await getAuthenticatedAppSession();
    if (!session) {
        throw new AppError('UNAUTHORIZED');
    }
    assertPermission(session, 'customer.company.create');

    const file = readCsvFile(formData);
    const prepared = await prepareTsrCompanyImport(file);

    const logs: CompanyImportLogItem[] = [];
    let successCount = 0;
    let failureCount = 0;
    let duplicateCount = 0;
    let skipCount = 0;

    // Separate rows by status
    const newRows = [];
    for (const row of prepared.rows) {
        const displayName = row.name ?? '(会社名なし)';

        if (row.status === 'duplicate') {
            duplicateCount += 1;
            logs.push({
                rowNumber: row.rowNumber,
                name: displayName,
                status: 'duplicate',
                message: row.note,
            });
            continue;
        }

        if (row.status === 'skip') {
            skipCount += 1;
            logs.push({
                rowNumber: row.rowNumber,
                name: displayName,
                status: 'skip',
                message: row.note,
            });
            continue;
        }

        newRows.push(row);
    }

    // Bulk create all new rows in a single transaction
    if (newRows.length > 0) {
        const bulkRows = newRows.map((row) => ({
            name: row.name!,
            normalizedName: normalizeCompanyName(row.name!),
            industry: row.industry ?? undefined,
            phone: row.phone ?? undefined,
            website: row.website ?? undefined,
            address: row.address ?? undefined,
        }));

        const bulkResults = await bulkCreateCompanies(
            bulkRows,
            session.activeBusinessScope,
            session.user.id,
        );

        for (const row of newRows) {
            const displayName = row.name ?? '(会社名なし)';
            const normalizedName = normalizeCompanyName(row.name!);
            const result = bulkResults.get(normalizedName);

            if (result && 'companyId' in result) {
                successCount += 1;
                logs.push({
                    rowNumber: row.rowNumber,
                    name: result.companyName,
                    status: 'success',
                    companyId: result.companyId,
                    message: result.sharedAcrossBusinesses
                        ? '既存会社へ現在の事業部プロフィールを追加しました。'
                        : '新規会社を登録しました。',
                });
            } else {
                failureCount += 1;
                logs.push({
                    rowNumber: row.rowNumber,
                    name: displayName,
                    status: 'failure',
                    message: result && 'error' in result ? result.error : '登録中にエラーが発生しました。',
                });
            }
        }
    }

    revalidatePath('/customers/companies');

    return {
        fileName: prepared.fileName,
        activeBusinessScope: prepared.activeBusinessScope,
        summary: {
            totalRows: prepared.summary.totalRows,
            successCount,
            failureCount,
            duplicateCount,
            skipCount,
        },
        logs,
    };
}

export async function updateCompanyAction(formData: FormData) {
    const companyId = readOptionalString(formData, 'companyId');
    if (!companyId) {
        redirect('/customers/companies');
    }

    const tagsRaw = readOptionalString(formData, 'tags');
    const tags = tagsRaw ? tagsRaw.split(',').map((tag) => tag.trim()).filter(Boolean) : undefined;

    try {
        await updateCompany(companyId, {
            industry: readOptionalString(formData, 'industry'),
            phone: readOptionalString(formData, 'phone'),
            tags,
            leadSource: readOptionalString(formData, 'leadSource'),
        });
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) {
            redirect('/login');
        }

        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) {
            redirect('/unauthorized');
        }

        if (isAppError(error, 'NOT_FOUND')) {
            redirect('/customers/companies');
        }

        throw error;
    }

    revalidatePath('/customers/companies');
    revalidatePath(`/customers/companies/${companyId}`);
    redirect(`/customers/companies/${companyId}?updated=1`);
}

export async function createCompanyQuickAction(name: string): Promise<{ id: string; label: string }> {
    const session = await getAuthenticatedAppSession();
    if (!session) throw new AppError('UNAUTHORIZED');

    assertPermission(session, 'customer.company.create');

    const company = await createCompany({ name });

    revalidatePath('/sales/meetings/new');

    return { id: company.id, label: company.name };
}

import type { BusinessScopeType } from '@g-dx/contracts';

export interface TsrFieldMapping {
    tsrFieldName: string;
    systemTarget: string;
    priority: string;
    note: string;
}

export interface TsrParsedCompanyRow {
    rowNumber: number;
    name: string | null;
    normalizedName: string | null;
    industry: string | null;
    phone: string | null;
    website: string | null;
    address: string | null;
}

export type CompanyImportRowStatus = 'new' | 'duplicate' | 'skip';

export interface CompanyImportPreparedRow extends TsrParsedCompanyRow {
    status: CompanyImportRowStatus;
    note: string;
}

export interface CompanyImportPreview {
    fileName: string;
    activeBusinessScope: BusinessScopeType;
    summary: {
        totalRows: number;
        newCount: number;
        duplicateCount: number;
        skipCount: number;
        previewCount: number;
    };
    previewRows: CompanyImportPreparedRow[];
}

export type CompanyImportLogStatus = 'success' | 'failure' | 'duplicate' | 'skip';

export interface CompanyImportLogItem {
    rowNumber: number;
    name: string;
    status: CompanyImportLogStatus;
    message: string;
    companyId?: string;
}

export interface CompanyImportResult {
    fileName: string;
    activeBusinessScope: BusinessScopeType;
    summary: {
        totalRows: number;
        successCount: number;
        failureCount: number;
        duplicateCount: number;
        skipCount: number;
    };
    logs: CompanyImportLogItem[];
}

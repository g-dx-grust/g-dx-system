import type { BusinessScopeType } from '@g-dx/contracts';
import { db } from '@g-dx/database';
import {
    masterAcquisitionMethod,
    masterIndustry,
    masterJetCreditStatus,
    masterJetDealStatus,
    masterJetStatus2,
    masterLeadSource,
    masterPipelineStage,
} from '@g-dx/database/schema';
import { asc, eq, inArray } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';

export interface MasterSelectOption {
    value: string;
    label: string;
}

export interface IndustryOption {
    code: string;
    label: string;
    majorCategory: string;
    minorCategory: string;
}

export interface MasterPipelineStageOption {
    key: string;
    label: string;
    order: number;
    isClosedStage: boolean;
}

const COMMON_BUSINESS_SCOPE = 'G-DX_COMMON';

const MASTER_PIPELINE_CODE_BY_SCOPE: Record<BusinessScopeType, string> = {
    LARK_SUPPORT: 'LARK_SUPPORT_STANDARD',
    WATER_SAVING: 'WATER_SAVING_STANDARD',
};

const MASTER_CACHE_REVALIDATE = 3600;

export const listAcquisitionMethodOptions = unstable_cache(
    async (activeBusinessScope: BusinessScopeType): Promise<MasterSelectOption[]> => {
        const rows = await db
            .select({
                value: masterAcquisitionMethod.displayName,
                label: masterAcquisitionMethod.displayName,
            })
            .from(masterAcquisitionMethod)
            .where(inArray(masterAcquisitionMethod.businessUnitScope, [COMMON_BUSINESS_SCOPE, activeBusinessScope]))
            .orderBy(asc(masterAcquisitionMethod.sortOrder), asc(masterAcquisitionMethod.displayName));

        return rows;
    },
    ['master-acquisition-methods'],
    { revalidate: MASTER_CACHE_REVALIDATE, tags: ['master-data'] },
);

export const listIndustryOptions = unstable_cache(
    async (): Promise<IndustryOption[]> => {
        const rows = await db
            .select({
                code: masterIndustry.industryCode,
                label: masterIndustry.displayName,
                majorCategory: masterIndustry.majorCategory,
                minorCategory: masterIndustry.minorCategory,
            })
            .from(masterIndustry)
            .orderBy(asc(masterIndustry.sortOrder), asc(masterIndustry.displayName));

        return rows;
    },
    ['master-industry-options'],
    { revalidate: MASTER_CACHE_REVALIDATE, tags: ['master-data'] },
);

export const listMasterPipelineStageOptions = unstable_cache(
    async (activeBusinessScope: BusinessScopeType): Promise<MasterPipelineStageOption[]> => {
        const pipelineCode = MASTER_PIPELINE_CODE_BY_SCOPE[activeBusinessScope];

        const rows = await db
            .select({
                key: masterPipelineStage.stageKey,
                label: masterPipelineStage.stageName,
                order: masterPipelineStage.sortOrder,
                isClosedStage: masterPipelineStage.isClosedStage,
            })
            .from(masterPipelineStage)
            .where(eq(masterPipelineStage.pipelineCode, pipelineCode))
            .orderBy(asc(masterPipelineStage.sortOrder), asc(masterPipelineStage.stageName));

        return rows;
    },
    ['master-pipeline-stages'],
    { revalidate: MASTER_CACHE_REVALIDATE, tags: ['master-data'] },
);

export const listJetDealStatusOptions = unstable_cache(
    async (): Promise<MasterSelectOption[]> => {
        const rows = await db
            .select({
                value: masterJetDealStatus.statusCode,
                label: masterJetDealStatus.displayName,
            })
            .from(masterJetDealStatus)
            .orderBy(asc(masterJetDealStatus.sortOrder), asc(masterJetDealStatus.displayName));

        return rows;
    },
    ['master-jet-deal-statuses'],
    { revalidate: MASTER_CACHE_REVALIDATE, tags: ['master-data'] },
);

export const listJetCreditStatusOptions = unstable_cache(
    async (): Promise<MasterSelectOption[]> => {
        const rows = await db
            .select({
                value: masterJetCreditStatus.creditProgressCode,
                label: masterJetCreditStatus.displayName,
            })
            .from(masterJetCreditStatus)
            .orderBy(asc(masterJetCreditStatus.sortOrder), asc(masterJetCreditStatus.displayName));

        return rows;
    },
    ['master-jet-credit-statuses'],
    { revalidate: MASTER_CACHE_REVALIDATE, tags: ['master-data'] },
);

export const listLeadSourceOptions = unstable_cache(
    async (): Promise<MasterSelectOption[]> => {
        const rows = await db
            .select({
                value: masterLeadSource.leadSourceCode,
                label: masterLeadSource.displayName,
            })
            .from(masterLeadSource)
            .orderBy(asc(masterLeadSource.sortOrder), asc(masterLeadSource.displayName));

        return rows;
    },
    ['master-lead-sources'],
    { revalidate: MASTER_CACHE_REVALIDATE, tags: ['master-data'] },
);

export const listJetStatus2Options = unstable_cache(
    async (): Promise<MasterSelectOption[]> => {
        const rows = await db
            .select({
                value: masterJetStatus2.status2Code,
                label: masterJetStatus2.displayName,
            })
            .from(masterJetStatus2)
            .orderBy(asc(masterJetStatus2.sortOrder), asc(masterJetStatus2.displayName));

        return rows;
    },
    ['master-jet-status2'],
    { revalidate: MASTER_CACHE_REVALIDATE, tags: ['master-data'] },
);

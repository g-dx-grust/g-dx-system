import type { BusinessScopeType } from '@g-dx/contracts';
import { db } from '@g-dx/database';
import {
    masterAcquisitionMethod,
    masterIndustry,
    masterJetCreditStatus,
    masterJetDealStatus,
    masterJetStatus2,
    masterPipelineStage,
} from '@g-dx/database/schema';
import { asc, eq, inArray } from 'drizzle-orm';

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

export async function listAcquisitionMethodOptions(activeBusinessScope: BusinessScopeType): Promise<MasterSelectOption[]> {
    const rows = await db
        .select({
            value: masterAcquisitionMethod.displayName,
            label: masterAcquisitionMethod.displayName,
        })
        .from(masterAcquisitionMethod)
        .where(inArray(masterAcquisitionMethod.businessUnitScope, [COMMON_BUSINESS_SCOPE, activeBusinessScope]))
        .orderBy(asc(masterAcquisitionMethod.sortOrder), asc(masterAcquisitionMethod.displayName));

    return rows;
}

export async function listIndustryOptions(): Promise<IndustryOption[]> {
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
}

export async function listMasterPipelineStageOptions(activeBusinessScope: BusinessScopeType): Promise<MasterPipelineStageOption[]> {
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
}

export async function listJetDealStatusOptions(): Promise<MasterSelectOption[]> {
    const rows = await db
        .select({
            value: masterJetDealStatus.statusCode,
            label: masterJetDealStatus.displayName,
        })
        .from(masterJetDealStatus)
        .orderBy(asc(masterJetDealStatus.sortOrder), asc(masterJetDealStatus.displayName));

    return rows;
}

export async function listJetCreditStatusOptions(): Promise<MasterSelectOption[]> {
    const rows = await db
        .select({
            value: masterJetCreditStatus.creditProgressCode,
            label: masterJetCreditStatus.displayName,
        })
        .from(masterJetCreditStatus)
        .orderBy(asc(masterJetCreditStatus.sortOrder), asc(masterJetCreditStatus.displayName));

    return rows;
}

export async function listJetStatus2Options(): Promise<MasterSelectOption[]> {
    const rows = await db
        .select({
            value: masterJetStatus2.status2Code,
            label: masterJetStatus2.displayName,
        })
        .from(masterJetStatus2)
        .orderBy(asc(masterJetStatus2.sortOrder), asc(masterJetStatus2.displayName));

    return rows;
}

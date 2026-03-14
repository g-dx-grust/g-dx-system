'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createContract } from '@/modules/sales/contract/application/create-contract';
import { updateContract } from '@/modules/sales/contract/application/update-contract';
import { isAppError } from '@/shared/server/errors';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import type { ContractStatus } from '@g-dx/contracts';

function readString(formData: FormData, key: string): string | undefined {
    const value = formData.get(key);
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

export async function createContractAction(formData: FormData) {
    const title = readString(formData, 'title');
    const companyId = readString(formData, 'companyId');

    if (!title || !companyId) {
        redirect('/sales/contracts/new?error=validation');
    }

    const session = await getAuthenticatedAppSession();
    if (!session) redirect('/login');

    const amountRaw = readString(formData, 'amount');
    const amount = amountRaw ? Number(amountRaw) : undefined;

    const freeSupportRaw = readString(formData, 'freeSupportMonths');
    const freeSupportMonths = freeSupportRaw ? Number(freeSupportRaw) : undefined;
    const enterpriseRaw = readString(formData, 'enterpriseLicenseCount');
    const enterpriseLicenseCount = enterpriseRaw ? Number(enterpriseRaw) : undefined;
    const proRaw = readString(formData, 'proLicenseCount');
    const proLicenseCount = proRaw ? Number(proRaw) : undefined;
    const a2Raw = readString(formData, 'a2LicenseCount');
    const a2LicenseCount = a2Raw ? Number(a2Raw) : undefined;
    const hasSubsidyRaw = readString(formData, 'hasSubsidy');
    const hasSubsidy = hasSubsidyRaw === 'true' ? true : hasSubsidyRaw === 'false' ? false : undefined;

    try {
        const result = await createContract({
            companyId,
            title,
            dealId: readString(formData, 'dealId'),
            contractNumber: readString(formData, 'contractNumber'),
            contractStatus: (readString(formData, 'contractStatus') as ContractStatus | undefined) ?? 'CONTRACTED',
            amount: amount !== undefined && !isNaN(amount) ? amount : undefined,
            contractDate: readString(formData, 'contractDate'),
            invoiceDate: readString(formData, 'invoiceDate'),
            paymentDate: readString(formData, 'paymentDate'),
            serviceStartDate: readString(formData, 'serviceStartDate'),
            serviceEndDate: readString(formData, 'serviceEndDate'),
            memo: readString(formData, 'memo'),
            ownerUserId: session.user.id,
            fsInChargeUserId: readString(formData, 'fsInChargeUserId'),
            isInChargeUserId: readString(formData, 'isInChargeUserId'),
            productCode: readString(formData, 'productCode'),
            hasSubsidy,
            licensePlanCode: readString(formData, 'licensePlanCode'),
            freeSupportMonths: freeSupportMonths !== undefined && !isNaN(freeSupportMonths) ? freeSupportMonths : undefined,
            enterpriseLicenseCount: enterpriseLicenseCount !== undefined && !isNaN(enterpriseLicenseCount) ? enterpriseLicenseCount : undefined,
            proLicenseCount: proLicenseCount !== undefined && !isNaN(proLicenseCount) ? proLicenseCount : undefined,
            a2LicenseCount: a2LicenseCount !== undefined && !isNaN(a2LicenseCount) ? a2LicenseCount : undefined,
        });
        revalidatePath('/sales/contracts');
        revalidatePath(`/customers/companies/${companyId}`);
        redirect(`/sales/contracts/${result.id}?created=1`);
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        throw error;
    }
}

export async function updateContractAction(formData: FormData) {
    const contractId = readString(formData, 'contractId');
    if (!contractId) redirect('/sales/contracts');

    const amountRaw = readString(formData, 'amount');
    const amount = amountRaw !== undefined ? (amountRaw === '' ? null : Number(amountRaw)) : undefined;

    const updateFreeSupportRaw = readString(formData, 'freeSupportMonths');
    const updateFreeSupport = updateFreeSupportRaw !== undefined ? (updateFreeSupportRaw === '' ? null : Number(updateFreeSupportRaw)) : undefined;
    const updateEnterpriseRaw = readString(formData, 'enterpriseLicenseCount');
    const updateEnterprise = updateEnterpriseRaw !== undefined ? (updateEnterpriseRaw === '' ? null : Number(updateEnterpriseRaw)) : undefined;
    const updateProRaw = readString(formData, 'proLicenseCount');
    const updatePro = updateProRaw !== undefined ? (updateProRaw === '' ? null : Number(updateProRaw)) : undefined;
    const updateA2Raw = readString(formData, 'a2LicenseCount');
    const updateA2 = updateA2Raw !== undefined ? (updateA2Raw === '' ? null : Number(updateA2Raw)) : undefined;
    const updateHasSubsidyRaw = readString(formData, 'hasSubsidy');
    const updateHasSubsidy = updateHasSubsidyRaw === 'true' ? true : updateHasSubsidyRaw === 'false' ? false : updateHasSubsidyRaw === '' ? null : undefined;

    try {
        await updateContract(contractId, {
            title: readString(formData, 'title'),
            contractNumber: readString(formData, 'contractNumber') ?? null,
            contractStatus: readString(formData, 'contractStatus') as ContractStatus | undefined,
            amount: amount !== undefined && (amount === null || !isNaN(amount)) ? amount : undefined,
            contractDate: readString(formData, 'contractDate') ?? null,
            invoiceDate: readString(formData, 'invoiceDate') ?? null,
            paymentDate: readString(formData, 'paymentDate') ?? null,
            serviceStartDate: readString(formData, 'serviceStartDate') ?? null,
            serviceEndDate: readString(formData, 'serviceEndDate') ?? null,
            memo: readString(formData, 'memo') ?? null,
            fsInChargeUserId: readString(formData, 'fsInChargeUserId') ?? null,
            isInChargeUserId: readString(formData, 'isInChargeUserId') ?? null,
            productCode: readString(formData, 'productCode') ?? null,
            hasSubsidy: updateHasSubsidy,
            licensePlanCode: readString(formData, 'licensePlanCode') ?? null,
            freeSupportMonths: updateFreeSupport !== undefined && (updateFreeSupport === null || !isNaN(updateFreeSupport)) ? updateFreeSupport : undefined,
            enterpriseLicenseCount: updateEnterprise !== undefined && (updateEnterprise === null || !isNaN(updateEnterprise)) ? updateEnterprise : undefined,
            proLicenseCount: updatePro !== undefined && (updatePro === null || !isNaN(updatePro)) ? updatePro : undefined,
            a2LicenseCount: updateA2 !== undefined && (updateA2 === null || !isNaN(updateA2)) ? updateA2 : undefined,
        });
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        if (isAppError(error, 'NOT_FOUND')) redirect('/sales/contracts');
        throw error;
    }

    revalidatePath('/sales/contracts');
    revalidatePath(`/sales/contracts/${contractId}`);
    redirect(`/sales/contracts/${contractId}?updated=1`);
}

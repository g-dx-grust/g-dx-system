'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getAuthenticatedAppSession } from '@/shared/server/session';
import { AppError, isAppError } from '@/shared/server/errors';
import { createFacility, updateFacility } from './infrastructure/facility-repository';

export async function createFacilityAction(formData: FormData) {
    const session = await getAuthenticatedAppSession();
    if (!session) redirect('/login');

    const companyId = formData.get('companyId') as string;
    const name = formData.get('name') as string;
    if (!companyId || !name) throw new AppError('VALIDATION_ERROR', '必須項目が不足しています。');

    let facilityId: string;
    try {
        facilityId = await createFacility(
            {
                companyId,
                name,
                postalCode: (formData.get('postalCode') as string) || undefined,
                prefecture: (formData.get('prefecture') as string) || undefined,
                city: (formData.get('city') as string) || undefined,
                addressLine1: (formData.get('addressLine1') as string) || undefined,
                mainPhone: (formData.get('mainPhone') as string) || undefined,
                managerName: (formData.get('managerName') as string) || undefined,
                memo: (formData.get('memo') as string) || undefined,
            },
            session.user.id
        );
    } catch (error) {
        if (isAppError(error)) throw error;
        throw new AppError('INTERNAL_SERVER_ERROR', '施設の作成に失敗しました。');
    }

    revalidatePath('/jet/facilities');
    redirect(`/jet/facilities/${facilityId}?created=1`);
}

export async function updateFacilityAction(formData: FormData) {
    const session = await getAuthenticatedAppSession();
    if (!session) redirect('/login');

    const facilityId = formData.get('facilityId') as string;
    if (!facilityId) throw new AppError('VALIDATION_ERROR', '施設IDが不足しています。');

    try {
        await updateFacility(facilityId, {
            name: (formData.get('name') as string) || undefined,
            postalCode: (formData.get('postalCode') as string) || undefined,
            prefecture: (formData.get('prefecture') as string) || undefined,
            city: (formData.get('city') as string) || undefined,
            addressLine1: (formData.get('addressLine1') as string) || undefined,
            mainPhone: (formData.get('mainPhone') as string) || undefined,
            managerName: (formData.get('managerName') as string) || undefined,
            memo: (formData.get('memo') as string) || undefined,
        });
    } catch (error) {
        if (isAppError(error)) throw error;
        throw new AppError('INTERNAL_SERVER_ERROR', '施設の更新に失敗しました。');
    }

    revalidatePath('/jet/facilities');
    revalidatePath(`/jet/facilities/${facilityId}`);
    redirect(`/jet/facilities/${facilityId}?updated=1`);
}

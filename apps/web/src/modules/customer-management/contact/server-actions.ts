'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createContact } from '@/modules/customer-management/contact/application/create-contact';
import { updateContact } from '@/modules/customer-management/contact/application/update-contact';
import { isAppError } from '@/shared/server/errors';

function readOptionalString(formData: FormData, key: string): string | undefined {
    const value = formData.get(key);
    if (typeof value !== 'string') {
        return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

function readBoolean(formData: FormData, key: string): boolean {
    return formData.get(key) === 'on';
}

export async function createContactAction(formData: FormData) {
    const companyId = readOptionalString(formData, 'companyId');
    const name = readOptionalString(formData, 'name');

    if (!companyId || !name) {
        redirect('/customers/contacts/new?error=validation');
    }

    try {
        const created = await createContact({
            companyId,
            name,
            department: readOptionalString(formData, 'department'),
            title: readOptionalString(formData, 'title'),
            email: readOptionalString(formData, 'email'),
            phone: readOptionalString(formData, 'phone'),
            isPrimary: readBoolean(formData, 'isPrimary'),
        });

        revalidatePath('/customers/contacts');
        revalidatePath(`/customers/companies/${companyId}`);
        redirect(`/customers/contacts/${created.id}?created=1`);
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) {
            redirect('/login');
        }

        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) {
            redirect('/unauthorized');
        }

        if (isAppError(error, 'NOT_FOUND')) {
            redirect('/customers/contacts/new?error=company');
        }

        throw error;
    }
}

// 会社詳細ページのインラインフォームから登録（成功後に会社詳細へリダイレクト）
export async function createContactFromCompanyAction(formData: FormData) {
    const companyId = readOptionalString(formData, 'companyId');
    const name = readOptionalString(formData, 'name');

    if (!companyId || !name) {
        redirect(`/customers/companies/${companyId ?? ''}?contactError=validation`);
    }

    try {
        await createContact({
            companyId,
            name,
            department: readOptionalString(formData, 'department'),
            title: readOptionalString(formData, 'title'),
            email: readOptionalString(formData, 'email'),
            phone: readOptionalString(formData, 'phone'),
            isPrimary: readBoolean(formData, 'isPrimary'),
        });
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) redirect('/login');
        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) redirect('/unauthorized');
        if (isAppError(error, 'NOT_FOUND')) redirect(`/customers/companies/${companyId}?contactError=company`);
        throw error;
    }

    revalidatePath(`/customers/companies/${companyId}`);
    revalidatePath('/customers/contacts');
    redirect(`/customers/companies/${companyId}?contactAdded=1`);
}

export async function updateContactAction(formData: FormData) {
    const contactId = readOptionalString(formData, 'contactId');
    if (!contactId) {
        redirect('/customers/contacts');
    }

    try {
        await updateContact(contactId, {
            department: readOptionalString(formData, 'department'),
            title: readOptionalString(formData, 'title'),
            email: readOptionalString(formData, 'email'),
            phone: readOptionalString(formData, 'phone'),
        });
    } catch (error) {
        if (isAppError(error, 'UNAUTHORIZED')) {
            redirect('/login');
        }

        if (isAppError(error, 'FORBIDDEN') || isAppError(error, 'BUSINESS_SCOPE_FORBIDDEN')) {
            redirect('/unauthorized');
        }

        if (isAppError(error, 'NOT_FOUND')) {
            redirect('/customers/contacts');
        }

        throw error;
    }

    revalidatePath('/customers/contacts');
    revalidatePath(`/customers/contacts/${contactId}`);
    redirect(`/customers/contacts/${contactId}?updated=1`);
}

import { pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';
import { businessUnits } from './business-units';

export const companies = pgTable('companies', {
    id: uuid('id').primaryKey().defaultRandom(),
    legalName: text('legal_name').notNull(),
    displayName: text('display_name').notNull(),
    corporateNumber: text('corporate_number'),
    website: text('website'),
    mainPhone: text('main_phone'),
    countryCode: text('country_code'),
    postalCode: text('postal_code'),
    prefecture: text('prefecture'),
    city: text('city'),
    addressLine1: text('address_line1'),
    addressLine2: text('address_line2'),
    normalizedName: text('normalized_name').notNull(),
    mergedIntoCompanyId: uuid('merged_into_company_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    createdByUserId: uuid('created_by_user_id').references(() => users.id),
    updatedByUserId: uuid('updated_by_user_id').references(() => users.id),
});

export const companyBusinessProfiles = pgTable('company_business_profiles', {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id').notNull().references(() => companies.id),
    businessUnitId: uuid('business_unit_id').notNull().references(() => businessUnits.id),
    ownerUserId: uuid('owner_user_id').references(() => users.id),
    customerStatus: text('customer_status').notNull(),
    leadSourceCode: text('lead_source_code'),
    rankCode: text('rank_code'),
    lastContactAt: timestamp('last_contact_at', { withTimezone: true }),
    nextActionAt: timestamp('next_action_at', { withTimezone: true }),
    profileAttributes: jsonb('profile_attributes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

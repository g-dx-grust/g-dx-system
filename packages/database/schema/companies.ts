import { pgTable, text, timestamp, uuid, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
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
}, (table) => ({
    normalizedNameIdx: uniqueIndex('companies_normalized_name_idx').on(table.normalizedName),
    displayNameIdx: index('companies_display_name_idx').on(table.displayName),
    updatedAtIdx: index('companies_updated_at_idx').on(table.updatedAt),
}));

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
    initialLeadSourceCode: text('initial_lead_source_code'),
    companyOverview: text('company_overview'),
    businessDescription: text('business_description'),
    profileAttributes: jsonb('profile_attributes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    businessUnitIdx: index('cbp_business_unit_idx').on(table.businessUnitId),
    companyIdx: index('cbp_company_idx').on(table.companyId),
    companyBusinessUnitIdx: uniqueIndex('cbp_company_business_unit_idx').on(table.companyId, table.businessUnitId),
    ownerUserIdx: index('cbp_owner_user_idx').on(table.ownerUserId),
}));

import { pgTable, text, timestamp, uuid, boolean, jsonb, date, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './users';
import { businessUnits } from './business-units';
import { companies } from './companies';

export const contacts = pgTable('contacts', {
    id: uuid('id').primaryKey().defaultRandom(),
    lastName: text('last_name').notNull(),
    firstName: text('first_name').notNull(),
    fullName: text('full_name').notNull(),
    email: text('email'), // Text rather than citext for simple compatibility
    mobilePhone: text('mobile_phone'),
    department: text('department'),
    jobTitle: text('job_title'),
    contactStatus: text('contact_status').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    createdByUserId: uuid('created_by_user_id').references(() => users.id),
    updatedByUserId: uuid('updated_by_user_id').references(() => users.id),
}, (table) => ({
    fullNameIdx: index('contacts_full_name_idx').on(table.fullName),
    emailIdx: index('contacts_email_idx').on(table.email),
}));

export const contactBusinessProfiles = pgTable('contact_business_profiles', {
    id: uuid('id').primaryKey().defaultRandom(),
    contactId: uuid('contact_id').notNull().references(() => contacts.id),
    businessUnitId: uuid('business_unit_id').notNull().references(() => businessUnits.id),
    ownerUserId: uuid('owner_user_id').references(() => users.id),
    engagementStatus: text('engagement_status').notNull(),
    doNotCall: boolean('do_not_call').default(false).notNull(),
    doNotEmail: boolean('do_not_email').default(false).notNull(),
    preferredContactTime: text('preferred_contact_time'),
    lastContactAt: timestamp('last_contact_at', { withTimezone: true }),
    profileAttributes: jsonb('profile_attributes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    contactIdx: index('cbpr_contact_idx').on(table.contactId),
    businessUnitIdx: index('cbpr_business_unit_idx').on(table.businessUnitId),
    contactBusinessUnitIdx: uniqueIndex('cbpr_contact_business_unit_idx').on(table.contactId, table.businessUnitId),
}));

export const companyContactLinks = pgTable('company_contact_links', {
    id: uuid('id').primaryKey().defaultRandom(),
    companyId: uuid('company_id').notNull().references(() => companies.id),
    contactId: uuid('contact_id').notNull().references(() => contacts.id),
    relationshipType: text('relationship_type').notNull(),
    isPrimary: boolean('is_primary').default(false).notNull(),
    departmentLabel: text('department_label'),
    startDate: date('start_date'),
    endDate: date('end_date'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    companyIdx: index('ccl_company_idx').on(table.companyId),
    contactIdx: index('ccl_contact_idx').on(table.contactId),
    companyContactIdx: uniqueIndex('ccl_company_contact_idx').on(table.companyId, table.contactId),
}));

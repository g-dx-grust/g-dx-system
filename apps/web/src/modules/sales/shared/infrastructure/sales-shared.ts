export type { BusinessUnitRecord } from '@/shared/server/business-unit';
export { findBusinessUnitByScope } from '@/shared/server/business-unit';

export function nextAuditId(): number {
    return Date.now() * 1000 + Math.floor(Math.random() * 1000);
}

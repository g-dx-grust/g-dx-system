import type { BusinessScopeType } from '@g-dx/contracts';

export const DASHBOARD_CACHE_REVALIDATE_SECONDS = 30;

export function getDashboardScopeTag(scope: BusinessScopeType): string {
    return `dashboard-scope:${scope}`;
}

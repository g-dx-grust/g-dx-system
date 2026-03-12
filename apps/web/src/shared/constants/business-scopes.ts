import { BusinessScope, type BusinessScopeType } from '@g-dx/contracts';

export const BUSINESS_SCOPE_LABELS: Record<BusinessScopeType, string> = {
    [BusinessScope.LARK_SUPPORT]: 'Lark サポート事業',
    [BusinessScope.WATER_SAVING]: '節水事業',
};

export function isBusinessScopeType(value: string): value is BusinessScopeType {
    return value === BusinessScope.LARK_SUPPORT || value === BusinessScope.WATER_SAVING;
}
